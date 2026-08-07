-- TESTLAB - securite entreprise Supabase (mode authentifie)
-- A appliquer lorsque l'application utilise Supabase Auth avec un utilisateur connecte par employe.
-- Important: ne pas appliquer ce script tant que l'application publique GitHub Pages utilise seulement la cle publishable/anon,
-- sinon les ecritures depuis les telephones non authentifies seront bloquees.

create extension if not exists "pgcrypto";

create table if not exists public.testlab_profiles (
  id text primary key,
  payload jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create table if not exists public.testlab_security_roles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  unique(user_id, role)
);

create or replace function public.testlab_current_role()
returns text
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(
    nullif(current_setting('request.jwt.claims', true)::jsonb ->> 'testlab_role', ''),
    (select role from public.testlab_security_roles where user_id = auth.uid() and active = true order by created_at desc limit 1),
    'invite'
  );
$$;

create or replace function public.testlab_can_read(table_name text)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select auth.uid() is not null;
$$;

create or replace function public.testlab_can_write(table_name text)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.testlab_current_role() in (
    'dg',
    'responsable_appel',
    'responsable_technique',
    'responsable_qualite',
    'responsable_labo',
    'responsable_metrologie',
    'responsable_achats',
    'responsable_finance',
    'receptionniste'
  );
$$;

do $$
declare
  tbl text;
  tables text[] := array[
    'testlab_clients',
    'testlab_objets_essais',
    'testlab_devis',
    'testlab_commandes',
    'testlab_factures',
    'testlab_rapports',
    'testlab_catalogue_essais',
    'testlab_resultats_essais',
    'testlab_documents_qualite',
    'testlab_equipements',
    'testlab_personnel',
    'testlab_non_conformites',
    'testlab_reclamations',
    'testlab_actions_qualite',
    'testlab_risques_opportunites',
    'testlab_revues_direction',
    'testlab_achats_approvisionnement',
    'testlab_fournisseurs',
    'testlab_consommables_stocks',
    'testlab_contrats',
    'testlab_signatures_electroniques',
    'testlab_portail_client',
    'testlab_portail_fournisseur',
    'testlab_analyse_documentaire_ia',
    'testlab_gouvernance',
    'testlab_demandes_prestations',
    'testlab_missions_terrain',
    'testlab_planning_projets',
    'testlab_competences_formations',
    'testlab_metrologie_avancee',
    'testlab_finances_avancees',
    'testlab_objectifs_qualite',
    'testlab_moteurs_systeme',
    'testlab_audit_logs',
    'testlab_notifications',
    'testlab_profiles'
  ];
begin
  foreach tbl in array tables loop
    execute format('alter table public.%I enable row level security', tbl);

    execute format('drop policy if exists %I on public.%I', tbl || ' anon read', tbl);
    execute format('drop policy if exists %I on public.%I', tbl || ' anon insert', tbl);
    execute format('drop policy if exists %I on public.%I', tbl || ' anon update', tbl);
    execute format('drop policy if exists %I on public.%I', tbl || ' anon delete', tbl);

    execute format('drop policy if exists %I on public.%I', tbl || ' authenticated read', tbl);
    execute format('create policy %I on public.%I for select to authenticated using (public.testlab_can_read(%L))', tbl || ' authenticated read', tbl, tbl);

    execute format('drop policy if exists %I on public.%I', tbl || ' authenticated insert', tbl);
    execute format('create policy %I on public.%I for insert to authenticated with check (public.testlab_can_write(%L))', tbl || ' authenticated insert', tbl, tbl);

    execute format('drop policy if exists %I on public.%I', tbl || ' authenticated update', tbl);
    execute format('create policy %I on public.%I for update to authenticated using (public.testlab_can_write(%L)) with check (public.testlab_can_write(%L))', tbl || ' authenticated update', tbl, tbl, tbl);

    execute format('drop policy if exists %I on public.%I', tbl || ' authenticated delete', tbl);
    execute format('create policy %I on public.%I for delete to authenticated using (public.testlab_current_role() in (''dg'', ''responsable_qualite''))', tbl || ' authenticated delete', tbl);
  end loop;
end $$;

alter table public.testlab_security_roles enable row level security;
drop policy if exists "roles own read" on public.testlab_security_roles;
create policy "roles own read" on public.testlab_security_roles for select to authenticated using (user_id = auth.uid() or public.testlab_current_role() = 'dg');
drop policy if exists "roles dg write" on public.testlab_security_roles;
create policy "roles dg write" on public.testlab_security_roles for all to authenticated using (public.testlab_current_role() = 'dg') with check (public.testlab_current_role() = 'dg');