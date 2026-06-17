import React, { useEffect, useMemo, useRef, useState } from 'react';
import toast from 'react-hot-toast';
import { deleteRecord, listRecords, upsertRecord } from '../services/localStore';
import { authProfiles, useAuth } from '../contexts/AuthContext';

const statusFolders = [
  { key: 'en_vigueur', label: 'En Vigueur', description: 'Documents applicables et utilises au laboratoire.' },
  { key: 'perime', label: 'Perimes', description: 'Documents retires, remplaces ou non applicables.' }
];

const typeFolders = [
  { key: 'procedure', label: 'Procedure', prefix: 'PRO', description: 'Mode operatoire, responsabilites, etapes et preuves attendues.' },
  { key: 'fiche', label: 'Fiche', prefix: 'FIC', description: 'Formulaire, support de saisie, fiche de controle ou enregistrement.' }
];

const approverRoles = ['responsable_technique', 'dg', 'responsable_labo'];
const documentWorkflowLabels = {
  brouillon: 'Brouillon',
  soumis_validation: 'Soumis pour validation',
  valide: 'Valide',
  rejete: 'Rejete'
};

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
    document_text: '',
    document_html: '',
    workflow_status: 'brouillon',
    approbateur_role: '',
    approbateur_nom: '',
    redige_par: '',
    redacteur_role: '',
    soumis_le: '',
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

function procedureText(record) {
  if (record.document_text) return record.document_text;
  const sections = procedureSections
    .map((section) => {
      const value = sectionValue(record, section.key);
      return value ? `${section.title}\n${value}` : '';
    })
    .filter(Boolean);
  return sections.join('\n\n');
}

function htmlFromPlainText(value) {
  const text = String(value || '').trim();
  if (!text) return '<p>Aucun contenu redige.</p>';
  return text
    .split(/\n{2,}/)
    .map((block) => {
      const lines = block.split('\n');
      const firstLine = lines[0] || '';
      const rest = lines.slice(1).join('\n');
      const isHeading = /^\d+\.\s/.test(firstLine);
      if (isHeading) {
        return `<section><h3>${escapeHtml(firstLine)}</h3>${rest ? `<p>${escapeHtml(rest).replace(/\n/g, '<br />')}</p>` : ''}</section>`;
      }
      return `<p>${escapeHtml(block).replace(/\n/g, '<br />')}</p>`;
    })
    .join('');
}

function procedureHtml(record) {
  if (record.document_html) return record.document_html;
  return htmlFromPlainText(procedureText(record));
}

function stripHtml(value) {
  return String(value || '')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/(p|div|h1|h2|h3|h4|li|section)>/gi, '\n')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/\s+\n/g, '\n')
    .replace(/\n\s+/g, '\n')
    .replace(/[ \t]{2,}/g, ' ')
    .trim();
}

function firstDocumentLine(html, fallback = 'Procedure qualite') {
  return stripHtml(html).split('\n').find((line) => line.trim()) || fallback;
}

function safeFileName(value) {
  return String(value || 'procedure')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9_-]+/gi, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80) || 'procedure';
}

function workflowLabel(value) {
  return documentWorkflowLabels[value] || documentWorkflowLabels.brouillon;
}

