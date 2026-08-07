-- Guided Reading publication flips from allowlist to blocklist.
--
-- WHY. The gate was fail-closed: a book was invisible to children until an app
-- admin explicitly approved it. The review table was never seeded, so in
-- practice all 206 authored books were hidden from every child, while the Daily
-- Mission still advertised a "book of the day" that led to an empty shelf. A
-- review queue nobody had worked through was silently identical to having no
-- library at all.
--
-- AFTER THIS MIGRATION. Every authored book is live. A book leaves the child
-- side only when an admin explicitly fails it, which still requires a repair
-- note. The ability to pull a bad book instantly is unchanged — what changes is
-- that withholding is now a deliberate recorded act rather than the default
-- state of an untouched queue.
--
-- The child surface therefore needs to read the QUARANTINED rows (the things to
-- hide), not the approved ones. That is the only policy change here.

begin;

-- The old public policy exposed approved rows, which the child side no longer
-- consults. Replaced rather than kept, so nothing reads a list that no longer
-- means anything.
drop policy if exists "Anyone can read approved guided reading books"
  on public.guided_reading_book_reviews;

drop policy if exists "Anyone can read quarantined guided reading books"
  on public.guided_reading_book_reviews;
create policy "Anyone can read quarantined guided reading books"
  on public.guided_reading_book_reviews
  for select
  to anon, authenticated
  using (status = 'quarantined');

comment on table public.guided_reading_book_reviews is
  'Guided Reading publication blocklist. Books are live to children by default; a row with status = ''quarantined'' removes one. An ''approved'' row is a positive review record only and no longer gates visibility.';

-- Any pre-existing 'approved' rows are now inert. They are left in place as
-- review history rather than deleted — they record that a human looked at that
-- book and passed it, which is worth keeping even though it no longer gates.

commit;
