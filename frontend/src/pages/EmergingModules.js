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
    processNote: 'Module metier relie a Supabase, aux notifications, aux actions qualite et a la tracabilite TESTLAB.',
    workflow,
    evidence,
    tabs: ['Tous', 'En cours', 'Valides', 'Archives'],
    defaultForm: fields.reduce((acc, field) => ({ ...acc, [field.name]: field.defaultValue || '' }), {}),
    fields,
    columns,
    detailFields,
    summary: (records) => [
      { label: 'Total', value: records.length, tone: 'blue', icon: prefix },
      { label: 'En cours', value: records.filter((item) => ['en_cours', 'ouverte', 'actif', 'en_attente', 'soumise', 'demande', 'a_signer'].includes(item.statut)).length, tone: 'amber', icon: 'EC' },
      { label: 'Valides', value: records.filter((item) => ['valide', 'signe', 'signee', 'conforme', 'paye', 'payee', 'livre', 'rapport_telecharge'].includes(item.statut)).length, tone: 'green', icon: 'OK' },
      { label: 'Alertes', value: records.filter((item) => ['expire', 'critique', 'retard', 'bloque', 'stock_bas', 'non_conforme'].includes(item.statut)).length, tone: 'red', icon: '!' }
    ],
    sideTitle: 'Statuts',
    sideStats: (records) => Array.from(new Set(records.map((item) => item.statut || 'non_renseigne'))).map((statut) => ({ label: statut, value: records.filter((item) => (item.statut || 'non_renseigne') === statut).length }))
  };
}

export function StocksConsommables() {
  const fields = [
    { name: 'reference', label: 'Reference', readOnly: true },
    { name: 'designation', label: 'Designation', required: true },
    { name: 'famille', label: 'Famille', options: ['reactif', 'verrerie', 'etalons', 'gaz', 'epi', 'pieces', 'consommable chantier'] },
    { name: 'lot', label: 'N lot' },
    { name: 'fournisseur', label: 'Fournisseur' },
    { name: 'quantite', label: 'Quantite', type: 'number' },
    { name: 'stock_minimum', label: 'Stock minimum', type: 'number' },
    { name: 'date_peremption', label: 'Date peremption', type: 'date' },
    { name: 'localisation', label: 'Localisation' },
    { name: 'responsable', label: 'Responsable' },
    { name: 'statut', label: 'Statut', options: ['actif', 'stock_bas', 'reserve', 'expire', 'bloque'], defaultValue: 'actif' }
  ];
  return <OperationalRegisterPage config={pageConfig({ resource: 'consommablesStocks', prefix: 'STK', title: 'Stocks & consommables', subtitle: 'Suivi des reactifs, consommables, lots, peremptions et seuils d alerte.', workflow: ['Entree stock', 'Controle lot', 'Affectation', 'Sortie', 'Inventaire', 'Alerte'], evidence: ['N lot', 'Fournisseur', 'Stock minimum', 'Peremption'], fields, columns: fields.slice(0, 9), detailFields: fields })} />;
}

export function Contrats() {
  const fields = [
    { name: 'reference', label: 'Reference', readOnly: true },
    { name: 'partenaire', label: 'Partenaire', required: true },
    { name: 'type', label: 'Type contrat', options: ['client', 'fournisseur', 'maintenance', 'sous_traitance', 'prestation', 'cadre'] },
    { name: 'objet', label: 'Objet', type: 'textarea', full: true },
    { name: 'date_debut', label: 'Date debut', type: 'date' },
    { name: 'date_fin', label: 'Date fin', type: 'date' },
    { name: 'montant', label: 'Montant', type: 'number' },
    { name: 'responsable', label: 'Responsable' },
    { name: 'statut', label: 'Statut', options: ['actif', 'en_revue', 'a_renouveler', 'expire', 'resilie', 'archive'], defaultValue: 'actif' }
  ];
  return <OperationalRegisterPage config={pageConfig({ resource: 'contrats', prefix: 'CTR', title: 'Contrats', subtitle: 'Gestion des contrats clients, fournisseurs, maintenance et sous-traitance.', workflow: ['Creation', 'Revue', 'Validation', 'Signature', 'Suivi echeance', 'Renouvellement'], evidence: ['Objet', 'Partenaire', 'Echeance', 'Signature'], fields, columns: fields, detailFields: fields })} />;
}

export function FacturesAvancees() {
  const fields = [
    { name: 'reference', label: 'Reference', readOnly: true },
    { name: 'client_nom', label: 'Client', required: true },
    { name: 'commande', label: 'Commande liee' },
    { name: 'montant_ht', label: 'Montant HT', type: 'number' },
    { name: 'date_emission', label: 'Date emission', type: 'date' },
    { name: 'date_echeance', label: 'Date echeance', type: 'date' },
    { name: 'preuve_envoi', label: 'Preuve envoi' },
    { name: 'responsable', label: 'Responsable' },
    { name: 'statut', label: 'Statut', options: ['brouillon', 'envoyee', 'en_attente', 'paye', 'retard', 'annulee'], defaultValue: 'brouillon' }
  ];
  return <OperationalRegisterPage config={pageConfig({ resource: 'factures', prefix: 'FAC', title: 'Factures', subtitle: 'Facturation, echeances, recouvrement et suivi financier des commandes.', workflow: ['Emission', 'Validation', 'Envoi', 'Paiement', 'Recouvrement', 'Archivage'], evidence: ['Commande', 'Montant', 'Preuve envoi', 'Paiement'], fields, columns: fields, detailFields: fields })} />;
}

