import React from 'react';
import ResourcePage from '../components/ResourcePage';

const statusOptions = [
  { value: 'ouverte', label: 'Ouverte' },
  { value: 'en_traitement', label: 'En traitement' },
  { value: 'cloturee', label: 'Cloturee' }
];

const fields = [
  { name: 'reference', label: 'Reference NC', required: true, placeholder: 'NC-2026-003' },
  { name: 'origine', label: 'Origine', required: true, placeholder: 'Reclamation, equipement, echantillon...' },
  { name: 'description', label: 'Description', required: true, placeholder: 'Description de la non-conformite', full: true },
  { name: 'responsable', label: 'Responsable', placeholder: 'Responsable Technique' },
  { name: 'echeance', label: 'Echeance', type: 'date' },
  { name: 'statut', label: 'Statut', options: statusOptions, defaultValue: 'ouverte' }
];

const columns = [
  { name: 'reference', label: 'Reference' },
  { name: 'origine', label: 'Origine' },
  { name: 'description', label: 'Description' },
  { name: 'responsable', label: 'Responsable' },
  { name: 'statut', label: 'Statut', badge: true }
];

export default function NonConformites() {
  const summaryCards = (records) => {
    const opened = records.filter((item) => item.statut === 'ouverte').length;
    const processing = records.filter((item) => item.statut === 'en_traitement').length;
    const closed = records.filter((item) => item.statut === 'cloturee').length;

    return [
      { label: 'NC totales', value: records.length, tone: 'blue' },
      { label: 'Ouvertes', value: opened, tone: 'red' },
      { label: 'En traitement', value: processing, tone: 'amber' },
      { label: 'Cloturees', value: closed, tone: 'green' }
    ];
  };

  return (
    <ResourcePage
      title="Gestion des non-conformités"
      subtitle="Suivi des ecarts, actions correctives et clotures selon le processus ISO."
      resource="nonConformites"
      fields={fields}
      columns={columns}
      primaryLabel="Nouvelle non-conformite"
      summaryCards={summaryCards}
    />
  );
}
