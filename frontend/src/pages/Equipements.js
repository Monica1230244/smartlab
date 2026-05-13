import React from 'react';
import ResourcePage from '../components/ResourcePage';

const statusOptions = [
  { value: 'conforme', label: 'Conforme' },
  { value: 'a_surveiller', label: 'A surveiller' },
  { value: 'hors_service', label: 'Hors service' }
];

const fields = [
  { name: 'code', label: 'Code equipement', required: true, placeholder: 'EQ-003' },
  { name: 'designation', label: 'Designation', required: true, placeholder: 'Presse, balance, etuve...' },
  { name: 'famille', label: 'Famille', placeholder: 'Beton, sols, metrologie...' },
  { name: 'dernier_etalonnage', label: 'Dernier etalonnage', type: 'date' },
  { name: 'prochain_etalonnage', label: 'Prochain etalonnage', type: 'date' },
  { name: 'statut', label: 'Statut', options: statusOptions, defaultValue: 'conforme' }
];

const columns = [
  { name: 'code', label: 'Code' },
  { name: 'designation', label: 'Designation' },
  { name: 'famille', label: 'Famille' },
  { name: 'prochain_etalonnage', label: 'Prochain etalonnage' },
  { name: 'statut', label: 'Statut', badge: true }
];

export default function Equipements() {
  return (
    <ResourcePage
      title="Equipements et calibrations"
      subtitle="Gestion des equipements critiques, certificats et echeances d'etalonnage."
      resource="equipements"
      fields={fields}
      columns={columns}
      primaryLabel="Nouvel equipement"
    />
  );
}
