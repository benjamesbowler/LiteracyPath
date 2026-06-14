-- Teacher worksheet "bank": saved worksheet recipes (cycle + type + page count).
-- We store the recipe, not the PDF - worksheets regenerate deterministically.
-- Scoped to the teacher and synced across their devices.

create table if not exists public.worksheet_bank (
  id uuid primary key default gen_random_uuid(),
  teacher_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  cycle_id text not null,
  type text not null,
  pages int not null default 1,
  title text not null default '',
  created_at timestamptz not null default now()
);

create index if not exists worksheet_bank_teacher_idx
  on public.worksheet_bank (teacher_id, created_at desc);

alter table public.worksheet_bank enable row level security;
revoke all on public.worksheet_bank from anon;
grant select, insert, delete on public.worksheet_bank to authenticated;

-- A teacher only ever sees and manages their own saved worksheets.
drop policy if exists "Teachers manage their own worksheets" on public.worksheet_bank;
create policy "Teachers manage their own worksheets"
  on public.worksheet_bank for all to authenticated
  using (teacher_id = auth.uid())
  with check (teacher_id = auth.uid());
