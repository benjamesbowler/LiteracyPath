-- Guided Reading publication is fail-closed: a book is unavailable to child
-- surfaces until an app admin explicitly approves it. Failed reviews remain
-- quarantined with a repair note so they can be fixed and reviewed again.

begin;

create table if not exists public.guided_reading_book_reviews (
  book_id text primary key check (char_length(btrim(book_id)) between 1 and 120),
  status text not null check (status in ('approved', 'quarantined')),
  review_note text not null default '',
  reviewed_by uuid references auth.users(id) on delete set null,
  reviewed_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint guided_reading_quarantine_note_required check (
    status <> 'quarantined' or char_length(btrim(review_note)) > 0
  )
);

alter table public.guided_reading_book_reviews enable row level security;

revoke all on table public.guided_reading_book_reviews
  from public, anon, authenticated;
grant select on table public.guided_reading_book_reviews to anon, authenticated;
grant insert, update on table public.guided_reading_book_reviews to authenticated;

drop policy if exists "Anyone can read approved guided reading books"
  on public.guided_reading_book_reviews;
create policy "Anyone can read approved guided reading books"
  on public.guided_reading_book_reviews
  for select
  to anon, authenticated
  using (status = 'approved');

drop policy if exists "App admins can read all guided reading reviews"
  on public.guided_reading_book_reviews;
create policy "App admins can read all guided reading reviews"
  on public.guided_reading_book_reviews
  for select
  to authenticated
  using (public.is_app_admin(auth.uid()));

drop policy if exists "App admins can create guided reading reviews"
  on public.guided_reading_book_reviews;
create policy "App admins can create guided reading reviews"
  on public.guided_reading_book_reviews
  for insert
  to authenticated
  with check (
    public.is_app_admin(auth.uid())
    and reviewed_by = auth.uid()
  );

drop policy if exists "App admins can update guided reading reviews"
  on public.guided_reading_book_reviews;
create policy "App admins can update guided reading reviews"
  on public.guided_reading_book_reviews
  for update
  to authenticated
  using (public.is_app_admin(auth.uid()))
  with check (
    public.is_app_admin(auth.uid())
    and reviewed_by = auth.uid()
  );

commit;
