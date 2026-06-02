import React from 'react';
import ResourcePage from '../components/ResourcePage';

const statusOptions = [
  { value: 'redaction', label: 'Redaction' },
  { value: 'validation_technique', label: 'Validation technique' },
  { value: 'validation_dg', label: 'Validation DG' },
  { value: 'pret_envoi', label: 'Pret a envoyer' },
  { value: 'envoye_client', label: 'Envoye au client' },
  { value: 'valide_client', label: 'Valide client' },
  { value: 'commande_creee', label: 'Commande creee' },
  { value: 'refuse', label: 'Refuse' }
];

const canalOptions = [
  { value: 'whatsapp', label: 'WhatsApp' },
  { value: 'email', label: 'Email' },
  { value: 'sms', label: 'SMS' }
];

const validationOptions = [
  { value: 'responsable_appel', label: 'Responsable des appels' },
  { value: 'responsable_technique', label: 'Responsable technique' },
  { value: 'dg', label: 'DG' },
  { value: 'client', label: 'Client' }
];

const fields = [
  { name: 'numero', label: 'Numero', required: true, placeholder: 'DEV-2026-032', hidden: true },
  {
    name: 'client_nom',
    label: 'Client',
    required: true,
    optionsResource: 'clients',
    optionValue: 'raison_sociale',
    optionLabel: 'raison_sociale',
    fillFrom: { client_whatsapp: 'telephone', client_email: 'email' }
  },
  { name: 'projet', label: 'Nom du projet', required: true, placeholder: 'Saisir le nom du projet' },
  { name: 'client_whatsapp', label: 'WhatsApp client', required: true, placeholder: '+229 97 12 34 56' },
  { name: 'client_email', label: 'Email client', placeholder: 'client@exemple.com' },
  { name: 'canal_envoi', label: 'Canal d’envoi', required: true, options: canalOptions, defaultValue: 'whatsapp' },
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
  { name: 'canal_validation', label: 'Circuit validation', options: validationOptions, defaultValue: 'responsable_appel', hidden: true },
  { name: 'code_validation', label: 'Code QR validation client', type: 'validationCode', readOnly: true, hidden: true },
  { name: 'date', label: 'Date', type: 'date', hidden: true },
  { name: 'statut', label: 'Statut', options: statusOptions, defaultValue: 'redaction', hidden: true }
];

const columns = [
  { name: 'numero', label: 'N' },
  { name: 'client_nom', label: 'Client' },
  { name: 'projet', label: 'Projet' },
  { name: 'objet', label: 'Objet' },
  { name: 'prestations', label: 'Prestations', type: 'lineItems' },
  { name: 'montant_ht', label: 'Montant HT', type: 'money' },
  { name: 'canal_envoi', label: 'Canal' },
  { name: 'code_validation', label: 'Code client' },
  { name: 'statut', label: 'Statut', badge: true }
];

function formatCompactMoney(value) {
  const amount = Number(value || 0);
  if (amount >= 1000000) return `${(amount / 1000000).toLocaleString('fr-FR', { maximumFractionDigits: 1 })}M`;
  if (amount >= 1000) return `${Math.round(amount / 1000).toLocaleString('fr-FR')}k`;
  return amount.toLocaleString('fr-FR');
}

export default function Devis() {
  const summaryCards = (records) => {
    const totalAmount = records.reduce((sum, item) => sum + Number(item.montant_ht || 0), 0);
    const sent = records.filter((item) => item.statut === 'envoye_client').length;
    const signed = records.filter((item) => ['valide_client', 'commande_creee'].includes(item.statut)).length;
    const drafts = records.filter((item) => item.statut === 'redaction').length;
    return [
      { label: 'Total devis', value: records.length, tone: 'blue' },
      { label: 'Montant total', value: formatCompactMoney(totalAmount), tone: 'green', note: 'FCFA' },
      { label: 'Devis envoyes', value: sent, tone: 'amber' },
      { label: 'Devis signes', value: signed, tone: 'green', note: `${drafts} brouillon(s)` }
    ];
  };

  return (
    <ResourcePage
      title="Devis"
      subtitle="Creation, suivi et envoi des devis aux clients."
      resource="devis"
      fields={fields}
      columns={columns}
      primaryLabel="Nouveau Devis"
      summaryCards={summaryCards}
      submitLabel="Enregistrer le devis"
    />
  );
}
