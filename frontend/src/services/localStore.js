const STORAGE_KEY = 'smartlab_mobile_records_v2';
const SUPABASE_URL = process.env.REACT_APP_SUPABASE_URL || 'https://xyfhlgdyzxxvhryjvqcm.supabase.co';
const SUPABASE_KEY = process.env.REACT_APP_SUPABASE_KEY || 'sb_publishable_EmGwHAduz7UAe5h_YvizNw_iz7AADmR';
const SUPABASE_TABLE = process.env.REACT_APP_SUPABASE_TABLE || 'smartlab_records';
const USE_TYPED_TABLES = process.env.REACT_APP_SUPABASE_TYPED_TABLES === 'true';
const RESOURCE_TABLES = {
  clients: 'testlab_clients',
  essais: 'testlab_objets_essais',
  devis: 'testlab_devis',
  commandes: 'testlab_commandes',
  rapports: 'testlab_rapports',
  catalogueEssais: 'testlab_catalogue_essais',
  resultatsEssais: 'testlab_resultats_essais',
  documentsQualite: 'testlab_documents_qualite',
  equipements: 'testlab_equipements',
  personnel: 'testlab_personnel',
  nonConformites: 'testlab_non_conformites',
  reclamations: 'testlab_reclamations',
  actionsQualite: 'testlab_actions_qualite',
  risquesOpportunites: 'testlab_risques_opportunites',
  revuesDirection: 'testlab_revues_direction',
  achatsApprovisionnement: 'testlab_achats_approvisionnement',
  fournisseurs: 'testlab_fournisseurs',
  factures: 'testlab_factures',
  consommablesStocks: 'testlab_consommables_stocks',
  contrats: 'testlab_contrats',
  signaturesElectroniques: 'testlab_signatures_electroniques',
  portailClient: 'testlab_portail_client',
  portailFournisseur: 'testlab_portail_fournisseur',
  analyseDocumentaireIA: 'testlab_analyse_documentaire_ia',
  gouvernance: 'testlab_gouvernance',
  demandesPrestations: 'testlab_demandes_prestations',
  missionsTerrain: 'testlab_missions_terrain',
  planningProjets: 'testlab_planning_projets',
  competencesFormations: 'testlab_competences_formations',
  metrologieAvancee: 'testlab_metrologie_avancee',
  financesAvancees: 'testlab_finances_avancees',
  objectifsQualite: 'testlab_objectifs_qualite',
  moteursSysteme: 'testlab_moteurs_systeme',
  auditLogs: 'testlab_audit_logs',
  notifications: 'testlab_notifications',
  profiles: 'testlab_profiles'
};

const today = new Date().toISOString().slice(0, 10);

