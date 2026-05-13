const STORAGE_KEY = 'smartlab_mobile_records_v2';

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
    { id: 'dev-1', numero: 'DEV-2026-031', client_nom: 'Sogea BTP Benin', objet: 'Pont Cotonou - 24 essais beton', montant_ht: 1850000, date: today, statut: 'envoye' },
    { id: 'dev-2', numero: 'FAC-2026-028', client_nom: 'AGETUR Benin', objet: 'Route nationale - essais sols', montant_ht: 1240000, date: today, statut: 'paye' }
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
  ]
};

const clone = (value) => JSON.parse(JSON.stringify(value));

export function loadData() {
  const saved = localStorage.getItem(STORAGE_KEY);
  if (!saved) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(seedData));
    return clone(seedData);
  }
  return { ...clone(seedData), ...JSON.parse(saved) };
}

export function saveData(data) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  window.dispatchEvent(new CustomEvent('smartlab:data-changed'));
}

export function listRecords(resource) {
  return loadData()[resource] || [];
}

export function upsertRecord(resource, record) {
  const data = loadData();
  const records = data[resource] || [];
  const nextRecord = {
    ...record,
    id: record.id || `${resource.slice(0, 3)}-${Date.now()}`
  };
  const exists = records.some((item) => item.id === nextRecord.id);
  data[resource] = exists
    ? records.map((item) => (item.id === nextRecord.id ? nextRecord : item))
    : [nextRecord, ...records];
  saveData(data);
  return nextRecord;
}

export function deleteRecord(resource, id) {
  const data = loadData();
  data[resource] = (data[resource] || []).filter((item) => item.id !== id);
  saveData(data);
}

export function getStats() {
  const data = loadData();
  return {
    clients: data.clients.length,
    essaisEnCours: data.essais.filter((item) => item.statut === 'en_cours').length,
    devisOuverts: data.devis.filter((item) => item.statut !== 'paye').length,
    commandesActives: data.commandes.filter((item) => item.statut !== 'livree').length,
    chiffreAffaires: data.devis.reduce((sum, item) => sum + Number(item.montant_ht || 0), 0)
  };
}
