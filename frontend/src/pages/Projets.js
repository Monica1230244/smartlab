import React from 'react';
import ResourcePage from '../components/ResourcePage';

const statusOptions = [
  { value: 'nouveau', label: 'Nouveau' },
  { value: 'en_cours', label: 'En cours' },
  { value: 'validation', label: 'Validation' },
  { value: 'termine', label: 'Termine' },
  { value: 'suspendu', label: 'Suspendu' }
];

const fields = [
  { name: 'reference', label: 'Reference projet', required: true, placeholder: 'PRJ-2026-001' },
  { name: 'nom', label: 'Nom du projet', required: true, placeholder: 'Pont de Cotonou' },
  { name: 'client_nom', label: 'Client', required: true, placeholder: 'Nom du client' },
  { name: 'localisation', label: 'Localisation', placeholder: 'Cotonou' },
  { name: 'date_debut', label: 'Date debut', type: 'date' },
  { name: 'date_fin_prevue', label: 'Date fin prevue', type: 'date' },
  { name: 'budget', label: 'Budget / montant', type: 'money', placeholder: '2500000' },
  { name: 'responsable', label: 'Responsable', placeholder: 'Nom responsable' },
  { name: 'statut', label: 'Statut', options: statusOptions, defaultValue: 'nouveau' },
  { name: 'description', label: 'Description', placeholder: 'Details du projet...', full: true }
];

const columns = [
  { name: 'reference', label: 'Reference' },
  { name: 'nom', label: 'Projet' },
  { name: 'client_nom', label: 'Client' },
  { name: 'localisation', label: 'Localisation' },
  { name: 'budget', label: 'Budget', type: 'money' },
  { name: 'statut', label: 'Statut', badge: true }
];

export default function Projets() {
  return (
    <ResourcePage
      title="Dossiers Projets"
      subtitle="Creation, suivi et classement des projets du laboratoire."
      resource="projets"
      fields={fields}
      columns={columns}
      primaryLabel="Nouveau projet"
    />
  );
}