const seedData = {
  profiles: [],
  clients: [
    { id: 'cli-1', code: 'CLI-001', raison_sociale: 'Sogea BTP Benin', contact_nom: 'M. Fonton', telephone: '+229 97 12 34 56', secteur: 'BTP', email: 'contact@sogea.bj' },
    { id: 'cli-2', code: 'CLI-002', raison_sociale: 'AGETUR Benin', contact_nom: 'Mme Ahoton', telephone: '+229 95 67 89 01', secteur: 'Infrastructure', email: 'secretariat@agetur.bj' },
    { id: 'cli-3', code: 'CLI-003', raison_sociale: 'Colas Benin', contact_nom: 'M. Mensah', telephone: '+229 91 44 20 10', secteur: 'Voirie', email: 'projets@colas.bj' }
  ],
  essais: [
    { id: 'ess-1', numero: 'EA-2026-051', nature: 'Beton C25', provenance: 'Pont de Cotonou', date_prelevement: today, essai_a_realiser: 'RC28', client_nom: 'Sogea BTP Benin', commentaire: 'Eprouvettes prelevees sur chantier.', technicien: 'A. Cisse', statut: 'en_cours', priorite: 'haute', date: today },
    { id: 'ess-2', numero: 'EA-2026-050', nature: 'Sol lateritique', provenance: 'Route Nationale 1', date_prelevement: today, essai_a_realiser: 'OPM', client_nom: 'AGETUR Benin', commentaire: 'Materiau de couche de forme.', technicien: 'R. Dossou', statut: 'termine', priorite: 'normale', date: today },
    { id: 'ess-3', numero: 'EA-2026-049', nature: 'Eau de forage', provenance: 'Forage MAEP', date_prelevement: today, essai_a_realiser: 'AE', client_nom: 'MAEP', commentaire: 'Prelevement conserve en flacon sterile.', technicien: 'C. Adoho', statut: 'en_attente', priorite: 'normale', date: today }
  ],
  devis: [],
  commandes: [],
  projets: [
    { id: 'prj-1', reference: 'PRJ-2026-001', nom: 'Pont de Cotonou', client_nom: 'Sogea BTP Benin', localisation: 'Cotonou', date_debut: today, date_fin_prevue: today, budget: 4800000, responsable: 'Responsable Technique', statut: 'en_cours', description: 'Campagne essais beton et acier.' },
    { id: 'prj-2', reference: 'PRJ-2026-002', nom: 'Route Nationale 1', client_nom: 'AGETUR Benin', localisation: 'RN1', date_debut: today, date_fin_prevue: today, budget: 3200000, responsable: 'Responsable Laboratoire', statut: 'validation', description: 'Essais sols et granulometrie.' }
  ],
  catalogueEssais: [
    { id: 'cat-1', code: 'CAT-001', abreviation: 'RC7', designation: 'Resistance a la compression beton a 7 jours', famille: 'Beton', norme_reference: 'NF EN 12390-3', type_echantillon: 'Eprouvette beton', quantite_minimale: '3 eprouvettes', delai_jours: 7, prix_unitaire: 150000, equipements: 'Presse hydraulique, pied a coulisse', criteres_acceptation: 'Moyenne des ruptures et conformite selon classe beton.', statut: 'actif' },
    { id: 'cat-2', code: 'CAT-002', abreviation: 'RC28', designation: 'Resistance a la compression beton a 28 jours', famille: 'Beton', norme_reference: 'NF EN 12390-3', type_echantillon: 'Eprouvette beton', quantite_minimale: '3 eprouvettes', delai_jours: 28, prix_unitaire: 150000, equipements: 'Presse hydraulique, pied a coulisse', criteres_acceptation: 'Conformite si la resistance moyenne atteint la resistance exigee.', statut: 'actif' },
    { id: 'cat-3', code: 'CAT-003', abreviation: 'OPM', designation: 'Optimum Proctor modifie', famille: 'Sols', norme_reference: 'NF P 94-093', type_echantillon: 'Sol remanie', quantite_minimale: '25 kg', delai_jours: 3, prix_unitaire: 200000, equipements: 'Moule Proctor, dame, balance, etuve', criteres_acceptation: 'Determination teneur en eau optimale et densite seche maximale.', statut: 'actif' },
    { id: 'cat-4', code: 'CAT-004', abreviation: 'CBR', designation: 'Indice CBR apres compactage', famille: 'Sols', norme_reference: 'ASTM D1883 / NF P 94-078', type_echantillon: 'Sol compactable', quantite_minimale: '30 kg', delai_jours: 5, prix_unitaire: 250000, equipements: 'Presse CBR, moule CBR, comparateur', criteres_acceptation: 'Indice CBR compare aux exigences du projet.', statut: 'actif' },
    { id: 'cat-5', code: 'CAT-005', abreviation: 'GRAN', designation: 'Analyse granulometrique par tamisage', famille: 'Granulats', norme_reference: 'NF EN 933-1', type_echantillon: 'Granulat ou sol', quantite_minimale: '10 kg', delai_jours: 2, prix_unitaire: 120000, equipements: 'Serie de tamis, tamiseuse, balance', criteres_acceptation: 'Courbe granulometrique et fuseau de specification.', statut: 'actif' },
    { id: 'cat-6', code: 'CAT-006', abreviation: 'LA', designation: "Limites d'Atterberg", famille: 'Sols', norme_reference: 'NF P 94-051', type_echantillon: 'Sol fin', quantite_minimale: '2 kg', delai_jours: 2, prix_unitaire: 90000, equipements: 'Coupelle Casagrande, plaque, balance, etuve', criteres_acceptation: 'Calcul IP = LL - LP et classification du sol.', statut: 'actif' },
    { id: 'cat-7', code: 'CAT-007', abreviation: 'AE', designation: "Analyse d'eau", famille: 'Eau', norme_reference: 'Methodes laboratoire / ISO 17025', type_echantillon: 'Eau', quantite_minimale: '1 litre', delai_jours: 3, prix_unitaire: 100000, equipements: 'pH-metre, conductimetre, verrerie', criteres_acceptation: 'Comparaison aux seuils applicables au projet.', statut: 'actif' }
  ],
  resultatsEssais: [
    { id: 'res-1', numero: 'RES-2026-001', objet_essai: 'EA-2026-051', essai_code: 'RC28', client_nom: 'Sogea BTP Benin', date_resultat: today, valeur_1: 27.4, valeur_2: 26.1, valeur_3: 25.8, moyenne: 26.43, unite: 'MPa', exigence: 25, decision: 'conforme', technicien: 'KASSIN Harrison', observations: 'Ruptures correctes, aucune anomalie visible.' }
  ],
  documentsQualite: [
    { id: 'docq-1', reference: 'PRO-2026-001', titre: 'Procedure de reception des objets d essais', type: 'procedure', statut: 'en_vigueur', version: '01', processus: 'Reception', responsable: 'Responsable Qualite', date_application: today, date_revision: today, objet: 'Definir les controles a effectuer a la reception.', contenu: 'Identification, verification de conformite, codification, enregistrement et transmission au laboratoire.', objectif: 'Definir les controles a effectuer lors de la reception des objets d essais afin de garantir leur identification, leur tracabilite et leur aptitude aux essais demandes.', domaine_application: 'Cette procedure s applique a tous les objets d essais recus par le laboratoire, depuis leur arrivee jusqu a leur transmission au responsable laboratoire.', references_normatives: 'ISO/IEC 17025, procedure de maitrise documentaire, fiche de reception des objets d essais.', responsabilites: 'Le receptionniste enregistre et identifie l objet d essai. Le responsable laboratoire verifie la conformite et oriente les essais. Le responsable qualite controle la maitrise documentaire.', deroulement: '1. Recevoir l objet d essai.\n2. Verifier l identification, l etat et les informations client.\n3. Attribuer une reference unique.\n4. Enregistrer la nature, la provenance, la date de prelevement et les essais demandes.\n5. Signaler toute anomalie au responsable concerne.\n6. Transmettre l objet d essai au laboratoire avec la fiche associee.', enregistrements: 'Fiche de reception, code objet d essai, photos si necessaire, observations de non-conformite, preuve de transmission au laboratoire.', maitrise_modifications: 'Toute modification de cette procedure est revue par le responsable qualite et validee avant diffusion.', lien_document: 'PRO-Reception-Objets-Essais.pdf', observation: '' },
    { id: 'docq-2', reference: 'FIC-2026-001', titre: 'Fiche de reception objet d essai', type: 'fiche', statut: 'en_vigueur', version: '01', processus: 'Reception', responsable: 'Receptionniste', date_application: today, date_revision: today, objet: 'Support de saisie des informations de reception.', contenu: 'Client, nature, provenance, date de prelevement, essais demandes, observations et signature.', lien_document: 'FIC-Reception-Objet-Essai.docx', observation: '' },
    { id: 'docq-3', reference: 'PRO-2025-001', titre: 'Ancienne procedure devis client', type: 'procedure', statut: 'perime', version: '00', processus: 'Commercial', responsable: 'Responsable des offres', date_application: today, date_revision: today, objet: 'Ancienne methode de revue et emission des devis.', contenu: 'Document remplace par le circuit de validation RT/DG/client.', objectif: 'Ancienne methode de revue et emission des devis.', domaine_application: 'Ancien circuit commercial.', references_normatives: 'Ancienne version documentaire.', responsabilites: 'Responsable des offres.', deroulement: 'Document remplace par le circuit de validation RT/DG/client.', enregistrements: 'Archives commerciales.', maitrise_modifications: 'Remplacee par PRO-2026-002.', lien_document: 'Archive-PRO-Devis-Client.pdf', observation: 'Remplacee par PRO-2026-002.' }
  ],
  rapports: [
    { id: 'rap-1', numero: 'RAP-2026-046', essai: 'EA-2026-050', client_nom: 'AGETUR Benin', date: today, statut: 'valide' },
    { id: 'rap-2', numero: 'RAP-2026-045', essai: 'EA-2026-049', client_nom: 'MAEP', date: today, statut: 'brouillon' }
  ],
  equipements: [
    { id: 'eq-1', code: 'EQ-001', designation: 'Presse hydraulique 3000 kN', famille: 'Beton', dernier_etalonnage: today, prochain_etalonnage: today, statut: 'conforme' },
    { id: 'eq-2', code: 'EQ-002', designation: 'Balance de precision', famille: 'Metrologie', dernier_etalonnage: today, prochain_etalonnage: today, statut: 'a_surveiller' }
  ],
  audits: [
    { id: 'aud-1', reference: 'AUD-2026-001', type: 'Audit interne ISO 17025', pilote: 'Responsable Qualite', date: today, statut: 'planifie' },
    { id: 'aud-2', reference: 'REV-2026-001', type: 'Revue de direction', pilote: 'Directeur General', date: today, statut: 'en_preparation' }
  ],
  nonConformites: [
    { id: 'nc-1', reference: 'NC-2026-002', origine: "Reception objet d'essai", description: "Objet d'essai recu sans identification complete", responsable: 'Responsable Laboratoire', echeance: today, statut: 'ouverte' },
    { id: 'nc-2', reference: 'NC-2026-001', origine: 'Controle rapport', description: 'Ecart releve avant transmission du rapport client', responsable: 'Responsable Technique', echeance: today, statut: 'en_traitement' }
  ],
  reclamations: [
    { id: 'rec-1', reference: 'REC-2026-001', client_nom: 'AGETUR Benin', canal: 'email', objet: 'Demande de verification rapport', description: 'Le client demande une verification des valeurs reprises dans le rapport transmis.', responsable: 'Responsable Technique', action_prevue: 'Revue du dossier et reponse client documentee.', date_reception: today, echeance: today, statut: 'en_traitement' }
  ],
  actionsQualite: [
    { id: 'act-1', reference: 'ACT-2026-001', origine: 'Reclamation', source: 'REC-2026-001', type: 'corrective', objet: 'Verifier les resultats contestes et documenter la reponse client', responsable: 'Responsable Technique', processus: 'Rapports', priorite: 'haute', date_ouverture: today, echeance: today, statut: 'en_cours', avancement: 55, efficacite: 'a_verifier' },
    { id: 'act-2', reference: 'ACT-2026-002', origine: 'Audit', source: 'AUD-2026-001', type: 'amelioration', objet: 'Renforcer la revue des dossiers avant emission des rapports', responsable: 'Responsable Qualite', processus: 'Management Qualite', priorite: 'moyenne', date_ouverture: today, echeance: today, statut: 'ouverte', avancement: 20, efficacite: 'non_verifiee' }
  ],
  risquesOpportunites: [
    { id: 'ris-1', reference: 'RIS-2026-001', categorie: 'Metrologie', type: 'risque', description: 'Retard d etalonnage sur un equipement critique', cause: 'Planning fournisseur non confirme', probabilite: 4, impact: 5, responsable: 'Responsable Metrologie', action_associee: 'ACT-2026-002', statut: 'ouvert', echeance: today },
    { id: 'ris-2', reference: 'OPP-2026-001', categorie: 'Commercial', type: 'opportunite', description: 'Portail client pour accelerer les validations de devis', cause: 'Clients demandent un suivi plus direct', probabilite: 3, impact: 4, responsable: 'Responsable des offres', action_associee: '', statut: 'en_suivi', echeance: today }
  ],
  revuesDirection: [
    { id: 'rev-1', reference: 'RD-2026-001', periode: 'S1 2026', responsable: 'Direction Generale', date_prevue: today, statut: 'en_preparation', decisions: 'Prioriser risques metrologie, actions en retard et satisfaction client.', participants: 'DG, RT, RQ, RL, RO', conclusion: 'Revue en preparation a partir des indicateurs TESTLAB.' }
  ],
  achatsApprovisionnement: [
    { id: 'ach-1', reference: 'ACH-2026-001', fournisseur: 'Fournitures Labo Benin', famille: 'Consommables', objet: 'Achat sacs echantillons et etiquettes', montant_ht: 185000, date_demande: today, demandeur: 'Receptionniste', responsable: 'Responsable Labo', priorite: 'normale', statut: 'en_attente' },
    { id: 'ach-2', reference: 'ACH-2026-002', fournisseur: 'MetroLab Services', famille: 'Maintenance', objet: 'Intervention balance de precision', montant_ht: 320000, date_demande: today, demandeur: 'Responsable Metrologie', responsable: 'Responsable Technique', priorite: 'urgente', statut: 'valide' }
  ],
  satisfactionClients: [
    { id: 'sat-1', reference: 'SAT-2026-001', client_nom: 'AGETUR Benin', projet: 'Route Nationale 1', note_globale: 4, delai: 4, qualite_rapport: 5, communication: 4, commentaire: 'Rapport clair, delai respecte.', date_reponse: today, responsable: 'Responsable des offres', statut: 'traite' },
    { id: 'sat-2', reference: 'SAT-2026-002', client_nom: 'Sogea BTP Benin', projet: 'Pont de Cotonou', note_globale: 3, delai: 3, qualite_rapport: 4, communication: 3, commentaire: 'Prevoir une meilleure information sur les delais.', date_reponse: today, responsable: 'Responsable Technique', statut: 'a_suivre' }
  ],
  gouvernance: [
    { id: 'gov-1', reference: 'GOV-2026-001', entite: 'TESTLAB Groupe', type_entite: 'Organisation', responsable: 'Direction Generale', perimetre: 'Pilotage global du systeme LIMS, QMS et ERP.', statut: 'actif' },
    { id: 'gov-2', reference: 'GOV-2026-002', entite: 'Laboratoire Geotechnique', type_entite: 'Laboratoire', responsable: 'Responsable Laboratoire', perimetre: 'Objets d essais, essais sols, beton, rapports et equipements critiques.', statut: 'actif' }
  ],
  demandesPrestations: [
    { id: 'dpr-1', reference: 'DPR-2026-001', client_nom: 'Sogea BTP Benin', contact: 'M. Fonton', besoin: 'Campagne d essais beton pour ouvrage en cours.', canal: 'whatsapp', responsable: 'Responsable des offres', statut: 'ouverte' },
    { id: 'dpr-2', reference: 'DPR-2026-002', client_nom: 'AGETUR Benin', contact: 'Mme Ahoton', besoin: 'Verification geotechnique de materiaux de couche de forme.', canal: 'email', responsable: 'Responsable Technique', statut: 'en_cours' }
  ],
  missionsTerrain: [
    { id: 'mis-1', reference: 'MIS-2026-001', projet: 'Pont de Cotonou', site: 'Cotonou', mission: 'Prelevement eprouvettes beton et controle reception chantier.', equipe: 'Equipe Beton', vehicule: 'Pick-up labo 01', date_intervention: today, statut: 'planifie' }
  ],
  planningProjets: [
    { id: 'pln-1', reference: 'PLN-2026-001', projet: 'Route Nationale 1', activite: 'Essais Proctor et CBR', jalon: 'Rapport intermediaire sols', responsable: 'Responsable Laboratoire', budget: 3200000, date_echeance: today, statut: 'en_cours' }
  ],
  competencesFormations: [
    { id: 'cmp-1', reference: 'CMP-2026-001', personnel: 'KASSIN Harrison', competence: 'Validation rapports beton', niveau: 'expert', formation: 'ISO/IEC 17025 - revue technique', date_evaluation: today, validateur: 'Direction Generale', statut: 'actif' },
    { id: 'cmp-2', reference: 'CMP-2026-002', personnel: 'ADOHO Cedric', competence: 'Essai RC28', niveau: 'habilite', formation: 'Pratique presse hydraulique', date_evaluation: today, validateur: 'Responsable Technique', statut: 'actif' }
  ],
  metrologieAvancee: [
    { id: 'met-1', reference: 'MET-2026-001', equipement: 'Presse hydraulique 3000 kN', operation: 'etalonnage', certificat: 'CERT-EQ-001-2026', incertitude: '0,2 %', decision: 'conforme', date_operation: today, statut: 'conforme' },
    { id: 'met-2', reference: 'MET-2026-002', equipement: 'Balance de precision', operation: 'verification_intermediaire', certificat: 'FIC-VERIF-BAL-2026', incertitude: '0,01 g', decision: 'a surveiller', date_operation: today, statut: 'en_cours' }
  ],
  financesAvancees: [
    { id: 'fin-1', reference: 'FIN-2026-001', categorie: 'paiement', libelle: 'Acompte devis Pont de Cotonou', partenaire: 'Sogea BTP Benin', centre: 'Laboratoire Beton', montant: 2030000, date_operation: today, statut: 'en_cours' },
    { id: 'fin-2', reference: 'FIN-2026-002', categorie: 'budget', libelle: 'Budget consommables geotechniques', partenaire: 'TESTLAB', centre: 'Laboratoire Sols', montant: 2000000, date_operation: today, statut: 'valide' }
  ],
  objectifsQualite: [
    { id: 'obj-1', reference: 'OBJ-2026-001', objectif: 'Reduire les non-conformites ouvertes de 30 % avant la prochaine revue de direction.', processus: 'Management Qualite', indicateur: 'Nombre de NC ouvertes', cible: '-30 %', responsable: 'Responsable Qualite', echeance: today, statut: 'en_cours' },
    { id: 'obj-2', reference: 'OBJ-2026-002', objectif: 'Maintenir 95 % des equipements critiques conformes.', processus: 'Metrologie', indicateur: 'Taux equipements conformes', cible: '95 %', responsable: 'Responsable Metrologie', echeance: today, statut: 'en_cours' }
  ],
  moteursSysteme: [
    { id: 'mot-1', reference: 'MOT-2026-001', moteur: 'workflow', regle: 'Lorsqu un devis est valide par le client, creer automatiquement une commande et notifier le responsable des offres.', module_cible: 'Devis / Commandes', declencheur: 'Validation client', action: 'Creation commande + notification + audit log.', responsable: 'Administrateur TESTLAB', statut: 'actif' },
    { id: 'mot-2', reference: 'MOT-2026-002', moteur: 'conformite', regle: 'Bloquer l affectation d un essai a un personnel non habilite.', module_cible: 'Objets d essais', declencheur: 'Affectation technicien', action: 'Verifier matrice competence et afficher alerte bloquante.', responsable: 'Responsable Qualite', statut: 'actif' }
  ],
  notifications: [],
  activityLogs: [],
  personnel: [
    { id: 'per-1', nom: 'ADOHO Cedric', role: 'Operateur technique', atelier: 'Beton', qualification: 'accepte', habilitation: 'active', prochaine_revue: today },
    { id: 'per-2', nom: 'DOSSOU Rachel', role: 'Responsable Laboratoire', atelier: 'Sols', qualification: 'en_suivi', habilitation: 'active', prochaine_revue: today },
    { id: 'per-3', nom: 'KASSIN Harrison', role: 'Responsable Technique', atelier: 'Tous domaines', qualification: 'accepte', habilitation: 'active', prochaine_revue: today }
  ],
  parametres: [
    { id: 'par-1', module: 'Normes', valeur: 'ISO/IEC 17025, ISO 9001, ASTM, NF, Eurocode', statut: 'actif' },
    { id: 'par-2', module: 'Rapports', valeur: 'Modeles PDF/Word personnalisables', statut: 'actif' },
    { id: 'par-3', module: 'Modules', valeur: 'Technique, Qualite, Administratif, Utilisateurs', statut: 'actif' }
  ]
};

