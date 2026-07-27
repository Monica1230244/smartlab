import React from 'react';
import OperationalRegisterPage from '../components/OperationalRegisterPage';

function config({ resource, prefix, title, subtitle, workflow, evidence, fields, columns = fields, detailFields = fields }) {
  return {
    resource,
    prefix,
    numberField: 'reference',
    title,
    eyebrow: 'TESTLAB - Architecture ISO 17025 / ISO 9001',
    subtitle,
    searchPlaceholder: `Rechercher dans ${title.toLowerCase()}...`,
    primaryLabel: 'Ajouter',
    createTitle: `Ajouter - ${title}`,
    editTitle: `Modifier - ${title}`,
    processTitle: `Workflow ${title}`,
    processNote: 'Module ajoute depuis le document d architecture TESTLAB pour completer le noyau LIMS + QMS + ERP.',
    workflow,
    evidence,
    tabs: ['Tous', 'En cours', 'Valides', 'Archives'],
    defaultForm: fields.reduce((acc, field) => ({ ...acc, [field.name]: field.defaultValue || '' }), {}),
    fields,
    columns,
    detailFields,
    summary: (records) => [
      { label: 'Total', value: records.length, tone: 'blue', icon: prefix },
      { label: 'Actifs', value: records.filter((item) => ['actif', 'en_cours', 'ouverte', 'planifie', 'preparee'].includes(item.statut)).length, tone: 'amber', icon: 'EC' },
      { label: 'Valides', value: records.filter((item) => ['valide', 'conforme', 'termine', 'terminee', 'realisee', 'cloturee', 'atteint', 'paye', 'configure'].includes(item.statut)).length, tone: 'green', icon: 'OK' },
      { label: 'Alertes', value: records.filter((item) => ['retard', 'bloque', 'critique', 'non_conforme', 'en_retard', 'expire', 'suspendu'].includes(item.statut)).length, tone: 'red', icon: '!' }
    ],
    sideTitle: 'Repartition par statut',
    sideStats: (records) => Array.from(new Set(records.map((item) => item.statut || 'non_renseigne')))
      .map((statut) => ({ label: statut, value: records.filter((item) => (item.statut || 'non_renseigne') === statut).length }))
  };
}

export function Gouvernance() {
  const fields = [
    { name: 'reference', label: 'Reference', readOnly: true },
    { name: 'entite', label: 'Entite', required: true },
    { name: 'type_entite', label: 'Type', options: ['Organisation', 'Site', 'Departement', 'Service', 'Laboratoire', 'Laboratoire chantier', 'Role', 'Permission'] },
    { name: 'responsable', label: 'Responsable' },
    { name: 'perimetre', label: 'Perimetre', full: true },
    { name: 'statut', label: 'Statut', options: ['actif', 'valide', 'a_revoir', 'suspendu'], defaultValue: 'actif' }
  ];
  return <OperationalRegisterPage config={config({ resource: 'gouvernance', prefix: 'GOV', title: 'Gouvernance & habilitations', subtitle: 'Organisation, sites, laboratoires, roles, permissions et perimetres de responsabilite.', workflow: ['Creer entite', 'Definir role', 'Affecter permissions', 'Valider', 'Tracer'], evidence: ['Role', 'Permission', 'Perimetre', 'Responsable'], fields })} />;
}

export function DemandesPrestations() {
  const fields = [
    { name: 'reference', label: 'Reference', readOnly: true },
    { name: 'client_nom', label: 'Client / prospect', required: true },
    { name: 'contact', label: 'Contact' },
    { name: 'projet', label: 'Projet / dossier' },
    { name: 'besoin', label: 'Besoin client', type: 'textarea', full: true },
    { name: 'canal', label: 'Canal', options: ['whatsapp', 'email', 'telephone', 'portail', 'presentiel'] },
    { name: 'responsable', label: 'Responsable' },
    { name: 'statut', label: 'Statut', options: ['ouverte', 'en_cours', 'qualifiee', 'pret_devis', 'validation_technique', 'cloturee'], defaultValue: 'ouverte' }
  ];
  return <OperationalRegisterPage config={config({ resource: 'demandesPrestations', prefix: 'DPR', title: 'Demandes de prestation', subtitle: 'Reception et qualification des demandes clients avant devis, commande ou projet.', workflow: ['Reception', 'Qualification', 'Revue capacite', 'Devis', 'Commande'], evidence: ['Besoin', 'Canal', 'Client', 'Revue capacite'], fields })} />;
}

