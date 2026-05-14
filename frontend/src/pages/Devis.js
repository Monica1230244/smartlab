import React from 'react';
import ResourcePage from '../components/ResourcePage';

const statusOptions = [
  { value: 'brouillon', label: 'Brouillon' },
  { value: 'envoye', label: 'Envoye' },
  { value: 'signe', label: 'Signe' },
  { value: 'paye', label: 'Paye' }
];

const fields = [
  { name: 'numero', label: 'Numero', required: true, placeholder: 'DEV-2026-032' },
  { name: 'client_nom', label: 'Client', required: true, placeholder: 'Nom client' },
  { name: 'objet', label: 'Objet', required: true, placeholder: 'Essais beton chantier...', full: true },
  { name: 'montant_ht', label: 'Montant HT', type: 'money', required: true, placeholder: '1500000' },
  { name: 'date', label: 'Date', type: 'date' },
  { name: 'statut', label: 'Statut', options: statusOptions, defaultValue: 'brouillon' }
];

const columns = [
  { name: 'numero', label: 'N' },
  { name: 'client_nom', label: 'Client' },
  { name: 'objet', label: 'Objet' },
  { name: 'montant_ht', label: 'Montant HT', type: 'money' },
  { name: 'statut', label: 'Statut', badge: true }
];

export default function Devis() {
  const summaryCards = [
    { label: 'Devis en attente', value: '8', tone: 'blue' },
    { label: 'CA facture 2026', value: '13.1M', tone: 'green', note: 'FCFA' },
    { label: 'En attente paiement', value: '2.8M', tone: 'amber', note: 'FCFA' },
    { label: 'Impayes', value: '480k', tone: 'red', note: 'FCFA' }
  ];

  return (
    <ResourcePage
      title="Devis & Factures"
      subtitle="Gestion administrative et commerciale"
      resource="devis"
      fields={fields}
      columns={columns}
      primaryLabel="Nouveau Devis"
      summaryCards={summaryCards}
    />
  );
}