const clone = (value) => JSON.parse(JSON.stringify(value));

function headers(extra = {}) {
  return {
    apikey: SUPABASE_KEY,
    Authorization: `Bearer ${SUPABASE_KEY}`,
    'Content-Type': 'application/json',
    ...extra
  };
}

function tableForResource(resource) {
  return USE_TYPED_TABLES ? (RESOURCE_TABLES[resource] || resource) : SUPABASE_TABLE;
}

function resourceUrl(resource) {
  const table = tableForResource(resource);
  if (USE_TYPED_TABLES) {
    return `${SUPABASE_URL}/rest/v1/${table}?select=id,payload,updated_at&order=id.asc`;
  }
  return `${SUPABASE_URL}/rest/v1/${table}?resource=eq.${encodeURIComponent(resource)}&select=id,resource,payload,updated_at&order=id.asc`;
}

function rowUrl(resource, id) {
  const table = tableForResource(resource);
  return `${SUPABASE_URL}/rest/v1/${table}?id=eq.${encodeURIComponent(id)}`;
}

function loadData() {
  const saved = localStorage.getItem(STORAGE_KEY);
  if (!saved) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(seedData));
    return clone(seedData);
  }
  return { ...clone(seedData), ...JSON.parse(saved) };
}

function saveData(data, notify = true) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  if (notify) window.dispatchEvent(new CustomEvent('smartlab:data-changed'));
}

