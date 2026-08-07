export const roleLabels = {
  responsable_appel: 'Responsable des offres',
  responsable_technique: 'Responsable technique',
  responsable_qualite: 'Responsable qualite',
  responsable_labo: 'Responsable laboratoire',
  responsable_metrologie: 'Responsable metrologie',
  responsable_achats: 'Responsable achats',
  responsable_finance: 'Responsable finance',
  receptionniste: 'Reception',
  auditeur: 'Auditeur interne',
  dg: 'Direction generale'
};

export const authProfiles = [
  { role: 'responsable_appel', label: roleLabels.responsable_appel, email: 'offres@testlab.com', initials: 'RO' },
  { role: 'responsable_technique', label: roleLabels.responsable_technique, email: 'rt@testlab.com', initials: 'RT' },
  { role: 'responsable_qualite', label: roleLabels.responsable_qualite, email: 'qualite@testlab.com', initials: 'RQ' },
  { role: 'responsable_labo', label: roleLabels.responsable_labo, email: 'labo@testlab.com', initials: 'RL' },
  { role: 'responsable_metrologie', label: roleLabels.responsable_metrologie, email: 'metrologie@testlab.com', initials: 'RM' },
  { role: 'responsable_achats', label: roleLabels.responsable_achats, email: 'achats@testlab.com', initials: 'RA' },
  { role: 'responsable_finance', label: roleLabels.responsable_finance, email: 'finance@testlab.com', initials: 'RF' },
  { role: 'receptionniste', label: roleLabels.receptionniste, email: 'reception@testlab.com', initials: 'RC' },
  { role: 'auditeur', label: roleLabels.auditeur, email: 'audit@testlab.com', initials: 'AU' },
  { role: 'dg', label: roleLabels.dg, email: 'dg@testlab.com', initials: 'DG' }
];

export const navItems = [
  { to: '/', label: 'Dashboard', icon: 'DB' },
  { to: '/essais', label: "Objets d'essais", icon: 'OE' },
  { to: '/rapports', label: 'Rapports', icon: 'RP' },
  { to: '/catalogue-essais', label: 'Catalogue des essais', icon: 'CE' },
  { to: '/resultats-essais', label: 'Resultats & calculs', icon: 'RC' },
  { to: '/documents-qualite', label: 'Documents qualite', icon: 'DQ' },
  { to: '/equipements', label: 'Equipements', icon: 'EQ' },
  { to: '/personnel', label: 'Gestion du personnel', icon: 'GP' },
  { to: '/competences-formations', label: 'Competences & formations', icon: 'CF' },
  { to: '/missions-terrain', label: 'Missions terrain', icon: 'MT' },
  { to: '/planning-projets', label: 'Planning projets', icon: 'PP' },
  { to: '/clients', label: 'Clients', icon: 'CL' },
  { to: '/demandes-prestations', label: 'Demandes de prestation', icon: 'DP' },
  { to: '/devis', label: 'Devis', icon: 'DV' },
  { to: '/commandes', label: 'Commandes', icon: 'CM' },
  { to: '/factures', label: 'Factures', icon: 'FC' },
  { to: '/finances-avancees', label: 'Finance avancee', icon: 'FA' },
  { to: '/contrats', label: 'Contrats', icon: 'CT' },
  { to: '/portail-client', label: 'Portail client', icon: 'PC' },
  { to: '/achats-approvisionnement', label: 'Achats & Approvisionnements', icon: 'AA' },
  { to: '/fournisseurs', label: 'Fournisseurs', icon: 'FR' },
  { to: '/stocks-consommables', label: 'Stocks & consommables', icon: 'ST' },
  { to: '/metrologie-avancee', label: 'Metrologie avancee', icon: 'MA' },
  { to: '/portail-fournisseur', label: 'Portail fournisseur', icon: 'PF' },
  { to: '/non-conformites', label: 'Non-conformites', icon: 'NC' },
  { to: '/reclamations', label: 'Reclamations', icon: 'GR' },
  { to: '/audits', label: 'Audits qualite', icon: 'AQ' },
  { to: '/satisfaction-clients', label: 'Satisfaction client', icon: 'SC' },
  { to: '/actions-qualite', label: 'Gestion des actions', icon: 'AC' },
  { to: '/objectifs-qualite', label: 'Objectifs qualite', icon: 'OQ' },
  { to: '/risques-opportunites', label: 'Risques & opportunites', icon: 'RO' },
  { to: '/revues-direction', label: 'Revues de direction', icon: 'RD' },
  { to: '/assistant-audit-iso', label: 'Assistant audit ISO', icon: 'AI' },
  { to: '/signatures-electroniques', label: 'Signatures electroniques', icon: 'SG' },
  { to: '/analyse-documentaire-ia', label: 'Analyse documentaire IA', icon: 'IA' },
  { to: '/indicateurs-qualite', label: 'Indicateurs qualite', icon: 'IQ' },
  { to: '/processus', label: 'Processus ISO 17025', icon: 'IS' },
  { to: '/projets', label: 'Projets', icon: 'PJ' },
  { to: '/gouvernance', label: 'Gouvernance', icon: 'GV' },
  { to: '/moteurs-systeme', label: 'Moteurs systeme', icon: 'MS' },
  { to: '/journal-activites', label: 'Journal d\'activites', icon: 'JA' },
  { to: '/parametres', label: 'Parametres', icon: 'PR' }
];

