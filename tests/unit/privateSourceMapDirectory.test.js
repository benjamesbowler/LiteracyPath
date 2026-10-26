import assert from "node:assert/strict";
import { mkdtempSync, mkdirSync, realpathSync, rmSync, symlinkSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import test from "node:test";
import { privateSourceMapDirectory } from "../../tools/lib/privateSourceMapDirectory.mjs";

test("private source maps require an external explicit directory, including through symlinks", () => {
  const temporary = mkdtempSync(path.join(tmpdir(), "private-map-boundary-"));
  const repository = path.join(temporary, "repository");
  mkdirSync(repository);
  try {
    for (const unsafe of [undefined, "", "dist", repository, temporary,
      path.parse(temporary).root, path.join(repository, "dist", "maps"),
      path.join(repository, "public", "maps")]) {
      assert.throws(() => privateSourceMapDirectory(unsafe, repository), /Private source maps/);
    }
    const alias = path.join(temporary, "alias");
    symlinkSync(repository, alias, "dir");
    assert.throws(() => privateSourceMapDirectory(path.join(alias, "new", "maps"), repository), /Private source maps/);
    assert.equal(privateSourceMapDirectory(path.join(temporary, "private-vault", "maps"), repository),
      path.join(realpathSync(temporary), "private-vault", "maps"));
    assert.equal(privateSourceMapDirectory(path.join(temporary, "repository-maps"), repository),
      path.join(realpathSync(temporary), "repository-maps"));
  } finally {
    rmSync(temporary, { recursive: true, force: true });
  }
});
