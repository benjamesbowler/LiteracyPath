import { useEffect, useId, useState } from "react";
import { supabase } from "../supabaseClient.js";

let cachedSchoolNames = null;

// Text input backed by a dropdown of every school already in the system.
// Picking an existing name prevents duplicate schools ("Basis" vs "basis");
// typing a brand-new name still works and creates the school on save.
export function SchoolNameInput({ value, onChange, placeholder = "Choose or type your school", autoComplete = "off", ...rest }) {
  const listId = useId();
  const [schools, setSchools] = useState(cachedSchoolNames || []);

  useEffect(() => {
    if (cachedSchoolNames) return;
    let cancelled = false;
    supabase
      .call("list_school_names")
      .then(({ data, error }) => {
        if (cancelled || error || !Array.isArray(data)) return;
        cachedSchoolNames = data.map(row => row.name).filter(Boolean);
        setSchools(cachedSchoolNames);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <>
      <input
        {...rest}
        type="text"
        list={listId}
        value={value}
        placeholder={placeholder}
        autoComplete={autoComplete}
        onChange={event => onChange?.(event.target.value)}
      />
      <datalist id={listId}>
        {schools.map(name => (
          <option key={name} value={name} />
        ))}
      </datalist>
    </>
  );
}
