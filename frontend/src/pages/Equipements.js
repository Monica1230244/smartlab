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
  etalonnage_reference: '',
  etalonnage_operation: '',
  etalonnage_periodicite: '',
  maintenance_reference: '',
  maintenance_operation: '',
  maintenance_periodicite: '',
  prestataire_etalonnage: '',
  prestataire_maintenance: '',
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
  interventions: ''
};

const emptyDocument = {
  type: 'Certificat',
  titre: '',
  reference: '',
  date_document: '',
  lien: '',
  observation: ''
};

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
    setSheetForm(mode === 'signaletique' ? selectedEquipment.signaletique : selectedEquipment.fiche_vie);
  };

  const updateSheetField = (name, value) => {
    setSheetForm((current) => ({ ...current, [name]: value }));
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
              <tr><th colspan="4">Autres equipements associes</th></tr>
              <tr><td colspan="4">${escapeHtml(data.equipements_associes)}</td></tr>
              <tr><th colspan="2">Etalonnage / Verification</th><th colspan="2">Maintenance preventive</th></tr>
              <tr><td>Reference procedure</td><td>${escapeHtml(data.etalonnage_reference)}</td><td>N fiche maintenance</td><td>${escapeHtml(data.maintenance_reference)}</td></tr>
              <tr><td>Operation a effectuer</td><td>${escapeHtml(data.etalonnage_operation)}</td><td>Operation a effectuer</td><td>${escapeHtml(data.maintenance_operation)}</td></tr>
              <tr><td>Periodicite</td><td>${escapeHtml(data.etalonnage_periodicite)}</td><td>Periodicite</td><td>${escapeHtml(data.maintenance_periodicite)}</td></tr>
              <tr><th colspan="4">Matieres consommables / pieces detachees / produits de maintenance</th></tr>
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
              <tr><td colspan="4">${escapeHtml(data.accessoires)}</td></tr>
              <tr><th colspan="4">Interventions</th></tr>
              <tr><td colspan="4">${escapeHtml(data.interventions).replace(/\n/g, '<br />')}</td></tr>
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
            <button type="button" className="ghostButton" onClick={() => setSelectedId('')}>Retour aux dossiers</button>
            <button type="button" className="dangerButton" onClick={() => removeEquipment(selectedEquipment)}>Supprimer dossier</button>
          </div>
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
              <div className="formGrid">
                {Object.keys(emptySignaletique).map((key) => (
                  <label className={['equipements_associes', 'matieres_consommables', 'pieces_detachees', 'produits_maintenance'].includes(key) ? 'full' : ''} key={key}>
                    <span>{key.replaceAll('_', ' ')}</span>
                    {['equipements_associes', 'matieres_consommables', 'pieces_detachees', 'produits_maintenance'].includes(key) ? (
                      <textarea value={sheetForm[key] || ''} onChange={(event) => updateSheetField(key, event.target.value)} rows="3" />
                    ) : (
                      <input type={key.startsWith('date_') ? 'date' : 'text'} value={sheetForm[key] || ''} onChange={(event) => updateSheetField(key, event.target.value)} />
                    )}
                  </label>
                ))}
              </div>
            ) : (
              <div className="formGrid">
                {Object.keys(emptyLifeSheet).map((key) => (
                  <label className={['accessoires', 'interventions', 'conditions_utilisation'].includes(key) ? 'full' : ''} key={key}>
                    <span>{key.replaceAll('_', ' ')}</span>
                    {['accessoires', 'interventions', 'conditions_utilisation'].includes(key) ? (
                      <textarea value={sheetForm[key] || ''} onChange={(event) => updateSheetField(key, event.target.value)} rows={key === 'interventions' ? '6' : '3'} />
                    ) : (
                      <input type={key.startsWith('date_') ? 'date' : 'text'} value={sheetForm[key] || ''} onChange={(event) => updateSheetField(key, event.target.value)} />
                    )}
                  </label>
                ))}
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
            <span className="folderIcon">EQ</span>
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
