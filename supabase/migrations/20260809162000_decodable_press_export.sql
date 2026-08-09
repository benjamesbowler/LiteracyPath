begin;

alter function public.teacher_export_learner_data(uuid,text,text)
  rename to teacher_export_learner_data_without_decodable_press;

create function public.teacher_export_learner_data(p_student_id uuid,p_requester_role text,p_verification_method text)
returns jsonb language plpgsql volatile security definer set search_path=public as $$
declare v_package jsonb;
begin
  perform public.assert_current_actor_teacher_access();
  v_package:=public.teacher_export_learner_data_without_decodable_press(p_student_id,p_requester_role,p_verification_method);
  return v_package || jsonb_build_object(
    'decodablePressAssignments',coalesce((select jsonb_agg(jsonb_build_object('projectId',p.id,'title',p.title,'rules',p.rules,'status',p.status,'createdAt',p.created_at) order by p.created_at) from public.student_book_project_learners pl join public.student_book_projects p on p.id=pl.project_id where pl.student_id=p_student_id),'[]'::jsonb),
    'decodablePressBooks',coalesce((select jsonb_agg(to_jsonb(b) order by b.created_at) from public.student_books b where b.student_id=p_student_id),'[]'::jsonb),
    'decodablePressRevisions',coalesce((select jsonb_agg(to_jsonb(r) order by r.created_at) from public.student_book_revisions r join public.student_books b on b.id=r.book_id where b.student_id=p_student_id),'[]'::jsonb),
    'decodablePressReviews',coalesce((select jsonb_agg(to_jsonb(rv) order by rv.created_at) from public.student_book_reviews rv join public.student_books b on b.id=rv.book_id where b.student_id=p_student_id),'[]'::jsonb)
  );
end; $$;
revoke all on function public.teacher_export_learner_data(uuid,text,text) from public,anon;
grant execute on function public.teacher_export_learner_data(uuid,text,text) to authenticated;
commit;