function saveLocalResource(resource, records) {
  const data = loadData();
  data[resource] = records;
  saveData(data, false);
}

function emitStatus(status, message) {
  window.dispatchEvent(new CustomEvent('smartlab:sync-status', { detail: { status, message } }));
}

function getAuditActor() {
  try {
    const savedUser = JSON.parse(localStorage.getItem('smartlab_user') || 'null');
    if (savedUser?.name) return savedUser.name;
  } catch (error) {
    // Local profile is optional.
  }
  return 'Utilisateur TESTLAB';
}

function appendAuditLog(data, resource, action, record, previous = null) {
  if (resource === 'auditLogs') return;
  const log = {
    id: `audlog-${Date.now()}-${Math.random().toString(16).slice(2)}`,
    reference: `LOG-${new Date().getFullYear()}-${String((data.auditLogs || []).length + 1).padStart(4, '0')}`,
    resource,
    action,
    record_id: record?.id || '',
    record_reference: record?.reference || record?.numero || record?.code || record?.id || '',
    utilisateur: getAuditActor(),
    ancienne_valeur: previous,
    nouvelle_valeur: action === 'suppression' ? null : record,
    date_action: new Date().toISOString(),
    source: 'TESTLAB Core System'
  };
  data.auditLogs = [...(data.auditLogs || []), log].slice(-300);
  upsertRemote('auditLogs', log).catch(() => {});
}

function workflowReference(data, resource, prefix) {
  const year = new Date().getFullYear();
  const records = data[resource] || [];
  const max = records.reduce((highest, record) => {
    const match = String(record.reference || record.numero || record.code || '').match(new RegExp(`^${prefix}-${year}-(\\d+)$`, 'i'));
    return match ? Math.max(highest, Number(match[1])) : highest;
  }, 0);
  return `${prefix}-${year}-${String(max + 1).padStart(3, '0')}`;
}

function pushWorkflowNotification(data, notification) {
  const id = notification.id || `notif-${notification.source || notification.title}-${notification.path || ''}`.toLowerCase().replace(/[^a-z0-9-]/g, '-');
  if ((data.notifications || []).some((item) => item.id === id && !item.read)) return;
  data.notifications = [...(data.notifications || []), {
    id,
    title: notification.title,
    message: notification.message,
    tone: notification.tone || 'info',
    path: notification.path || '/',
    targetRole: notification.targetRole || 'all',
    read: false,
    justification: notification.justification || 'Regle metier TESTLAB appliquee automatiquement.',
    created_at: new Date().toISOString()
  }];
}

