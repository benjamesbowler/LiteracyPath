-- Broader literacy practice uses the existing token-scoped learn_games
-- transport. It never enters the independent progress bank or assessment
-- archive. Keep the existing assignment RPC, ownership checks and grants.
begin;

create or replace function public.lp_progress_config_valid(p_config jsonb, p_version text)
returns boolean language plpgsql stable security definer set search_path = '' as $$
begin
  if jsonb_typeof(p_config) is distinct from 'object' then return false; end if;
  if exists(select 1 from jsonb_object_keys(p_config) k
    where k not in ('plan_kind','track_id','bank_version'))
    or p_config->>'bank_version' is distinct from p_version
  then return false; end if;

  if p_config->>'plan_kind' = 'practice' then
    return coalesce(p_version = 'literacy-practice-v1'
      and p_config->>'track_id' in ('all','sound_awareness','phonics',
        'vocabulary','listening','reading','language','print','writing'), false);
  end if;

  -- Existing independent checks still require their exact private bank.
  -- No legacy version, checkpoint, first response or archive is rewritten.
  return coalesce(exists(select 1 from public.progress_test_banks where version=p_version)
    and (p_config->>'plan_kind'='broad_profile' and coalesce(p_config->>'track_id','')=''
      or p_config->>'plan_kind'='focused' and p_config->>'track_id' in
        ('hear_sounds','printed_words','common_words','word_meaning','listening_stories','reading_stories')), false);
end;
$$;

revoke all on function public.lp_progress_config_valid(jsonb,text) from public, anon, authenticated;
notify pgrst, 'reload schema';
commit;
