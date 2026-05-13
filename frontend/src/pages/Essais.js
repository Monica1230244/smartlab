import React from 'react';
import ResourcePage from '../components/ResourcePage';

const statusOptions = [
  { value: 'en_attente', label: 'En attente' },
  { value: 'en_cours', label: 'En cours' },
  { value: 'termine', label: 'Termine' }
];

const priorityOptions = [
  { value: 'normale', label: 'Normale' },
  { value: 'haute', label: 'Haute' },
  { value: 'urgente', label: 'Urgente' }
];

const fields = [
  { name: 'numero', label: 'Numero essai', required: true, placeholder: 'EA-2026-052' },
  { name: 'type_essai', label: 'Type essai', required: true, placeholder: 'Beton - Rc28' },
  { name: 'client_nom', label: 'Client', required: true, placeholder: 'Sogea BTP Benin' },
  { name: 'echantillon', label: 'Echantillon', placeholder: 'ECH-052' },
  { name: 'technicien', label: 'Technicien', placeholder: 'Nom technicien' },
  { name: 'date', label: 'Date', type: 'date' },
  { name: 'statut', label: 'Statut', required: true, options: statusOptions, defaultValue: 'en_cours' },
  { name: 'priorite', label: 'Priorite', options: priorityOptions, defaultValue: 'normale' }
];

const columns = [
  { name: 'numero', label: 'N essai' },
  { name: 'type_essai', label: 'Type' },
  { name: 'client_nom', label: 'Client' },
  { name: 'technicien', label: 'Technicien' },
  { name: 'statut', label: 'Statut' },
  { name: 'priorite', label: 'Priorite' }
];

export default function Essais() {
  return (
    <ResourcePage
      title="Gestion des essais"
      subtitle="Creation, suivi et mise a jour des essais de laboratoire."
      resource="essais"
      fields={fields}
      columns={columns}
      primaryLabel="Nouvel essai"
    />
  );
}