function syncWorkflowNotifications(data) {
  (data.notifications || []).slice(-50).forEach((notification) => {
    upsertRemote('notifications', notification).catch(() => {});
  });
}
function pushWorkflowAction(data, action) {
  const source = action.source || action.reference || '';
  if ((data.actionsQualite || []).some((item) => item.source === source && item.origine === action.origine && !['terminee', 'cloturee'].includes(item.statut))) return;
  const record = {
    id: `act-${Date.now()}-${Math.random().toString(16).slice(2)}`,
    reference: workflowReference(data, 'actionsQualite', 'ACT'),
    origine: action.origine,
    source,
    type: action.type || 'corrective',
    objet: action.objet,
    responsable: action.responsable || 'Responsable Qualite',
    processus: action.processus || 'Management Qualite',
    priorite: action.priorite || 'moyenne',
    date_ouverture: new Date().toISOString().slice(0, 10),
    echeance: action.echeance || new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 10),
    statut: 'ouverte',
    avancement: 0,
    efficacite: 'non_verifiee',
    justification: action.justification || 'Action generee par le moteur de workflow TESTLAB.'
  };
  data.actionsQualite = [...(data.actionsQualite || []), record];
  upsertRemote('actionsQualite', record).catch(() => {});
}

function daysUntil(date) {
  if (!date) return null;
  const todayDate = new Date();
  todayDate.setHours(0, 0, 0, 0);
  const target = new Date(date);
  target.setHours(0, 0, 0, 0);
  return Math.round((target - todayDate) / 86400000);
}

