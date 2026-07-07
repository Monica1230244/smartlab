-- TESTLAB - tables complementaires issues du document d architecture
-- A executer dans Supabase SQL Editor si REACT_APP_SUPABASE_TYPED_TABLES=true.

create extension if not exists "pgcrypto";

create or replace function public.testlab_touch_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

do $$
declare
  item record;
begin
  for item in
    select * from (values
      ('testlab_gouvernance', 'gouvernance'),
      ('testlab_demandes_prestations', 'demandesPrestations'),
      ('testlab_missions_terrain', 'missionsTerrain'),
      ('testlab_planning_projets', 'planningProjets'),
      ('testlab_competences_formations', 'competencesFormations'),
      ('testlab_metrologie_avancee', 'metrologieAvancee'),
      ('testlab_finances_avancees', 'financesAvancees'),
      ('testlab_objectifs_qualite', 'objectifsQualite'),
      ('testlab_moteurs_systeme', 'moteursSysteme')
    ) as t(table_name, resource_name)
  loop
    execute format($f$
      create table if not exists public.%I (
        id text primary key,
        payload jsonb not null default '{}'::jsonb,
        updated_at timestamptz not null default now(),
        created_at timestamptz not null default now()
      )
    $f$, item.table_name);

    execute format('create index if not exists %I on public.%I (updated_at desc)', item.table_name || '_updated_at_idx', item.table_name);
    execute format('alter table public.%I enable row level security', item.table_name);

    execute format('drop policy if exists %I on public.%I', item.table_name || ' anon read', item.table_name);
    execute format('create policy %I on public.%I for select to anon using (true)', item.table_name || ' anon read', item.table_name);
    execute format('drop policy if exists %I on public.%I', item.table_name || ' anon insert', item.table_name);
    execute format('create policy %I on public.%I for insert to anon with check (true)', item.table_name || ' anon insert', item.table_name);
    execute format('drop policy if exists %I on public.%I', item.table_name || ' anon update', item.table_name);
    execute format('create policy %I on public.%I for update to anon using (true) with check (true)', item.table_name || ' anon update', item.table_name);
    execute format('drop policy if exists %I on public.%I', item.table_name || ' anon delete', item.table_name);
    execute format('create policy %I on public.%I for delete to anon using (true)', item.table_name || ' anon delete', item.table_name);

    execute format('drop trigger if exists %I on public.%I', item.table_name || '_touch_updated_at', item.table_name);
    execute format('create trigger %I before update on public.%I for each row execute procedure public.testlab_touch_updated_at()', item.table_name || '_touch_updated_at', item.table_name);

    execute format(
      'insert into public.%I (id, payload, updated_at)
       select id, payload, updated_at from public.smartlab_records where resource = %L
       on conflict (id) do update set payload = excluded.payload, updated_at = excluded.updated_at',
      item.table_name,
      item.resource_name
    );
  end loop;
end $$;
