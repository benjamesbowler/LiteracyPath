import { PGlite } from "@electric-sql/pglite";
import { pgcrypto } from "@electric-sql/pglite/contrib/pgcrypto";
import { readFileSync } from "node:fs";
const db = await PGlite.create({ extensions: { pgcrypto } });
await db.exec(readFileSync("bootstrap.sql", "utf8"));
await db.exec(readFileSync("legacy.sql", "utf8"));
try {
  await db.exec(readFileSync(process.argv[2], "utf8"));
  console.log("APPLIED CLEANLY on a legacy database");
} catch (e) {
  console.log("FAILED: " + String(e?.message || e).split("\n")[0]);
  process.exitCode = 1;
}