function runWorkflowAutomations(data, resource, action, record) {
  if (!record || action === 'suppression') return;
  const ref = record.reference || record.numero || record.code || record.id;

  if (resource === 'reclamations' && action === 'creation') {
    pushWorkflowAction(data, {
      origine: 'Reclamation',
      source: ref,
      type: 'corrective',
      objet: `Traiter la reclamation ${ref} - ${record.objet || record.description || 'analyse client'}`,
      responsable: record.responsable || 'Responsable Technique',
      processus: 'Satisfaction client',
      priorite: record.priorite || 'moyenne',
      justification: 'Le TSAB prevoit qu une reclamation peut generer automatiquement une action corrective.'
    });
    pushWorkflowNotification(data, {
      id: `workflow-reclamation-${record.id}`,
      title: 'Reclamation a traiter',
      message: `${ref} a genere une action corrective automatique.`,
      path: '/reclamations',
      targetRole: 'responsable_technique',
      tone: 'offline',
      source: ref,
      justification: 'Reclamation client creee: information automatique du responsable concerne.'
    });
  }

  if (resource === 'nonConformites' && action === 'creation') {
    pushWorkflowAction(data, {
      origine: 'Non-conformite',
      source: ref,
      type: 'corrective',
      objet: `Analyser et traiter la non-conformite ${ref}`,
      responsable: record.responsable || 'Responsable Qualite',
      processus: record.origine || 'Management Qualite',
      priorite: 'haute',
      justification: 'Toute non-conformite ouverte doit etre reliee a un traitement documente.'
    });
  }

  if (resource === 'risquesOpportunites') {
    const score = Number(record.probabilite || 0) * Number(record.impact || 0);
    if (score >= 16 && record.statut !== 'cloture') {
      pushWorkflowAction(data, {
        origine: 'Risque',
        source: ref,
        type: 'preventive',
        objet: `Mettre sous controle le risque critique ${ref} (score ${score})`,
        responsable: record.responsable || 'Responsable Qualite',
        processus: record.categorie || 'Gestion des risques',
        priorite: 'haute',
        justification: 'Score criticite >= 16: action preventive obligatoire selon la matrice TESTLAB.'
      });
      pushWorkflowNotification(data, {
        id: `workflow-risque-${record.id}`,
        title: 'Risque critique',
        message: `${ref} atteint un score de ${score}. Une action est requise.`,
        path: '/risques-opportunites',
        targetRole: 'dg',
        tone: 'offline',
        source: ref,
        justification: 'Risque critique detecte automatiquement par le moteur de regles.'
      });
    }
  }

  if (resource === 'equipements') {
    const remaining = daysUntil(record.prochain_etalonnage);
    if ((remaining !== null && remaining <= 30) || ['a_surveiller', 'en_panne', 'hors_service'].includes(record.statut)) {
      pushWorkflowAction(data, {
        origine: 'Equipement',
        source: ref,
        type: 'preventive',
        objet: `Verifier la conformite metrologique de ${record.designation || ref}`,
        responsable: record.responsable || 'Responsable Metrologie',
        processus: 'Metrologie',
        priorite: remaining !== null && remaining < 0 ? 'haute' : 'moyenne',
        justification: 'Echeance metrologique proche, depassee ou statut equipement non conforme.'
      });
      pushWorkflowNotification(data, {
        id: `workflow-equipement-${record.id}`,
        title: 'Alerte equipement',
        message: `${record.designation || ref}: etalonnage/statut a verifier.`,
        path: '/equipements',
        targetRole: 'responsable_labo',
        tone: remaining !== null && remaining < 0 ? 'offline' : 'info',
        source: ref,
        justification: 'Controle automatique des echeances metrologiques.'
      });
    }
  }

  if (resource === 'documentsQualite' && record.statut === 'en_vigueur') {
    const revisionDelay = daysUntil(record.date_revision);
    if (revisionDelay !== null && revisionDelay < 0) {
      record.statut = 'perime';
      pushWorkflowNotification(data, {
        id: `workflow-document-${record.id}`,
        title: 'Document qualite perime',
        message: `${record.reference || record.titre} a depasse sa date de revision.`,
        path: '/documents-qualite',
        targetRole: 'responsable_technique',
        tone: 'offline',
        source: ref,
        justification: 'Date de revision depassee: retrait automatique de la diffusion active.'
      });
    }
  }
  if (resource === 'demandesPrestations') {
    const key = String(record.statut || '').toLowerCase();
    pushWorkflowNotification(data, {
      id: `workflow-demande-${record.id}`,
      title: 'Demande de prestation',
      message: `${ref} - ${record.client_nom || 'Client'}: ${record.besoin || 'demande a qualifier'}`,
      path: '/demandes-prestations',
      targetRole: key.includes('technique') ? 'responsable_technique' : 'responsable_appel',
      tone: 'info',
      source: ref,
      justification: 'Toute demande client doit etre qualifiee avant devis ou commande.'
    });

    if (['pret_devis', 'devis', 'valide', 'qualifiee'].includes(key)) {
      const existingQuote = (data.devis || []).some((item) => item.demande_reference === ref);
      if (!existingQuote) {
        const quote = {
          id: `dev-${Date.now()}-${Math.random().toString(16).slice(2)}`,
          numero: workflowReference(data, 'devis', 'DEV'),
          demande_reference: ref,
          client_nom: record.client_nom || '',
          projet: record.projet || '',
          objet: record.besoin || 'Demande de prestation a chiffrer',
          prestations: [],
          montant_ht: 0,
          canal_envoi: record.canal || 'whatsapp',
          statut: 'redaction',
          date: new Date().toISOString().slice(0, 10),
          responsable: record.responsable || 'Responsable des offres',
          commentaire: `Devis cree automatiquement depuis ${ref}`
        };
        data.devis = [...(data.devis || []), quote];
        upsertRemote('devis', quote).catch(() => {});
        pushWorkflowNotification(data, {
          id: `workflow-demande-devis-${record.id}`,
          title: 'Devis a rediger',
          message: `${quote.numero} cree depuis ${ref}.`,
          path: '/devis',
          targetRole: 'responsable_appel',
          tone: 'online',
          source: quote.numero,
          justification: 'Demande qualifiee: creation automatique du brouillon de devis.'
        });
      }
    }
  }

  if (resource === 'missionsTerrain') {
    const key = String(record.statut || '').toLowerCase();
    if (['termine', 'terminee', 'realise', 'realisee'].includes(key)) {
      const existingSample = (data.essais || []).some((item) => item.source_mission === ref);
      if (!existingSample) {
        const sample = {
          id: `ess-${Date.now()}-${Math.random().toString(16).slice(2)}`,
          numero: workflowReference(data, 'essais', 'EA'),
          source_mission: ref,
          nature: record.mission || 'Objet issu mission terrain',
          provenance: record.site || record.projet || '',
          date_prelevement: record.date_intervention || new Date().toISOString().slice(0, 10),
          essai_a_realiser: record.essais || '',
          client_nom: record.client_nom || '',
          commentaire: `Objet d essai cree automatiquement apres mission ${ref}`,
          technicien: record.equipe || '',
          statut: 'en_attente',
          priorite: 'normale',
          date: new Date().toISOString().slice(0, 10)
        };
        data.essais = [...(data.essais || []), sample];
        upsertRemote('essais', sample).catch(() => {});
        pushWorkflowNotification(data, {
          id: `workflow-mission-essai-${record.id}`,
          title: "Objet d'essai cree",
          message: `${sample.numero} cree depuis la mission ${ref}.`,
          path: '/essais',
          targetRole: 'responsable_labo',
          tone: 'online',
          source: sample.numero,
          justification: 'Mission terrain terminee: reception laboratoire a preparer.'
        });
      }
    }
  }

  if (resource === 'competencesFormations') {
    const level = String(record.niveau || '').toLowerCase();
    if (['habilite', 'expert'].includes(level) && record.personnel) {
      data.personnel = (data.personnel || []).map((person) => {
        if (String(person.nom || '').toLowerCase() !== String(record.personnel || '').toLowerCase()) return person;
        const competences = Array.from(new Set([...(person.competences || []), record.competence].filter(Boolean)));
        const updated = { ...person, competences, habilitation: 'active', prochaine_revue: record.date_evaluation || person.prochaine_revue };
        upsertRemote('personnel', updated).catch(() => {});
        return updated;
      });
      pushWorkflowNotification(data, {
        id: `workflow-competence-${record.id}`,
        title: 'Competence validee',
        message: `${record.personnel} est ${record.niveau} pour ${record.competence || 'une competence'}.`,
        path: '/competences-formations',
        targetRole: 'responsable_technique',
        tone: 'online',
        source: ref,
        justification: 'La matrice de competence met a jour les habilitations du personnel.'
      });
    }
  }

  if (resource === 'metrologieAvancee') {
    const decision = String(record.decision || record.statut || '').toLowerCase();
    const isNonConforming = decision.includes('non') || decision.includes('surveiller') || ['en_retard', 'a_surveiller', 'non_conforme'].includes(record.statut);
    if (record.equipement) {
      data.equipements = (data.equipements || []).map((equipment) => {
        const equipmentLabel = String(equipment.designation || equipment.code || '').toLowerCase();
        const recordLabel = String(record.equipement || '').toLowerCase();
        const sameEquipment = equipmentLabel.includes(recordLabel) || recordLabel.includes(equipmentLabel);
        if (!sameEquipment) return equipment;
        const updated = { ...equipment, statut: isNonConforming ? 'a_surveiller' : 'conforme', dernier_etalonnage: record.date_operation || equipment.dernier_etalonnage, certificat: record.certificat || equipment.certificat };
        upsertRemote('equipements', updated).catch(() => {});
        return updated;
      });
    }
    if (isNonConforming) {
      pushWorkflowAction(data, {
        origine: 'Metrologie',
        source: ref,
        type: 'preventive',
        objet: `Verifier la decision metrologique ${ref} pour ${record.equipement || 'equipement'}`,
        responsable: 'Responsable Metrologie',
        processus: 'Metrologie',
        priorite: 'haute',
        justification: 'Decision metrologique a surveiller ou non conforme.'
      });
    }
  }

  if (resource === 'objectifsQualite') {
    const remaining = daysUntil(record.echeance);
    if (remaining !== null && remaining <= 7 && !['atteint', 'cloture', 'cloturee'].includes(String(record.statut || '').toLowerCase())) {
      pushWorkflowAction(data, {
        origine: 'Objectif qualite',
        source: ref,
        type: 'amelioration',
        objet: `Verifier l avancement de l objectif ${ref}: ${record.objectif || ''}`,
        responsable: record.responsable || 'Responsable Qualite',
        processus: record.processus || 'Objectifs qualite',
        priorite: remaining < 0 ? 'haute' : 'moyenne',
        justification: 'Objectif qualite proche de son echeance ou en retard.'
      });
      pushWorkflowNotification(data, {
        id: `workflow-objectif-${record.id}`,
        title: 'Objectif qualite a suivre',
        message: `${ref} arrive a echeance ${remaining < 0 ? 'depuis ' + Math.abs(remaining) + ' jour(s)' : 'dans ' + remaining + ' jour(s)'}.`,
        path: '/objectifs-qualite',
        targetRole: 'dg',
        tone: remaining < 0 ? 'offline' : 'info',
        source: ref,
        justification: 'Suivi automatique des objectifs ISO 9001.'
      });
    }
  }

  if (resource === 'planningProjets') {
    const remaining = daysUntil(record.date_echeance);
    if (remaining !== null && remaining < 0 && !['termine', 'cloture', 'cloturee'].includes(String(record.statut || '').toLowerCase())) {
      pushWorkflowAction(data, {
        origine: 'Projet',
        source: ref,
        type: 'amelioration',
        objet: `Rattraper le jalon projet en retard ${ref}: ${record.jalon || record.activite || ''}`,
        responsable: record.responsable || 'Chef de projet',
        processus: 'Gestion projets',
        priorite: 'haute',
        justification: 'Jalon projet en retard detecte par le moteur de workflow.'
      });
    }
  }

  if (resource === 'financesAvancees' && ['paiement', 'recette'].includes(String(record.categorie || '').toLowerCase())) {
    pushWorkflowNotification(data, {
      id: `workflow-finance-${record.id}`,
      title: 'Operation financiere',
      message: `${ref}: ${record.libelle || 'operation'} - ${Number(record.montant || 0).toLocaleString('fr-FR')} FCFA.`,
      path: '/finances-avancees',
      targetRole: 'dg',
      tone: 'online',
      source: ref,
      justification: 'Operation financiere tracee pour le pilotage direction.'
    });
  }

  if (resource === 'consommablesStocks') {
    const qty = Number(record.quantite || 0);
    const min = Number(record.stock_minimum || 0);
    const expiryDelay = daysUntil(record.date_peremption);
    const isLowStock = min > 0 && qty <= min;
    const isExpired = expiryDelay !== null && expiryDelay < 0;
    const isExpiring = expiryDelay !== null && expiryDelay <= 30;
    if (isExpired) record.statut = 'expire';
    if (isLowStock || isExpiring) {
      pushWorkflowAction(data, {
        origine: 'Stock',
        source: ref,
        type: isLowStock ? 'preventive' : 'corrective',
        objet: `${record.designation || ref}: ${isLowStock ? 'stock minimum atteint' : isExpired ? 'lot perime' : 'peremption proche'}`,
        responsable: record.responsable || 'Responsable Labo',
        processus: 'Stocks et consommables',
        priorite: isExpired || isLowStock ? 'haute' : 'moyenne',
        justification: 'Le module stock surveille automatiquement les seuils minimums et les dates de peremption.'
      });
      pushWorkflowNotification(data, {
        id: `workflow-stock-${record.id}`,
        title: 'Alerte stock / consommable',
        message: `${record.designation || ref}: ${isLowStock ? 'stock bas' : isExpired ? 'perime' : 'peremption proche'}.`,
        path: '/stocks-consommables',
        targetRole: 'responsable_labo',
        tone: isExpired || isLowStock ? 'offline' : 'info',
        source: ref,
        justification: 'Seuil ou peremption controle automatiquement.'
      });
    }
  }

  if (resource === 'contrats') {
    const remaining = daysUntil(record.date_fin);
    const status = String(record.statut || '').toLowerCase();
    if (remaining !== null && remaining < 0 && !['resilie', 'archive', 'expire'].includes(status)) record.statut = 'expire';
    if (remaining !== null && remaining <= 30 && !['resilie', 'archive', 'cloture'].includes(status)) {
      pushWorkflowAction(data, {
        origine: 'Contrat',
        source: ref,
        type: 'preventive',
        objet: `Revoir le contrat ${ref} - ${record.partenaire || 'partenaire'}`,
        responsable: record.responsable || 'Direction Generale',
        processus: 'Gestion contrats',
        priorite: remaining < 0 ? 'haute' : 'moyenne',
        justification: 'Contrat proche de son echeance ou expire: decision de renouvellement requise.'
      });
      pushWorkflowNotification(data, {
        id: `workflow-contrat-${record.id}`,
        title: 'Contrat a revoir',
        message: `${ref} arrive a echeance ${remaining < 0 ? 'depuis ' + Math.abs(remaining) + ' jour(s)' : 'dans ' + remaining + ' jour(s)'}.`,
        path: '/contrats',
        targetRole: 'dg',
        tone: remaining < 0 ? 'offline' : 'info',
        source: ref,
        justification: 'Surveillance automatique des echeances contractuelles.'
      });
    }
  }

  if (resource === 'factures') {
    const status = String(record.statut || '').toLowerCase();
    const remaining = daysUntil(record.date_echeance);
    const isPaid = ['paye', 'payee', 'regle', 'reglee'].includes(status);
    if (isPaid) {
      const existingFinance = (data.financesAvancees || []).some((item) => item.source_facture === ref);
      if (!existingFinance) {
        const finance = {
          id: `fin-${Date.now()}-${Math.random().toString(16).slice(2)}`,
          reference: workflowReference(data, 'financesAvancees', 'FIN'),
          source_facture: ref,
          categorie: 'paiement',
          libelle: `Encaissement facture ${ref}`,
          partenaire: record.client_nom || '',
          centre: 'Commercial',
          montant: Number(record.montant_ht || record.montant || 0),
          date_operation: new Date().toISOString().slice(0, 10),
          statut: 'paye'
        };
        data.financesAvancees = [...(data.financesAvancees || []), finance];
        upsertRemote('financesAvancees', finance).catch(() => {});
      }
    }
    if (remaining !== null && remaining < 0 && !isPaid && !['annule', 'annulee'].includes(status)) {
      pushWorkflowAction(data, {
        origine: 'Facture',
        source: ref,
        type: 'corrective',
        objet: `Relancer la facture en retard ${ref} - ${record.client_nom || 'client'}`,
        responsable: record.responsable || 'Responsable des offres',
        processus: 'Recouvrement',
        priorite: 'haute',
        justification: 'Facture arrivee a echeance sans statut paye.'
      });
      pushWorkflowNotification(data, {
        id: `workflow-facture-${record.id}`,
        title: 'Facture en retard',
        message: `${ref} est en retard de ${Math.abs(remaining)} jour(s).`,
        path: '/factures',
        targetRole: 'responsable_appel',
        tone: 'offline',
        source: ref,
        justification: 'Recouvrement automatique des factures echues.'
      });
    }
  }

  if (resource === 'signaturesElectroniques') {
    const status = String(record.statut || '').toLowerCase();
    if (['signe', 'signee', 'valide'].includes(status)) {
      data.documentsQualite = (data.documentsQualite || []).map((document) => {
        const documentLabel = String(document.reference || document.titre || '').toLowerCase();
        const signedLabel = String(record.document || '').toLowerCase();
        if (!documentLabel.includes(signedLabel) && !signedLabel.includes(documentLabel)) return document;
        const updated = { ...document, signature_reference: ref, signe_par: record.signataire || document.signe_par, date_signature: record.date_signature || new Date().toISOString().slice(0, 10) };
        upsertRemote('documentsQualite', updated).catch(() => {});
        return updated;
      });
      pushWorkflowNotification(data, {
        id: `workflow-signature-${record.id}`,
        title: 'Signature electronique validee',
        message: `${record.document || ref} signe par ${record.signataire || 'signataire'}.`,
        path: '/signatures-electroniques',
        targetRole: 'responsable_technique',
        tone: 'online',
        source: ref,
        justification: 'Signature horodatee ajoutee a la piste de preuve.'
      });
    }
  }

  if (resource === 'portailClient') {
    const status = String(record.statut || '').toLowerCase();
    if (action === 'creation' && ['nouvelle', 'ouverte', 'demande', 'soumise', 'en_attente'].includes(status || 'demande')) {
      const existingDemand = (data.demandesPrestations || []).some((item) => item.source_portail === ref);
      if (!existingDemand) {
        const demand = {
          id: `dpr-${Date.now()}-${Math.random().toString(16).slice(2)}`,
          reference: workflowReference(data, 'demandesPrestations', 'DPR'),
          source_portail: ref,
          client_nom: record.client_nom || '',
          contact: record.canal || '',
          projet: record.rapport || '',
          besoin: record.demande || 'Demande client via portail',
          canal: record.canal || 'portail',
          responsable: 'Responsable des offres',
          statut: 'ouverte'
        };
        data.demandesPrestations = [...(data.demandesPrestations || []), demand];
        upsertRemote('demandesPrestations', demand).catch(() => {});
      }
    }
    if (['devis_valide', 'valide', 'rapport_telecharge', 'commande_creee'].includes(status)) {
      pushWorkflowNotification(data, {
        id: `workflow-portail-client-${record.id}`,
        title: 'Activite portail client',
        message: `${record.client_nom || 'Client'}: ${record.statut || 'activite portail'}.`,
        path: '/portail-client',
        targetRole: 'responsable_appel',
        tone: 'online',
        source: ref,
        justification: 'Activite client suivie automatiquement dans le portail.'
      });
    }
  }

  if (resource === 'portailFournisseur') {
    const status = String(record.statut || '').toLowerCase();
    if (['offre_recue', 'deposee', 'facture_recue', 'livraison_confirmee'].includes(status)) {
      pushWorkflowNotification(data, {
        id: `workflow-portail-fournisseur-${record.id}`,
        title: 'Activite fournisseur',
        message: `${record.fournisseur || 'Fournisseur'}: ${record.statut || 'nouvelle activite'}.`,
        path: '/portail-fournisseur',
        targetRole: 'responsable_labo',
        tone: 'info',
        source: ref,
        justification: 'Reponse fournisseur centralisee pour achats et approvisionnements.'
      });
    }
  }

  if (resource === 'analyseDocumentaireIA') {
    const hasFindings = Boolean(record.constats || record.actions_suggerees);
    if (hasFindings && !['cloture', 'valide'].includes(String(record.statut || '').toLowerCase())) {
      pushWorkflowAction(data, {
        origine: 'Analyse documentaire IA',
        source: ref,
        type: 'amelioration',
        objet: `Verifier les constats documentaires ${ref} - ${record.document || 'document'}`,
        responsable: record.responsable || 'Responsable Qualite',
        processus: 'Maitrise documentaire',
        priorite: 'moyenne',
        justification: 'L analyse documentaire propose des actions qui doivent etre validees humainement.'
      });
      pushWorkflowNotification(data, {
        id: `workflow-analyse-ia-${record.id}`,
        title: 'Analyse documentaire a valider',
        message: `${record.document || ref}: constats/actions detectes.`,
        path: '/analyse-documentaire-ia',
        targetRole: 'responsable_technique',
        tone: 'info',
        source: ref,
        justification: 'L assistant IA ne cloture rien seul: validation responsable requise.'
      });
    }
  }
  if (resource === 'moteursSysteme') {
    pushWorkflowNotification(data, {
      id: `workflow-moteur-${record.id}`,
      title: 'Regle systeme configuree',
      message: `${record.moteur || 'Moteur'}: ${record.regle || ref}`,
      path: '/moteurs-systeme',
      targetRole: 'dg',
      tone: 'info',
      source: ref,
      justification: 'Nouvelle regle ou automatisation TESTLAB documentee.'
    });
  }
}

