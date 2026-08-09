export async function createWorksheetInstance(client, { classId, learnerIds, recipe }) {
  const { data, error } = await client.call("teacher_create_worksheet_instance", { p_class_id: classId, p_learner_ids: learnerIds, p_recipe: recipe });
  if (error) throw error; if (!data?.ok) throw new Error(data?.error || "The tracked worksheet could not be created."); return data;
}
export async function resolveWorksheetCode(client, code) {
  const { data, error } = await client.call("teacher_resolve_worksheet_code", { p_code: code });
  if (error) throw error; if (!data?.ok) throw new Error(data?.error || "That worksheet code was not found."); return data.instance;
}
export async function saveWorksheetObservations(client, { instanceId, marks, note, supersedesBatchId = null }) {
  const { data, error } = await client.call("teacher_record_worksheet_observation", { p_instance_id: instanceId, p_client_event_id: crypto.randomUUID(), p_marks: marks, p_note: note, p_supersedes_batch_id: supersedesBatchId });
  if (error) throw error; if (!data?.ok) throw new Error(data?.error || "The worksheet observations could not be saved."); return data;
}
export async function readWorksheetHistory(client, instanceId) {
  const { data, error } = await client.call("teacher_read_worksheet_history", { p_instance_id: instanceId });
  if (error) throw error; if (!data?.ok) throw new Error(data?.error || "Worksheet history could not be read."); return data.batches;
}
