import React from 'react';
import ResourcePage from '../components/ResourcePage';

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
  {
    name: 'reference_devis',
    label: 'Numero devis',
    required: true,
    optionsResource: 'devis',
    optionValue: 'numero',
    optionLabel: 'numero',
    fillFrom: {
      client_nom: 'client_nom',
      provenance: 'projet'
    }
  },
  { name: 'nature', label: 'Nature', required: true, placeholder: 'Beton C25, sol lateritique, eau...' },
  { name: 'provenance', label: 'Provenance', required: true, placeholder: 'Chantier, carriere, forage...' },
  { name: 'date_prelevement', label: 'Date de prelevement', type: 'date' },
  { name: 'date', label: 'Date de reception', type: 'date' },
  { name: 'delai_livraison', label: 'Delai de livraison', type: 'date' },
  { name: 'essai_a_realiser', label: 'Essais a realiser', required: true, type: 'multiSelect', options: essaiOptions, full: true },
  { name: 'client_nom', label: 'Client', required: true, placeholder: 'Sogea BTP Benin' },
  { name: 'receptionniste', label: 'Receptionniste', required: true, placeholder: 'Nom du receptionniste' },
  { name: 'responsable_labo', label: 'Responsable labo', required: true, placeholder: 'Nom du responsable labo' },
  { name: 'commentaire', label: 'Commentaire', placeholder: 'Observations, conditions de prelevement...', full: true },
  { name: 'statut', label: 'Statut', defaultValue: 'en_cours', hidden: true }
];

const columns = [
  { name: 'numero', label: 'N essai' },
  { name: 'reference_devis', label: 'Devis' },
  { name: 'nature', label: 'Nature' },
  { name: 'provenance', label: 'Provenance' },
  { name: 'date_prelevement', label: 'Prelevement' },
  { name: 'date', label: 'Reception' },
  { name: 'delai_livraison', label: 'Livraison' },
  { name: 'essai_a_realiser', label: 'Essais', type: 'multiSelect' },
  { name: 'client_nom', label: 'Client' },
  { name: 'receptionniste', label: 'Receptionniste' },
  { name: 'responsable_labo', label: 'Resp. labo' }
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
