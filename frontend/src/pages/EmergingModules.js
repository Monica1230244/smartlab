import React from 'react';
import OperationalRegisterPage from '../components/OperationalRegisterPage';

function pageConfig({ resource, prefix, numberField = 'reference', title, subtitle, workflow, evidence, fields, columns, detailFields }) {
  return {
    resource,
    prefix,
    numberField,
    title,
    eyebrow: 'TESTLAB - Module metier',
    subtitle,
    searchPlaceholder: `Rechercher dans ${title.toLowerCase()}...`,
    primaryLabel: 'Ajouter',
    createTitle: `Ajouter - ${title}`,
    editTitle: `Modifier - ${title}`,
    processTitle: `Cycle ${title}`,
    processNote: 'Module cree pour recevoir les donnees reelles Supabase et alimenter les preuves ISO/ERP.',
    workflow,
    evidence,
    tabs: ['Tous', 'En cours', 'Validés', 'Archives'],
    defaultForm: fields.reduce((acc, field) => ({ ...acc, [field.name]: field.defaultValue || '' }), {}),
    fields,
    columns,
    detailFields,
    summary: (records) => [
      { label: 'Total', value: records.length, tone: 'blue', icon: prefix },
      { label: 'En cours', value: records.filter((item) => ['en_cours', 'ouverte', 'actif'].includes(item.statut)).length, tone: 'amber', icon: 'EC' },
      { label: 'Validés', value: records.filter((item) => ['valide', 'signe', 'conforme', 'paye'].includes(item.statut)).length, tone: 'green', icon: 'OK' },
      { label: 'Alertes', value: records.filter((item) => ['expire', 'critique', 'retard', 'bloque'].includes(item.statut)).length, tone: 'red', icon: '!' }
    ],
    sideTitle: 'Statuts',
    sideStats: (records) => Array.from(new Set(records.map((item) => item.statut || 'non_renseigne'))).map((statut) => ({ label: statut, value: records.filter((item) => (item.statut || 'non_renseigne') === statut).length }))
  };
}

export function StocksConsommables() {
  const fields = [
    { name: 'reference', label: 'Reference', readOnly: true },
    { name: 'designation', label: 'Designation', required: true },
    { name: 'famille', label: 'Famille' },
    { name: 'lot', label: 'N lot' },
    { name: 'fournisseur', label: 'Fournisseur' },
    { name: 'quantite', label: 'Quantite', type: 'number' },
    { name: 'stock_minimum', label: 'Stock minimum', type: 'number' },
    { name: 'date_peremption', label: 'Date peremption', type: 'date' },
    { name: 'statut', label: 'Statut' }
  ];
  return <OperationalRegisterPage config={pageConfig({ resource: 'consommablesStocks', prefix: 'STK', title: 'Stocks & consommables', subtitle: 'Suivi des reactifs, consommables, lots, peremptions et seuils d alerte.', workflow: ['Entrée stock', 'Contrôle lot', 'Affectation', 'Sortie', 'Inventaire', 'Alerte'], evidence: ['N lot', 'Fournisseur', 'Stock minimum', 'Peremption'], fields, columns: fields.slice(0, 8), detailFields: fields })} />;
}

export function Contrats() {
  const fields = [
    { name: 'reference', label: 'Reference', readOnly: true },
    { name: 'partenaire', label: 'Partenaire', required: true },
    { name: 'type', label: 'Type contrat' },
    { name: 'objet', label: 'Objet', full: true },
    { name: 'date_debut', label: 'Date debut', type: 'date' },
    { name: 'date_fin', label: 'Date fin', type: 'date' },
    { name: 'responsable', label: 'Responsable' },
    { name: 'statut', label: 'Statut' }
  ];
  return <OperationalRegisterPage config={pageConfig({ resource: 'contrats', prefix: 'CTR', title: 'Contrats', subtitle: 'Gestion des contrats clients, fournisseurs, maintenance et sous-traitance.', workflow: ['Création', 'Revue', 'Validation', 'Signature', 'Suivi échéance', 'Renouvellement'], evidence: ['Objet', 'Partenaire', 'Echeance', 'Signature'], fields, columns: fields, detailFields: fields })} />;
}

