const STORAGE_KEY = 'smartlab_mobile_records_v2';
const SUPABASE_URL = process.env.REACT_APP_SUPABASE_URL || 'https://xyfhlgdyzxxvhryjvqcm.supabase.co';
const SUPABASE_KEY = process.env.REACT_APP_SUPABASE_KEY || 'sb_publishable_EmGwHAduz7UAe5h_YvizNw_iz7AADmR';
const SUPABASE_TABLE = process.env.REACT_APP_SUPABASE_TABLE || 'smartlab_records';

const today = new Date().toISOString().slice(0, 10);

const seedData = {
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
    { id: 'docq-1', reference: 'PRO-2026-001', titre: 'Procedure de reception des objets d essais', type: 'procedure', statut: 'en_vigueur', version: '01', processus: 'Reception', responsable: 'Responsable Qualite', date_application: today, date_revision: today, objet: 'Definir les controles a effectuer a la reception.', contenu: 'Identification, verification de conformite, codification, enregistrement et transmission au laboratoire.', lien_document: 'PRO-Reception-Objets-Essais.pdf', observation: '' },
    { id: 'docq-2', reference: 'FIC-2026-001', titre: 'Fiche de reception objet d essai', type: 'fiche', statut: 'en_vigueur', version: '01', processus: 'Reception', responsable: 'Receptionniste', date_application: today, date_revision: today, objet: 'Support de saisie des informations de reception.', contenu: 'Client, nature, provenance, date de prelevement, essais demandes, observations et signature.', lien_document: 'FIC-Reception-Objet-Essai.docx', observation: '' },
    { id: 'docq-3', reference: 'PRO-2025-001', titre: 'Ancienne procedure devis client', type: 'procedure', statut: 'perime', version: '00', processus: 'Commercial', responsable: 'Responsable des offres', date_application: today, date_revision: today, objet: 'Ancienne methode de revue et emission des devis.', contenu: 'Document remplace par le circuit de validation RT/DG/client.', lien_document: 'Archive-PRO-Devis-Client.pdf', observation: 'Remplacee par PRO-2026-002.' }
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

function resourceUrl(resource) {
  return `${SUPABASE_URL}/rest/v1/${SUPABASE_TABLE}?resource=eq.${encodeURIComponent(resource)}&select=id,resource,payload,updated_at&order=id.asc`;
}

function rowUrl(id) {
  return `${SUPABASE_URL}/rest/v1/${SUPABASE_TABLE}?id=eq.${encodeURIComponent(id)}`;
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

async function upsertRemote(resource, record) {
  const response = await fetch(`${SUPABASE_URL}/rest/v1/${SUPABASE_TABLE}`, {
    method: 'POST',
    headers: headers({ Prefer: 'resolution=merge-duplicates,return=representation' }),
    body: JSON.stringify({
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
  const exists = records.some((item) => item.id === nextRecord.id);
  data[resource] = exists
    ? records.map((item) => (item.id === nextRecord.id ? nextRecord : item))
    : [...records, nextRecord];
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
  data[resource] = (data[resource] || []).filter((item) => item.id !== id);
  saveData(data);

  try {
    const response = await fetch(rowUrl(id), { method: 'DELETE', headers: headers() });
    if (!response.ok) throw new Error(await response.text());
    emitStatus('online', 'Suppression synchronisee avec Supabase');
  } catch (error) {
    console.warn('Suppression Supabase echouee:', error);
    emitStatus('offline', 'Suppression locale - Supabase non pret');
  }
}

export async function getStats() {
  const resources = ['clients', 'essais', 'devis', 'commandes', 'projets', 'nonConformites', 'reclamations', 'equipements', 'personnel', 'notifications', 'catalogueEssais', 'resultatsEssais', 'documentsQualite'];
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