export function MissionsTerrain() {
  const fields = [
    { name: 'reference', label: 'Reference', readOnly: true },
    { name: 'projet', label: 'Projet', required: true },
    { name: 'client_nom', label: 'Client' },
    { name: 'site', label: 'Site / chantier' },
    { name: 'mission', label: 'Mission', full: true },
    { name: 'essais', label: 'Essais / analyses attendus' },
    { name: 'equipe', label: 'Equipe' },
    { name: 'vehicule', label: 'Vehicule' },
    { name: 'date_intervention', label: 'Date intervention', type: 'date' },
    { name: 'statut', label: 'Statut', options: ['planifie', 'preparee', 'en_cours', 'realisee', 'terminee', 'annulee'], defaultValue: 'planifie' }
  ];
  return <OperationalRegisterPage config={config({ resource: 'missionsTerrain', prefix: 'MIS', title: 'Missions terrain', subtitle: 'Interventions, campagnes de prelevement, equipes, vehicules et retours terrain.', workflow: ['Planification', 'Preparation', 'Intervention', 'Reception objets', 'Compte rendu'], evidence: ['Mission', 'Equipe', 'Vehicule', 'Compte rendu'], fields })} />;
}

export function PlanningProjets() {
  const fields = [
    { name: 'reference', label: 'Reference', readOnly: true },
    { name: 'projet', label: 'Projet', required: true },
    { name: 'activite', label: 'Activite / tache' },
    { name: 'jalon', label: 'Jalon / livrable' },
    { name: 'responsable', label: 'Responsable' },
    { name: 'budget', label: 'Budget', type: 'number' },
    { name: 'date_echeance', label: 'Echeance', type: 'date' },
    { name: 'statut', label: 'Statut', options: ['en_cours', 'valide', 'retard', 'termine', 'cloture'], defaultValue: 'en_cours' }
  ];
  return <OperationalRegisterPage config={config({ resource: 'planningProjets', prefix: 'PLN', title: 'Planning projets & jalons', subtitle: 'Taches, jalons, livrables, budgets, risques et suivi projet.', workflow: ['Projet', 'Activites', 'Jalons', 'Livrables', 'Cloture'], evidence: ['Echeance', 'Budget', 'Responsable', 'Livrable'], fields })} />;
}

export function CompetencesFormations() {
  const fields = [
    { name: 'reference', label: 'Reference', readOnly: true },
    { name: 'personnel', label: 'Personnel', required: true },
    { name: 'competence', label: 'Competence / essai' },
    { name: 'niveau', label: 'Niveau', options: ['observation', 'forme', 'habilite', 'expert'] },
    { name: 'formation', label: 'Formation associee' },
    { name: 'date_evaluation', label: 'Date evaluation', type: 'date' },
    { name: 'validateur', label: 'Validateur' },
    { name: 'statut', label: 'Statut', options: ['actif', 'a_revoir', 'expire', 'suspendu'], defaultValue: 'actif' }
  ];
  return <OperationalRegisterPage config={config({ resource: 'competencesFormations', prefix: 'CMP', title: 'Competences & formations', subtitle: 'Matrice des competences, habilitations, formations et preuves de qualification.', workflow: ['Identifier besoin', 'Former', 'Evaluer', 'Habiliter', 'Revoir'], evidence: ['Competence', 'Evaluation', 'Validateur', 'Habilitation'], fields })} />;
}

