-- Class Decodable Press drafts may be saved page by page. Submission remains
-- fail-closed and validates the exact frozen revision server-side.
create or replace function public.student_save_book_revision(p_token text,p_project_id uuid,p_book_id uuid,p_client_event_id text,p_book jsonb,p_validation jsonb)
returns jsonb language plpgsql volatile security definer set search_path=public as $$
declare v_student public.students; v_project public.student_book_projects; v_book public.student_books; v_revision public.student_book_revisions; v_number integer; v_page jsonb; v_asset text; v_assets jsonb; v_title text;
begin
  v_student:=public.student_from_token(p_token); if v_student.id is null then return jsonb_build_object('ok',false,'error','invalid_student_session'); end if;
  select p.* into v_project from public.student_book_projects p join public.student_book_project_learners pl on pl.project_id=p.id where p.id=p_project_id and pl.student_id=v_student.id and p.status='open'; if v_project.id is null then return jsonb_build_object('ok',false,'error','project_not_found'); end if;
  if jsonb_typeof(p_book)<>'object' or jsonb_typeof(p_book->'pages')<>'array' or jsonb_array_length(p_book->'pages')<>4 then return jsonb_build_object('ok',false,'error','book_shape_invalid'); end if;
  v_title:=trim(coalesce(p_book->>'title','')); if char_length(v_title) not between 1 and 80 then return jsonb_build_object('ok',false,'error','title_invalid'); end if;
  v_assets:=v_project.rules->'assetIds';
  for v_page in select value from jsonb_array_elements(p_book->'pages') loop
    v_asset:=v_page->>'assetId';
    if char_length(trim(coalesce(v_page->>'text',''))) > 240 or not v_assets ? v_asset then return jsonb_build_object('ok',false,'error','page_invalid'); end if;
  end loop;
  if p_book_id is null then insert into public.student_books(project_id,student_id,title) values(p_project_id,v_student.id,v_title) returning * into v_book;
  else select * into v_book from public.student_books where id=p_book_id and project_id=p_project_id and student_id=v_student.id for update; if v_book.id is null or v_book.status in ('submitted','archived') then return jsonb_build_object('ok',false,'error','book_not_editable'); end if; end if;
  select * into v_revision from public.student_book_revisions where book_id=v_book.id and client_event_id=p_client_event_id; if v_revision.id is not null then return jsonb_build_object('ok',true,'book_id',v_book.id,'revision_id',v_revision.id,'revision',v_revision.revision,'idempotent',true); end if;
  select coalesce(max(revision),0)+1 into v_number from public.student_book_revisions where book_id=v_book.id;
  insert into public.student_book_revisions(book_id,revision,parent_revision_id,client_event_id,content,validation) values(v_book.id,v_number,v_book.current_revision_id,p_client_event_id,p_book,p_validation) returning * into v_revision;
  update public.student_books set title=v_title,current_revision_id=v_revision.id,status='draft',updated_at=now() where id=v_book.id;
  return jsonb_build_object('ok',true,'book_id',v_book.id,'revision_id',v_revision.id,'revision',v_number,'status','draft');
end; $$;

-- Classmates see a neutral attribution. Teachers retain the learner identity
-- in the private review queue, where it is necessary for safeguarding and
-- feedback, but the child-facing library does not expose stored roster names.
create or replace function public.student_read_class_press_library(p_token text)
returns jsonb language plpgsql stable security definer set search_path=public as $$
declare v_student public.students; v_books jsonb;
begin
  v_student:=public.student_from_token(p_token); if v_student.id is null then return jsonb_build_object('ok',false,'error','invalid_student_session'); end if;
  select coalesce(jsonb_agg(jsonb_build_object('id',b.id,'title',b.title,'author_name','A reader in your class','revision_id',b.approved_revision_id,'content',r.content) order by b.updated_at desc),'[]'::jsonb)
    into v_books
    from public.student_books b
    join public.student_book_projects p on p.id=b.project_id
    join public.student_book_revisions r on r.id=b.approved_revision_id
    join public.student_book_reviews rv on rv.revision_id=b.approved_revision_id and rv.decision='approved' and rv.allow_class_library=true
    where p.class_id=v_student.class_id and b.status='approved_class' and b.visibility='class';
  return jsonb_build_object('ok',true,'books',v_books);
end; $$;

create or replace function public.student_submit_book_revision(p_token text,p_book_id uuid,p_revision_id uuid)
returns jsonb language plpgsql volatile security definer set search_path=public as $$
declare v_student public.students; v_book public.student_books; v_project public.student_book_projects; v_content jsonb; v_page jsonb; v_asset text; v_assets jsonb;
begin
  v_student:=public.student_from_token(p_token); if v_student.id is null then return jsonb_build_object('ok',false,'error','invalid_student_session'); end if;
  select * into v_book from public.student_books where id=p_book_id and student_id=v_student.id for update;
  if v_book.id is null then return jsonb_build_object('ok',false,'error','book_not_found'); end if;
  select * into v_project from public.student_book_projects where id=v_book.project_id;
  if v_project.id is null or v_project.status<>'open' then return jsonb_build_object('ok',false,'error','book_not_found'); end if;
  if v_book.current_revision_id<>p_revision_id or v_book.status<>'draft' then return jsonb_build_object('ok',false,'error','revision_not_submittable'); end if;
  select content into v_content from public.student_book_revisions where id=p_revision_id and book_id=v_book.id;
  if jsonb_typeof(v_content->'pages')<>'array' or jsonb_array_length(v_content->'pages')<>4 then return jsonb_build_object('ok',false,'error','book_incomplete'); end if;
  v_assets:=v_project.rules->'assetIds';
  for v_page in select value from jsonb_array_elements(v_content->'pages') loop
    v_asset:=v_page->>'assetId';
    if char_length(trim(coalesce(v_page->>'text',''))) not between 1 and 240 or not v_assets ? v_asset then return jsonb_build_object('ok',false,'error','book_incomplete'); end if;
  end loop;
  update public.student_books set status='submitted',updated_at=now() where id=v_book.id;
  return jsonb_build_object('ok',true,'status','submitted','revision_id',p_revision_id);
end; $$;
