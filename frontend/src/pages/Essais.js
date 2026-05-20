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

const essaiOptions = [
  { value: 'OPM', label: 'OPM - Optimum Proctor Modifie' },
  { value: 'RC7', label: 'RC7 - Resistance compression 7 jours' },
  { value: 'RC28', label: 'RC28 - Resistance compression 28 jours' },
  { value: 'AE', label: 'AE - Analyse eau' },
  { value: 'CBR', label: 'CBR - California Bearing Ratio' },
  { value: 'GRAN', label: 'GRAN - Granulometrie' },
  { value: 'LA', label: 'LA - Limites Atterberg' }
];

const fields = [
  { name: 'numero', label: 'Numero essai', required: true, placeholder: 'EA-2026-052' },
  { name: 'nature', label: 'Nature', required: true, placeholder: 'Beton C25, sol lateritique, eau...' },
  { name: 'provenance', label: 'Provenance', required: true, placeholder: 'Chantier, carriere, forage...' },
  { name: 'date_prelevement', label: 'Date de prelevement', type: 'date' },
  { name: 'essai_a_realiser', label: 'Essai a realiser', required: true, options: essaiOptions },
  { name: 'client_nom', label: 'Client', required: true, placeholder: 'Sogea BTP Benin' },
  { name: 'commentaire', label: 'Commentaire', placeholder: 'Observations, conditions de prelevement...', full: true },
  { name: 'technicien', label: 'Technicien', placeholder: 'Nom technicien' },
  { name: 'date', label: 'Date', type: 'date', hidden: true },
  { name: 'statut', label: 'Statut', required: true, options: statusOptions, defaultValue: 'en_cours' },
  { name: 'priorite', label: 'Priorite', options: priorityOptions, defaultValue: 'normale' }
];

const columns = [
  { name: 'numero', label: 'N essai' },
  { name: 'nature', label: 'Nature' },
  { name: 'provenance', label: 'Provenance' },
  { name: 'essai_a_realiser', label: 'Essai' },
  { name: 'client_nom', label: 'Client' },
  { name: 'statut', label: 'Statut', badge: true },
  { name: 'priorite', label: 'Priorite', badge: true }
];

export default function Essais() {
  return (
    <ResourcePage
      title="Objets d'essais"
      subtitle="Creation, suivi et mise a jour des objets soumis aux essais de laboratoire."
      resource="essais"
      fields={fields}
      columns={columns}
      primaryLabel="Nouvel objet d'essai"
    />
  );
}
