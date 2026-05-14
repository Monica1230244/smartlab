-- A executer une seule fois dans Supabase > SQL Editor.
-- Cette table synchronise tous les modules SMARTLAB depuis l'application React.

create table if not exists public.smartlab_records (
  id text primary key,
  resource text not null,
  payload jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

create index if not exists smartlab_records_resource_idx
  on public.smartlab_records (resource);

alter table public.smartlab_records enable row level security;

drop policy if exists "smartlab public read" on public.smartlab_records;
create policy "smartlab public read"
  on public.smartlab_records
  for select
  to anon
  using (true);

drop policy if exists "smartlab public insert" on public.smartlab_records;
create policy "smartlab public insert"
  on public.smartlab_records
  for insert
  to anon
  with check (true);

drop policy if exists "smartlab public update" on public.smartlab_records;
create policy "smartlab public update"
  on public.smartlab_records
  for update
  to anon
  using (true)
  with check (true);

drop policy if exists "smartlab public delete" on public.smartlab_records;
create policy "smartlab public delete"
  on public.smartlab_records
  for delete
  to anon
  using (true);