export function SignaturesElectroniques() {
  const fields = [
    { name: 'reference', label: 'Reference', readOnly: true },
    { name: 'document', label: 'Document', required: true },
    { name: 'signataire', label: 'Signataire', required: true },
    { name: 'role', label: 'Role', options: ['responsable_appel', 'responsable_technique', 'responsable_labo', 'responsable_qualite', 'dg', 'client', 'fournisseur'] },
    { name: 'date_signature', label: 'Date signature', type: 'date' },
    { name: 'empreinte', label: 'Empreinte' },
    { name: 'methode', label: 'Methode', options: ['signature_electronique', 'code_pin', 'qr_code', 'signature_importee'] },
    { name: 'statut', label: 'Statut', options: ['a_signer', 'controle_identite', 'signe', 'rejete', 'archive'], defaultValue: 'a_signer' }
  ];
  return <OperationalRegisterPage config={pageConfig({ resource: 'signaturesElectroniques', prefix: 'SIG', title: 'Signatures electroniques', subtitle: 'Tracabilite des validations et signatures numeriques des documents sensibles.', workflow: ['Demande', 'Controle identite', 'Signature', 'Horodatage', 'Archivage'], evidence: ['Signataire', 'Role', 'Empreinte', 'Horodatage'], fields, columns: fields, detailFields: fields })} />;
}

export function PortailClient() {
  const fields = [
    { name: 'reference', label: 'Reference', readOnly: true },
    { name: 'client_nom', label: 'Client', required: true },
    { name: 'demande', label: 'Demande', type: 'textarea', full: true },
    { name: 'canal', label: 'Canal', options: ['portail', 'whatsapp', 'email', 'telephone'] },
    { name: 'rapport', label: 'Rapport / devis / commande' },
    { name: 'commentaire_client', label: 'Commentaire client', type: 'textarea', full: true },
    { name: 'statut', label: 'Statut', options: ['demande', 'soumise', 'devis_valide', 'commande_creee', 'rapport_telecharge', 'satisfaction_recue'], defaultValue: 'demande' }
  ];
  return <OperationalRegisterPage config={pageConfig({ resource: 'portailClient', prefix: 'PCL', title: 'Portail client', subtitle: 'Demandes clients, validations de devis, telechargement de rapports et enquetes.', workflow: ['Demande', 'Devis', 'Validation', 'Commande', 'Rapport', 'Satisfaction'], evidence: ['Client', 'Validation', 'Rapport', 'Enquete'], fields, columns: fields, detailFields: fields })} />;
}

export function PortailFournisseur() {
  const fields = [
    { name: 'reference', label: 'Reference', readOnly: true },
    { name: 'fournisseur', label: 'Fournisseur', required: true },
    { name: 'consultation', label: 'Consultation' },
    { name: 'offre', label: 'Offre', type: 'textarea', full: true },
    { name: 'montant', label: 'Montant offre', type: 'number' },
    { name: 'date_reponse', label: 'Date reponse', type: 'date' },
    { name: 'statut', label: 'Statut', options: ['consultation_envoyee', 'offre_recue', 'deposee', 'livraison_confirmee', 'facture_recue', 'evalue'], defaultValue: 'consultation_envoyee' }
  ];
  return <OperationalRegisterPage config={pageConfig({ resource: 'portailFournisseur', prefix: 'PFR', title: 'Portail fournisseur', subtitle: 'Reponses aux consultations, depots d offres, factures et evaluations fournisseur.', workflow: ['Consultation', 'Offre', 'Comparaison', 'Commande', 'Livraison', 'Evaluation'], evidence: ['Offre', 'Delai', 'Commande', 'Evaluation'], fields, columns: fields, detailFields: fields })} />;
}

export function AnalyseDocumentaireIA() {
  const fields = [
    { name: 'reference', label: 'Reference', readOnly: true },
    { name: 'document', label: 'Document', required: true },
    { name: 'type_analyse', label: 'Type analyse', options: ['exigences_iso', 'procedure', 'risques', 'ecarts', 'amelioration'] },
    { name: 'constats', label: 'Constats', type: 'textarea', full: true },
    { name: 'actions_suggerees', label: 'Actions suggerees', type: 'textarea', full: true },
    { name: 'responsable', label: 'Responsable' },
    { name: 'statut', label: 'Statut', options: ['a_analyser', 'analyse_en_cours', 'a_valider', 'valide', 'cloture'], defaultValue: 'a_analyser' }
  ];
  return <OperationalRegisterPage config={pageConfig({ resource: 'analyseDocumentaireIA', prefix: 'AIA', title: 'Analyse documentaire IA', subtitle: 'Preparation a l analyse automatique des procedures, exigences et impacts documentaires.', workflow: ['Importer', 'Analyser', 'Identifier exigences', 'Proposer actions', 'Validation humaine'], evidence: ['Document', 'Constats', 'Actions', 'Validation'], fields, columns: fields, detailFields: fields })} />;
}
