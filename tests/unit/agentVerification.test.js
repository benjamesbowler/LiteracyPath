import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { existsSync, readFileSync, mkdtempSync, mkdirSync, writeFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import test from "node:test";
import {
  executeVerificationPlan, planTaskVerification, repositoryRoot,
  runTaskVerification, TASK_GATES
} from "../../tools/agentVerification.mjs";
import { checkAgentInstructions } from "../../tools/checkAgentInstructions.mjs";

test("invalid or missing selection fails before executing any command", () => {
  let calls = 0;
  for (const input of [[], ["question-contracts", "typo"], ["__proto__"], ["--plan"], ["regression; echo unsafe"]]) {
    assert.equal(runTaskVerification(input, { execute: () => { calls += 1; }, log: () => {} }), 2);
  }
  assert.equal(calls, 0);
});

test("planning is side-effect free and repeated selections do not rerun checks", () => {
  let calls = 0;
  let output = "";
  assert.equal(runTaskVerification(["--plan", "supabase-local", "supabase-local"], {
    execute: () => { calls += 1; }, log: text => { output = text; }
  }), 0);
  assert.equal(calls, 0);
  assert.deepEqual(JSON.parse(output), planTaskVerification(["supabase-local"]));
  const plan = planTaskVerification(["supabase-local"]);
  plan[0].push("--changed-by-caller");
  assert.notDeepEqual(plan, planTaskVerification(["supabase-local"]));
});

test("a failed command preserves its exit code and stops later work", () => {
  const calls = [];
  const code = executeVerificationPlan([["first", "argument with spaces"], ["later"]], {
    execute: (command, args, options) => {
      calls.push({ command, args, options });
      return { status: 7 };
    }, log: () => {}
  });
  assert.equal(code, 7);
  assert.equal(calls.length, 1);
  assert.deepEqual(calls[0].args, ["argument with spaces"]);
  assert.equal(calls[0].options.shell, false);
  assert.equal(calls[0].options.cwd, repositoryRoot);
});

test("spawn errors and killed processes cannot appear as passing checks", () => {
  for (const result of [{ error: new Error("missing executable"), status: null }, { signal: "SIGTERM", status: null }, { status: null }]) {
    assert.equal(executeVerificationPlan([["check"]], { execute: () => result, log: () => {} }), 1);
  }
});

test("real child-process failures propagate through the runner", () => {
  assert.equal(executeVerificationPlan([[process.execPath, "-e", "process.exit(9)"]], { log: () => {} }), 9);
  assert.equal(executeVerificationPlan([[process.execPath, "-e", "process.exit(0)"]], { log: () => {} }), 0);
});

test("CLI rejects an unknown profile with a nonzero process status", () => {
  const result = spawnSync(process.execPath, ["tools/agentVerification.mjs", "missing-profile"], {
    cwd: repositoryRoot, encoding: "utf8"
  });
  assert.equal(result.status, 2);
  assert.match(result.stdout, /Unknown verification profile/);
});

test("every selected command resolves to a current script or file", () => {
  const pkg = JSON.parse(readFileSync(path.join(repositoryRoot, "package.json"), "utf8"));
  for (const command of Object.values(TASK_GATES).flat()) {
    if (command[0] === "npm") {
      const name = command[1] === "run" ? command[2] : command[1];
      assert.ok(pkg.scripts[name], `Missing npm script ${name}`);
    } else {
      assert.equal(command[0], "node");
      for (const file of command.slice(1).filter(arg => !arg.startsWith("-"))) {
        assert.ok(existsSync(path.join(repositoryRoot, file)), `Missing command input ${file}`);
      }
    }
  }
});

test("instruction checker detects broken references and missing task commands", t => {
  const root = mkdtempSync(path.join(tmpdir(), "lp-instruction-check-"));
  t.after(() => rmSync(root, { recursive: true, force: true }));
  const write = (file, text) => {
    const absolute = path.join(root, file);
    mkdirSync(path.dirname(absolute), { recursive: true });
    writeFileSync(absolute, text);
  };
  for (const file of [
    "AGENTS.md", "docs/brain/START-HERE.md", "docs/brain/AGENT_TASK_BRIEF.md",
    "docs/engineering/AGENT_WORKFLOW.md", "docs/verification/TASK_GATES.md",
    "docs/brain/decisions/2026-09-12-selective-agent-guidance.md"
  ]) write(file, "# Fixture\n");
  write("package.json", JSON.stringify({ scripts: { "valid-check": "node test.js" } }));
  write("tests/fixtures/agent-instructions/cases.json", JSON.stringify([
    { id: "one", prompt: "Review the fixture", expectedSkills: ["example"], acceptance: ["Valid output"] }
  ]));
  const skill = ".agents/skills/example/SKILL.md";
  const metadata = "---\nname: example\ndescription: Review fixture tasks.\n---\n";
  write(skill, `${metadata}\n[Root](../../../AGENTS.md)\nRun npm run valid-check.\n`);
  assert.deepEqual(checkAgentInstructions(root).failures, []);

  write(skill, `${metadata}\n[Missing](../../../missing.md)\n[Outside](../../../../)\nRun npm run absent-check.\n`);
  const failures = checkAgentInstructions(root).failures;
  assert.equal(failures.length, 3);
  assert.ok(failures.some(message => message.includes("missing.md")));
  assert.ok(failures.some(message => message.includes("../../../../")));
  assert.ok(failures.some(message => message.includes("absent-check")));

  write(skill, "---\nname: wrong-name\ndescription: Review fixture tasks.\n---\n");
  const missingSkill = checkAgentInstructions(root).failures;
  assert.ok(missingSkill.some(message => message.includes("match its directory")));
  assert.ok(missingSkill.some(message => message.includes("missing skill: example")));
});
