import { auditSecurityBoundarySource } from "./databasePolicyContract.mjs";
import { auditHostedSchemaDriftSource } from "./hostedSchemaDriftContract.mjs";

const report = auditSecurityBoundarySource();
const hostedDriftReport = auditHostedSchemaDriftSource();
console.log(`Database migrations inspected: ${report.files.length}`);
console.log(`Anonymous SECURITY DEFINER RPCs allowed: ${report.anonymousRpcCount}`);
console.log(`Authenticated SECURITY DEFINER RPCs allowed: ${report.authenticatedRpcCount}`);
console.log(`Obsolete child-login RPCs removed: ${report.legacyRpcCount}`);
console.log(`Historical hosted policies removed: ${hostedDriftReport.historicalPolicyCount}`);
console.log(`Retained hosted-only tables locked: ${hostedDriftReport.retainedTableCount}`);
console.log(`Canonical table grants fixed: ${hostedDriftReport.exactGrantTableCount}`);
const failures = [...report.failures, ...hostedDriftReport.failures];
if (failures.length) {
  failures.forEach(failure => console.error(`- ${failure}`));
  process.exitCode = 1;
} else {
  console.log("Static database security boundary contract passed.");
}