async function upsertRemote(resource, record) {
  const response = await fetch(`${SUPABASE_URL}/rest/v1/${tableForResource(resource)}`, {
    method: 'POST',
    headers: headers({ Prefer: 'resolution=merge-duplicates,return=representation' }),
    body: JSON.stringify(USE_TYPED_TABLES ? {
      id: record.id,
      payload: record,
      updated_at: new Date().toISOString()
    } : {
      id: record.id,
      resource,
      payload: record,
      updated_at: new Date().toISOString()
    })
  });
  if (!response.ok) throw new Error(await response.text());
  return response.json();
}

async function seedRemoteResource(resource) {
  const records = seedData[resource] || [];
  if (records.length === 0) return;
  await Promise.all(records.map((record) => upsertRemote(resource, record)));
}

export async function listRecords(resource) {
  try {
    const response = await fetch(resourceUrl(resource), { headers: headers() });
    if (!response.ok) throw new Error(await response.text());
    const rows = await response.json();
    if (rows.length === 0 && (seedData[resource] || []).length > 0) {
      await seedRemoteResource(resource);
      return listRecords(resource);
    }
    const records = rows.map((row) => row.payload);
    saveLocalResource(resource, records);
    emitStatus('online', 'Base Supabase connectee');
    return records;
  } catch (error) {
    console.warn('Supabase indisponible, fallback local:', error);
    emitStatus('offline', 'Mode local - creez la table smartlab_records dans Supabase');
    return loadData()[resource] || [];
  }
}

