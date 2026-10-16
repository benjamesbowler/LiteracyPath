import fs from 'node:fs';

const read = name => fs.readFileSync(new URL(`../supabase/migrations/${name}`, import.meta.url), 'utf8');
const frozen = (name, file) => read(file).match(new RegExp(`create (?:or replace )?function public\\.${name}\\([\\s\\S]*?\\$\\$;`))[0]
  .replace(/^create (?:or replace )?function/, 'create or replace function');

/** Forward identity aliases. No historical snapshot is changed. Keep this
 * separately exercisable by legacy-database parity tests as well as V8. */
export function literacyMockIdentityV8Sql() {
  const helpers = `create or replace function public.lp_literacy_print_letter_target(p_value jsonb)
returns text language plpgsql immutable set search_path='' as $$
declare s jsonb:=coalesce(p_value->'itemSnapshot',p_value->'questionSnapshot',p_value);
 targets jsonb; candidate text; letter text;
begin
 for candidate in select value from unnest(array[p_value->>'exposureItemId',s->>'canonicalItemId',s->>'sourceItemId',p_value->>'questionId',s->>'id',
  regexp_replace(coalesce(nullif(p_value->>'exposureFamilyId',''),s->>'exposureFamilyId',''),'^source-item:','')]) value loop
  letter:=(regexp_match(btrim(candidate),'^literacy\\.letter_knowledge\\.(?:name|case)-([a-z])$'))[1];
  if letter is null then letter:=(regexp_match(btrim(candidate),'^mock\\.capacity\\.foundation\\.letter-case\\.l[12]\\.([a-z])$'))[1]; end if;
  if letter is not null then return letter; end if;
 end loop;
 if coalesce(nullif(p_value->>'domainId',''),s->>'domainId','')<>'print'
  or coalesce(nullif(p_value->>'skillId',''),s->>'skillId','')<>'letter_knowledge'
  or coalesce(nullif(s->>'constructClaim',''),p_value->>'constructClaim','') not in ('letter_name','letter_case','letter_case_correspondence') then return null; end if;
 targets:=case when jsonb_typeof(s->'matchTargets')='array' then s->'matchTargets' else '[]'::jsonb end;
 if jsonb_array_length(targets)>1 or (coalesce(s->>'responseLength','0')~'^[0-9]+$' and (s->>'responseLength')::numeric>1)
  or (coalesce(s->>'sequenceLength','0')~'^[0-9]+$' and (s->>'sequenceLength')::numeric>1) then return null; end if;
 for candidate in select value from unnest(array[s->>'targetWord',s->>'passage',targets#>>'{0,label}']) value loop
  if btrim(candidate)~'^[A-Za-z]$' then return lower(btrim(candidate)); end if;
 end loop;
 for candidate in select value from unnest(array[s->>'exposureFamilyId',s->>'canonicalPassageId',s->>'stimulusKey']) value loop
  letter:=(regexp_match(btrim(candidate),'^letter-case:([a-z])$'))[1];
  if letter is not null then return letter; end if;
 end loop;
 return null;
end; $$;

create or replace function public.lp_literacy_lexical_word_target(p_value jsonb)
returns text language plpgsql immutable set search_path='' as $$
declare s jsonb:=coalesce(p_value->'itemSnapshot',p_value->'questionSnapshot',p_value); family text; word text;
begin
 family:=lower(regexp_replace(btrim(coalesce(nullif(p_value->>'exposureFamilyId',''),nullif(s->>'exposureFamilyId',''),s->>'itemFamilyId','')),'\\s+',' ','g'));
 word:=(regexp_match(family,'^(?:hfw-word|v6-phonics-team|mock-foundation-word|v[48]-context-word-senses):([a-z]+)$'))[1];
 if word is not null then return word; end if;
 if coalesce(nullif(p_value->>'domainId',''),s->>'domainId','')<>'sound_awareness' or coalesce(btrim(s->>'passage'),'')<>''
  or coalesce(nullif(s->>'constructClaim',''),p_value->>'constructClaim','') not in ('initial_sound_discrimination','initial_sound_grapheme_mapping','spoken_medial_vowel_discrimination','spoken_rhyme_discrimination') then return null; end if;
 word:=lower(btrim(s->>'targetWord'));
 return case when word~'^[a-z]+$' then word else null end;
end; $$;`;
  const originalFamily = "coalesce(nullif(p_value->>'exposureFamilyId',''),nullif(s->>'exposureFamilyId',''),s->>'itemFamilyId','')";
  const identity = frozen('lp_literacy_exposure_identity', '20261010120000_literacy_mock_evidence_v2.sql')
    .replace(originalFamily, `coalesce('letter-case:'||public.lp_literacy_print_letter_target(p_value),
      'mock-foundation-word:'||public.lp_literacy_lexical_word_target(p_value),${originalFamily})`);
  const identities = frozen('lp_literacy_exposure_identities', '20261012083202_literacy_mock_adaptive_v4.sql')
    .replace('select identity from source union select', `select identity from source
  union select jsonb_set(identity,'{exposureFamilyId}',to_jsonb(${originalFamily})) from source
    where ${originalFamily}<>'' and ${originalFamily} is distinct from identity->>'exposureFamilyId'
  union select`);
  return [helpers, identity, identities,
    'revoke all on function public.lp_literacy_print_letter_target(jsonb),public.lp_literacy_lexical_word_target(jsonb),public.lp_literacy_exposure_identity(jsonb),public.lp_literacy_exposure_identities(jsonb) from public,anon,authenticated;'].join('\n\n');
}
