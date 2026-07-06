import React from 'react';
import OperationalRegisterPage from '../components/OperationalRegisterPage';

const statusOptions = [{ value: 'ouverte', label: 'Ouverte' }, { value: 'en_traitement', label: 'En traitement' }, { value: 'cloturee', label: 'Cloturee' }];
const graviteOptions = [{ value: 'mineure', label: 'Mineure' }, { value: 'majeure', label: 'Majeure' }, { value: 'critique', label: 'Critique' }];

export default function NonConformites() {
  return <OperationalRegisterPage config={{
    resource: 'nonConformites',
    prefix: 'NC',
    numberField: 'reference',
    title: 'Gestion des non-conformites',
    eyebrow: 'QMS - ISO 17025 / 9001',
    subtitle: 'Enregistrez les ecarts, analysez les causes, pilotez les actions et conservez les preuves de cloture.',
    searchPlaceholder: 'Rechercher une NC, origine, responsable...',
    primaryLabel: 'Nouvelle NC',
    createTitle: 'Nouvelle non-conformite',
    editTitle: 'Modifier non-conformite',
    processTitle: 'Cycle non-conformite',
    processNote: 'Une NC cree automatiquement une action qualite corrective avec trace dans le journal d audit.',
    workflow: ['Detection', 'Enregistrement', 'Analyse cause', 'Action corrective', 'Verification', 'Cloture'],
    evidence: ['Description ecart', 'Cause', 'Action corrective', 'Preuve cloture'],
    tabs: ['Toutes les NC', 'Ouvertes', 'En traitement', 'Cloturees'],
    defaultForm: { reference: '', origine: '', description: '', cause: '', responsable: '', gravite: 'majeure', echeance: new Date().toISOString().slice(0, 10), statut: 'ouverte', action_corrective: '' },
    fields: [
      { name: 'reference', label: 'Reference NC', readOnly: true },
      { name: 'origine', label: 'Origine', required: true },
      { name: 'gravite', label: 'Gravite', options: graviteOptions },
      { name: 'responsable', label: 'Responsable' },
      { name: 'echeance', label: 'Echeance', type: 'date' },
      { name: 'statut', label: 'Statut', options: statusOptions },
      { name: 'description', label: 'Description', type: 'textarea', full: true, required: true },
      { name: 'cause', label: 'Cause identifiee', type: 'textarea', full: true },
      { name: 'action_corrective', label: 'Action corrective', type: 'textarea', full: true }
    ],
    columns: [
      { name: 'reference', label: 'Reference' },
      { name: 'origine', label: 'Origine' },
      { name: 'description', label: 'Description' },
      { name: 'gravite', label: 'Gravite', badge: true },
      { name: 'responsable', label: 'Responsable' },
      { name: 'echeance', label: 'Echeance' },
      { name: 'statut', label: 'Statut', badge: true }
    ],
    detailFields: [
      { name: 'origine', label: 'Origine' },
      { name: 'description', label: 'Description' },
      { name: 'cause', label: 'Cause' },
      { name: 'action_corrective', label: 'Action corrective' },
      { name: 'responsable', label: 'Responsable' },
      { name: 'echeance', label: 'Echeance' }
    ],
    summary: (records) => [
      { label: 'NC totales', value: records.length, tone: 'blue', icon: 'NC' },
      { label: 'Ouvertes', value: records.filter((item) => item.statut === 'ouverte').length, tone: 'red', icon: 'OU' },
      { label: 'En traitement', value: records.filter((item) => item.statut === 'en_traitement').length, tone: 'amber', icon: 'TR' },
      { label: 'Cloturees', value: records.filter((item) => item.statut === 'cloturee').length, tone: 'green', icon: 'OK' },
      { label: 'Critiques', value: records.filter((item) => item.gravite === 'critique').length, tone: 'red', icon: '!' }
    ],
    sideTitle: 'Origines principales',
    sideStats: (records) => Array.from(new Set(records.map((item) => item.origine).filter(Boolean))).map((origine) => ({ label: origine, value: records.filter((item) => item.origine === origine).length }))
  }} />;
}
