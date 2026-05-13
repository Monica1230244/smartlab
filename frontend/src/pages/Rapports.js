import React from 'react';
import ResourcePage from '../components/ResourcePage';

const statusOptions = [
  { value: 'brouillon', label: 'Brouillon' },
  { value: 'controle', label: 'Controle' },
  { value: 'valide', label: 'Valide' },
  { value: 'envoye', label: 'Envoye' }
];

const fields = [
  { name: 'numero', label: 'Numero rapport', required: true, placeholder: 'RAP-2026-047' },
  { name: 'essai', label: 'Essai lie', required: true, placeholder: 'EA-2026-052' },
  { name: 'client_nom', label: 'Client', required: true, placeholder: 'Nom client' },
  { name: 'date', label: 'Date', type: 'date' },
  { name: 'statut', label: 'Statut', options: statusOptions, defaultValue: 'brouillon' }
];

const columns = [
  { name: 'numero', label: 'N rapport' },
  { name: 'essai', label: 'Essai' },
  { name: 'client_nom', label: 'Client' },
  { name: 'date', label: 'Date' },
  { name: 'statut', label: 'Statut', badge: true }
];

export default function Rapports() {
  return (
    <ResourcePage
      title="Rapports"
      subtitle="Gestion des rapports d'essais et de leurs statuts."
      resource="rapports"
      fields={fields}
      columns={columns}
      primaryLabel="Nouveau rapport"
    />
  );
}
