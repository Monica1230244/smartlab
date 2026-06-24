import React from 'react';
import ResourcePage from '../components/ResourcePage';

const statusOptions = [
  { value: 'nouvelle', label: 'Nouvelle' },
  { value: 'a_suivre', label: 'A suivre' },
  { value: 'traite', label: 'Traite' },
  { value: 'cloturee', label: 'Cloturee' }
];

const scoreOptions = [
  { value: '1', label: '1 - Insatisfait' },
  { value: '2', label: '2 - Peu satisfait' },
  { value: '3', label: '3 - Moyen' },
  { value: '4', label: '4 - Satisfait' },
  { value: '5', label: '5 - Tres satisfait' }
];

const fields = [
  {
    name: 'client_nom',
    label: 'Client',
    required: true,
    optionsResource: 'clients',
    optionValue: 'raison_sociale',
    optionLabel: 'raison_sociale'
  },
  { name: 'reference', label: 'Reference enquete', required: true, placeholder: 'SAT-2026-003' },
  { name: 'projet', label: 'Projet / dossier', placeholder: 'Nom du projet' },
  { name: 'note_globale', label: 'Note globale', options: scoreOptions, defaultValue: '4' },
  { name: 'delai', label: 'Respect delai', options: scoreOptions, defaultValue: '4' },
  { name: 'qualite_rapport', label: 'Qualite rapport', options: scoreOptions, defaultValue: '4' },
  { name: 'communication', label: 'Communication', options: scoreOptions, defaultValue: '4' },
  { name: 'commentaire', label: 'Commentaire client', type: 'textarea', full: true },
  { name: 'date_reponse', label: 'Date reponse', type: 'date' },
  { name: 'responsable', label: 'Responsable suivi', placeholder: 'Responsable des offres' },
  { name: 'statut', label: 'Statut', options: statusOptions, defaultValue: 'nouvelle' }
];

const columns = [
  { name: 'reference', label: 'Reference' },
  { name: 'client_nom', label: 'Client' },
  { name: 'projet', label: 'Projet' },
  { name: 'note_globale', label: 'Note' },
  { name: 'delai', label: 'Delai' },
  { name: 'qualite_rapport', label: 'Rapport' },
  { name: 'responsable', label: 'Responsable' },
  { name: 'statut', label: 'Statut', badge: true }
];

function average(records, field) {
  if (records.length === 0) return 0;
  return records.reduce((sum, item) => sum + Number(item[field] || 0), 0) / records.length;
}

export default function SatisfactionClients() {
  const summaryCards = (records) => {
    const avg = average(records, 'note_globale');
    const follow = records.filter((item) => item.statut === 'a_suivre').length;
    const treated = records.filter((item) => ['traite', 'cloturee'].includes(item.statut)).length;

    return [
      { label: 'Reponses clients', value: records.length, tone: 'blue' },
      { label: 'Satisfaction moyenne', value: avg.toFixed(1), tone: avg >= 4 ? 'green' : 'amber', note: '/ 5' },
      { label: 'A suivre', value: follow, tone: 'amber' },
      { label: 'Traitees', value: treated, tone: 'green' }
    ];
  };

  return (
    <ResourcePage
      title="Satisfaction client"
      subtitle="Mesure de satisfaction, suivi des retours et actions d'amelioration."
      resource="satisfactionClients"
      fields={fields}
      columns={columns}
      primaryLabel="Nouvelle enquete"
      summaryCards={summaryCards}
    />
  );
}
