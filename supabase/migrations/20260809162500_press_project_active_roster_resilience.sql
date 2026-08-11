-- Assign only verified active class members. A stale or duplicated roster row
-- must not prevent every valid learner receiving the project.
create or replace function public.teacher_create_press_project(p_class_id uuid,p_learner_ids uuid[],p_project_rules jsonb)
returns jsonb language plpgsql volatile security definer set search_path=public as $$
declare v_project public.student_book_projects; v_requested_count integer; v_valid_ids uuid[]; v_count integer; v_title text; v_assets jsonb; v_pages jsonb;
begin
  perform public.assert_current_actor_teacher_access();
  if not exists(select 1 from public.classes where id=p_class_id and teacher_id=auth.uid()) then return jsonb_build_object('ok',false,'error','class_not_found'); end if;
  v_requested_count:=coalesce(array_length(p_learner_ids,1),0);
  if v_requested_count=0 then return jsonb_build_object('ok',false,'error','learners_required'); end if;
  select coalesce(array_agg(distinct s.id),'{}'::uuid[]) into v_valid_ids from public.students s where s.id=any(p_learner_ids) and s.class_id=p_class_id and s.teacher_id=auth.uid() and coalesce(s.is_archived,false)=false;
  v_count:=coalesce(array_length(v_valid_ids,1),0);
  if v_count=0 then return jsonb_build_object('ok',false,'error','no_active_learners'); end if;
  v_title:=trim(coalesce(p_project_rules->>'title','')); v_assets:=p_project_rules->'assetIds'; v_pages:=p_project_rules->'pagePrompts';
  if jsonb_typeof(p_project_rules)<>'object' or char_length(v_title) not between 1 and 120 or jsonb_typeof(v_assets)<>'array' or jsonb_array_length(v_assets)=0 or jsonb_typeof(v_pages)<>'array' or jsonb_array_length(v_pages)<>4 then return jsonb_build_object('ok',false,'error','project_rules_invalid'); end if;
  insert into public.student_book_projects(teacher_id,class_id,title,rules,content_version,allow_class_library,deadline) values(auth.uid(),p_class_id,v_title,p_project_rules,coalesce((p_project_rules->>'contentVersion')::integer,1),coalesce((p_project_rules->>'allowClassLibrary')::boolean,false),nullif(p_project_rules->>'deadline','')::timestamptz) returning * into v_project;
  insert into public.student_book_project_learners(project_id,student_id) select v_project.id,unnest(v_valid_ids);
  return jsonb_build_object('ok',true,'project',to_jsonb(v_project),'assigned_count',v_count,'skipped_count',greatest(v_requested_count-v_count,0));
end; $$;
