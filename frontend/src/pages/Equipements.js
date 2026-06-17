import React, { useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import { deleteRecord, listRecords, upsertRecord } from '../services/localStore';

const statusOptions = [
  { value: 'conforme', label: 'Conforme' },
  { value: 'a_surveiller', label: 'A surveiller' },
  { value: 'hors_service', label: 'Hors service' }
];

const emptyEquipment = {
  code: '',
  designation: '',
  famille: '',
  marque: '',
  modele: '',
  numero_serie: '',
  date_reception: '',
  date_mise_service: '',
  date_reforme: '',
  caracteristiques: '',
  dernier_etalonnage: '',
  prochain_etalonnage: '',
  statut: 'conforme'
};

const emptySignaletique = {
  dossier_administratif: '',
  designation: '',
  marque: '',
  modele: '',
  numero_serie: '',
  caracteristiques: '',
  divers: '',
  date_reception: '',
  date_mise_service: '',
  date_reforme: '',
  equipements_associes: '',
  associe_1_designation: '',
  associe_1_marque: '',
  associe_1_modele: '',
  associe_1_numero_serie: '',
  associe_1_caracteristiques: '',
  associe_2_designation: '',
  associe_2_marque: '',
  associe_2_modele: '',
  associe_2_numero_serie: '',
  associe_2_caracteristiques: '',
  etalonnage_reference: '',
  etalonnage_operation: '',
  etalonnage_periodicite: '',
  maintenance_reference: '',
  maintenance_operation: '',
  maintenance_periodicite: '',
  externe_etalonnage_ref_contrat: '',
  externe_etalonnage_societe: '',
  externe_etalonnage_adresse: '',
  externe_etalonnage_tel: '',
  externe_etalonnage_fax: '',
  externe_etalonnage_correspondant: '',
  externe_etalonnage_periodicite: '',
  externe_maintenance_ref_contrat: '',
  externe_maintenance_societe: '',
  externe_maintenance_adresse: '',
  externe_maintenance_tel: '',
  externe_maintenance_fax: '',
  externe_maintenance_correspondant: '',
  externe_maintenance_periodicite: '',
  matieres_consommables: '',
  pieces_detachees: '',
  produits_maintenance: ''
};

const emptyLifeSheet = {
  designation: '',
  type: '',
  marque: '',
  numero_serie: '',
  numero_interne: '',
  etat_reception: '',
  date_reception: '',
  date_mise_service: '',
  conditions_utilisation: '',
  intervalle_etalonnage: '',
  intervalle_verification: '',
  intervalle_maintenance: '',
  accessoires: '',
  accessoire_1_designation: '',
  accessoire_1_numero_identification: '',
  accessoire_1_incertitudes_etalonnage: '',
  accessoire_1_points_etalonnage: '',
  accessoire_2_designation: '',
  accessoire_2_numero_identification: '',
  accessoire_2_incertitudes_etalonnage: '',
  accessoire_2_points_etalonnage: '',
  accessoire_3_designation: '',
  accessoire_3_numero_identification: '',
  accessoire_3_incertitudes_etalonnage: '',
  accessoire_3_points_etalonnage: '',
  interventions: '',
  intervention_1_numero: '',
  intervention_1_nature: '',
  intervention_1_references_moyens: '',
  intervention_1_reference_document: '',
  intervention_1_date: '',
  intervention_1_prochaine_date: '',
  intervention_1_affectation: '',
  intervention_1_intervenant: '',
  intervention_1_reference_rapport: '',
  intervention_1_resultats_observations: '',
  intervention_1_visa_responsable_metrologie: '',
  intervention_2_numero: '',
  intervention_2_nature: '',
  intervention_2_references_moyens: '',
  intervention_2_reference_document: '',
  intervention_2_date: '',
  intervention_2_prochaine_date: '',
  intervention_2_affectation: '',
  intervention_2_intervenant: '',
  intervention_2_reference_rapport: '',
  intervention_2_resultats_observations: '',
  intervention_2_visa_responsable_metrologie: '',
  intervention_3_numero: '',
  intervention_3_nature: '',
  intervention_3_references_moyens: '',
  intervention_3_reference_document: '',
  intervention_3_date: '',
  intervention_3_prochaine_date: '',
  intervention_3_affectation: '',
  intervention_3_intervenant: '',
  intervention_3_reference_rapport: '',
  intervention_3_resultats_observations: '',
  intervention_3_visa_responsable_metrologie: ''
};

const emptyDocument = {
  type: 'Certificat',
  titre: '',
  reference: '',
  date_document: '',
  lien: '',
  observation: ''
};

const signaletiqueMainFields = [
  ['dossier_administratif', 'Dossier administratif N'],
  ['designation', 'Designation'],
  ['marque', 'Marque'],
  ['modele', 'Modele'],
  ['numero_serie', 'N de serie'],
  ['date_reception', 'Date de reception', 'date'],
  ['date_mise_service', 'Date de mise en service', 'date'],
  ['date_reforme', 'Date de reforme', 'date'],
  ['caracteristiques', 'Caracteristiques', 'textarea'],
  ['divers', 'Divers', 'textarea']
];

const signaletiqueInternalFields = [
  ['etalonnage_reference', 'Reference procedure'],
  ['etalonnage_operation', 'Operation etalonnage / verification'],
  ['etalonnage_periodicite', 'Periodicite etalonnage / verification'],
  ['maintenance_reference', 'N fiche maintenance'],
  ['maintenance_operation', 'Operation maintenance preventive'],
  ['maintenance_periodicite', 'Periodicite maintenance preventive']
];

const consumableFields = [
  ['matieres_consommables', 'Matieres consommables'],
  ['pieces_detachees', 'Pieces detachees'],
  ['produits_maintenance', 'Produits de maintenance']
];

const lifeMainFields = [
  ['designation', 'Designation'],
  ['type', 'Type'],
  ['marque', 'Marque'],
  ['numero_serie', 'N de serie'],
  ['numero_interne', 'N identification interne'],
  ['etat_reception', 'Etat de l equipement a la reception'],
  ['date_reception', 'Date de reception', 'date'],
  ['date_mise_service', 'Date de mise en service', 'date'],
  ['conditions_utilisation', 'Conditions particulieres d utilisation', 'textarea'],
  ['intervalle_etalonnage', 'Intervalle entre deux etalonnages'],
  ['intervalle_verification', 'Intervalle entre deux verifications metrologiques'],
  ['intervalle_maintenance', 'Intervalle entre deux maintenances']
];

function escapeHtml(value) {
  return String(value || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function today() {
  return new Date().toISOString().slice(0, 10);
}

function nextEquipmentCode(records) {
  const max = records.reduce((highest, record) => {
    const match = String(record.code || '').match(/^EQ-(\d+)$/i);
    return match ? Math.max(highest, Number(match[1])) : highest;
  }, 0);
  return `EQ-${String(max + 1).padStart(3, '0')}`;
}

function normalizeEquipment(record) {
  return {
    ...emptyEquipment,
    ...record,
    signaletique: { ...emptySignaletique, ...(record.signaletique || {}) },
    fiche_vie: { ...emptyLifeSheet, ...(record.fiche_vie || {}) },
    documents: Array.isArray(record.documents) ? record.documents : []
  };
}

function compareEquipments(a, b) {
  return String(a.code || '').localeCompare(String(b.code || ''), 'fr', {
    numeric: true,
    sensitivity: 'base'
  });
}

function statusLabel(value) {
  return statusOptions.find((option) => option.value === value)?.label || value || '-';
}

function signaletiqueAssociatedRows(data) {
  return getSignaletiqueAssociatedLines(data).map((line) => `
    <tr>
      <td>${escapeHtml(line.designation)}</td>
      <td>${escapeHtml(line.marque)}</td>
      <td>${escapeHtml(line.modele)}</td>
      <td>${escapeHtml(line.numero_serie)}</td>
      <td>${escapeHtml(line.caracteristiques)}</td>
    </tr>
  `).join('');
}

function signaletiqueExternalRows(data) {
  return getSignaletiqueExternalLines(data).map((line) => `
    <tr>
      <td>${escapeHtml(line.type)}</td>
      <td>${escapeHtml(line.ref_contrat)}</td>
      <td>${escapeHtml(line.societe)}</td>
      <td>${escapeHtml(line.adresse)}</td>
      <td>${escapeHtml(line.tel)}</td>
      <td>${escapeHtml(line.fax)}</td>
      <td>${escapeHtml(line.correspondant)}</td>
      <td>${escapeHtml(line.periodicite)}</td>
    </tr>
  `).join('');
}

function lifeAccessoryRows(data) {
  return getLifeAccessoryLines(data).map((line) => `
    <tr>
      <td>${escapeHtml(line.designation)}</td>
      <td>${escapeHtml(line.numero_identification)}</td>
      <td>${escapeHtml(line.incertitudes_etalonnage)}</td>
      <td>${escapeHtml(line.points_etalonnage)}</td>
    </tr>
  `).join('');
}

function lifeInterventionRows(data) {
  return getLifeInterventionLines(data).map((line) => `
    <tr>
      <td>${escapeHtml(line.numero)}</td>
      <td>${escapeHtml(line.nature)}</td>
      <td>${escapeHtml(line.references_moyens)}</td>
      <td>${escapeHtml(line.reference_document)}</td>
      <td>${escapeHtml(line.date)}</td>
      <td>${escapeHtml(line.prochaine_date)}</td>
      <td>${escapeHtml(line.affectation)}</td>
      <td>${escapeHtml(line.intervenant)}</td>
      <td>${escapeHtml(line.reference_rapport)}</td>
      <td>${escapeHtml(line.resultats_observations)}</td>
      <td>${escapeHtml(line.visa_responsable_metrologie)}</td>
    </tr>
  `).join('');
}

function hasRowValue(row) {
  return Object.values(row).some((value) => String(value || '').trim());
}

function getSignaletiqueAssociatedLines(data = {}) {
  if (Array.isArray(data.equipements_associes_lignes)) return data.equipements_associes_lignes;
  return [1, 2].map((index) => ({
    designation: data[`associe_${index}_designation`] || '',
    marque: data[`associe_${index}_marque`] || '',
    modele: data[`associe_${index}_modele`] || '',
    numero_serie: data[`associe_${index}_numero_serie`] || '',
    caracteristiques: data[`associe_${index}_caracteristiques`] || ''
  })).filter(hasRowValue);
}

function getSignaletiqueExternalLines(data = {}) {
  if (Array.isArray(data.prestataires_externes_lignes)) return data.prestataires_externes_lignes;
  return [
    {
      type: 'Etalonnage / Verification',
      ref_contrat: data.externe_etalonnage_ref_contrat || '',
      societe: data.externe_etalonnage_societe || '',
      adresse: data.externe_etalonnage_adresse || '',
      tel: data.externe_etalonnage_tel || '',
      fax: data.externe_etalonnage_fax || '',
      correspondant: data.externe_etalonnage_correspondant || '',
      periodicite: data.externe_etalonnage_periodicite || ''
    },
    {
      type: 'Maintenance preventive',
      ref_contrat: data.externe_maintenance_ref_contrat || '',
      societe: data.externe_maintenance_societe || '',
      adresse: data.externe_maintenance_adresse || '',
      tel: data.externe_maintenance_tel || '',
      fax: data.externe_maintenance_fax || '',
      correspondant: data.externe_maintenance_correspondant || '',
      periodicite: data.externe_maintenance_periodicite || ''
    }
  ].filter(hasRowValue);
}

function getLifeAccessoryLines(data = {}) {
  if (Array.isArray(data.accessoire_lignes)) return data.accessoire_lignes;
  return [1, 2, 3].map((index) => ({
    designation: data[`accessoire_${index}_designation`] || '',
    numero_identification: data[`accessoire_${index}_numero_identification`] || '',
    incertitudes_etalonnage: data[`accessoire_${index}_incertitudes_etalonnage`] || '',
    points_etalonnage: data[`accessoire_${index}_points_etalonnage`] || ''
  })).filter(hasRowValue);
}

function getLifeInterventionLines(data = {}) {
  if (Array.isArray(data.intervention_lignes)) return data.intervention_lignes;
  return [1, 2, 3].map((index) => ({
    numero: data[`intervention_${index}_numero`] || '',
    nature: data[`intervention_${index}_nature`] || '',
    references_moyens: data[`intervention_${index}_references_moyens`] || '',
    reference_document: data[`intervention_${index}_reference_document`] || '',
    date: data[`intervention_${index}_date`] || '',
    prochaine_date: data[`intervention_${index}_prochaine_date`] || '',
    affectation: data[`intervention_${index}_affectation`] || '',
    intervenant: data[`intervention_${index}_intervenant`] || '',
    reference_rapport: data[`intervention_${index}_reference_rapport`] || '',
    resultats_observations: data[`intervention_${index}_resultats_observations`] || '',
    visa_responsable_metrologie: data[`intervention_${index}_visa_responsable_metrologie`] || ''
  })).filter(hasRowValue);
}

function normalizeSheetRows(mode, data) {
  if (mode === 'signaletique') {
    return {
      ...data,
      equipements_associes_lignes: getSignaletiqueAssociatedLines(data),
      prestataires_externes_lignes: getSignaletiqueExternalLines(data)
    };
  }
  return {
    ...data,
    accessoire_lignes: getLifeAccessoryLines(data),
    intervention_lignes: getLifeInterventionLines(data)
  };
}

export default function Equipements() {
  const [records, setRecords] = useState([]);
  const [selectedId, setSelectedId] = useState('');
  const [equipmentFormOpen, setEquipmentFormOpen] = useState(false);
  const [equipmentForm, setEquipmentForm] = useState(emptyEquipment);
  const [sheetMode, setSheetMode] = useState('');
  const [sheetForm, setSheetForm] = useState({});
  const [documentFormOpen, setDocumentFormOpen] = useState(false);
  const [documentForm, setDocumentForm] = useState(emptyDocument);
  const [loading, setLoading] = useState(true);

  const refresh = async () => {
    setLoading(true);
    const items = await listRecords('equipements');
    setRecords(items.map(normalizeEquipment).sort(compareEquipments));
    setLoading(false);
  };

  useEffect(() => {
    refresh();
    const reload = () => refresh();
    window.addEventListener('smartlab:data-changed', reload);
    return () => window.removeEventListener('smartlab:data-changed', reload);
  }, []);

  const selectedEquipment = useMemo(
    () => records.find((record) => record.id === selectedId),
    [records, selectedId]
  );

  const closeEquipmentFolder = () => {
    setSelectedId('');
    setSheetMode('');
    setDocumentFormOpen(false);
    setDocumentForm(emptyDocument);
  };

  const closeEquipmentSubFolder = () => {
    setSheetMode('');
    setDocumentFormOpen(false);
    setDocumentForm(emptyDocument);
  };

  const closeEquipmentForm = () => {
    setEquipmentFormOpen(false);
    setEquipmentForm(emptyEquipment);
  };

  const openCreateEquipment = () => {
    setEquipmentForm({
      ...emptyEquipment,
      code: nextEquipmentCode(records),
      date_reception: today(),
      date_mise_service: today()
    });
    setEquipmentFormOpen(true);
  };

  const updateEquipmentField = (name, value) => {
    setEquipmentForm((current) => ({ ...current, [name]: value }));
  };

  const saveEquipment = async (event) => {
    event.preventDefault();
    const payload = normalizeEquipment({
      ...equipmentForm,
      id: equipmentForm.id || `eq-${Date.now()}`,
      signaletique: {
        ...emptySignaletique,
        designation: equipmentForm.designation,
        marque: equipmentForm.marque,
        modele: equipmentForm.modele,
        numero_serie: equipmentForm.numero_serie,
        caracteristiques: equipmentForm.caracteristiques,
        date_reception: equipmentForm.date_reception,
        date_mise_service: equipmentForm.date_mise_service,
        date_reforme: equipmentForm.date_reforme
      },
      fiche_vie: {
        ...emptyLifeSheet,
        designation: equipmentForm.designation,
        type: equipmentForm.famille,
        marque: equipmentForm.marque,
        numero_serie: equipmentForm.numero_serie,
        numero_interne: equipmentForm.code,
        date_reception: equipmentForm.date_reception,
        date_mise_service: equipmentForm.date_mise_service
      },
      documents: []
    });
    const saved = await upsertRecord('equipements', payload);
    if (saved.__syncError) {
      toast.error(`Enregistre localement, mais pas dans Supabase: ${saved.__syncError}`);
    } else {
      toast.success('Equipement ajoute dans Supabase');
    }
    setEquipmentFormOpen(false);
    setSelectedId(payload.id);
    await refresh();
  };

  const saveSelectedEquipment = async (updated, successMessage) => {
    const saved = await upsertRecord('equipements', normalizeEquipment(updated));
    if (saved.__syncError) {
      toast.error(`Enregistre localement, mais pas dans Supabase: ${saved.__syncError}`);
    } else {
      toast.success(successMessage);
    }
    await refresh();
  };

  const openSheet = (mode) => {
    if (!selectedEquipment) return;
    setSheetMode(mode);
    setSheetForm(normalizeSheetRows(mode, mode === 'signaletique' ? selectedEquipment.signaletique : selectedEquipment.fiche_vie));
  };

  const updateSheetField = (name, value) => {
    setSheetForm((current) => ({ ...current, [name]: value }));
  };

  const addSheetRow = (collection, row) => {
    setSheetForm((current) => ({
      ...current,
      [collection]: [...(Array.isArray(current[collection]) ? current[collection] : []), row]
    }));
  };

  const updateSheetRow = (collection, index, name, value) => {
    setSheetForm((current) => ({
      ...current,
      [collection]: (Array.isArray(current[collection]) ? current[collection] : []).map((row, rowIndex) => (
        rowIndex === index ? { ...row, [name]: value } : row
      ))
    }));
  };

  const removeSheetRow = (collection, index) => {
    setSheetForm((current) => ({
      ...current,
      [collection]: (Array.isArray(current[collection]) ? current[collection] : []).filter((_, rowIndex) => rowIndex !== index)
    }));
  };

  const saveSheet = async (event) => {
    event.preventDefault();
    if (!selectedEquipment) return;
    const key = sheetMode === 'signaletique' ? 'signaletique' : 'fiche_vie';
    await saveSelectedEquipment({
      ...selectedEquipment,
      [key]: sheetForm
    }, sheetMode === 'signaletique' ? 'Fiche signaletique enregistree' : 'Fiche de vie enregistree');
    setSheetMode('');
  };

  const openDocumentForm = () => {
    setDocumentForm({ ...emptyDocument, date_document: today() });
    setDocumentFormOpen(true);
  };

  const saveDocument = async (event) => {
    event.preventDefault();
    if (!selectedEquipment) return;
    await saveSelectedEquipment({
      ...selectedEquipment,
      documents: [
        ...(selectedEquipment.documents || []),
        { ...documentForm, id: `doc-${Date.now()}` }
      ]
    }, 'Document ajoute au dossier equipement');
    setDocumentFormOpen(false);
  };

  const removeDocument = async (documentId) => {
    if (!selectedEquipment) return;
    await saveSelectedEquipment({
      ...selectedEquipment,
      documents: selectedEquipment.documents.filter((item) => item.id !== documentId)
    }, 'Document retire du dossier');
  };

  const removeEquipment = async (record) => {
    if (!window.confirm(`Supprimer le dossier ${record.code} - ${record.designation} ?`)) return;
    await deleteRecord('equipements', record.id);
    toast.success('Dossier equipement supprime');
    if (selectedId === record.id) setSelectedId('');
    await refresh();
  };

  const openPrintWindow = (html, blockedMessage = 'Fenetre PDF bloquee par le navigateur') => {
    const doc = window.open('', '_blank');
    if (!doc) {
      toast.error(blockedMessage);
      return;
    }
    doc.document.write(html);
    doc.document.close();
    doc.focus();
    setTimeout(() => doc.print(), 450);
  };

  const generateEquipmentList = () => {
    const rows = records.map((record) => `
      <tr>
        <td>${escapeHtml(record.designation)}</td>
        <td>${escapeHtml(record.code)}</td>
      </tr>
    `).join('');
    openPrintWindow(`
      <!doctype html>
      <html lang="fr">
        <head>
          <meta charset="utf-8" />
          <title>Liste des equipements</title>
          <style>
            body { color: #111827; font-family: Arial, sans-serif; margin: 30px; }
            header { border-bottom: 3px solid #2563eb; margin-bottom: 22px; padding-bottom: 14px; }
            h1 { font-size: 24px; margin: 0; }
            p { color: #64748b; margin: 6px 0 0; }
            table { border-collapse: collapse; width: 100%; }
            th, td { border: 1px solid #dbe4f0; padding: 10px; text-align: left; }
            th { background: #f1f5f9; color: #334155; }
            footer { color: #64748b; font-size: 11px; margin-top: 24px; }
          </style>
        </head>
        <body>
          <header>
            <h1>TESTLAB - Liste des equipements</h1>
            <p>${records.length} equipement(s) - ${new Date().toLocaleDateString('fr-FR')}</p>
          </header>
          <table>
            <thead><tr><th>Nom de l'equipement</th><th>Code d'identification</th></tr></thead>
            <tbody>${rows || '<tr><td colspan="2">Aucun equipement</td></tr>'}</tbody>
          </table>
          <footer>Document genere depuis TESTLAB.</footer>
        </body>
      </html>
    `);
  };

  const generateSignaletique = (record) => {
    const data = record.signaletique || {};
    openPrintWindow(`
      <!doctype html>
      <html lang="fr">
        <head>
          <meta charset="utf-8" />
          <title>Fiche signaletique ${escapeHtml(record.code)}</title>
          <style>
            body { color: #111827; font-family: Arial, sans-serif; margin: 22px; }
            header { align-items: center; border: 1px solid #111827; display: grid; grid-template-columns: 150px 1fr 150px; margin-bottom: 20px; min-height: 70px; text-align: center; }
            header div { border-right: 1px solid #111827; height: 100%; padding: 10px; }
            header div:last-child { border-right: 0; font-size: 12px; text-align: left; }
            h1 { font-size: 18px; margin: 14px 0; }
            table { border-collapse: collapse; font-size: 12px; width: 100%; }
            th, td { border: 1px solid #111827; padding: 7px; text-align: left; vertical-align: top; }
            th { background: #f3f4f6; text-transform: uppercase; }
            .grid td { height: 28px; }
            footer { color: #475569; font-size: 10px; margin-top: 24px; text-align: center; }
          </style>
        </head>
        <body>
          <header>
            <div><strong>TESTLAB</strong><br />Laboratoire Geotechnique</div>
            <h1>FICHE SIGNALETIQUE</h1>
            <div>Ref: FIC-20<br />Version: 01<br />du ${new Date().toLocaleDateString('fr-FR')}</div>
          </header>
          <p><strong>Dossier administratif N:</strong> ${escapeHtml(data.dossier_administratif || record.code)}</p>
          <table class="grid">
            <tbody>
              <tr><th colspan="4">References de l'equipement</th></tr>
              <tr><td>Designation</td><td>${escapeHtml(data.designation || record.designation)}</td><td>Date de reception</td><td>${escapeHtml(data.date_reception || record.date_reception)}</td></tr>
              <tr><td>Marque</td><td>${escapeHtml(data.marque || record.marque)}</td><td>Date de mise en service</td><td>${escapeHtml(data.date_mise_service || record.date_mise_service)}</td></tr>
              <tr><td>Modele</td><td>${escapeHtml(data.modele || record.modele)}</td><td>Date de reforme</td><td>${escapeHtml(data.date_reforme || record.date_reforme)}</td></tr>
              <tr><td>N de serie</td><td>${escapeHtml(data.numero_serie || record.numero_serie)}</td><td>Caracteristiques</td><td>${escapeHtml(data.caracteristiques || record.caracteristiques)}</td></tr>
              <tr><th colspan="4">Divers</th></tr>
              <tr><td colspan="4">${escapeHtml(data.divers)}</td></tr>
            </tbody>
          </table>
          <table class="grid">
            <tbody>
              <tr><th colspan="5">Autres equipements associes</th></tr>
              <tr><td>Designation</td><td>Marque</td><td>Modele</td><td>N de serie</td><td>Caracteristiques</td></tr>
              ${signaletiqueAssociatedRows(data)}
              ${data.equipements_associes ? `<tr><td colspan="5">${escapeHtml(data.equipements_associes)}</td></tr>` : ''}
            </tbody>
          </table>
          <table class="grid">
            <tbody>
              <tr><th colspan="4">Interventions internes</th></tr>
              <tr><th colspan="2">Etalonnage / Verification</th><th colspan="2">Maintenance preventive</th></tr>
              <tr><td>Reference procedure</td><td>${escapeHtml(data.etalonnage_reference)}</td><td>N fiche maintenance</td><td>${escapeHtml(data.maintenance_reference)}</td></tr>
              <tr><td>Operation a effectuer</td><td>${escapeHtml(data.etalonnage_operation)}</td><td>Operation a effectuer</td><td>${escapeHtml(data.maintenance_operation)}</td></tr>
              <tr><td>Periodicite</td><td>${escapeHtml(data.etalonnage_periodicite)}</td><td>Periodicite</td><td>${escapeHtml(data.maintenance_periodicite)}</td></tr>
              <tr><th colspan="4">Interventions externes</th></tr>
            </tbody>
          </table>
          <table class="grid">
            <tbody>
              <tr><th>Type</th><th>Ref contrat</th><th>Societe</th><th>Adresse</th><th>Tel</th><th>Fax</th><th>Correspondant</th><th>Periodicite</th></tr>
              ${signaletiqueExternalRows(data)}
              <tr><th colspan="4">Matieres consommables / pieces detachees / produits de maintenance</th></tr>
            </tbody>
          </table>
          <table class="grid">
            <tbody>
              <tr><td>Matieres consommables</td><td>${escapeHtml(data.matieres_consommables)}</td><td>Pieces detachees</td><td>${escapeHtml(data.pieces_detachees)}</td></tr>
              <tr><td>Produits de maintenance</td><td colspan="3">${escapeHtml(data.produits_maintenance)}</td></tr>
            </tbody>
          </table>
          <footer>Le laboratoire TESTLAB exerce exclusivement son droit de propriete sur le present document.</footer>
        </body>
      </html>
    `);
  };

  const generateLifeSheet = (record) => {
    const data = record.fiche_vie || {};
    openPrintWindow(`
      <!doctype html>
      <html lang="fr">
        <head>
          <meta charset="utf-8" />
          <title>Fiche de vie ${escapeHtml(record.code)}</title>
          <style>
            body { color: #111827; font-family: Arial, sans-serif; margin: 22px; }
            header { align-items: center; border: 1px solid #111827; display: grid; grid-template-columns: 150px 1fr 150px; margin-bottom: 20px; min-height: 70px; text-align: center; }
            header div { border-right: 1px solid #111827; height: 100%; padding: 10px; }
            header div:last-child { border-right: 0; font-size: 12px; text-align: left; }
            h1 { font-size: 18px; margin: 14px 0; }
            table { border-collapse: collapse; font-size: 12px; width: 100%; }
            th, td { border: 1px solid #111827; padding: 7px; text-align: left; vertical-align: top; }
            th { background: #f3f4f6; text-align: center; }
            footer { color: #475569; font-size: 10px; margin-top: 24px; text-align: center; }
          </style>
        </head>
        <body>
          <header>
            <div><strong>TESTLAB</strong><br />Laboratoire Geotechnique</div>
            <h1>FICHE DE VIE</h1>
            <div>Ref: FIC-21<br />Version: 01<br />du ${new Date().toLocaleDateString('fr-FR')}</div>
          </header>
          <table>
            <tbody>
              <tr><td>Designation</td><td>${escapeHtml(data.designation || record.designation)}</td><td>Date de reception</td><td>${escapeHtml(data.date_reception || record.date_reception)}</td></tr>
              <tr><td>Type</td><td>${escapeHtml(data.type || record.famille)}</td><td>Date de mise en service</td><td>${escapeHtml(data.date_mise_service || record.date_mise_service)}</td></tr>
              <tr><td>Marque</td><td>${escapeHtml(data.marque || record.marque)}</td><td>Conditions particulieres d'utilisation</td><td>${escapeHtml(data.conditions_utilisation)}</td></tr>
              <tr><td>N de serie</td><td>${escapeHtml(data.numero_serie || record.numero_serie)}</td><td>Intervalle entre deux etalonnages</td><td>${escapeHtml(data.intervalle_etalonnage)}</td></tr>
              <tr><td>N identification interne</td><td>${escapeHtml(data.numero_interne || record.code)}</td><td>Intervalle entre deux verifications metrologiques</td><td>${escapeHtml(data.intervalle_verification)}</td></tr>
              <tr><td>Etat a la reception</td><td>${escapeHtml(data.etat_reception)}</td><td>Intervalle entre deux maintenances</td><td>${escapeHtml(data.intervalle_maintenance)}</td></tr>
              <tr><th colspan="4">Equipements ou accessoires associes</th></tr>
              <tr><td>Designation</td><td>N d'identification</td><td>Incertitudes d'etalonnage demandees</td><td>Points d'etalonnage demandes</td></tr>
              ${lifeAccessoryRows(data)}
              ${data.accessoires ? `<tr><td colspan="4">${escapeHtml(data.accessoires)}</td></tr>` : ''}
            </tbody>
          </table>
          <table>
            <tbody>
              <tr><th colspan="11">Interventions</th></tr>
              <tr>
                <td>N</td>
                <td>Nature de l'intervention</td>
                <td>References des moyens utilises</td>
                <td>Reference du document utilise</td>
                <td>Date</td>
                <td>Prochaine date</td>
                <td>Affectation de l'equipement de mesure</td>
                <td>Intervenant</td>
                <td>Reference du rapport</td>
                <td>Resultats ou observations du rapport</td>
                <td>Visa du Responsable Metrologie</td>
              </tr>
              ${lifeInterventionRows(data)}
              ${data.interventions ? `<tr><td colspan="11">${escapeHtml(data.interventions).replace(/\n/g, '<br />')}</td></tr>` : ''}
            </tbody>
          </table>
          <footer>Le laboratoire TESTLAB exerce exclusivement son droit de propriete sur le present document.</footer>
        </body>
      </html>
    `);
  };

  if (selectedEquipment) {
    return (
      <div className="pageStack equipmentFolderPage">
        <div className="pageHeader">
          <div>
            <h2>{selectedEquipment.code} - {selectedEquipment.designation}</h2>
            <p>Dossier equipement: fiche signaletique, fiche de vie et documents associes.</p>
          </div>
          <div className="headerActions">
            <button type="button" className="dangerButton" onClick={() => removeEquipment(selectedEquipment)}>Supprimer dossier</button>
          </div>
        </div>

        <div className="documentBreadcrumb">
          <button type="button" onClick={closeEquipmentFolder}>
            Gestion des equipements
          </button>
          <button
            type="button"
            className={!sheetMode && !documentFormOpen ? 'active' : ''}
            onClick={closeEquipmentSubFolder}
          >
            {selectedEquipment.code}
          </button>
          {sheetMode && (
            <span>{sheetMode === 'signaletique' ? 'Fiche signaletique' : 'Fiche de vie'}</span>
          )}
          {documentFormOpen && <span>Ajouter document</span>}
        </div>

        <div className="equipmentIdentityPanel">
          <div><span>Nom</span><strong>{selectedEquipment.designation}</strong></div>
          <div><span>Code identification</span><strong>{selectedEquipment.code}</strong></div>
          <div><span>Famille</span><strong>{selectedEquipment.famille || '-'}</strong></div>
          <div><span>Statut</span><strong>{statusLabel(selectedEquipment.statut)}</strong></div>
        </div>

        <div className="equipmentDocumentsGrid">
          <section className="equipmentDocumentCard">
            <div>
              <span>FIC-20</span>
              <h3>Fiche signaletique</h3>
              <p>References de l'equipement, interventions, prestataires, consommables et pieces associees.</p>
            </div>
            <div className="rowActions">
              <button type="button" className="ghostButton" onClick={() => openSheet('signaletique')}>Ajouter / modifier</button>
              <button type="button" className="primaryButton" onClick={() => generateSignaletique(selectedEquipment)}>Generer</button>
            </div>
          </section>
          <section className="equipmentDocumentCard">
            <div>
              <span>FIC-21</span>
              <h3>Fiche de vie</h3>
              <p>Etat a la reception, intervalles metrologiques, accessoires et historique des interventions.</p>
            </div>
            <div className="rowActions">
              <button type="button" className="ghostButton" onClick={() => openSheet('vie')}>Ajouter / modifier</button>
              <button type="button" className="primaryButton" onClick={() => generateLifeSheet(selectedEquipment)}>Generer</button>
            </div>
          </section>
          <section className="equipmentDocumentCard">
            <div>
              <span>DOC</span>
              <h3>Autres documents</h3>
              <p>Certificats d'etalonnage, rapports, notices, photos, fiches de maintenance et preuves associees.</p>
            </div>
            <button type="button" className="secondaryButton" onClick={openDocumentForm}>+ Ajouter document</button>
          </section>
        </div>

        {sheetMode && (
          <form className="editorPanel equipmentSheetEditor" onSubmit={saveSheet}>
            <div className="formHeader">
              <strong>{sheetMode === 'signaletique' ? 'Fiche signaletique' : 'Fiche de vie'}</strong>
              <button type="button" className="ghostButton" onClick={() => setSheetMode('')}>Fermer</button>
            </div>
            {sheetMode === 'signaletique' ? (
              <div className="sheetCompactForm">
                <div className="formGrid">
                  {signaletiqueMainFields.map(([key, label, type]) => (
                    <label className={type === 'textarea' ? 'full' : ''} key={key}>
                      <span>{label}</span>
                      {type === 'textarea' ? (
                        <textarea value={sheetForm[key] || ''} onChange={(event) => updateSheetField(key, event.target.value)} rows="3" />
                      ) : (
                        <input type={type || 'text'} value={sheetForm[key] || ''} onChange={(event) => updateSheetField(key, event.target.value)} />
                      )}
                    </label>
                  ))}
                </div>

                <div className="repeatableBlock">
                  <div className="repeatableHeader">
                    <strong>Autres equipements associes</strong>
                    <button type="button" className="secondaryButton" onClick={() => addSheetRow('equipements_associes_lignes', { designation: '', marque: '', modele: '', numero_serie: '', caracteristiques: '' })}>+ Ligne</button>
                  </div>
                  <div className="tableScroll">
                    <table className="editableRowsTable">
                      <thead><tr><th>Designation</th><th>Marque</th><th>Modele</th><th>N de serie</th><th>Caracteristiques</th><th /></tr></thead>
                      <tbody>
                        {(sheetForm.equipements_associes_lignes || []).map((row, index) => (
                          <tr key={`associe-${index}`}>
                            {['designation', 'marque', 'modele', 'numero_serie', 'caracteristiques'].map((field) => (
                              <td key={field}><input value={row[field] || ''} onChange={(event) => updateSheetRow('equipements_associes_lignes', index, field, event.target.value)} /></td>
                            ))}
                            <td><button type="button" className="dangerButton" onClick={() => removeSheetRow('equipements_associes_lignes', index)}>Retirer</button></td>
                          </tr>
                        ))}
                        {(!sheetForm.equipements_associes_lignes || sheetForm.equipements_associes_lignes.length === 0) && (
                          <tr><td colSpan="6" className="emptyCell">Aucune ligne ajoutee</td></tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>

                <div className="formGrid">
                  {signaletiqueInternalFields.map(([key, label]) => (
                    <label key={key}>
                      <span>{label}</span>
                      <input value={sheetForm[key] || ''} onChange={(event) => updateSheetField(key, event.target.value)} />
                    </label>
                  ))}
                </div>

                <div className="repeatableBlock">
                  <div className="repeatableHeader">
                    <strong>Interventions externes</strong>
                    <button type="button" className="secondaryButton" onClick={() => addSheetRow('prestataires_externes_lignes', { type: '', ref_contrat: '', societe: '', adresse: '', tel: '', fax: '', correspondant: '', periodicite: '' })}>+ Ligne</button>
                  </div>
                  <div className="tableScroll">
                    <table className="editableRowsTable wideRowsTable">
                      <thead><tr><th>Type</th><th>Ref contrat</th><th>Societe</th><th>Adresse</th><th>Tel</th><th>Fax</th><th>Correspondant</th><th>Periodicite</th><th /></tr></thead>
                      <tbody>
                        {(sheetForm.prestataires_externes_lignes || []).map((row, index) => (
                          <tr key={`prestataire-${index}`}>
                            {['type', 'ref_contrat', 'societe', 'adresse', 'tel', 'fax', 'correspondant', 'periodicite'].map((field) => (
                              <td key={field}><input value={row[field] || ''} onChange={(event) => updateSheetRow('prestataires_externes_lignes', index, field, event.target.value)} /></td>
                            ))}
                            <td><button type="button" className="dangerButton" onClick={() => removeSheetRow('prestataires_externes_lignes', index)}>Retirer</button></td>
                          </tr>
                        ))}
                        {(!sheetForm.prestataires_externes_lignes || sheetForm.prestataires_externes_lignes.length === 0) && (
                          <tr><td colSpan="9" className="emptyCell">Aucune ligne ajoutee</td></tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>

                <div className="formGrid">
                  {consumableFields.map(([key, label]) => (
                    <label className="full" key={key}>
                      <span>{label}</span>
                      <textarea value={sheetForm[key] || ''} onChange={(event) => updateSheetField(key, event.target.value)} rows="2" />
                    </label>
                  ))}
                </div>
              </div>
            ) : (
              <div className="sheetCompactForm">
                <div className="formGrid">
                  {lifeMainFields.map(([key, label, type]) => (
                    <label className={type === 'textarea' ? 'full' : ''} key={key}>
                      <span>{label}</span>
                      {type === 'textarea' ? (
                        <textarea value={sheetForm[key] || ''} onChange={(event) => updateSheetField(key, event.target.value)} rows="3" />
                      ) : (
                        <input type={type || 'text'} value={sheetForm[key] || ''} onChange={(event) => updateSheetField(key, event.target.value)} />
                      )}
                    </label>
                  ))}
                </div>

                <div className="repeatableBlock">
                  <div className="repeatableHeader">
                    <strong>Equipements ou accessoires associes</strong>
                    <button type="button" className="secondaryButton" onClick={() => addSheetRow('accessoire_lignes', { designation: '', numero_identification: '', incertitudes_etalonnage: '', points_etalonnage: '' })}>+ Ligne</button>
                  </div>
                  <div className="tableScroll">
                    <table className="editableRowsTable">
                      <thead><tr><th>Designation</th><th>N identification</th><th>Incertitudes demandees</th><th>Points demandes</th><th /></tr></thead>
                      <tbody>
                        {(sheetForm.accessoire_lignes || []).map((row, index) => (
                          <tr key={`accessoire-${index}`}>
                            {['designation', 'numero_identification', 'incertitudes_etalonnage', 'points_etalonnage'].map((field) => (
                              <td key={field}><input value={row[field] || ''} onChange={(event) => updateSheetRow('accessoire_lignes', index, field, event.target.value)} /></td>
                            ))}
                            <td><button type="button" className="dangerButton" onClick={() => removeSheetRow('accessoire_lignes', index)}>Retirer</button></td>
                          </tr>
                        ))}
                        {(!sheetForm.accessoire_lignes || sheetForm.accessoire_lignes.length === 0) && (
                          <tr><td colSpan="5" className="emptyCell">Aucune ligne ajoutee</td></tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>

                <div className="repeatableBlock">
                  <div className="repeatableHeader">
                    <strong>Interventions</strong>
                    <button type="button" className="secondaryButton" onClick={() => addSheetRow('intervention_lignes', { numero: '', nature: '', references_moyens: '', reference_document: '', date: '', prochaine_date: '', affectation: '', intervenant: '', reference_rapport: '', resultats_observations: '', visa_responsable_metrologie: '' })}>+ Ligne</button>
                  </div>
                  <div className="tableScroll">
                    <table className="editableRowsTable wideRowsTable">
                      <thead><tr><th>N</th><th>Nature</th><th>Moyens</th><th>Document</th><th>Date</th><th>Prochaine date</th><th>Affectation</th><th>Intervenant</th><th>Rapport</th><th>Observations</th><th>Visa RM</th><th /></tr></thead>
                      <tbody>
                        {(sheetForm.intervention_lignes || []).map((row, index) => (
                          <tr key={`intervention-${index}`}>
                            {['numero', 'nature', 'references_moyens', 'reference_document', 'date', 'prochaine_date', 'affectation', 'intervenant', 'reference_rapport', 'resultats_observations', 'visa_responsable_metrologie'].map((field) => (
                              <td key={field}><input type={field.includes('date') ? 'date' : 'text'} value={row[field] || ''} onChange={(event) => updateSheetRow('intervention_lignes', index, field, event.target.value)} /></td>
                            ))}
                            <td><button type="button" className="dangerButton" onClick={() => removeSheetRow('intervention_lignes', index)}>Retirer</button></td>
                          </tr>
                        ))}
                        {(!sheetForm.intervention_lignes || sheetForm.intervention_lignes.length === 0) && (
                          <tr><td colSpan="12" className="emptyCell">Aucune ligne ajoutee</td></tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}
            <div className="formActions">
              <button type="submit" className="primaryButton">Enregistrer la fiche</button>
            </div>
          </form>
        )}

        {documentFormOpen && (
          <form className="editorPanel" onSubmit={saveDocument}>
            <div className="formHeader">
              <strong>Ajouter un document au dossier</strong>
              <button type="button" className="ghostButton" onClick={() => setDocumentFormOpen(false)}>Fermer</button>
            </div>
            <div className="formGrid">
              {Object.keys(emptyDocument).map((key) => (
                <label className={key === 'observation' ? 'full' : ''} key={key}>
                  <span>{key.replaceAll('_', ' ')}</span>
                  {key === 'observation' ? (
                    <textarea value={documentForm[key] || ''} onChange={(event) => setDocumentForm((current) => ({ ...current, [key]: event.target.value }))} rows="3" />
                  ) : (
                    <input type={key === 'date_document' ? 'date' : 'text'} value={documentForm[key] || ''} onChange={(event) => setDocumentForm((current) => ({ ...current, [key]: event.target.value }))} />
                  )}
                </label>
              ))}
            </div>
            <div className="formActions">
              <button type="submit" className="primaryButton">Enregistrer document</button>
            </div>
          </form>
        )}

        <div className="tablePanel">
          <div className="tableTools">
            <strong>Documents ajoutes au dossier</strong>
            <span className="archiveNotice">{selectedEquipment.documents.length} document(s)</span>
          </div>
          <div className="tableScroll">
            <table>
              <thead>
                <tr><th>Type</th><th>Titre</th><th>Reference</th><th>Date</th><th>Lien</th><th>Actions</th></tr>
              </thead>
              <tbody>
                {selectedEquipment.documents.map((doc) => (
                  <tr key={doc.id}>
                    <td>{doc.type}</td>
                    <td>{doc.titre}</td>
                    <td>{doc.reference || '-'}</td>
                    <td>{doc.date_document || '-'}</td>
                    <td>{doc.lien || '-'}</td>
                    <td><button type="button" className="dangerButton" onClick={() => removeDocument(doc.id)}>Retirer</button></td>
                  </tr>
                ))}
                {selectedEquipment.documents.length === 0 && (
                  <tr><td colSpan="6" className="emptyCell">Aucun document annexe ajoute</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="pageStack equipmentPage">
      <div className="pageHeader">
        <div>
          <h2>Gestion des equipements</h2>
          <p>Chaque equipement est classe comme un dossier avec ses fiches et documents metrologiques.</p>
        </div>
        <div className="headerActions">
          <button type="button" className="ghostButton" onClick={generateEquipmentList}>Generer liste des equipements</button>
          <button type="button" className="secondaryButton" onClick={openCreateEquipment}>+ Ajouter un nouvel equipement</button>
        </div>
      </div>

      <div className="documentBreadcrumb">
        <button
          type="button"
          className={!equipmentFormOpen ? 'active' : ''}
          onClick={closeEquipmentForm}
        >
          Gestion des equipements
        </button>
        {equipmentFormOpen && <span>Nouvel equipement</span>}
      </div>

      {equipmentFormOpen && (
        <form className="editorPanel" onSubmit={saveEquipment}>
          <div className="formHeader">
            <strong>Ajouter un nouvel equipement</strong>
            <button type="button" className="ghostButton" onClick={() => setEquipmentFormOpen(false)}>Fermer</button>
          </div>
          <div className="formGrid">
            {Object.keys(emptyEquipment).map((key) => (
              <label className={key === 'caracteristiques' ? 'full' : ''} key={key}>
                <span>{key.replaceAll('_', ' ')}</span>
                {key === 'statut' ? (
                  <select value={equipmentForm[key] || ''} onChange={(event) => updateEquipmentField(key, event.target.value)}>
                    {statusOptions.map((option) => <option value={option.value} key={option.value}>{option.label}</option>)}
                  </select>
                ) : key === 'caracteristiques' ? (
                  <textarea value={equipmentForm[key] || ''} onChange={(event) => updateEquipmentField(key, event.target.value)} rows="3" />
                ) : (
                  <input type={key.startsWith('date_') || key.includes('etalonnage') ? 'date' : 'text'} value={equipmentForm[key] || ''} onChange={(event) => updateEquipmentField(key, event.target.value)} required={['code', 'designation'].includes(key)} />
                )}
              </label>
            ))}
          </div>
          <div className="formActions">
            <button type="submit" className="primaryButton">Creer le dossier equipement</button>
          </div>
        </form>
      )}

      <div className="equipmentFolderGrid">
        {records.map((record) => (
          <button type="button" className="equipmentFolder" key={record.id} onClick={() => setSelectedId(record.id)}>
            <span className="folderIcon" aria-hidden="true" />
            <strong>{record.designation}</strong>
            <small>{record.code} | {record.famille || 'Famille non definie'}</small>
            <em>{statusLabel(record.statut)}</em>
          </button>
        ))}
        {!loading && records.length === 0 && (
          <div className="emptyDocumentState">Aucun equipement enregistre</div>
        )}
      </div>
    </div>
  );
}
