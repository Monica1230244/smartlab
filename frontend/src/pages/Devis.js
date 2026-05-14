import React from 'react';
import ResourcePage from '../components/ResourcePage';

const statusOptions = [
  { value: 'brouillon', label: 'Brouillon' },
  { value: 'envoye', label: 'Envoye' },
  { value: 'signe', label: 'Signe' },
  { value: 'paye', label: 'Paye' }
];

const clientOptions = [
  { value: 'Sogea BTP Benin', label: 'Sogea BTP', fill: { client_whatsapp: '+229 97 12 34 56' } },
  { value: 'AGETUR Benin', label: 'AGETUR Benin', fill: { client_whatsapp: '+229 95 67 89 01' } },
  { value: 'Colas Benin', label: 'Colas Benin', fill: { client_whatsapp: '+229 91 44 20 10' } },
  { value: 'SERHAU-SEM', label: 'SERHAU-SEM', fill: { client_whatsapp: '+229 96 20 44 11' } },
  { value: 'SONEB', label: 'SONEB', fill: { client_whatsapp: '+229 90 10 22 33' } }
];

const projetOptions = [
  { value: 'Pont de Cotonou', label: 'Pont de Cotonou' },
  { value: 'Route Nationale 1', label: 'Route Nationale 1' },
  { value: 'Voirie Akpakpa', label: 'Voirie Akpakpa' },
  { value: 'Forage Abomey', label: 'Forage Abomey' },
  { value: 'Nouveau projet', label: 'Nouveau projet' }
];

const fields = [
  { name: 'numero', label: 'Numero', required: true, placeholder: 'DEV-2026-032', hidden: true },
  { name: 'client_nom', label: 'Client', required: true, options: clientOptions },
  { name: 'projet', label: 'Projet', options: projetOptions },
  { name: 'client_whatsapp', label: 'WhatsApp client', required: true, placeholder: '+229 97 12 34 56' },
  { name: 'objet', label: 'Objet du devis', required: true, placeholder: 'Ex: Essais beton - Pont de Cotonou', full: true },
  {
    name: 'prestations',
    label: 'Prestations',
    type: 'lineItems',
    full: true,
    defaultValue: [
      { designation: 'Compression beton Rc28 (lot 3)', quantite: 8, prix_unitaire: 150000 },
      { designation: 'Proctor modifie', quantite: 4, prix_unitaire: 200000 }
    ]
  },
  { name: 'montant_ht', label: 'Montant HT', type: 'money', required: true, hidden: true },
  { name: 'date', label: 'Date', type: 'date', hidden: true },
  { name: 'statut', label: 'Statut', options: statusOptions, defaultValue: 'brouillon', hidden: true }
];

const columns = [
  { name: 'numero', label: 'N' },
  { name: 'client_nom', label: 'Client' },
  { name: 'projet', label: 'Projet' },
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
      submitLabel="Envoyer au client"
      whatsappOnSubmit
    />
  );
}
