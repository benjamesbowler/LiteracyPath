-- Restore the Guided Reading approval allowlist. Child publication must fail
-- closed: only explicit approved rows are readable to browser roles. Quarantine
-- notes remain visible to app admins and are no longer exposed publicly.

begin;

drop policy if exists "Anyone can read quarantined guided reading books"
  on public.guided_reading_book_reviews;

drop policy if exists "Anyone can read approved guided reading books"
  on public.guided_reading_book_reviews;
create policy "Anyone can read approved guided reading books"
  on public.guided_reading_book_reviews
  for select
  to anon, authenticated
  using (status = 'approved');

comment on table public.guided_reading_book_reviews is
  'Fail-closed Guided Reading publication allowlist. Only status = approved reaches child and teacher-assignment surfaces. App admins retain access to all reviews and quarantine notes.';

commit;
