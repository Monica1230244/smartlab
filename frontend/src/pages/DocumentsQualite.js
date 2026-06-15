import React, { useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import { deleteRecord, listRecords, upsertRecord } from '../services/localStore';

const statusFolders = [
  { key: 'en_vigueur', label: 'En Vigueur', description: 'Documents applicables et utilises au laboratoire.' },
  { key: 'perime', label: 'Périmés', description: 'Documents retires, remplaces ou non applicables.' }
];

const typeFolders = [
  { key: 'procedure', label: 'Procédure', prefix: 'PRO', description: 'Mode operatoire, responsabilites, etapes et preuves attendues.' },
  { key: 'fiche', label: 'Fiche', prefix: 'FIC', description: 'Formulaire, support de saisie, fiche de controle ou enregistrement.' }
];

const today = () => new Date().toISOString().slice(0, 10);

function emptyForm(status, type, records) {
  return {
    reference: nextDocumentReference(records, type),
    titre: '',
    type,
    statut: status,
    version: '01',
    processus: '',
    responsable: '',
    date_application: today(),
    date_revision: '',
    objet: '',
    contenu: '',
    lien_document: '',
    observation: ''
  };
}

function nextDocumentReference(records, type) {
  const year = new Date().getFullYear();
  const typeConfig = typeFolders.find((item) => item.key === type) || typeFolders[0];
  const pattern = new RegExp(`^${typeConfig.prefix}-${year}-(\\d+)$`, 'i');
  const max = records.reduce((highest, record) => {
    const match = String(record.reference || '').match(pattern);
    return match ? Math.max(highest, Number(match[1])) : highest;
  }, 0);
  return `${typeConfig.prefix}-${year}-${String(max + 1).padStart(3, '0')}`;
}

function statusLabel(value) {
  return statusFolders.find((item) => item.key === value)?.label || value;
}

function typeLabel(value) {
  return typeFolders.find((item) => item.key === value)?.label || value;
}

function compareDocuments(a, b) {
  return String(a.reference || '').localeCompare(String(b.reference || ''), 'fr', {
    numeric: true,
    sensitivity: 'base'
  });
}

export default function DocumentsQualite() {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedStatus, setSelectedStatus] = useState('');
  const [selectedType, setSelectedType] = useState('');
  const [formOpen, setFormOpen] = useState(false);
  const [editingId, setEditingId] = useState('');
  const [form, setForm] = useState({});

  const refresh = async () => {
    setLoading(true);
    const docs = await listRecords('documentsQualite');
    setRecords(docs);
    setLoading(false);
  };

  useEffect(() => {
    refresh();
    const reload = () => refresh();
    window.addEventListener('smartlab:data-changed', reload);
    return () => window.removeEventListener('smartlab:data-changed', reload);
  }, []);

  const currentDocuments = useMemo(() => (
    records
      .filter((record) => record.statut === selectedStatus && record.type === selectedType)
      .sort(compareDocuments)
  ), [records, selectedStatus, selectedType]);

  const openStatusFolder = (status) => {
    setSelectedStatus(status);
    setSelectedType('');
    setFormOpen(false);
    setEditingId('');
  };

  const openTypeFolder = (type) => {
    setSelectedType(type);
    setFormOpen(false);
    setEditingId('');
  };

  const openCreate = () => {
    setEditingId('');
    setForm(emptyForm(selectedStatus, selectedType, records));
    setFormOpen(true);
  };

  const openEdit = (record) => {
    setEditingId(record.id);
    setForm({ ...record });
    setFormOpen(true);
  };

  const closeForm = () => {
    setEditingId('');
    setFormOpen(false);
    setForm({});
  };

  const updateField = (name, value) => {
    setForm((current) => ({ ...current, [name]: value }));
  };

  const submit = async (event) => {
    event.preventDefault();
    const payload = {
      ...form,
      type: selectedType,
      statut: selectedStatus,
      updated_at: new Date().toISOString()
    };
    const saved = await upsertRecord('documentsQualite', {
      ...payload,
      id: editingId || form.id
    });
    if (saved.__syncError) {
      toast.error(`Enregistre localement, mais pas dans Supabase: ${saved.__syncError}`);
    } else {
      toast.success(editingId ? 'Document modifie dans Supabase' : 'Document qualite ajoute dans Supabase');
    }
    closeForm();
    await refresh();
  };

  const remove = async (record) => {
    if (!window.confirm(`Supprimer ${record.reference || record.titre} ?`)) return;
    await deleteRecord('documentsQualite', record.id);
    toast.success('Document supprime');
    await refresh();
  };

  return (
    <div className="pageStack documentsQualityPage">
      <div className="pageHeader">
        <div>
          <h2>Gestion des documents qualités</h2>
          <p>Classement des procedures et fiches par etat documentaire.</p>
        </div>
      </div>

      <div className="documentBreadcrumb">
        <button type="button" className={!selectedStatus ? 'active' : ''} onClick={() => { setSelectedStatus(''); setSelectedType(''); closeForm(); }}>
          Documents qualité
        </button>
        {selectedStatus && (
          <button type="button" className={!selectedType ? 'active' : ''} onClick={() => { setSelectedType(''); closeForm(); }}>
            {statusLabel(selectedStatus)}
          </button>
        )}
        {selectedType && <span>{typeLabel(selectedType)}</span>}
      </div>

      {!selectedStatus && (
        <div className="documentFolderGrid">
          {statusFolders.map((folder) => {
            const count = records.filter((record) => record.statut === folder.key).length;
            return (
              <button type="button" className="documentFolder" key={folder.key} onClick={() => openStatusFolder(folder.key)}>
                <span className="folderIcon">DIR</span>
                <strong>{folder.label}</strong>
                <small>{folder.description}</small>
                <em>{count} document(s)</em>
              </button>
            );
          })}
        </div>
      )}

      {selectedStatus && !selectedType && (
        <div className="documentFolderGrid">
          {typeFolders.map((folder) => {
            const count = records.filter((record) => record.statut === selectedStatus && record.type === folder.key).length;
            return (
              <button type="button" className="documentFolder" key={folder.key} onClick={() => openTypeFolder(folder.key)}>
                <span className="folderIcon">DIR</span>
                <strong>{folder.label}</strong>
                <small>{folder.description}</small>
                <em>{count} document(s)</em>
              </button>
            );
          })}
        </div>
      )}

      {selectedStatus && selectedType && (
        <>
          <div className="tablePanel">
            <div className="tableTools">
              <strong>{typeLabel(selectedType)} - {statusLabel(selectedStatus)}</strong>
              <button type="button" className="secondaryButton" onClick={openCreate}>
                + Nouvelle {typeLabel(selectedType).toLowerCase()}
              </button>
            </div>
            <div className="tableScroll">
              <table>
                <thead>
                  <tr>
                    <th>Reference</th>
                    <th>Titre</th>
                    <th>Version</th>
                    <th>Processus</th>
                    <th>Responsable</th>
                    <th>Application</th>
                    <th>Revision</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {currentDocuments.map((record) => (
                    <tr key={record.id}>
                      <td><strong>{record.reference}</strong></td>
                      <td>{record.titre}</td>
                      <td>{record.version}</td>
                      <td>{record.processus || '-'}</td>
                      <td>{record.responsable || '-'}</td>
                      <td>{record.date_application || '-'}</td>
                      <td>{record.date_revision || '-'}</td>
                      <td>
                        <div className="rowActions">
                          <button type="button" className="ghostButton" onClick={() => openEdit(record)}>Modifier</button>
                          <button type="button" className="dangerButton" onClick={() => remove(record)}>Supprimer</button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {!loading && currentDocuments.length === 0 && (
                    <tr>
                      <td colSpan="8" className="emptyCell">Aucun document dans ce dossier</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {formOpen && (
            <form className="editorPanel" onSubmit={submit}>
              <div className="formHeader">
                <strong>{editingId ? 'Modifier' : 'Ajouter'} {typeLabel(selectedType).toLowerCase()}</strong>
                <button type="button" className="ghostButton" onClick={closeForm}>Fermer</button>
              </div>
              <div className="formGrid">
                <label>
                  <span>Reference</span>
                  <input value={form.reference || ''} onChange={(event) => updateField('reference', event.target.value)} required />
                </label>
                <label>
                  <span>Version</span>
                  <input value={form.version || ''} onChange={(event) => updateField('version', event.target.value)} required />
                </label>
                <label>
                  <span>Responsable</span>
                  <input value={form.responsable || ''} onChange={(event) => updateField('responsable', event.target.value)} placeholder="Responsable qualite" />
                </label>
                <label className="full">
                  <span>Titre</span>
                  <input value={form.titre || ''} onChange={(event) => updateField('titre', event.target.value)} required placeholder={`Titre de la ${typeLabel(selectedType).toLowerCase()}`} />
                </label>
                <label>
                  <span>Processus concerne</span>
                  <input value={form.processus || ''} onChange={(event) => updateField('processus', event.target.value)} placeholder="Technique, qualite, reception..." />
                </label>
                <label>
                  <span>Date d'application</span>
                  <input type="date" value={form.date_application || ''} onChange={(event) => updateField('date_application', event.target.value)} />
                </label>
                <label>
                  <span>Date de revision</span>
                  <input type="date" value={form.date_revision || ''} onChange={(event) => updateField('date_revision', event.target.value)} />
                </label>
                <label className="full">
                  <span>Objet</span>
                  <textarea value={form.objet || ''} onChange={(event) => updateField('objet', event.target.value)} rows="3" placeholder="Objectif, domaine d'application et documents associes." />
                </label>
                <label className="full">
                  <span>Contenu / description</span>
                  <textarea value={form.contenu || ''} onChange={(event) => updateField('contenu', event.target.value)} rows="5" placeholder="Etapes, responsabilites, enregistrements, criteres de maitrise documentaire..." />
                </label>
                <label className="full">
                  <span>Lien ou nom du fichier</span>
                  <input value={form.lien_document || ''} onChange={(event) => updateField('lien_document', event.target.value)} placeholder="Nom du document, lien Drive, PDF, Word..." />
                </label>
                <label className="full">
                  <span>Observation</span>
                  <textarea value={form.observation || ''} onChange={(event) => updateField('observation', event.target.value)} rows="2" placeholder="Motif de peremption, remplacement, commentaire qualite..." />
                </label>
              </div>
              <div className="formActions">
                <button type="submit" className="primaryButton">Enregistrer</button>
              </div>
            </form>
          )}
        </>
      )}
    </div>
  );
}
