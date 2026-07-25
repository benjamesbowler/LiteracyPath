import { auditSecurityBoundarySource } from "./databasePolicyContract.mjs";

const report = auditSecurityBoundarySource();
console.log(`Database migrations inspected: ${report.files.length}`);
console.log(`Anonymous SECURITY DEFINER RPCs allowed: ${report.anonymousRpcCount}`);
console.log(`Authenticated SECURITY DEFINER RPCs allowed: ${report.authenticatedRpcCount}`);
console.log(`Obsolete child-login RPCs removed: ${report.legacyRpcCount}`);
if (report.failures.length) {
  report.failures.forEach(failure => console.error(`- ${failure}`));
  process.exitCode = 1;
} else {
  console.log("Static database security boundary contract passed.");
}
