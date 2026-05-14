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
    { id: 'ess-1', numero: 'EA-2026-051', type_essai: 'Beton - Rc28', client_nom: 'Sogea BTP Benin', echantillon: 'ECH-051', technicien: 'A. Cisse', statut: 'en_cours', priorite: 'haute', date: today },
    { id: 'ess-2', numero: 'EA-2026-050', type_essai: 'Proctor modifie', client_nom: 'AGETUR Benin', echantillon: 'ECH-050', technicien: 'R. Dossou', statut: 'termine', priorite: 'normale', date: today },
    { id: 'ess-3', numero: 'EA-2026-049', type_essai: 'Analyse eau', client_nom: 'MAEP', echantillon: 'ECH-049', technicien: 'C. Adoho', statut: 'en_attente', priorite: 'normale', date: today }
  ],
  devis: [
    { id: 'dev-1', numero: 'DEV-2026-031', client_nom: 'Sogea BTP Benin', client_whatsapp: '+229 97 12 34 56', objet: 'Pont Cotonou - 24 essais beton', montant_ht: 1850000, date: today, statut: 'envoye' },
    { id: 'dev-2', numero: 'FAC-2026-028', client_nom: 'AGETUR Benin', client_whatsapp: '+229 95 67 89 01', objet: 'Route nationale - essais sols', montant_ht: 1240000, date: today, statut: 'paye' }
  ],
  commandes: [
    { id: 'cmd-1', numero: 'CMD-2026-014', client_nom: 'Sogea BTP Benin', reference_devis: 'DEV-2026-031', objet: 'Campagne beton phase 2', date: today, statut: 'en_cours' },
    { id: 'cmd-2', numero: 'CMD-2026-013', client_nom: 'Colas Benin', reference_devis: 'FAC-2026-025', objet: 'Voirie Akpakpa', date: today, statut: 'livree' }
  ],
  echantillons: [
    { id: 'ech-1', code: 'ECH-051', client_nom: 'Sogea BTP Benin', nature: 'Beton C25', reception: today, statut: 'recu' },
    { id: 'ech-2', code: 'ECH-050', client_nom: 'AGETUR Benin', nature: 'Sol lateritique', reception: today, statut: 'en_essai' }
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
    { id: 'nc-1', reference: 'NC-2026-002', origine: 'Reception echantillon', description: 'Echantillon recu sans identification complete', responsable: 'Responsable Laboratoire', echeance: today, statut: 'ouverte' },
    { id: 'nc-2', reference: 'NC-2026-001', origine: 'Reclamation client', description: 'Demande de verification sur rapport transmis', responsable: 'Responsable Technique', echeance: today, statut: 'en_traitement' }
  ],
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
  return `${SUPABASE_URL}/rest/v1/${SUPABASE_TABLE}?resource=eq.${encodeURIComponent(resource)}&select=id,resource,payload,updated_at&order=updated_at.asc`;
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
  const resources = ['clients', 'essais', 'devis', 'commandes', 'nonConformites', 'equipements', 'personnel'];
  const entries = await Promise.all(resources.map(async (resource) => [resource, await listRecords(resource)]));
  const data = Object.fromEntries(entries);
  return {
    clients: data.clients.length,
    essaisEnCours: data.essais.filter((item) => item.statut === 'en_cours').length,
    devisOuverts: data.devis.filter((item) => item.statut !== 'paye').length,
    commandesActives: data.commandes.filter((item) => item.statut !== 'livree').length,
    nonConformites: data.nonConformites.filter((item) => item.statut !== 'cloturee').length,
    equipements: data.equipements.length,
    habilitations: data.personnel.filter((item) => item.habilitation === 'active').length,
    chiffreAffaires: data.devis.reduce((sum, item) => sum + Number(item.montant_ht || 0), 0)
  };
}
