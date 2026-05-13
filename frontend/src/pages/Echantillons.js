import React from 'react';
import ResourcePage from '../components/ResourcePage';

const statusOptions = [
  { value: 'recu', label: 'Recu' },
  { value: 'en_essai', label: 'En essai' },
  { value: 'conserve', label: 'Conserve' },
  { value: 'archive', label: 'Archive' }
];

const fields = [
  { name: 'code', label: 'Code echantillon', required: true, placeholder: 'ECH-052' },
  { name: 'client_nom', label: 'Client', required: true, placeholder: 'Nom client' },
  { name: 'nature', label: 'Nature', required: true, placeholder: 'Beton C25, sol...' },
  { name: 'reception', label: 'Date reception', type: 'date' },
  { name: 'statut', label: 'Statut', options: statusOptions, defaultValue: 'recu' }
];

const columns = [
  { name: 'code', label: 'Code' },
  { name: 'client_nom', label: 'Client' },
  { name: 'nature', label: 'Nature' },
  { name: 'reception', label: 'Reception' },
  { name: 'statut', label: 'Statut', badge: true }
];

export default function Echantillons() {
  return (
    <ResourcePage
      title="Echantillons"
      subtitle="Enregistrement et suivi des echantillons recus."
      resource="echantillons"
      fields={fields}
      columns={columns}
      primaryLabel="Nouvel echantillon"
    />
  );
}
