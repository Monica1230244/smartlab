import React, { useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import { deleteRecord, listRecords, upsertRecord } from '../services/localStore';

const statusFolders = [
  { key: 'en_vigueur', label: 'En Vigueur', description: 'Documents applicables et utilises au laboratoire.' },
  { key: 'perime', label: 'Perimes', description: 'Documents retires, remplaces ou non applicables.' }
];

const typeFolders = [
  { key: 'procedure', label: 'Procedure', prefix: 'PRO', description: 'Mode operatoire, responsabilites, etapes et preuves attendues.' },
  { key: 'fiche', label: 'Fiche', prefix: 'FIC', description: 'Formulaire, support de saisie, fiche de controle ou enregistrement.' }
];

const procedureSections = [
  {
    key: 'objectif',
    title: '1. Objectif',
    helper: 'Preciser le but de la procedure et le resultat attendu.'
  },
  {
    key: 'domaine_application',
    title: "2. Domaine d'application",
    helper: 'Indiquer les activites, services, postes ou essais concernes.'
  },
  {
    key: 'references_normatives',
    title: '3. References et documents associes',
    helper: 'Lister normes, fiches, formulaires, modes operatoires et documents qualite lies.'
  },
  {
    key: 'responsabilites',
    title: '4. Responsabilites',
    helper: 'Decrire qui redige, verifie, valide, applique et archive.'
  },
  {
    key: 'deroulement',
    title: '5. Deroulement de la procedure',
    helper: 'Rediger les etapes dans l ordre reel de travail au laboratoire.'
  },
  {
    key: 'enregistrements',
    title: '6. Enregistrements et preuves',
    helper: 'Indiquer les preuves a conserver: fiche, rapport, signature, photo, QR, fichier.'
  },
  {
    key: 'maitrise_modifications',
    title: '7. Maitrise des modifications',
    helper: 'Tracer les revisions, motifs de changement, anciennes versions et date d application.'
  }
];

const today = () => new Date().toISOString().slice(0, 10);

const procedureDefaults = () => procedureSections.reduce((values, section) => ({
  ...values,
  [section.key]: ''
}), {});

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
    observation: '',
    ...procedureDefaults()
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

function isExpiredProcedure(record) {
  if (record.type !== 'procedure' || record.statut !== 'en_vigueur' || !record.date_revision) return false;
  return record.date_revision < today();
}

function sectionValue(record, sectionKey) {
  if (record[sectionKey]) return record[sectionKey];
  if (sectionKey === 'objectif') return record.objet || '';
  if (sectionKey === 'deroulement') return record.contenu || '';
  return '';
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
    const expiredProcedures = docs.filter(isExpiredProcedure);
    const normalizedDocs = docs.map((record) => {
      if (!isExpiredProcedure(record)) return record;
      return {
        ...record,
        statut: 'perime',
        observation: record.observation
          ? record.observation
          : `Archive automatiquement le ${today()} car la date de revision est depassee.`,
        updated_at: new Date().toISOString()
      };
    });
    setRecords(normalizedDocs);
    setLoading(false);
    if (expiredProcedures.length > 0) {
      await Promise.all(normalizedDocs.filter((record) => expiredProcedures.some((expired) => expired.id === record.id)).map((record) => upsertRecord('documentsQualite', record)));
      toast.success(`${expiredProcedures.length} procedure(s) archivee(s) dans Perimes`);
    }
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
    if (selectedType === 'procedure' && selectedStatus === 'perime') {
      toast.error('Une procedure perimee ne se cree pas ici. Elle doit venir de En Vigueur apres expiration.');
      return;
    }
    setEditingId('');
    setForm(emptyForm(selectedStatus, selectedType, records));
    setFormOpen(true);
  };

  const openEdit = (record) => {
    setEditingId(record.id);
    setForm({ ...procedureDefaults(), ...record });
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
    const isProcedure = selectedType === 'procedure';
    const payload = {
      ...form,
      type: selectedType,
      statut: selectedStatus,
      objet: isProcedure ? (form.objectif || form.objet || '') : (form.objet || ''),
      contenu: isProcedure ? (form.deroulement || form.contenu || '') : (form.contenu || ''),
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

  const renderProcedureDocument = (record) => (
    <article className="procedureDocument" key={record.id}>
      <header className="procedureDocumentHeader">
        <div>
          <span>{record.reference} - Version {record.version || '01'}</span>
          <h3>{record.titre || 'Procedure sans titre'}</h3>
          <p>
            Processus: {record.processus || '-'} | Responsable: {record.responsable || '-'} | Application: {record.date_application || '-'} | Revision: {record.date_revision || '-'}
          </p>
        </div>
        <div className="rowActions">
          {record.statut === 'en_vigueur' && <button type="button" className="ghostButton" onClick={() => openEdit(record)}>Modifier</button>}
          <button type="button" className="dangerButton" onClick={() => remove(record)}>Supprimer</button>
        </div>
      </header>

      <div className="procedureDocumentBody">
        {procedureSections.map((section) => {
          const value = sectionValue(record, section.key);
          if (!value) return null;
          return (
            <section className="procedureDocumentSection" key={section.key}>
              <h4>{section.title}</h4>
              <p>{value}</p>
            </section>
          );
        })}
        {(record.lien_document || record.observation) && (
          <footer className="procedureDocumentFooter">
            {record.lien_document && <span>Document source: {record.lien_document}</span>}
            {record.observation && <span>Observation: {record.observation}</span>}
          </footer>
        )}
      </div>
    </article>
  );

  const renderProcedureLibrary = () => (
    <div className="procedureLibraryPanel">
      <div className="tableTools">
        <strong>{typeLabel(selectedType)} - {statusLabel(selectedStatus)}</strong>
        {selectedStatus === 'en_vigueur' ? (
          <button type="button" className="secondaryButton" onClick={openCreate}>
            + Nouvelle procedure
          </button>
        ) : (
          <span className="archiveNotice">Archive automatique des procedures expirees</span>
        )}
      </div>
      <div className="procedureDocumentList">
        {currentDocuments.map(renderProcedureDocument)}
        {!loading && currentDocuments.length === 0 && (
          <div className="emptyDocumentState">Aucune procedure dans ce dossier</div>
        )}
      </div>
    </div>
  );

  const renderFicheTable = () => (
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
  );

  const renderProcedureEditor = () => (
    <form className="editorPanel procedureEditorPanel" onSubmit={submit}>
      <div className="formHeader">
        <div>
          <strong>{editingId ? 'Modifier la procedure' : 'Rediger une nouvelle procedure'}</strong>
          <small>Redaction complete du document qualite, avec les sections attendues pour une procedure de laboratoire.</small>
        </div>
        <button type="button" className="ghostButton" onClick={closeForm}>Fermer</button>
      </div>

      <div className="procedureMetaGrid">
        <label>
          <span>Reference</span>
          <input value={form.reference || ''} onChange={(event) => updateField('reference', event.target.value)} required />
        </label>
        <label>
          <span>Version</span>
          <input value={form.version || ''} onChange={(event) => updateField('version', event.target.value)} required />
        </label>
        <label>
          <span>Processus</span>
          <input value={form.processus || ''} onChange={(event) => updateField('processus', event.target.value)} placeholder="Reception, technique, qualite..." />
        </label>
        <label>
          <span>Responsable</span>
          <input value={form.responsable || ''} onChange={(event) => updateField('responsable', event.target.value)} placeholder="Responsable qualite" />
        </label>
        <label className="wide">
          <span>Titre de la procedure</span>
          <input value={form.titre || ''} onChange={(event) => updateField('titre', event.target.value)} required placeholder="Ex: Procedure de reception des objets d essais" />
        </label>
        <label>
          <span>Date d'application</span>
          <input type="date" value={form.date_application || ''} onChange={(event) => updateField('date_application', event.target.value)} />
        </label>
        <label>
          <span>Date de revision</span>
          <input type="date" value={form.date_revision || ''} onChange={(event) => updateField('date_revision', event.target.value)} />
        </label>
      </div>

      <div className="procedureWritingSurface">
        {procedureSections.map((section) => {
          const fallback = section.key === 'objectif'
            ? form.objet
            : section.key === 'deroulement'
              ? form.contenu
              : '';
          return (
            <section className="procedureSection" key={section.key}>
              <div className="procedureSectionHeader">
                <strong>{section.title}</strong>
                <small>{section.helper}</small>
              </div>
              <textarea
                value={form[section.key] || fallback || ''}
                onChange={(event) => updateField(section.key, event.target.value)}
                rows={section.key === 'deroulement' ? 10 : 5}
                placeholder="Redigez ici..."
              />
            </section>
          );
        })}
      </div>

      <div className="procedureAppendixGrid">
        <label>
          <span>Lien ou nom du fichier</span>
          <input value={form.lien_document || ''} onChange={(event) => updateField('lien_document', event.target.value)} placeholder="Nom Word/PDF ou lien Drive" />
        </label>
        <label>
          <span>Observation qualite</span>
          <textarea value={form.observation || ''} onChange={(event) => updateField('observation', event.target.value)} rows="3" placeholder="Motif de revision, commentaire, remplacement..." />
        </label>
      </div>

      <div className="formActions">
        <button type="submit" className="primaryButton">Enregistrer la procedure</button>
      </div>
    </form>
  );

  const renderFicheForm = () => (
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
          <textarea value={form.contenu || ''} onChange={(event) => updateField('contenu', event.target.value)} rows="5" placeholder="Champs attendus, consignes de saisie, controles a effectuer..." />
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
  );

  return (
    <div className="pageStack documentsQualityPage">
      <div className="pageHeader">
        <div>
          <h2>Gestion des documents qualites</h2>
          <p>Classement des procedures et fiches par etat documentaire.</p>
        </div>
      </div>

      <div className="documentBreadcrumb">
        <button type="button" className={!selectedStatus ? 'active' : ''} onClick={() => { setSelectedStatus(''); setSelectedType(''); closeForm(); }}>
          Documents qualite
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
          {selectedType === 'procedure' ? renderProcedureLibrary() : renderFicheTable()}

          {formOpen && (selectedType === 'procedure' ? renderProcedureEditor() : renderFicheForm())}
        </>
      )}
    </div>
  );
}
