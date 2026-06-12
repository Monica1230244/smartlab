import React from 'react';
import ResourcePage from '../components/ResourcePage';

const statusOptions = [
  { value: 'ouverte', label: 'Ouverte' },
  { value: 'en_traitement', label: 'En traitement' },
  { value: 'cloturee', label: 'Cloturee' }
];

const fields = [
  { name: 'reference', label: 'Reference reclamation', required: true, placeholder: 'REC-2026-003' },
  { name: 'client_nom', label: 'Client', required: true, placeholder: 'Nom du client' },
  { name: 'canal', label: 'Canal', options: [
    { value: 'telephone', label: 'Telephone' },
    { value: 'whatsapp', label: 'WhatsApp' },
    { value: 'email', label: 'Email' },
    { value: 'courrier', label: 'Courrier' },
    { value: 'autre', label: 'Autre' }
  ], defaultValue: 'whatsapp' },
  { name: 'objet', label: 'Objet', required: true, placeholder: 'Objet de la reclamation' },
  { name: 'description', label: 'Description', required: true, placeholder: 'Detail de la reclamation client', full: true },
  { name: 'responsable', label: 'Responsable traitement', placeholder: 'Responsable Technique' },
  { name: 'action_prevue', label: 'Action prevue', placeholder: 'Correction, reprise essai, reponse client...', full: true },
  { name: 'date_reception', label: 'Date reception', type: 'date' },
  { name: 'echeance', label: 'Echeance', type: 'date' },
  { name: 'statut', label: 'Statut', options: statusOptions, defaultValue: 'ouverte' }
];

const columns = [
  { name: 'reference', label: 'Reference' },
  { name: 'client_nom', label: 'Client' },
  { name: 'canal', label: 'Canal' },
  { name: 'objet', label: 'Objet' },
  { name: 'responsable', label: 'Responsable' },
  { name: 'echeance', label: 'Echeance' },
  { name: 'statut', label: 'Statut', badge: true }
];

export default function Reclamations() {
  return (
    <ResourcePage
      title="Gestion des réclamations"
      subtitle="Reception, traitement, reponse client et cloture des reclamations."
      resource="reclamations"
      fields={fields}
      columns={columns}
      primaryLabel="Nouvelle reclamation"
    />
  );
}
