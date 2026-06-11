import React from 'react';
import ResourcePage from '../components/ResourcePage';

const statusOptions = [
  { value: 'nouvelle', label: 'Nouvelle' },
  { value: 'en_cours', label: 'En cours' },
  { value: 'livree', label: 'Livree' },
  { value: 'annulee', label: 'Annulee' }
];

const fields = [
  { name: 'numero', label: 'Numero commande', required: true, placeholder: 'CMD-2026-015', hidden: true },
  {
    name: 'reference_devis',
    label: 'Reference devis',
    required: true,
    optionsResource: 'devis',
    optionValue: 'numero',
    optionLabel: 'numero',
    fillFrom: {
      client_nom: 'client_nom',
      client_whatsapp: 'client_whatsapp',
      projet: 'projet',
      prestations: 'prestations',
      montant_ht: 'montant_ht'
    }
  },
  { name: 'client_nom', label: 'Client concerne', required: true, placeholder: 'Client du devis', readOnly: true },
  { name: 'client_whatsapp', label: 'WhatsApp client', placeholder: '+229 ...', readOnly: true },
  { name: 'projet', label: 'Projet', placeholder: 'Projet du devis', readOnly: true },
  {
    name: 'prestations',
    label: 'Prestations',
    type: 'lineItems',
    full: true,
    defaultValue: [
      { designation: '', quantite: 1, prix_unitaire: 0 }
    ]
  },
  { name: 'montant_ht', label: 'Montant HT', type: 'money', required: true, hidden: true },
  { name: 'date', label: 'Date', type: 'date', hidden: true },
  { name: 'statut', label: 'Statut', options: statusOptions, defaultValue: 'nouvelle', hidden: true }
];

const columns = [
  { name: 'numero', label: 'N commande' },
  { name: 'reference_devis', label: 'Devis' },
  { name: 'client_nom', label: 'Client' },
  { name: 'projet', label: 'Projet' },
  { name: 'prestations', label: 'Prestations', type: 'lineItems' },
  { name: 'montant_ht', label: 'Montant', type: 'money' }
];

function formatCompactAmount(value) {
  const amount = Number(value || 0);
  if (amount >= 1000000) return `${(amount / 1000000).toFixed(2)}M`;
  return amount.toLocaleString('fr-FR');
}

export default function Commandes() {
  const summaryCards = (records) => {
    const totalAmount = records.reduce((sum, item) => sum + Number(item.montant_ht || 0), 0);
    const activeOrders = records.filter((item) => item.statut !== 'livree').length;
    const deliveredOrders = records.filter((item) => item.statut === 'livree').length;
    return [
      { label: 'Commandes creees', value: records.length, tone: 'blue' },
      { label: 'Montant total commandes', value: formatCompactAmount(totalAmount), tone: 'green', note: 'FCFA' },
      { label: 'Commandes actives', value: activeOrders, tone: 'amber' },
      { label: 'Commandes livrees', value: deliveredOrders, tone: 'green' }
    ];
  };

  return (
    <ResourcePage
      title="Commandes"
      subtitle="Suivi des commandes liees aux devis acceptes."
      resource="commandes"
      fields={fields}
      columns={columns}
      primaryLabel="Nouvelle commande"
      summaryCards={summaryCards}
    />
  );
}
