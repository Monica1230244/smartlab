import React from 'react';
import ResourcePage from '../components/ResourcePage';

const statusOptions = [
  { value: 'en_attente', label: 'En attente' },
  { value: 'valide', label: 'Valide' },
  { value: 'commande', label: 'Commande' },
  { value: 'recu', label: 'Recu' },
  { value: 'annule', label: 'Annule' }
];

const priorityOptions = [
  { value: 'basse', label: 'Basse' },
  { value: 'normale', label: 'Normale' },
  { value: 'urgente', label: 'Urgente' }
];

const familyOptions = [
  { value: 'Consommables', label: 'Consommables' },
  { value: 'Equipement', label: 'Equipement' },
  { value: 'Maintenance', label: 'Maintenance' },
  { value: 'Etalonnage', label: 'Etalonnage' },
  { value: 'Service', label: 'Service' }
];

const fields = [
  { name: 'reference', label: 'Reference achat', required: true, placeholder: 'ACH-2026-003' },
  { name: 'fournisseur', label: 'Fournisseur', required: true, placeholder: 'Nom du fournisseur' },
  { name: 'famille', label: 'Famille', options: familyOptions, required: true },
  { name: 'objet', label: 'Objet de la demande', required: true, full: true, placeholder: 'Materiel, consommable, maintenance...' },
  { name: 'montant_ht', label: 'Montant HT', type: 'money', required: true },
  { name: 'date_demande', label: 'Date demande', type: 'date' },
  { name: 'demandeur', label: 'Demandeur', placeholder: 'Personne qui exprime le besoin' },
  { name: 'responsable', label: 'Responsable suivi', placeholder: 'Responsable Labo, RT, DG...' },
  { name: 'priorite', label: 'Priorite', options: priorityOptions, defaultValue: 'normale' },
  { name: 'statut', label: 'Statut', options: statusOptions, defaultValue: 'en_attente' }
];

const columns = [
  { name: 'reference', label: 'Reference' },
  { name: 'fournisseur', label: 'Fournisseur' },
  { name: 'famille', label: 'Famille' },
  { name: 'objet', label: 'Objet' },
  { name: 'montant_ht', label: 'Montant HT', type: 'money' },
  { name: 'responsable', label: 'Responsable' },
  { name: 'priorite', label: 'Priorite', badge: true },
  { name: 'statut', label: 'Statut', badge: true }
];

export default function AchatsApprovisionnement() {
  const summaryCards = (records) => {
    const total = records.reduce((sum, item) => sum + Number(item.montant_ht || 0), 0);
    const waiting = records.filter((item) => item.statut === 'en_attente').length;
    const validated = records.filter((item) => item.statut === 'valide').length;
    const urgent = records.filter((item) => item.priorite === 'urgente').length;

    return [
      { label: 'Demandes achats', value: records.length, tone: 'blue' },
      { label: 'Budget engage', value: `${(total / 1000000).toFixed(2)}M`, tone: 'green', note: 'FCFA' },
      { label: 'En attente', value: waiting, tone: 'amber' },
      { label: 'Validees', value: validated, tone: 'green' },
      { label: 'Urgentes', value: urgent, tone: 'red' }
    ];
  };

  return (
    <ResourcePage
      title="Achats et approvisionnement"
      subtitle="Suivi des besoins, fournisseurs, validations et receptions d'approvisionnement."
      resource="achatsApprovisionnement"
      fields={fields}
      columns={columns}
      primaryLabel="Nouvelle demande"
      summaryCards={summaryCards}
    />
  );
}