export async function upsertRecord(resource, record) {
  const nextRecord = {
    ...record,
    id: record.id || `${resource.slice(0, 3)}-${Date.now()}`
  };

  const data = loadData();
  const records = data[resource] || [];
  const previous = records.find((item) => item.id === nextRecord.id) || null;
  const exists = Boolean(previous);
  data[resource] = exists
    ? records.map((item) => (item.id === nextRecord.id ? nextRecord : item))
    : [...records, nextRecord];
  appendAuditLog(data, resource, exists ? 'modification' : 'creation', nextRecord, previous);
  runWorkflowAutomations(data, resource, exists ? 'modification' : 'creation', nextRecord);
  syncWorkflowNotifications(data);
  saveData(data);

  try {
    await upsertRemote(resource, nextRecord);
    emitStatus('online', 'Modification synchronisee avec Supabase');
  } catch (error) {
    console.warn('Ecriture Supabase echouee:', error);
    const message = error?.message || 'Ecriture Supabase echouee';
    emitStatus('offline', `Enregistre localement - ${message}`);
    return { ...nextRecord, __syncError: message };
  }

  return nextRecord;
}

export async function deleteRecord(resource, id) {
  const data = loadData();
  const previous = (data[resource] || []).find((item) => item.id === id) || null;
  data[resource] = (data[resource] || []).filter((item) => item.id !== id);
  appendAuditLog(data, resource, 'suppression', previous || { id }, previous);
  saveData(data);

  try {
    const response = await fetch(rowUrl(resource, id), { method: 'DELETE', headers: headers() });
    if (!response.ok) throw new Error(await response.text());
    emitStatus('online', 'Suppression synchronisee avec Supabase');
  } catch (error) {
    console.warn('Suppression Supabase echouee:', error);
    emitStatus('offline', 'Suppression locale - Supabase non pret');
  }
}

export async function getStats() {
  const resources = ['clients', 'essais', 'devis', 'commandes', 'factures', 'projets', 'nonConformites', 'reclamations', 'achatsApprovisionnement', 'satisfactionClients', 'equipements', 'personnel', 'notifications', 'catalogueEssais', 'resultatsEssais', 'documentsQualite', 'actionsQualite', 'risquesOpportunites', 'revuesDirection', 'consommablesStocks', 'contrats', 'signaturesElectroniques', 'portailClient', 'portailFournisseur', 'analyseDocumentaireIA', 'gouvernance', 'demandesPrestations', 'missionsTerrain', 'planningProjets', 'competencesFormations', 'metrologieAvancee', 'financesAvancees', 'objectifsQualite', 'moteursSysteme', 'auditLogs'];
  const entries = await Promise.all(resources.map(async (resource) => [resource, await listRecords(resource)]));
  const data = Object.fromEntries(entries);
  return {
    clients: data.clients.length,
    essaisEnCours: data.essais.filter((item) => item.statut === 'en_cours').length,
    devisOuverts: data.devis.filter((item) => item.statut !== 'paye').length,
    commandesActives: data.commandes.filter((item) => item.statut !== 'livree').length,
    nonConformites: data.nonConformites.filter((item) => item.statut !== 'cloturee').length,
    reclamations: data.reclamations.filter((item) => item.statut !== 'cloturee').length,
    equipements: data.equipements.length,
    habilitations: data.personnel.filter((item) => item.habilitation === 'active').length,
    chiffreAffaires: data.commandes.reduce((sum, item) => sum + Number(item.montant_ht || 0), 0)
  };
}








