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
  return (
    <ResourcePage
      title="Reclamations et non-conformites"
      subtitle="Suivi des ecarts, actions correctives et clotures selon le processus ISO."
      resource="nonConformites"
      fields={fields}
      columns={columns}
      primaryLabel="Nouvelle non-conformite"
    />
  );
}