export const titles = Object.fromEntries(navItems.map((item) => [item.to, item.label]));

const allPaths = navItems.map((item) => item.to);
const commercial = ['/', '/clients', '/demandes-prestations', '/devis', '/commandes', '/factures', '/finances-avancees', '/contrats', '/portail-client', '/projets', '/satisfaction-clients', '/processus', '/parametres'];
const technique = ['/', '/clients', '/demandes-prestations', '/devis', '/commandes', '/rapports', '/resultats-essais', '/non-conformites', '/reclamations', '/satisfaction-clients', '/actions-qualite', '/objectifs-qualite', '/risques-opportunites', '/revues-direction', '/assistant-audit-iso', '/signatures-electroniques', '/analyse-documentaire-ia', '/journal-activites', '/indicateurs-qualite', '/personnel', '/competences-formations', '/processus', '/documents-qualite', '/catalogue-essais', '/parametres'];
const labo = ['/', '/commandes', '/essais', '/catalogue-essais', '/resultats-essais', '/rapports', '/documents-qualite', '/equipements', '/metrologie-avancee', '/achats-approvisionnement', '/fournisseurs', '/stocks-consommables', '/portail-fournisseur', '/personnel', '/non-conformites', '/reclamations', '/actions-qualite', '/objectifs-qualite', '/risques-opportunites', '/revues-direction', '/indicateurs-qualite', '/processus', '/parametres'];
const qualite = ['/', '/documents-qualite', '/non-conformites', '/reclamations', '/audits', '/satisfaction-clients', '/actions-qualite', '/objectifs-qualite', '/risques-opportunites', '/revues-direction', '/assistant-audit-iso', '/signatures-electroniques', '/analyse-documentaire-ia', '/journal-activites', '/indicateurs-qualite', '/processus', '/personnel', '/competences-formations', '/parametres'];
const metrologie = ['/', '/equipements', '/metrologie-avancee', '/stocks-consommables', '/achats-approvisionnement', '/fournisseurs', '/non-conformites', '/actions-qualite', '/risques-opportunites', '/documents-qualite', '/processus', '/parametres'];
const achats = ['/', '/achats-approvisionnement', '/fournisseurs', '/stocks-consommables', '/portail-fournisseur', '/contrats', '/factures', '/actions-qualite', '/risques-opportunites', '/parametres'];
const finance = ['/', '/factures', '/finances-avancees', '/devis', '/commandes', '/contrats', '/clients', '/actions-qualite', '/parametres'];
const reception = ['/', '/commandes', '/essais', '/clients', '/demandes-prestations', '/non-conformites', '/reclamations', '/actions-qualite', '/satisfaction-clients', '/processus', '/documents-qualite', '/parametres'];
const audit = ['/', '/documents-qualite', '/equipements', '/metrologie-avancee', '/personnel', '/competences-formations', '/non-conformites', '/reclamations', '/audits', '/actions-qualite', '/objectifs-qualite', '/risques-opportunites', '/revues-direction', '/assistant-audit-iso', '/journal-activites', '/indicateurs-qualite', '/processus'];

export const menuByRole = {
  responsable_appel: commercial,
  responsable_technique: technique,
  responsable_qualite: qualite,
  responsable_labo: labo,
  responsable_metrologie: metrologie,
  responsable_achats: achats,
  responsable_finance: finance,
  receptionniste: reception,
  auditeur: audit,
  dg: allPaths
};

export const roleHome = {
  responsable_appel: '/',
  responsable_technique: '/',
  responsable_qualite: '/assistant-audit-iso',
  responsable_labo: '/essais',
  responsable_metrologie: '/equipements',
  responsable_achats: '/achats-approvisionnement',
  responsable_finance: '/finances-avancees',
  receptionniste: '/essais',
  auditeur: '/assistant-audit-iso',
  dg: '/'
};

export function allowedPathsForRole(role) {
  return menuByRole[role] || menuByRole.responsable_appel;
}

export function canAccessPath(role, pathname) {
  if (!pathname || pathname === '/login') return true;
  return allowedPathsForRole(role).includes(pathname);
}

export function defaultRouteForRole(role) {
  return roleHome[role] || '/';
}

