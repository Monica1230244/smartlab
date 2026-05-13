import React from 'react';
import ResourcePage from '../components/ResourcePage';

const statusOptions = [
  { value: 'nouvelle', label: 'Nouvelle' },
  { value: 'en_cours', label: 'En cours' },
  { value: 'livree', label: 'Livree' },
  { value: 'annulee', label: 'Annulee' }
];

const fields = [
  { name: 'numero', label: 'Numero commande', required: true, placeholder: 'CMD-2026-015' },
  { name: 'client_nom', label: 'Client', required: true, placeholder: 'Nom client' },
  { name: 'reference_devis', label: 'Reference devis', placeholder: 'DEV-2026-032' },
  { name: 'objet', label: 'Objet', required: true, placeholder: 'Campagne essais...', full: true },
  { name: 'date', label: 'Date', type: 'date' },
  { name: 'statut', label: 'Statut', options: statusOptions, defaultValue: 'nouvelle' }
];

const columns = [
  { name: 'numero', label: 'N commande' },
  { name: 'client_nom', label: 'Client' },
  { name: 'reference_devis', label: 'Devis' },
  { name: 'objet', label: 'Objet' },
  { name: 'statut', label: 'Statut', badge: true }
];

export default function Commandes() {
  return (
    <ResourcePage
      title="Commandes"
      subtitle="Suivi des commandes liees aux devis acceptes."
      resource="commandes"
      fields={fields}
      columns={columns}
      primaryLabel="Nouvelle commande"
    />
  );
}
