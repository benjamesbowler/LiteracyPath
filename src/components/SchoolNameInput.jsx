import { useEffect, useId, useState } from "react";
import { supabase } from "../supabaseClient.js";

/** Mirrors the floor in search_school_names(text); below this the RPC returns nothing. */
export const SCHOOL_SEARCH_MIN_LENGTH = 3;
/** Long enough that finishing a word triggers one lookup rather than one per key. */
const SEARCH_DEBOUNCE_MS = 220;

/**
 * Prefix → names already fetched. Module-level so backspacing through a name
 * re-uses what was just looked up, and so two inputs on one page share results.
 * Each entry is at most twenty names.
 */
const prefixCache = new Map();

/**
 * Text input backed by suggestions from the school directory. Choosing an
 * existing name prevents duplicates ("Basis" vs "basis" vs "Basis."); typing a
 * brand-new name still works and creates the school on save.
 *
 * WHY THIS SEARCHES RATHER THAN LISTS. It used to call list_school_names(),
 * which was granted to anon and returned every school name unbounded — a single
 * request from anyone, signed in or not, exported the entire customer list. It
 * now calls search_school_names(prefix), which returns nothing under three
 * characters and at most twenty matches. A teacher typing their own school sees
 * no difference; enumerating the directory now costs a dictionary attack across
 * every prefix rather than one call.
 */
export function SchoolNameInput({ value, onChange, placeholder = "Choose or type your school", autoComplete = "off", ...rest }) {
  const listId = useId();
  // Results live in the module cache, not in state. This counter exists only to
  // re-render once a fetch resolves — setting state synchronously in an effect
  // body causes cascading renders, so the suggestion list is DERIVED below
  // rather than stored and synchronised.
  const [fetchVersion, setFetchVersion] = useState(0);

  const prefix = String(value || "").trim();
  const cacheKey = prefix.toLowerCase();
  const tooShort = prefix.length < SCHOOL_SEARCH_MIN_LENGTH;
  const schools = tooShort ? [] : (prefixCache.get(cacheKey) || []);

  useEffect(() => {
    if (tooShort || prefixCache.has(cacheKey)) return undefined;

    let cancelled = false;
    const timer = setTimeout(() => {
      supabase
        .call("search_school_names", { p_prefix: prefix })
        .then(({ data, error }) => {
          if (cancelled || error || !Array.isArray(data)) return;
          prefixCache.set(cacheKey, data.map(row => row.name).filter(Boolean));
          setFetchVersion(version => version + 1);
        })
        .catch(error => {
          // A failed lookup costs suggestions, never the ability to type a
          // school name. Nothing is surfaced to the person.
          console.warn("Could not search school names.", error);
        });
    }, SEARCH_DEBOUNCE_MS);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [prefix, cacheKey, tooShort]);

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
      <datalist id={listId} data-fetch-version={fetchVersion}>
        {schools.map(name => (
          <option key={name} value={name} />
        ))}
      </datalist>
    </>
  );
}
