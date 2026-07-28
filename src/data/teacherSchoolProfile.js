export async function loadTeacherSchoolName({ client, schoolId }) {
  const requestedSchoolId = String(schoolId || "").trim();
  if (!requestedSchoolId) {
    return { data: "", error: null };
  }

  try {
    const { data, error } = await client
      .table("schools")
      .select("name")
      .eq("id", requestedSchoolId)
      .maybeSingle();
    if (error) return { data: "", error };

    const name = String(data?.name || "").trim();
    if (!name) {
      return {
        data: "",
        error: new Error("The saved school record did not return a name.")
      };
    }
    return { data: name, error: null };
  } catch (error) {
    return { data: "", error };
  }
}
