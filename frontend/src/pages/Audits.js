import React from 'react';
import ResourcePage from '../components/ResourcePage';

const statusOptions = [
  { value: 'planifie', label: 'Planifie' },
  { value: 'en_preparation', label: 'En preparation' },
  { value: 'realise', label: 'Realise' },
  { value: 'cloture', label: 'Cloture' }
];

const fields = [
  { name: 'reference', label: 'Reference', required: true, placeholder: 'AUD-2026-002' },
  { name: 'type', label: 'Type audit', required: true, placeholder: 'Audit interne ISO 17025' },
  { name: 'pilote', label: 'Pilote', placeholder: 'Responsable Qualite' },
  { name: 'date', label: 'Date', type: 'date' },
  { name: 'statut', label: 'Statut', options: statusOptions, defaultValue: 'planifie' }
];

const columns = [
  { name: 'reference', label: 'Reference' },
  { name: 'type', label: 'Type' },
  { name: 'pilote', label: 'Pilote' },
  { name: 'date', label: 'Date' },
  { name: 'statut', label: 'Statut', badge: true }
];

export default function Audits() {
  return (
    <ResourcePage
      title="Audits qualite"
      subtitle="Planification des audits, revues de direction et actions d'amelioration."
      resource="audits"
      fields={fields}
      columns={columns}
      primaryLabel="Nouvel audit"
    />
  );
}