export function MetrologieAvancee() {
  const fields = [
    { name: 'reference', label: 'Reference', readOnly: true },
    { name: 'equipement', label: 'Equipement', required: true },
    { name: 'operation', label: 'Operation', options: ['etalonnage', 'verification_intermediaire', 'carte_controle', 'decision_conformite'] },
    { name: 'certificat', label: 'Certificat / preuve' },
    { name: 'incertitude', label: 'Incertitude' },
    { name: 'decision', label: 'Decision de conformite' },
    { name: 'date_operation', label: 'Date operation', type: 'date' },
    { name: 'statut', label: 'Statut', options: ['conforme', 'en_cours', 'a_surveiller', 'non_conforme', 'en_retard'], defaultValue: 'conforme' }
  ];
  return <OperationalRegisterPage config={config({ resource: 'metrologieAvancee', prefix: 'MET', title: 'Metrologie avancee', subtitle: 'Etalons, certificats, verifications intermediaires, incertitudes et decisions de conformite.', workflow: ['Inventaire', 'Verification', 'Etalonnage', 'Decision', 'Suivi periodique'], evidence: ['Certificat', 'Incertitude', 'Decision', 'Tracabilite SI'], fields })} />;
}

export function FinancesAvancees() {
  const fields = [
    { name: 'reference', label: 'Reference', readOnly: true },
    { name: 'categorie', label: 'Categorie', options: ['recette', 'depense', 'paiement', 'budget', 'caisse', 'banque'] },
    { name: 'libelle', label: 'Libelle', required: true },
    { name: 'partenaire', label: 'Client / fournisseur' },
    { name: 'centre', label: 'Centre cout / profit' },
    { name: 'montant', label: 'Montant', type: 'number' },
    { name: 'date_operation', label: 'Date operation', type: 'date' },
    { name: 'statut', label: 'Statut', options: ['en_cours', 'valide', 'paye', 'annule'], defaultValue: 'en_cours' }
  ];
  return <OperationalRegisterPage config={config({ resource: 'financesAvancees', prefix: 'FIN', title: 'Finance avancee', subtitle: 'Paiements, budgets, depenses, recettes, caisse, banque et centres de cout.', workflow: ['Operation', 'Validation', 'Paiement', 'Lettrage', 'Reporting'], evidence: ['Montant', 'Piece', 'Centre', 'Validation'], fields })} />;
}

export function ObjectifsQualite() {
  const fields = [
    { name: 'reference', label: 'Reference', readOnly: true },
    { name: 'objectif', label: 'Objectif qualite', required: true, full: true },
    { name: 'processus', label: 'Processus' },
    { name: 'indicateur', label: 'Indicateur' },
    { name: 'cible', label: 'Cible' },
    { name: 'responsable', label: 'Responsable' },
    { name: 'echeance', label: 'Echeance', type: 'date' },
    { name: 'statut', label: 'Statut', options: ['en_cours', 'atteint', 'retard', 'cloture'], defaultValue: 'en_cours' }
  ];
  return <OperationalRegisterPage config={config({ resource: 'objectifsQualite', prefix: 'OBJ', title: 'Objectifs qualite', subtitle: 'Objectifs ISO 9001, cibles, indicateurs, responsables et taux d atteinte.', workflow: ['Definir', 'Planifier', 'Mesurer', 'Analyser', 'Ameliorer'], evidence: ['Objectif', 'Indicateur', 'Cible', 'Resultat'], fields })} />;
}

export function MoteursSysteme() {
  const fields = [
    { name: 'reference', label: 'Reference', readOnly: true },
    { name: 'moteur', label: 'Moteur', options: ['regles_metier', 'conformite', 'documentaire', 'workflow', 'notifications', 'intelligence_artificielle'] },
    { name: 'regle', label: 'Regle / automatisation', required: true, full: true },
    { name: 'module_cible', label: 'Module cible' },
    { name: 'declencheur', label: 'Declencheur' },
    { name: 'action', label: 'Action systeme', type: 'textarea', full: true },
    { name: 'responsable', label: 'Responsable' },
    { name: 'statut', label: 'Statut', options: ['actif', 'configure', 'en_test', 'suspendu'], defaultValue: 'actif' }
  ];
  return <OperationalRegisterPage config={config({ resource: 'moteursSysteme', prefix: 'MOT', title: 'Moteurs systeme', subtitle: 'Regles metier, conformite, workflow, notifications et IA qui automatisent TESTLAB.', workflow: ['Regle', 'Declencheur', 'Controle', 'Action', 'Trace'], evidence: ['Regle', 'Workflow', 'Notification', 'Audit log'], fields })} />;
}
