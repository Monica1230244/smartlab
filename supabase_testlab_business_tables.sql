-- TESTLAB - tables metier separees compatibles avec l'application React
-- A executer dans Supabase SQL Editor avant d'activer REACT_APP_SUPABASE_TYPED_TABLES=true.
-- Le script cree une table par module, puis recopie les donnees existantes depuis smartlab_records.

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
    'testlab_audit_logs',
    'testlab_notifications'
  ];
begin
  foreach tbl in array tables loop
    execute format($f$
      create table if not exists public.%I (
        id text primary key,
        payload jsonb not null default '{}'::jsonb,
        updated_at timestamptz not null default now(),
        created_at timestamptz not null default now()
      )
    $f$, tbl);

    execute format('create index if not exists %I on public.%I (updated_at desc)', tbl || '_updated_at_idx', tbl);
    execute format('alter table public.%I enable row level security', tbl);

    execute format('drop policy if exists %I on public.%I', tbl || ' anon read', tbl);
    execute format('create policy %I on public.%I for select to anon using (true)', tbl || ' anon read', tbl);
    execute format('drop policy if exists %I on public.%I', tbl || ' anon insert', tbl);
    execute format('create policy %I on public.%I for insert to anon with check (true)', tbl || ' anon insert', tbl);
    execute format('drop policy if exists %I on public.%I', tbl || ' anon update', tbl);
    execute format('create policy %I on public.%I for update to anon using (true) with check (true)', tbl || ' anon update', tbl);
    execute format('drop policy if exists %I on public.%I', tbl || ' anon delete', tbl);
    execute format('create policy %I on public.%I for delete to anon using (true)', tbl || ' anon delete', tbl);

    execute format('drop trigger if exists %I on public.%I', tbl || '_touch_updated_at', tbl);
    execute format('create trigger %I before update on public.%I for each row execute procedure public.testlab_touch_updated_at()', tbl || '_touch_updated_at', tbl);
  end loop;
end $$;

-- Migration optionnelle des donnees existantes depuis l'ancien stockage centralise.
insert into public.testlab_clients (id, payload, updated_at)
select id, payload, updated_at from public.smartlab_records where resource = 'clients'
on conflict (id) do update set payload = excluded.payload, updated_at = excluded.updated_at;

insert into public.testlab_objets_essais (id, payload, updated_at)
select id, payload, updated_at from public.smartlab_records where resource = 'essais'
on conflict (id) do update set payload = excluded.payload, updated_at = excluded.updated_at;

insert into public.testlab_devis (id, payload, updated_at)
select id, payload, updated_at from public.smartlab_records where resource = 'devis'
on conflict (id) do update set payload = excluded.payload, updated_at = excluded.updated_at;

insert into public.testlab_commandes (id, payload, updated_at)
select id, payload, updated_at from public.smartlab_records where resource = 'commandes'
on conflict (id) do update set payload = excluded.payload, updated_at = excluded.updated_at;

insert into public.testlab_rapports (id, payload, updated_at)
select id, payload, updated_at from public.smartlab_records where resource = 'rapports'
on conflict (id) do update set payload = excluded.payload, updated_at = excluded.updated_at;

insert into public.testlab_documents_qualite (id, payload, updated_at)
select id, payload, updated_at from public.smartlab_records where resource = 'documentsQualite'
on conflict (id) do update set payload = excluded.payload, updated_at = excluded.updated_at;

insert into public.testlab_equipements (id, payload, updated_at)
select id, payload, updated_at from public.smartlab_records where resource = 'equipements'
on conflict (id) do update set payload = excluded.payload, updated_at = excluded.updated_at;

insert into public.testlab_non_conformites (id, payload, updated_at)
select id, payload, updated_at from public.smartlab_records where resource = 'nonConformites'
on conflict (id) do update set payload = excluded.payload, updated_at = excluded.updated_at;

insert into public.testlab_reclamations (id, payload, updated_at)
select id, payload, updated_at from public.smartlab_records where resource = 'reclamations'
on conflict (id) do update set payload = excluded.payload, updated_at = excluded.updated_at;

insert into public.testlab_notifications (id, payload, updated_at)
select id, payload, updated_at from public.smartlab_records where resource = 'notifications'
on conflict (id) do update set payload = excluded.payload, updated_at = excluded.updated_at;

-- Migration complete des ressources connues vers les tables TESTLAB separees.
do $$
declare
  pair text[];
  pairs text[][] := array[
    array['clients','testlab_clients'],
    array['essais','testlab_objets_essais'],
    array['devis','testlab_devis'],
    array['commandes','testlab_commandes'],
    array['factures','testlab_factures'],
    array['rapports','testlab_rapports'],
    array['catalogueEssais','testlab_catalogue_essais'],
    array['resultatsEssais','testlab_resultats_essais'],
    array['documentsQualite','testlab_documents_qualite'],
    array['equipements','testlab_equipements'],
    array['personnel','testlab_personnel'],
    array['nonConformites','testlab_non_conformites'],
    array['reclamations','testlab_reclamations'],
    array['actionsQualite','testlab_actions_qualite'],
    array['risquesOpportunites','testlab_risques_opportunites'],
    array['revuesDirection','testlab_revues_direction'],
    array['achatsApprovisionnement','testlab_achats_approvisionnement'],
    array['fournisseurs','testlab_fournisseurs'],
    array['consommablesStocks','testlab_consommables_stocks'],
    array['contrats','testlab_contrats'],
    array['signaturesElectroniques','testlab_signatures_electroniques'],
    array['portailClient','testlab_portail_client'],
    array['portailFournisseur','testlab_portail_fournisseur'],
    array['analyseDocumentaireIA','testlab_analyse_documentaire_ia'],
    array['auditLogs','testlab_audit_logs'],
    array['notifications','testlab_notifications']
  ];
begin
  foreach pair slice 1 in array pairs loop
    execute format(
      'insert into public.%I (id, payload, updated_at) select id, payload, updated_at from public.smartlab_records where resource = %L on conflict (id) do update set payload = excluded.payload, updated_at = excluded.updated_at',
      pair[2], pair[1]
    );
  end loop;
end $$;

