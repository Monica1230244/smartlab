import React from 'react';
import OperationalRegisterPage from '../components/OperationalRegisterPage';

const statusOptions = [
  { value: 'brouillon', label: 'Brouillon' },
  { value: 'controle', label: 'Controle' },
  { value: 'valide', label: 'Valide' },
  { value: 'envoye', label: 'Envoye' }
];

export default function Rapports() {
  return <OperationalRegisterPage config={{
    resource: 'rapports',
    prefix: 'RAP',
    numberField: 'numero',
    title: 'Rapports',
    eyebrow: 'LIMS - Rapports',
    subtitle: 'Suivez la redaction, le controle, la validation et l envoi des rapports d essais.',
    searchPlaceholder: 'Rechercher un rapport, essai, client...',
    primaryLabel: 'Nouveau rapport',
    createTitle: 'Nouveau rapport',
    editTitle: 'Modifier rapport',
    processTitle: 'Cycle rapport d essai',
    processNote: 'Chaque rapport doit rester lie a son objet d essai, ses resultats, son validateur et son historique.',
    workflow: ['Brouillon', 'Controle', 'Validation RT', 'Signature', 'Envoi client', 'Archivage'],
    evidence: ['Resultats attaches', 'Validateur', 'Signature', 'Preuve envoi'],
    tabs: ['Tous les rapports', 'Brouillons', 'En controle', 'Valides', 'Envoyes'],
    defaultForm: { numero: '', essai: '', client_nom: '', date: new Date().toISOString().slice(0, 10), statut: 'brouillon', validateur: '', observations: '' },
    fields: [
      { name: 'numero', label: 'Numero rapport', readOnly: true },
      { name: 'essai', label: 'Essai lie', required: true },
      { name: 'client_nom', label: 'Client', required: true },
      { name: 'date', label: 'Date', type: 'date' },
      { name: 'validateur', label: 'Validateur' },
      { name: 'statut', label: 'Statut', options: statusOptions },
      { name: 'observations', label: 'Observations', type: 'textarea', full: true }
    ],
    columns: [
      { name: 'numero', label: 'N rapport' },
      { name: 'essai', label: 'Essai lie' },
      { name: 'client_nom', label: 'Client' },
      { name: 'date', label: 'Date' },
      { name: 'validateur', label: 'Validateur' },
      { name: 'statut', label: 'Statut', badge: true }
    ],
    detailFields: [
      { name: 'client_nom', label: 'Client' },
      { name: 'essai', label: 'Objet / essai' },
      { name: 'date', label: 'Date generation' },
      { name: 'validateur', label: 'Validateur' },
      { name: 'observations', label: 'Observations' }
    ],
    summary: (records) => [
      { label: 'Rapports totaux', value: records.length, tone: 'blue', icon: 'RP' },
      { label: 'Brouillons', value: records.filter((item) => item.statut === 'brouillon').length, tone: 'amber', icon: 'BR' },
      { label: 'En controle', value: records.filter((item) => item.statut === 'controle').length, tone: 'blue', icon: 'CT' },
      { label: 'Valides', value: records.filter((item) => item.statut === 'valide').length, tone: 'green', icon: 'OK' },
      { label: 'Envoyes', value: records.filter((item) => item.statut === 'envoye').length, tone: 'green', icon: 'EN' }
    ],
    sideTitle: 'Repartition par statut',
    sideStats: (records) => ['brouillon', 'controle', 'valide', 'envoye'].map((status) => ({ label: status, value: records.filter((item) => item.statut === status).length }))
  }} />;
}
