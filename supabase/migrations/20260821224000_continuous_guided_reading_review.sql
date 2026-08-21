-- Guided Reading follows the product-wide continuous-review policy.
-- Books are accepted unless an app admin records a quarantine. Public callers
-- receive only the ids needed to exclude quarantined books; repair notes and
-- reviewer metadata remain available only to app admins.

begin;

drop policy if exists "Anyone can read approved guided reading books"
  on public.guided_reading_book_reviews;
drop policy if exists "Anyone can read quarantined guided reading books"
  on public.guided_reading_book_reviews;

revoke all on table public.guided_reading_book_reviews from anon;
revoke all on table public.guided_reading_book_reviews from authenticated;
grant select, insert, update on table public.guided_reading_book_reviews to authenticated;

create or replace view public.guided_reading_quarantines
with (security_barrier = true)
as
select book_id, status
from public.guided_reading_book_reviews
where status = 'quarantined';

revoke all on table public.guided_reading_quarantines from public, anon, authenticated;
grant select on table public.guided_reading_quarantines to anon, authenticated;

comment on table public.guided_reading_book_reviews is
  'Private continuous-review decisions. Missing rows and approved rows are accepted; a quarantined row removes the book from learner surfaces.';
comment on view public.guided_reading_quarantines is
  'Public projection of quarantined Guided Reading book ids. Repair notes, reviewer ids, and timestamps are not exposed.';

commit;