export function FacturesAvancees() {
  const fields = [
    { name: 'reference', label: 'Reference', readOnly: true },
    { name: 'client_nom', label: 'Client', required: true },
    { name: 'commande', label: 'Commande liee' },
    { name: 'montant_ht', label: 'Montant HT', type: 'number' },
    { name: 'date_emission', label: 'Date emission', type: 'date' },
    { name: 'date_echeance', label: 'Date echeance', type: 'date' },
    { name: 'statut', label: 'Statut' }
  ];
  return <OperationalRegisterPage config={pageConfig({ resource: 'factures', prefix: 'FAC', title: 'Factures', subtitle: 'Facturation, échéances, recouvrement et suivi financier des commandes.', workflow: ['Emission', 'Validation', 'Envoi', 'Paiement', 'Recouvrement', 'Archivage'], evidence: ['Commande', 'Montant', 'Preuve envoi', 'Paiement'], fields, columns: fields, detailFields: fields })} />;
}

export function SignaturesElectroniques() {
  const fields = [
    { name: 'reference', label: 'Reference', readOnly: true },
    { name: 'document', label: 'Document', required: true },
    { name: 'signataire', label: 'Signataire', required: true },
    { name: 'role', label: 'Role' },
    { name: 'date_signature', label: 'Date signature', type: 'date' },
    { name: 'empreinte', label: 'Empreinte' },
    { name: 'statut', label: 'Statut' }
  ];
  return <OperationalRegisterPage config={pageConfig({ resource: 'signaturesElectroniques', prefix: 'SIG', title: 'Signatures électroniques', subtitle: 'Traçabilité des validations et signatures numériques des documents sensibles.', workflow: ['Demande', 'Contrôle identité', 'Signature', 'Horodatage', 'Archivage'], evidence: ['Signataire', 'Role', 'Empreinte', 'Horodatage'], fields, columns: fields, detailFields: fields })} />;
}

export function PortailClient() {
  const fields = [
    { name: 'reference', label: 'Reference', readOnly: true },
    { name: 'client_nom', label: 'Client', required: true },
    { name: 'demande', label: 'Demande', full: true },
    { name: 'canal', label: 'Canal' },
    { name: 'rapport', label: 'Rapport / devis' },
    { name: 'statut', label: 'Statut' }
  ];
  return <OperationalRegisterPage config={pageConfig({ resource: 'portailClient', prefix: 'PCL', title: 'Portail client', subtitle: 'Demandes clients, validations de devis, téléchargement de rapports et enquêtes.', workflow: ['Demande', 'Devis', 'Validation', 'Commande', 'Rapport', 'Satisfaction'], evidence: ['Client', 'Validation', 'Rapport', 'Enquete'], fields, columns: fields, detailFields: fields })} />;
}

export function PortailFournisseur() {
  const fields = [
    { name: 'reference', label: 'Reference', readOnly: true },
    { name: 'fournisseur', label: 'Fournisseur', required: true },
    { name: 'consultation', label: 'Consultation' },
    { name: 'offre', label: 'Offre', full: true },
    { name: 'date_reponse', label: 'Date reponse', type: 'date' },
    { name: 'statut', label: 'Statut' }
  ];
  return <OperationalRegisterPage config={pageConfig({ resource: 'portailFournisseur', prefix: 'PFR', title: 'Portail fournisseur', subtitle: 'Réponses aux consultations, dépôts d offres, factures et évaluations fournisseur.', workflow: ['Consultation', 'Offre', 'Comparaison', 'Commande', 'Livraison', 'Evaluation'], evidence: ['Offre', 'Délai', 'Commande', 'Evaluation'], fields, columns: fields, detailFields: fields })} />;
}

export function AnalyseDocumentaireIA() {
  const fields = [
    { name: 'reference', label: 'Reference', readOnly: true },
    { name: 'document', label: 'Document', required: true },
    { name: 'type_analyse', label: 'Type analyse' },
    { name: 'constats', label: 'Constats', type: 'textarea', full: true },
    { name: 'actions_suggerees', label: 'Actions suggerees', type: 'textarea', full: true },
    { name: 'statut', label: 'Statut' }
  ];
  return <OperationalRegisterPage config={pageConfig({ resource: 'analyseDocumentaireIA', prefix: 'AIA', title: 'Analyse documentaire IA', subtitle: 'Préparation à l analyse automatique des procédures, exigences et impacts documentaires.', workflow: ['Importer', 'Analyser', 'Identifier exigences', 'Proposer actions', 'Validation humaine'], evidence: ['Document', 'Constats', 'Actions', 'Validation'], fields, columns: fields, detailFields: fields })} />;
}
