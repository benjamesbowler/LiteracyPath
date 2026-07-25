// Saved worksheet "bank" - stores the RECIPE (cycle + type + pages), not a PDF.
// Recipes regenerate identical worksheets on demand (buildWorksheetDocument is
// deterministic). Synced per teacher via Supabase so it follows them across
// devices / class iPads. All calls are best-effort and never throw into the UI.
import { supabase } from "../../supabaseClient.js";

export async function listWorksheetRecipes() {
  try {
    const { data, error } = await supabase
      .table("worksheet_bank")
      .select("id, cycle_id, type, pages, title, created_at")
      .order("created_at", { ascending: false });
    if (error) return { rows: [], error };
    return { rows: data || [], error: null };
  } catch (error) {
    return { rows: [], error };
  }
}

export async function saveWorksheetRecipe({ cycleId, type, pages, title }) {
  try {
    const { data, error } = await supabase
      .table("worksheet_bank")
      .insert({ cycle_id: cycleId, type, pages, title })
      .select("id, cycle_id, type, pages, title, created_at")
      .single();
    return { row: data || null, error: error || null };
  } catch (error) {
    return { row: null, error };
  }
}

export async function deleteWorksheetRecipe(id) {
  try {
    const { error } = await supabase.table("worksheet_bank").delete().eq("id", id);
    return { error: error || null };
  } catch (error) {
    return { error };
  }
}
