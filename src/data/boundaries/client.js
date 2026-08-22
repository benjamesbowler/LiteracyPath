import { AUTH_RPCS } from "./auth.js";
import {
  CLASS_RPCS,
  CLASS_TABLES,
  validateClassRow,
  validateClassRpcData
} from "./classes.js";
import { CONTENT_RPCS, CONTENT_TABLES, validateContentRow } from "./content.js";
import { EVIDENCE_RPCS, EVIDENCE_TABLES, validateEvidenceRow } from "./evidence.js";
import { GUARDIAN_RPCS, validateGuardianRpcData } from "./guardians.js";
import { REPORT_RPCS, REPORT_TABLES, validateReportRow } from "./reports.js";
import {
  assertOptionalFields,
  assertPlainRecord,
  DomainBoundaryError,
  isPlainRecord,
  validateRows
} from "./schema.js";

const TABLE_DOMAINS = new Map([
  ...[...CLASS_TABLES].map(name => [name, "classes"]),
  ...[...EVIDENCE_TABLES].map(name => [name, "evidence"]),
  ...[...REPORT_TABLES].map(name => [name, "reports"]),
  ...[...CONTENT_TABLES].map(name => [name, "content"])
]);
const RPC_NAMES = new Set([
  ...AUTH_RPCS,
  ...CLASS_RPCS,
  ...EVIDENCE_RPCS,
  ...REPORT_RPCS,
  ...GUARDIAN_RPCS,
  ...CONTENT_RPCS
]);

export const BOUNDARY_TABLES = Object.freeze([...TABLE_DOMAINS.keys()].sort());
export const BOUNDARY_RPCS = Object.freeze([...RPC_NAMES].sort());

function validateTableData(table, data) {
  const domain = TABLE_DOMAINS.get(table);
  if (!domain) throw new DomainBoundaryError(`Unregistered Supabase table: ${table}`);
  const validateRow = (row, label) => {
    if (domain === "classes") return validateClassRow(row, label);
    if (domain === "evidence") return validateEvidenceRow(row, label, table);
    if (domain === "reports") return validateReportRow(row, label);
    return validateContentRow(row, label);
  };
  return validateRows(data, table, validateRow);
}

function validateRpcData(name, data) {
  if (!RPC_NAMES.has(name)) throw new DomainBoundaryError(`Unregistered Supabase RPC: ${name}`);
  if (data === null || data === undefined || ["string", "number", "boolean"].includes(typeof data)) {
    return data;
  }
  if (CLASS_RPCS.has(name)) {
    const validated = validateClassRpcData(name, data);
    if (validated !== null) return validated;
  }
  if (GUARDIAN_RPCS.has(name)) return validateGuardianRpcData(name, data);
  if (
    name === "report_assessment_question"
    || name === "admin_review_assessment_question_report"
  ) {
    return validateRows(data, `rpc.${name}`, validateReportRow);
  }
  return validateRows(data, `rpc.${name}`, (row, label) => {
    assertPlainRecord(row, label);
    assertOptionalFields(row, {
      id: "string",
      class_id: "string",
      student_id: "string",
      request_id: "string",
      access_code: "string",
      token: "string",
      ok: "boolean",
      schemaVersion: "integer",
      payload: "object"
    }, label);
  });
}

/**
 * @typedef {{
 *   data: unknown,
 *   error: unknown,
 *   count?: number|null,
 *   status?: number,
 *   statusText?: string
 * }} SupabaseResponse
 */

/**
 * @param {"table"|"rpc"} kind
 * @param {string} resource
 * @param {unknown} result
 * @returns {SupabaseResponse}
 */
export function validateSupabaseResponse(kind, resource, result) {
  if (!isPlainRecord(result) || !("data" in result) || !("error" in result)) {
    throw new DomainBoundaryError(`${kind}.${resource} returned an invalid response envelope.`);
  }
  if (result.error) return result;
  if (kind === "table") validateTableData(resource, result.data);
  else validateRpcData(resource, result.data);
  return result;
}
