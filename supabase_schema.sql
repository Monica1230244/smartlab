-- SMARTLAB - schema metier Supabase
-- A executer dans Supabase SQL Editor avec un compte proprietaire du projet.

create extension if not exists "pgcrypto";

create table if not exists public.clients (
  id uuid primary key default gen_random_uuid(),
  code text unique not null,
  raison_sociale text not null,
  contact_nom text,
  telephone text,
  email text,
  secteur text,
  adresse text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists public.devis (
  id uuid primary key default gen_random_uuid(),
  numero text unique not null,
  client_id uuid references public.clients(id),
  client_nom text not null,
  client_whatsapp text,
  client_email text,
  projet text not null,
  objet text not null,
  canal_envoi text default 'whatsapp',
  statut text default 'redaction',
  montant_ht numeric default 0,
  code_validation text unique,
  validation_expires_at timestamptz,
  validation_client text,
  motif_refus text,
  commande_numero text,
  historique_validations jsonb default '[]'::jsonb,
  attachments jsonb default '[]'::jsonb,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists public.devis_prestations (
  id uuid primary key default gen_random_uuid(),
  devis_id uuid references public.devis(id) on delete cascade,
  designation text not null,
  quantite numeric default 1,
  prix_unitaire numeric default 0,
  created_at timestamptz default now()
);

create table if not exists public.commandes (
  id uuid primary key default gen_random_uuid(),
  numero text unique not null,
  devis_id uuid references public.devis(id),
  reference_devis text,
  client_nom text not null,
  client_whatsapp text,
  projet text,
  montant_ht numeric default 0,
  statut text default 'nouvelle',
  prestations jsonb default '[]'::jsonb,
  attachments jsonb default '[]'::jsonb,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists public.objets_essais (
  id uuid primary key default gen_random_uuid(),
  numero text unique not null,
  reference_devis text not null,
  reference_commande text,
  nature text not null,
  provenance text,
  date_prelevement date,
  date_reception date,
  delai_livraison date,
  essai_a_realiser text,
  client_nom text,
  receptionniste text,
  responsable_labo text,
  commentaire text,
  statut text default 'en_cours',
  attachments jsonb default '[]'::jsonb,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  message text not null,
  path text default '/',
  tone text default 'info',
  target_role text,
  read boolean default false,
  read_at timestamptz,
  created_at timestamptz default now()
);

create table if not exists public.activity_logs (
  id uuid primary key default gen_random_uuid(),
  resource text not null,
  record_id text,
  action text not null,
  actor_role text,
  actor_name text,
  detail text,
  created_at timestamptz default now()
);

create table if not exists public.attachments (
  id uuid primary key default gen_random_uuid(),
  resource text not null,
  record_id text not null,
  file_name text not null,
  file_size bigint,
  file_type text,
  storage_path text,
  uploaded_by text,
  created_at timestamptz default now()
);

alter table public.clients enable row level security;
alter table public.devis enable row level security;
alter table public.devis_prestations enable row level security;
alter table public.commandes enable row level security;
alter table public.objets_essais enable row level security;
alter table public.notifications enable row level security;
alter table public.activity_logs enable row level security;
alter table public.attachments enable row level security;

-- Politiques de developpement. A durcir apres authentification Supabase Auth.
do $$
declare
  t text;
begin
  foreach t in array array['clients','devis','devis_prestations','commandes','objets_essais','notifications','activity_logs','attachments']
  loop
    execute format('drop policy if exists "smartlab_public_read_%s" on public.%I', t, t);
    execute format('drop policy if exists "smartlab_public_write_%s" on public.%I', t, t);
    execute format('create policy "smartlab_public_read_%s" on public.%I for select using (true)', t, t);
    execute format('create policy "smartlab_public_write_%s" on public.%I for all using (true) with check (true)', t, t);
  end loop;
end $$;