function escapeHtml(value) {
  return String(value || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

export default function DocumentsQualite() {
  const { user } = useAuth();
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedStatus, setSelectedStatus] = useState('');
  const [selectedType, setSelectedType] = useState('');
  const [formOpen, setFormOpen] = useState(false);
  const [editingId, setEditingId] = useState('');
  const [form, setForm] = useState({});
  const [procedureApprovers, setProcedureApprovers] = useState({});
  const editorRef = useRef(null);
  const writerRef = useRef(null);
  const imageInputRef = useRef(null);
  const approverOptions = useMemo(() => (
    authProfiles.filter((profile) => approverRoles.includes(profile.role) && profile.role !== user?.role)
  ), [user?.role]);

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

  useEffect(() => {
    if (!formOpen || selectedType !== 'procedure') return undefined;
    const frame = window.requestAnimationFrame(() => {
      editorRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      writerRef.current?.focus({ preventScroll: true });
    });
    return () => window.cancelAnimationFrame(frame);
  }, [formOpen, selectedType, editingId]);

  useEffect(() => {
    if (!formOpen || selectedType !== 'procedure' || !writerRef.current) return;
    const nextHtml = form.document_html || '';
    if (writerRef.current.innerHTML !== nextHtml) {
      writerRef.current.innerHTML = nextHtml;
    }
  }, [formOpen, selectedType, editingId, form.document_html]);

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
    setForm({
      ...emptyForm(selectedStatus, selectedType, records),
      redige_par: user?.name || user?.label || '',
      responsable: user?.name || user?.label || '',
      approbateur_role: approverOptions[0]?.role || '',
      approbateur_nom: approverOptions[0]?.label || ''
    });
    setFormOpen(true);
  };

  const openEdit = (record) => {
    setEditingId(record.id);
    setForm({
      ...procedureDefaults(),
      ...record,
      document_text: procedureText(record),
      document_html: procedureHtml(record),
      approbateur_role: record.approbateur_role || approverOptions[0]?.role || '',
      approbateur_nom: record.approbateur_nom || approverOptions[0]?.label || ''
    });
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

  const updateWriterContent = () => {
    const html = writerRef.current?.innerHTML || '';
    updateField('document_html', html);
  };

  const createDocumentNotification = async (record, approver) => {
    const notification = {
      id: `notif-doc-${record.id}-${Date.now()}`,
      title: 'Document qualite a valider',
      message: `${record.reference || 'Procedure'} soumis par ${record.redige_par || 'un responsable'}`,
      path: '/documents-qualite',
      tone: 'info',
      targetRole: approver?.role || record.approbateur_role || 'responsable_technique',
      created_at: new Date().toISOString(),
      read: false
    };
    await upsertRecord('notifications', notification);
  };

  const selectedApproverRole = (record) => (
    procedureApprovers[record.id] || record.approbateur_role || approverOptions[0]?.role || ''
  );

  const selectedApprover = (record) => (
    approverOptions.find((item) => item.role === selectedApproverRole(record))
  );

  const saveDocument = async ({ submitForApproval = false } = {}) => {
    const isProcedure = selectedType === 'procedure';
    const currentHtml = isProcedure ? (writerRef.current?.innerHTML || form.document_html || '') : '';
    const documentText = isProcedure ? stripHtml(currentHtml) : (form.document_text || '');
    const documentTitle = isProcedure ? firstDocumentLine(currentHtml, form.titre || form.reference || 'Procedure qualite') : form.titre;
    const approver = approverOptions.find((item) => item.role === form.approbateur_role);
    if (submitForApproval && isProcedure && !approver) {
      toast.error('Choisissez un responsable habilite avant la soumission');
      return;
    }
    const payload = {
      ...form,
      type: selectedType,
      statut: selectedStatus,
      titre: isProcedure ? documentTitle : form.titre,
      objet: isProcedure ? documentTitle : (form.objet || ''),
      contenu: isProcedure ? documentText : (form.contenu || ''),
      document_text: isProcedure ? documentText : form.document_text,
      document_html: isProcedure ? currentHtml : form.document_html,
      workflow_status: submitForApproval ? 'soumis_validation' : (form.workflow_status || 'brouillon'),
      redige_par: form.redige_par || user?.name || user?.label || '',
      redacteur_role: form.redacteur_role || user?.role || '',
      approbateur_role: isProcedure ? (form.approbateur_role || approver?.role || '') : form.approbateur_role,
      approbateur_nom: isProcedure ? (approver?.label || form.approbateur_nom || '') : form.approbateur_nom,
      soumis_le: submitForApproval ? new Date().toISOString() : form.soumis_le,
      updated_at: new Date().toISOString()
    };
    const saved = await upsertRecord('documentsQualite', {
      ...payload,
      id: editingId || form.id
    });
    if (saved.__syncError) {
      toast.error(`Enregistre localement, mais pas dans Supabase: ${saved.__syncError}`);
    } else {
      if (submitForApproval && isProcedure) {
        await createDocumentNotification(saved, approver);
        toast.success(`Procedure soumise a ${approver.label}`);
      } else {
        toast.success(editingId ? 'Document modifie dans Supabase' : 'Document qualite ajoute dans Supabase');
      }
    }
    closeForm();
    await refresh();
  };

  const submit = async (event) => {
    event.preventDefault();
    await saveDocument();
  };

  const submitSavedProcedure = async (record) => {
    const approver = selectedApprover(record);
    if (!approver) {
      toast.error('Choisissez un responsable habilite avant la soumission');
      return;
    }
    const updated = {
      ...record,
      workflow_status: 'soumis_validation',
      redige_par: record.redige_par || user?.name || user?.label || '',
      redacteur_role: record.redacteur_role || user?.role || '',
      approbateur_role: approver.role,
      approbateur_nom: approver.label,
      soumis_le: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    const saved = await upsertRecord('documentsQualite', updated);
    if (saved.__syncError) {
      toast.error(`Soumission locale, mais pas dans Supabase: ${saved.__syncError}`);
      return;
    }
    await createDocumentNotification(saved, approver);
    toast.success(`Procedure soumise a ${approver.label}`);
    await refresh();
  };

  const remove = async (record) => {
    if (!window.confirm(`Supprimer ${record.reference || record.titre} ?`)) return;
    await deleteRecord('documentsQualite', record.id);
    toast.success('Document supprime');
    await refresh();
  };

  const buildProcedureHtml = (record) => {
    return `
      <!doctype html>
      <html lang="fr">
        <head>
          <meta charset="utf-8" />
          <title>${escapeHtml(record.reference || 'Procedure')}</title>
          <style>
            @page { margin: 18mm; }
            body { color: #111827; font-family: Arial, sans-serif; line-height: 1.55; margin: 0; }
            header { border-bottom: 3px solid #2563eb; display: flex; justify-content: space-between; gap: 20px; padding-bottom: 16px; margin-bottom: 24px; }
            h1 { font-size: 28px; letter-spacing: .05em; margin: 0; }
            h2 { color: #1f2937; font-size: 20px; margin: 8px 0 0; }
            .subtitle { color: #64748b; margin: 5px 0 0; }
            .meta { color: #475569; font-size: 12px; text-align: right; min-width: 210px; }
            .meta strong { color: #111827; display: block; font-size: 14px; margin-bottom: 6px; }
            .identity { border: 1px solid #dbe4f0; border-radius: 8px; display: grid; grid-template-columns: repeat(4, 1fr); margin-bottom: 22px; overflow: hidden; }
            .identity div { border-right: 1px solid #dbe4f0; padding: 10px 12px; }
            .identity div:last-child { border-right: 0; }
            .identity span { color: #64748b; display: block; font-size: 11px; font-weight: 700; text-transform: uppercase; }
            .identity strong { color: #111827; display: block; font-size: 13px; margin-top: 4px; }
            section { border-bottom: 1px solid #e2e8f0; padding: 16px 0; page-break-inside: avoid; }
            h3 { color: #111827; font-size: 16px; margin: 0 0 8px; }
            p { color: #334155; font-size: 13px; margin: 0; white-space: normal; }
            .procedureContent { color: #334155; font-size: 13px; line-height: 1.65; }
            .procedureContent h1, .procedureContent h2, .procedureContent h3 { color: #111827; margin: 16px 0 8px; }
            .procedureContent p { margin: 0 0 10px; }
            .procedureContent ul, .procedureContent ol { margin: 8px 0 12px 24px; }
            .procedureContent img { display: block; max-width: 100%; margin: 12px 0; }
            .procedureContent table { border-collapse: collapse; width: 100%; }
            .procedureContent td, .procedureContent th { border: 1px solid #dbe4f0; padding: 7px; }
            .footerBox { background: #f8fafc; border: 1px solid #dbe4f0; border-radius: 8px; color: #475569; font-size: 12px; margin-top: 22px; padding: 12px; }
            .signatures { display: grid; grid-template-columns: 1fr 1fr; gap: 40px; margin-top: 42px; }
            .signature { border-top: 1px solid #94a3b8; color: #334155; font-size: 12px; min-height: 54px; padding-top: 8px; }
            footer { color: #64748b; font-size: 11px; margin-top: 24px; }
          </style>
        </head>
        <body>
          <header>
            <div>
              <h1>TESTLAB</h1>
              <h2>${escapeHtml(record.titre || 'Procedure qualite')}</h2>
              <p class="subtitle">Document qualite - References: ISO/IEC 17025 et ISO 9001</p>
            </div>
            <div class="meta">
              <strong>${escapeHtml(record.reference || '')}</strong>
              Version: ${escapeHtml(record.version || '01')}<br />
              Generation: ${new Date().toLocaleDateString('fr-FR')}<br />
              Statut: ${escapeHtml(statusLabel(record.statut))}
            </div>
          </header>
          <div class="identity">
            <div><span>Processus</span><strong>${escapeHtml(record.processus || '-')}</strong></div>
            <div><span>Responsable</span><strong>${escapeHtml(record.responsable || '-')}</strong></div>
            <div><span>Application</span><strong>${escapeHtml(record.date_application || '-')}</strong></div>
            <div><span>Revision</span><strong>${escapeHtml(record.date_revision || '-')}</strong></div>
          </div>
          <main class="procedureContent">${procedureHtml(record)}</main>
          ${(record.lien_document || record.observation) ? `
            <div class="footerBox">
              ${record.lien_document ? `<strong>Document source:</strong> ${escapeHtml(record.lien_document)}<br />` : ''}
              ${record.observation ? `<strong>Observation:</strong> ${escapeHtml(record.observation)}` : ''}
            </div>
          ` : ''}
          <div class="signatures">
            <div class="signature">Responsable qualite / Visa</div>
            <div class="signature">Direction / Validation</div>
          </div>
          <footer>Procedure generee depuis l'application TESTLAB.</footer>
        </body>
      </html>
    `;
  };

  const generateProcedure = (record) => {
    const doc = window.open('', '_blank');
    if (!doc) {
      toast.error('Fenetre PDF bloquee par le navigateur');
      return;
    }
    doc.document.write(buildProcedureHtml(record));
    doc.document.close();
    doc.focus();
    setTimeout(() => doc.print(), 450);
  };

  const exportProcedureWord = (record) => {
    const html = buildProcedureHtml(record);
    const blob = new Blob(['\ufeff', html], { type: 'application/msword;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${safeFileName(record.reference || record.titre)}.doc`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const runEditorCommand = (command, value = null) => {
    writerRef.current?.focus();
    document.execCommand(command, false, value);
    updateWriterContent();
  };

  const changeBlockStyle = (value) => {
    if (!value) return;
    runEditorCommand('formatBlock', value);
  };

  const insertEditorLink = () => {
    const url = window.prompt('Lien a inserer');
    if (!url) return;
    runEditorCommand('createLink', url);
  };

  const insertEditorImage = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      runEditorCommand('insertImage', reader.result);
      if (imageInputRef.current) imageInputRef.current.value = '';
    };
    reader.readAsDataURL(file);
  };

  const updateProcedureWorkflow = async (record, nextStatus) => {
    const updated = {
      ...record,
      workflow_status: nextStatus,
      valide_par: nextStatus === 'valide' ? (user?.name || user?.label || '') : record.valide_par,
      valide_le: nextStatus === 'valide' ? new Date().toISOString() : record.valide_le,
      rejete_par: nextStatus === 'rejete' ? (user?.name || user?.label || '') : record.rejete_par,
      rejete_le: nextStatus === 'rejete' ? new Date().toISOString() : record.rejete_le,
      updated_at: new Date().toISOString()
    };
    await upsertRecord('documentsQualite', updated);
    if (record.redacteur_role) {
      await upsertRecord('notifications', {
        id: `notif-doc-retour-${record.id}-${Date.now()}`,
        title: nextStatus === 'valide' ? 'Procedure validee' : 'Procedure rejetee',
        message: `${record.reference || 'Procedure'} ${nextStatus === 'valide' ? 'validee' : 'rejetee'} par ${user?.name || user?.label || 'le responsable habilite'}`,
        path: '/documents-qualite',
        tone: nextStatus === 'valide' ? 'success' : 'warning',
        targetRole: record.redacteur_role,
        created_at: new Date().toISOString(),
        read: false
      });
    }
    toast.success(nextStatus === 'valide' ? 'Procedure validee' : 'Procedure rejetee');
    await refresh();
  };

  const renderProcedureDocument = (record) => (
    <article className="procedureDocument" key={record.id}>
      <header className="procedureDocumentHeader">
        <div>
          <span>{record.reference} - Version {record.version || '01'}</span>
          <h3>{record.titre || 'Procedure sans titre'}</h3>
          <div className="documentMetaLine">
            <span className={`statusBadge ${record.workflow_status === 'soumis_validation' ? 'info' : 'neutral'}`}>
              {workflowLabel(record.workflow_status)}
            </span>
            {record.approbateur_nom && <em>Responsable habilite: {record.approbateur_nom}</em>}
          </div>
        </div>
        <div className="rowActions">
          {record.statut === 'en_vigueur' && <button type="button" className="primaryButton" onClick={() => generateProcedure(record)}>Generer procedure</button>}
          {record.statut === 'en_vigueur' && <button type="button" className="ghostButton" onClick={() => exportProcedureWord(record)}>Word</button>}
          {record.workflow_status === 'soumis_validation' && record.approbateur_role === user?.role && (
            <>
              <button type="button" className="ghostButton" onClick={() => updateProcedureWorkflow(record, 'valide')}>Valider</button>
              <button type="button" className="dangerButton" onClick={() => updateProcedureWorkflow(record, 'rejete')}>Rejeter</button>
            </>
          )}
          {record.statut === 'en_vigueur' && !['soumis_validation', 'valide'].includes(record.workflow_status || 'brouillon') && (
            <div className="submitProcedureBox">
              <select
                aria-label="Responsable habilite"
                value={selectedApproverRole(record)}
                onChange={(event) => setProcedureApprovers((current) => ({ ...current, [record.id]: event.target.value }))}
              >
                {approverOptions.map((profile) => (
                  <option key={profile.role} value={profile.role}>{profile.label}</option>
                ))}
              </select>
              <button type="button" className="secondaryButton" onClick={() => submitSavedProcedure(record)}>
                Soumettre
              </button>
            </div>
          )}
          {record.statut === 'en_vigueur' && <button type="button" className="ghostButton" onClick={() => openEdit(record)}>Modifier</button>}
          <button type="button" className="dangerButton" onClick={() => remove(record)}>Supprimer</button>
        </div>
      </header>

      <div className="procedureDocumentBody">
        <div className="procedureDocumentText" dangerouslySetInnerHTML={{ __html: procedureHtml(record) }} />
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
      {formOpen && renderProcedureEditor()}
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
    <form className="editorPanel procedureEditorPanel" ref={editorRef} onSubmit={submit}>
      <div className="formHeader">
        <div>
          <strong>{editingId ? 'Modifier la procedure' : 'Rediger une nouvelle procedure'}</strong>
          <small>Redigez et mettez en forme le document comme dans un traitement de texte.</small>
        </div>
        <button type="button" className="ghostButton" onClick={closeForm}>Fermer</button>
      </div>

      <div className="procedureWritingSurface documentWritingSurface">
        <div className="documentWriterToolbar">
          <select aria-label="Style du paragraphe" defaultValue="" onChange={(event) => changeBlockStyle(event.target.value)}>
            <option value="">Style</option>
            <option value="h1">Titre 1</option>
            <option value="h2">Titre 2</option>
            <option value="h3">Titre 3</option>
            <option value="p">Paragraphe</option>
          </select>
          <button type="button" title="Gras" onClick={() => runEditorCommand('bold')}>B</button>
          <button type="button" title="Italique" onClick={() => runEditorCommand('italic')}><i>I</i></button>
          <button type="button" title="Souligner" onClick={() => runEditorCommand('underline')}><u>U</u></button>
          <button type="button" title="Liste a puces" onClick={() => runEditorCommand('insertUnorderedList')}>Liste</button>
          <button type="button" title="Liste numerotee" onClick={() => runEditorCommand('insertOrderedList')}>1.</button>
          <button type="button" title="Aligner a gauche" onClick={() => runEditorCommand('justifyLeft')}>Gauche</button>
          <button type="button" title="Centrer" onClick={() => runEditorCommand('justifyCenter')}>Centre</button>
          <button type="button" title="Aligner a droite" onClick={() => runEditorCommand('justifyRight')}>Droite</button>
          <button type="button" title="Inserer un lien" onClick={insertEditorLink}>Lien</button>
          <button type="button" title="Inserer une image" onClick={() => imageInputRef.current?.click()}>Image</button>
          <input ref={imageInputRef} type="file" accept="image/*" onChange={insertEditorImage} hidden />
        </div>
        <div
          className="documentWriter"
          ref={writerRef}
          contentEditable
          suppressContentEditableWarning
          onInput={updateWriterContent}
          data-placeholder="Redigez la procedure ici..."
        />
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
                <span className="folderIcon" aria-hidden="true" />
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
                <span className="folderIcon" aria-hidden="true" />
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

          {formOpen && selectedType !== 'procedure' && renderFicheForm()}
        </>
      )}
    </div>
  );
}
