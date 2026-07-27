/**
 * @typedef {Record<string, unknown>} DomainRecord
 */

export class DomainBoundaryError extends Error {
  constructor(message, details = {}) {
    super(message);
    this.name = "DomainBoundaryError";
    this.details = details;
  }
}

export function isPlainRecord(value) {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

/**
 * @param {unknown} value
 * @param {string} label
 * @returns {DomainRecord}
 */
export function assertPlainRecord(value, label) {
  if (!isPlainRecord(value)) {
    throw new DomainBoundaryError(`${label} must be an object.`, { label });
  }
  return value;
}

/**
 * @param {DomainRecord} record
 * @param {Record<string, string|string[]>} schema
 * @param {string} label
 * @returns {DomainRecord}
 */
export function assertOptionalFields(record, schema, label) {
  assertPlainRecord(record, label);
  for (const [field, accepted] of Object.entries(schema)) {
    if (record[field] === undefined || record[field] === null) continue;
    const validators = Array.isArray(accepted) ? accepted : [accepted];
    const valid = validators.some(type => {
      if (type === "array") return Array.isArray(record[field]);
      if (type === "object") return isPlainRecord(record[field]);
      if (type === "integer") return Number.isInteger(record[field]);
      return typeof record[field] === type;
    });
    if (!valid) {
      throw new DomainBoundaryError(
        `${label}.${field} has an invalid type.`,
        { field, label, received: typeof record[field] }
      );
    }
  }
  return record;
}

/**
 * Validate either one returned row or a returned row collection.
 *
 * @param {unknown} data
 * @param {string} label
 * @param {(row: DomainRecord, label: string) => unknown} validateRow
 * @returns {unknown}
 */
export function validateRows(data, label, validateRow) {
  if (data === null || data === undefined) return data;
  if (Array.isArray(data)) {
    data.forEach((row, index) => validateRow(row, `${label}[${index}]`));
    return data;
  }
  validateRow(data, label);
  return data;
}

export function validateCommonRow(row, label) {
  return assertOptionalFields(row, {
    id: "string",
    teacher_id: "string",
    school_id: "string",
    class_id: "string",
    student_id: "string",
    user_id: "string",
    created_at: "string",
    updated_at: "string",
    archived_at: "string"
  }, label);
}

export function validateVersionedPayload(row, label) {
  validateCommonRow(row, label);
  assertOptionalFields(row, {
    payload: "object",
    schema_version: ["number", "integer"]
  }, label);
  if (isPlainRecord(row.payload) && row.payload.schemaVersion !== undefined) {
    if (!Number.isInteger(row.payload.schemaVersion) || row.payload.schemaVersion < 1) {
      throw new DomainBoundaryError(`${label}.payload.schemaVersion must be a positive integer.`);
    }
  }
  return row;
}
