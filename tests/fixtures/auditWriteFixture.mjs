import fs from "node:fs";
import path from "node:path";

const target = path.join(process.cwd(), "docs", "validation", "audit-mode-fixture.txt");
fs.mkdirSync(path.dirname(target), { recursive: true });
fs.writeFileSync(target, "audit write guard fixture\n");
