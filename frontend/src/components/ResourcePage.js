import React, { useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import { deleteRecord, listRecords, upsertRecord } from '../services/localStore';

function emptyForm(fields) {
  return fields.reduce((acc, field) => {
    const value = field.defaultValue;
    return {
      ...acc,
      [field.name]: Array.isArray(value) ? value.map((item) => ({ ...item })) : value || ''
    };
  }, {});
}

const AUTO_NUMBERING = {
  audits: { field: 'reference', prefix: 'AUD', withYear: true, pad: 3 },
  clients: { field: 'code', prefix: 'CLI', withYear: false, pad: 3 },
  commandes: { field: 'numero', prefix: 'CMD', withYear: true, pad: 3 },
  catalogueEssais: { field: 'code', prefix: 'CAT', withYear: false, pad: 3 },
  devis: { field: 'numero', prefix: 'DEV', withYear: true, pad: 3 },
  echantillons: { field: 'code', prefix: 'ECH', withYear: false, pad: 3 },
  equipements: { field: 'code', prefix: 'EQ', withYear: false, pad: 3 },
  essais: { field: 'numero', prefix: 'EA', withYear: true, pad: 3 },
  nonConformites: { field: 'reference', prefix: 'NC', withYear: true, pad: 3 },
  projets: { field: 'reference', prefix: 'PRJ', withYear: true, pad: 3 },
  rapports: { field: 'numero', prefix: 'RAP', withYear: true, pad: 3 },
  resultatsEssais: { field: 'numero', prefix: 'RES', withYear: true, pad: 3 }
};

function nextAutomaticNumber(resource, records) {
  const config = AUTO_NUMBERING[resource];
  if (!config) return '';
  const year = new Date().getFullYear();
  const escapedPrefix = config.prefix.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const pattern = config.withYear
    ? new RegExp(`^${escapedPrefix}-${year}-(\\d+)$`, 'i')
    : new RegExp(`^${escapedPrefix}-(\\d+)$`, 'i');
  const max = records.reduce((highest, record) => {
    const value = String(record[config.field] || '');
    const match = value.match(pattern);
    return match ? Math.max(highest, Number(match[1])) : highest;
  }, 0);
  const next = String(max + 1).padStart(config.pad, '0');
  return config.withYear ? `${config.prefix}-${year}-${next}` : `${config.prefix}-${next}`;
}

function formatValue(value, field) {
  if (field.type === 'money') {
    return `${Number(value || 0).toLocaleString('fr-FR')} FCFA`;
  }
  if (field.type === 'lineItems') {
    if (!Array.isArray(value) || value.length === 0) return '-';
    return value.map((item) => {
      const quantity = item.quantite || 0;
      const price = Number(item.prix_unitaire || 0).toLocaleString('fr-FR');
      return `${item.designation || 'Prestation'} (${quantity} x ${price})`;
    }).join(' | ');
  }
  return value || '-';
}

function statusTone(value) {
  const key = String(value || '').toLowerCase();
  if (['termine', 'paye', 'livree', 'valide', 'envoye', 'signe', 'conforme', 'accepte', 'active', 'actif', 'realise', 'cloture', 'cloturee', 'pret_envoi', 'envoye_client', 'valide_client', 'commande_creee'].includes(key)) return 'success';
  if (['en_cours', 'en_essai', 'controle', 'recu', 'en_traitement', 'planifie', 'en_preparation', 'validation_technique', 'validation_dg'].includes(key)) return 'info';
  if (['haute', 'urgente', 'brouillon', 'redaction', 'nouvelle', 'en_attente', 'a_surveiller', 'en_suivi', 'a_renouveler', 'a_configurer', 'ouverte'].includes(key)) return 'warning';
  if (['annulee', 'archive', 'hors_service', 'refuse', 'refus', 'suspendue', 'inactif'].includes(key)) return 'danger';
  return 'neutral';
}

function quoteStepLabel(status) {
  const labels = {
    redaction: 'Redaction du devis',
    validation_technique: 'Chez responsable technique',
    validation_dg: 'Chez DG',
    pret_envoi: 'Pret a envoyer au client',
    envoye_client: 'En attente validation client',
    valide_client: 'Valide par le client',
    commande_creee: 'Commande creee',
    refuse: 'Refuse'
  };
  return labels[status] || labels.redaction;
}

function normalizeQuoteStatus(status) {
  const legacy = {
    brouillon: 'redaction',
    envoye: 'envoye_client',
    signe: 'valide_client',
    paye: 'commande_creee',
    accepte: 'valide_client'
  };
  return legacy[status] || status || 'redaction';
}

function fieldDefault(field) {
  if (Array.isArray(field.defaultValue)) {
    return field.defaultValue.map((item) => ({ ...item }));
  }
  return field.defaultValue || '';
}

function normalizeWhatsAppNumber(value) {
  const digits = String(value || '').replace(/\D/g, '');
  if (!digits) return '';
  if (digits.startsWith('229')) return digits;
  if (digits.length === 8) return `229${digits}`;
  if (digits.length === 9 && digits.startsWith('0')) return `229${digits.slice(1)}`;
  return digits;
}

function escapeHtml(value) {
  return String(value || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function lineItemTotal(item) {
  return Number(item.quantite || 0) * Number(item.prix_unitaire || 0);
}

function lineItemsTotal(items) {
  return (Array.isArray(items) ? items : []).reduce((sum, item) => sum + lineItemTotal(item), 0);
}

function formatMoney(value) {
  return Number(value || 0).toLocaleString('fr-FR');
}

function buildValidationCode(numero) {
  const cleanNumber = String(numero || 'DEV').replace(/[^a-z0-9]/gi, '').toUpperCase();
  const suffix = Date.now().toString(36).toUpperCase().slice(-5);
  return `QR-${cleanNumber}-${suffix}`;
}

function buildValidationExpiry() {
  const expiry = new Date();
  expiry.setDate(expiry.getDate() + 30);
  return expiry.toISOString();
}

function buildValidationUrl(code) {
  const base = `${window.location.origin}${window.location.pathname}`.replace(/\/$/, '');
  return `${base}/devis?validation=${encodeURIComponent(code || '')}`;
}

function currentRole() {
  return localStorage.getItem('smartlab_current_role') || 'responsable_appel';
}

function roleLabel(role) {
  const labels = {
    responsable_appel: 'Responsable des appels',
    responsable_technique: 'Responsable technique',
    dg: 'DG',
    responsable_labo: 'Responsable labo',
    receptionniste: 'Receptionniste',
    client: 'Client'
  };
  return labels[role] || role || 'Utilisateur';
}

function appendHistory(record, action, detail = '') {
  const role = currentRole();
  return [
    ...(Array.isArray(record.historique_validations) ? record.historique_validations : []),
    {
      action,
      detail,
      role,
      acteur: roleLabel(role),
      date: new Date().toISOString()
    }
  ];
}

async function createSharedNotification({ title, message, path = '/', tone = 'info', targetRole = 'responsable_technique' }) {
  return upsertRecord('notifications', {
    id: `not-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    title,
    message,
    path,
    tone,
    targetRole,
    read: false,
    created_at: new Date().toISOString()
  });
}

function buildPdfHtml({ title, fields, record }) {
  const rows = fields.filter((field) => !field.hidden || field.type === 'validationCode').map((field) => {
    if (field.type === 'lineItems') {
      const items = Array.isArray(record[field.name]) ? record[field.name] : [];
      const itemRows = items.map((item) => `
        <tr>
          <td>${escapeHtml(item.designation)}</td>
          <td>${escapeHtml(item.quantite)}</td>
          <td>${escapeHtml(formatMoney(item.prix_unitaire))}</td>
          <td>${escapeHtml(formatMoney(lineItemTotal(item)))}</td>
        </tr>
      `).join('');
      return `
        <tr>
          <th>${escapeHtml(field.label)}</th>
          <td>
            <table class="inner">
              <thead><tr><th>Designation</th><th>Qte</th><th>P.U.</th><th>Total</th></tr></thead>
              <tbody>${itemRows}</tbody>
              <tfoot><tr><th colspan="3">Total</th><th>${escapeHtml(formatMoney(lineItemsTotal(items)))} FCFA</th></tr></tfoot>
            </table>
          </td>
        </tr>
      `;
    }
    if (field.type === 'validationCode') {
      const validationUrl = buildValidationUrl(record[field.name]);
      return `
        <tr>
          <th>${escapeHtml(field.label)}</th>
          <td>
            <div class="qrbox">
              <img alt="QR validation devis" src="https://api.qrserver.com/v1/create-qr-code/?size=140x140&data=${encodeURIComponent(validationUrl)}" />
              <div>
                <strong>${escapeHtml(record[field.name])}</strong>
                <p>Scanner ce QR code pour valider le devis et permettre la creation de la commande.</p>
              </div>
            </div>
          </td>
        </tr>
      `;
    }
    return `
      <tr>
        <th>${escapeHtml(field.label)}</th>
        <td>${escapeHtml(formatValue(record[field.name], field))}</td>
      </tr>
    `;
  }).join('');

  return `
    <!doctype html>
    <html lang="fr">
      <head>
        <meta charset="utf-8" />
        <title>${escapeHtml(title)}</title>
        <style>
          body { font-family: Arial, sans-serif; color: #111827; margin: 34px; }
          header { border-bottom: 3px solid #3b9eff; display: flex; justify-content: space-between; gap: 18px; padding-bottom: 16px; margin-bottom: 26px; }
          h1 { margin: 0; font-size: 28px; letter-spacing: .04em; }
          h2 { margin: 0; font-size: 18px; color: #334155; }
          p { margin: 6px 0 0; color: #64748b; }
          .meta { text-align: right; font-size: 12px; color: #64748b; }
          table { width: 100%; border-collapse: collapse; margin-top: 18px; }
          th, td { border: 1px solid #dbe4f0; padding: 12px; text-align: left; }
          th { width: 34%; background: #f1f5f9; color: #334155; }
          table.inner { margin: 0; }
          table.inner th { width: auto; }
          .qrbox { display: flex; gap: 16px; align-items: center; }
          .qrbox img { width: 140px; height: 140px; border: 1px solid #dbe4f0; padding: 6px; }
          .qrbox strong { display: block; font-size: 18px; margin-bottom: 6px; }
          .conditions { margin-top: 24px; border: 1px solid #dbe4f0; background: #f8fafc; padding: 14px; font-size: 12px; color: #475569; }
          .signatures { display: grid; grid-template-columns: 1fr 1fr; gap: 28px; margin-top: 34px; }
          .signature { border-top: 1px solid #94a3b8; padding-top: 8px; color: #334155; font-size: 12px; min-height: 52px; }
          footer { margin-top: 32px; color: #64748b; font-size: 12px; }
        </style>
      </head>
      <body>
        <header>
          <div>
            <h1>SMARTLAB</h1>
            <h2>Laboratoire - Devis et prestations d'essais</h2>
            <p>References qualite: ISO/IEC 17025 - ISO 9001</p>
          </div>
          <div class="meta">
            <strong>${escapeHtml(title)}</strong><br />
            Date: ${new Date().toLocaleDateString('fr-FR')}<br />
            Reference: ${escapeHtml(record.numero || record.reference || record.code || '')}
          </div>
        </header>
        <table>${rows}</table>
        <div class="conditions">
          Conditions: ce document est soumis a validation interne SMARTLAB puis validation du client. La commande est creee automatiquement apres validation client.
        </div>
        <div class="signatures">
          <div class="signature">Responsable technique / SMARTLAB</div>
          <div class="signature">Client / Signature et cachet</div>
        </div>
        <footer>Document genere depuis l'application SMARTLAB.</footer>
      </body>
    </html>
  `;
}

function buildListPdfHtml({ title, columns, records }) {
  const headers = columns.map((column) => `<th>${escapeHtml(column.label)}</th>`).join('');
  const rows = records.map((record) => `
    <tr>
      ${columns.map((column) => `<td>${escapeHtml(formatValue(record[column.name], column))}</td>`).join('')}
    </tr>
  `).join('');

  return `
    <!doctype html>
    <html lang="fr">
      <head>
        <meta charset="utf-8" />
        <title>${escapeHtml(title)}</title>
        <style>
          body { font-family: Arial, sans-serif; color: #111827; margin: 28px; }
          header { border-bottom: 3px solid #3b9eff; padding-bottom: 14px; margin-bottom: 22px; }
          h1 { margin: 0; font-size: 24px; }
          p { margin: 6px 0 0; color: #64748b; }
          table { width: 100%; border-collapse: collapse; font-size: 12px; }
          th, td { border: 1px solid #dbe4f0; padding: 8px; text-align: left; vertical-align: top; }
          th { background: #f1f5f9; color: #334155; }
          footer { margin-top: 24px; color: #64748b; font-size: 11px; }
        </style>
      </head>
      <body>
        <header>
          <h1>SMARTLAB - ${escapeHtml(title)}</h1>
          <p>Liste complete - ${records.length} element(s) - ${new Date().toLocaleDateString('fr-FR')}</p>
        </header>
        <table>
          <thead><tr>${headers}</tr></thead>
          <tbody>${rows || `<tr><td colspan="${columns.length}">Aucune donnee</td></tr>`}</tbody>
        </table>
        <footer>Document genere depuis l'application SMARTLAB.</footer>
      </body>
    </html>
  `;
}

function ResourcePage({
  title,
  subtitle,
  resource,
  fields,
  columns,
  primaryLabel,
  summaryCards = [],
  submitLabel,
  whatsappOnSubmit = false
}) {
  const [records, setRecords] = useState([]);
  const [query, setQuery] = useState('');
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(emptyForm(fields));
  const [modalOpen, setModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [dynamicOptions, setDynamicOptions] = useState({});

  const refresh = async () => {
    setLoading(true);
    setRecords(await listRecords(resource));
    setLoading(false);
  };

  useEffect(() => {
    let active = true;
    const load = async () => {
      setLoading(true);
      const nextRecords = await listRecords(resource);
      if (active) {
        setRecords(nextRecords);
        setLoading(false);
      }
    };
    load();
    const handler = () => load();
    window.addEventListener('smartlab:data-changed', handler);
    return () => {
      active = false;
      window.removeEventListener('smartlab:data-changed', handler);
    };
  }, [resource]);

  useEffect(() => {
    let active = true;
    const optionFields = fields.filter((field) => field.optionsResource);
    if (optionFields.length === 0) return () => {
      active = false;
    };

    const loadOptions = async () => {
      const entries = await Promise.all(optionFields.map(async (field) => {
        const sourceRecords = await listRecords(field.optionsResource);
        const options = sourceRecords.map((record) => ({
          value: record[field.optionValue] || record[field.optionLabel] || record.id,
          label: record[field.optionLabel] || record[field.optionValue] || record.id,
          fill: Object.fromEntries(Object.entries(field.fillFrom || {}).map(([target, source]) => [target, record[source] || '']))
        }));
        return [field.name, options];
      }));
      if (active) setDynamicOptions(Object.fromEntries(entries));
    };

    loadOptions();
    return () => {
      active = false;
    };
  }, [fields]);

  const filteredRecords = useMemo(() => {
    const needle = query.trim().toLowerCase();
    if (!needle) return records;
    return records.filter((record) => Object.values(record).join(' ').toLowerCase().includes(needle));
  }, [records, query]);

  const renderedSummaryCards = useMemo(() => (
    typeof summaryCards === 'function' ? summaryCards(records) : summaryCards
  ), [records, summaryCards]);

  const openCreate = () => {
    setEditing(null);
    const nextForm = { ...emptyForm(fields), attachments: [] };
    const config = AUTO_NUMBERING[resource];
    if (config && fields.some((field) => field.name === config.field)) {
      nextForm[config.field] = nextAutomaticNumber(resource, records);
    }
    if (resource === 'devis' && fields.some((field) => field.name === 'code_validation')) {
      nextForm.code_validation = buildValidationCode(nextForm.numero);
      nextForm.validation_expires_at = buildValidationExpiry();
    }
    fields.forEach((field) => {
      if (field.type === 'date' && !nextForm[field.name]) {
        nextForm[field.name] = new Date().toISOString().slice(0, 10);
      }
    });
    setForm(nextForm);
    setModalOpen(true);
  };

  const openEdit = (record) => {
    setEditing(record.id);
    setForm({ ...fields.reduce((acc, field) => {
      const value = record[field.name];
      return {
        ...acc,
        [field.name]: Array.isArray(value)
          ? value.map((item) => ({ ...item }))
          : value || fieldDefault(field)
      };
    }, {}), attachments: Array.isArray(record.attachments) ? record.attachments : [] });
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setEditing(null);
    setForm(emptyForm(fields));
  };

  const generatePdf = (record = form) => {
    const doc = window.open('', '_blank');
    if (!doc) {
      toast.error('Fenetre PDF bloquee par le navigateur');
      return;
    }
    doc.document.write(buildPdfHtml({ title, fields, record }));
    doc.document.close();
    doc.focus();
    setTimeout(() => doc.print(), 250);
  };

  const generateListPdf = () => {
    const doc = window.open('', '_blank');
    if (!doc) {
      toast.error('Fenetre PDF bloquee par le navigateur');
      return;
    }
    doc.document.write(buildListPdfHtml({ title, columns, records }));
    doc.document.close();
    doc.focus();
    setTimeout(() => doc.print(), 250);
  };

  const updateLineItem = (fieldName, index, key, value) => {
    setForm((current) => {
      const items = Array.isArray(current[fieldName]) ? current[fieldName] : [];
      const nextItems = items.map((item, itemIndex) => (
        itemIndex === index ? { ...item, [key]: value } : item
      ));
      return {
        ...current,
        [fieldName]: nextItems,
        montant_ht: lineItemsTotal(nextItems)
      };
    });
  };

  const addLineItem = (fieldName) => {
    setForm((current) => {
      const items = Array.isArray(current[fieldName]) ? current[fieldName] : [];
      return {
        ...current,
        [fieldName]: [...items, { designation: '', quantite: 1, prix_unitaire: 0 }]
      };
    });
  };

  const removeLineItem = (fieldName, index) => {
    setForm((current) => {
      const items = Array.isArray(current[fieldName]) ? current[fieldName] : [];
      const nextItems = items.filter((_, itemIndex) => itemIndex !== index);
      return {
        ...current,
        [fieldName]: nextItems,
        montant_ht: lineItemsTotal(nextItems)
      };
    });
  };

  const addAttachment = (files) => {
    const nextFiles = Array.from(files || []).map((file) => ({
      id: `att-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      name: file.name,
      size: file.size,
      type: file.type || 'application/octet-stream',
      added_at: new Date().toISOString(),
      added_by: roleLabel(currentRole())
    }));
    setForm((current) => ({
      ...current,
      attachments: [...(Array.isArray(current.attachments) ? current.attachments : []), ...nextFiles]
    }));
  };

  const removeAttachment = (id) => {
    setForm((current) => ({
      ...current,
      attachments: (Array.isArray(current.attachments) ? current.attachments : []).filter((attachment) => attachment.id !== id)
    }));
  };

  const sendToClient = (record, targetWindow = null) => {
    const phone = normalizeWhatsAppNumber(record.client_whatsapp || record.client_telephone || record.telephone || record.whatsapp);
    const amount = record.montant_ht ? `${Number(record.montant_ht).toLocaleString('fr-FR')} FCFA HT` : 'montant a confirmer';
    const validationCode = record.code_validation ? ` Code de validation: ${record.code_validation}.` : '';
    const validationUrl = record.code_validation ? ` Lien de validation: ${buildValidationUrl(record.code_validation)}` : '';
    const message = `Bonjour ${record.client_nom || ''}, votre devis ${record.numero || ''} SMARTLAB concernant "${record.objet || 'votre demande'}" a ete cree. Montant: ${amount}.${validationCode}${validationUrl}`;
    const channel = record.canal_envoi || 'whatsapp';

    if (channel === 'email') {
      if (!record.client_email) {
        toast.error('Email client manquant');
        return false;
      }
      window.open(`mailto:${record.client_email}?subject=${encodeURIComponent(`Devis SMARTLAB ${record.numero || ''}`)}&body=${encodeURIComponent(message)}`, '_blank', 'noopener,noreferrer');
      return true;
    }

    if (channel === 'sms') {
      if (!phone) {
        toast.error('Numero SMS client manquant');
        return false;
      }
      window.open(`sms:${phone}?body=${encodeURIComponent(message)}`, '_blank', 'noopener,noreferrer');
      return true;
    }

    if (!phone) {
      if (targetWindow) targetWindow.close();
      toast.error('Numero WhatsApp client manquant');
      return false;
    }
    const whatsappUrl = `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
    if (targetWindow) {
      targetWindow.location.href = whatsappUrl;
    } else {
      window.open(whatsappUrl, '_blank', 'noopener,noreferrer');
    }
    return true;
  };

  const submit = async (event) => {
    event.preventDefault();
    setSaving(true);
    const pendingClientWindow = resource === 'devis' && form.canal_envoi === 'whatsapp'
      ? window.open('', '_blank')
      : null;
    if (resource === 'essais' && form.reference_devis) {
      const commandes = await listRecords('commandes');
      const hasCommande = commandes.some((commande) => commande.reference_devis === form.reference_devis);
      if (!hasCommande) {
        toast.error('Reception impossible: aucune commande liee a ce devis');
        setSaving(false);
        return;
      }
    }
    const lineItemsField = fields.find((field) => field.type === 'lineItems');
    let payload = lineItemsField
      ? { ...form, montant_ht: lineItemsTotal(form[lineItemsField.name]) }
      : form;
    if (resource === 'devis' && !payload.code_validation) {
      payload = { ...payload, code_validation: buildValidationCode(payload.numero) };
    }
    if (resource === 'devis' && !payload.validation_expires_at) {
      payload = { ...payload, validation_expires_at: buildValidationExpiry() };
    }
    const previousRecord = editing ? records.find((item) => item.id === editing) : null;
    const auditAction = editing ? 'Modification' : 'Creation';
    const savedRecord = await upsertRecord(resource, {
      ...payload,
      id: editing,
      attachments: Array.isArray(form.attachments) ? form.attachments : [],
      historique_validations: appendHistory(previousRecord || payload, auditAction, title)
    });
    setRecords(await listRecords(resource));
    setSaving(false);
    if (savedRecord.__syncError) {
      toast.error(`Enregistre localement, mais pas dans Supabase: ${savedRecord.__syncError}`);
    } else {
      toast.success(editing ? 'Modification enregistree dans Supabase' : 'Ajout enregistre dans Supabase');
    }
    if (resource === 'devis' && payload.canal_envoi === 'whatsapp') {
      const sent = sendToClient(savedRecord, pendingClientWindow);
      if (sent) {
        await upsertRecord('devis', {
          ...savedRecord,
          statut: 'envoye_client',
          date_envoi_client: new Date().toISOString(),
          historique_validations: appendHistory(savedRecord, 'Envoi client', 'Canal: WhatsApp')
        });
        toast.success('WhatsApp ouvert avec le lien de validation client');
      }
    }
    if (whatsappOnSubmit) sendToClient(savedRecord);
    closeModal();
  };

  const remove = async (record) => {
    const label = record.numero || record.code || record.raison_sociale || record.reference || 'cet element';
    if (!window.confirm(`Supprimer ${label} ?`)) return;
    await deleteRecord(resource, record.id);
    setRecords(await listRecords(resource));
    toast.success('Suppression effectuee');
  };

  const updateQuoteStage = async (record, status, channel) => {
    await upsertRecord('devis', {
      ...record,
      statut: status,
      canal_validation: channel,
      code_validation: record.code_validation || buildValidationCode(record.numero),
      validation_expires_at: record.validation_expires_at || buildValidationExpiry(),
      historique_validations: appendHistory(record, quoteStepLabel(status), `Canal: ${roleLabel(channel)}`)
    });
    await createSharedNotification({
      title: 'Devis - nouvelle etape',
      message: `${record.numero} : ${quoteStepLabel(status)}`,
      path: '/devis',
      tone: status === 'refuse' ? 'offline' : 'info',
      targetRole: channel
    });
    setRecords(await listRecords(resource));
  };

  const sendQuoteAfterValidation = async (record) => {
    const quote = {
      ...record,
      code_validation: record.code_validation || buildValidationCode(record.numero)
    };
    const sent = sendToClient(quote);
    if (!sent) return;
    await updateQuoteStage(quote, 'envoye_client', 'client');
    toast.success('Devis envoye au client');
  };

  const validateQuoteAsOrder = async (record) => {
    const commandes = await listRecords('commandes');
    const existingOrder = commandes.find((commande) => commande.reference_devis === record.numero);
    if (existingOrder) {
      toast.success(`Commande deja creee: ${existingOrder.numero}`);
      return;
    }

    const order = {
      numero: nextAutomaticNumber('commandes', commandes),
      reference_devis: record.numero,
      client_nom: record.client_nom,
      client_whatsapp: record.client_whatsapp,
      projet: record.projet,
      prestations: Array.isArray(record.prestations) ? record.prestations : [],
      montant_ht: Number(record.montant_ht || lineItemsTotal(record.prestations)),
      date: new Date().toISOString().slice(0, 10),
      statut: 'nouvelle'
    };

    await upsertRecord('commandes', order);
    await upsertRecord('devis', {
      ...record,
      statut: 'commande_creee',
      canal_validation: 'client',
      historique_validations: appendHistory(record, 'Commande creee', order.numero)
    });
    await createSharedNotification({
      title: 'Commande creee',
      message: `${order.numero} creee depuis le devis ${record.numero}`,
      path: '/commandes',
      tone: 'online',
      targetRole: 'responsable_labo'
    });
    setRecords(await listRecords(resource));
    toast.success(`Commande ${order.numero} creee depuis le devis`);
  };

  const renderQuoteWorkflowActions = (record) => {
    const status = normalizeQuoteStatus(record.statut);
    return (
      <>
        <span className={`statusBadge ${statusTone(status)}`}>{quoteStepLabel(status)}</span>
        {status === 'redaction' && (
          <button type="button" className="ghostButton" onClick={() => updateQuoteStage(record, 'validation_technique', 'responsable_technique')}>
            Soumettre technique
          </button>
        )}
        {status === 'validation_technique' && (
          <button type="button" className="ghostButton" onClick={() => updateQuoteStage(record, 'validation_dg', 'dg')}>
            Valider technique
          </button>
        )}
        {status === 'validation_dg' && (
          <button type="button" className="ghostButton" onClick={() => updateQuoteStage(record, 'pret_envoi', 'dg')}>
            Valider DG
          </button>
        )}
        {status === 'pret_envoi' && (
          <button type="button" className="ghostButton" onClick={() => sendQuoteAfterValidation(record)}>
            Envoyer client
          </button>
        )}
        {status === 'envoye_client' && (
          <button type="button" className="ghostButton" onClick={() => validateQuoteAsOrder({ ...record, statut: 'valide_client' })}>
            Client valide
          </button>
        )}
      </>
    );
  };

  return (
    <div className="pageStack">
      <div className="pageHeader">
        <div>
          <h2>{title}</h2>
          <p>{subtitle}</p>
        </div>
        <div className="headerActions">
          <button type="button" className="ghostButton" onClick={generateListPdf}>Generer PDF liste</button>
          <button type="button" className="secondaryButton" onClick={openCreate}>+ {primaryLabel}</button>
        </div>
      </div>

      {renderedSummaryCards.length > 0 && (
        <div className="statsGrid">
          {renderedSummaryCards.map((card) => (
            <div className={`statCard ${card.tone || 'blue'}`} key={card.label}>
              <span>{card.label}</span>
              <strong>{card.value}</strong>
              {card.note && <small>{card.note}</small>}
            </div>
          ))}
        </div>
      )}

      <div className="tablePanel">
        <div className="tableTools">
          <strong>{loading ? 'Chargement...' : `${records.length} element(s)`}</strong>
          <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Rechercher..." />
        </div>
        <div className="tableScroll">
          <table>
            <thead>
              <tr>
                {columns.map((column) => <th key={column.name}>{column.label}</th>)}
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {!loading && filteredRecords.map((record) => (
                <tr key={record.id}>
                  {columns.map((column) => (
                    <td key={column.name}>
                      {column.badge ? (
                        <span className={`statusBadge ${statusTone(record[column.name])}`}>
                          {formatValue(record[column.name], column)}
                        </span>
                      ) : (
                        formatValue(record[column.name], column)
                      )}
                    </td>
                  ))}
                  <td>
                    <div className="rowActions">
                      <button type="button" className="ghostButton" onClick={() => openEdit(record)}>Modifier</button>
                      {resource === 'devis' && (
                        renderQuoteWorkflowActions(record)
                      )}
                      <button type="button" className="dangerButton" onClick={() => remove(record)}>Supprimer</button>
                    </div>
                  </td>
                </tr>
              ))}
              {!loading && filteredRecords.length === 0 && (
                <tr>
                  <td colSpan={columns.length + 1} className="emptyCell">Aucun resultat</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {modalOpen && (
        <div className="modalOverlay" onMouseDown={(event) => event.target === event.currentTarget && closeModal()}>
          <form className="modalPanel" onSubmit={submit}>
            <div className="modalHeader">
              <strong>{editing ? 'Modifier' : primaryLabel}</strong>
              <button type="button" className="modalClose" onClick={closeModal}>x</button>
            </div>
            <div className="modalBody">
              <div className="formGrid">
                {fields.filter((field) => !field.hidden).map((field) => (
                  <label key={field.name} className={field.full ? 'full' : ''}>
                    <span>{field.label}</span>
                    {field.type === 'lineItems' ? (
                      <div className="lineItemsPanel">
                        <div className="lineItemsHeader">
                          <strong>Prestations</strong>
                          <button type="button" className="ghostButton" onClick={() => addLineItem(field.name)}>+ Ligne</button>
                        </div>
                        <div className="lineItemsTable">
                          <div className="lineItemsHead">
                            <span>Designation</span>
                            <span>Qte</span>
                            <span>P.U. (FCFA)</span>
                            <span>Total</span>
                            <span></span>
                          </div>
                          {(Array.isArray(form[field.name]) ? form[field.name] : []).map((item, index) => (
                            <div className="lineItemsRow" key={`${field.name}-${index}`}>
                              <input
                                value={item.designation || ''}
                                placeholder="Designation"
                                onChange={(event) => updateLineItem(field.name, index, 'designation', event.target.value)}
                              />
                              <input
                                type="number"
                                min="0"
                                value={item.quantite || ''}
                                onChange={(event) => updateLineItem(field.name, index, 'quantite', event.target.value)}
                              />
                              <input
                                type="number"
                                min="0"
                                value={item.prix_unitaire || ''}
                                onChange={(event) => updateLineItem(field.name, index, 'prix_unitaire', event.target.value)}
                              />
                              <strong>{formatMoney(lineItemTotal(item))}</strong>
                              <button type="button" className="modalClose" onClick={() => removeLineItem(field.name, index)}>x</button>
                            </div>
                          ))}
                        </div>
                        <div className="lineItemsTotal">Total : <strong>{formatMoney(lineItemsTotal(form[field.name]))} FCFA</strong></div>
                      </div>
                    ) : (field.options || dynamicOptions[field.name]) ? (
                      <select
                        value={form[field.name]}
                        required={field.required}
                        onChange={(event) => {
                          const options = field.options || dynamicOptions[field.name] || [];
                          const option = options.find((item) => item.value === event.target.value);
                          setForm((current) => ({ ...current, [field.name]: event.target.value, ...(option?.fill || {}) }));
                        }}
                      >
                        <option value="">Selectionner</option>
                        {(field.options || dynamicOptions[field.name] || []).map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
                      </select>
                    ) : field.type === 'textarea' ? (
                      <textarea
                        value={form[field.name]}
                        required={field.required}
                        placeholder={field.placeholder}
                        rows={field.rows || 4}
                        onChange={(event) => setForm((current) => ({ ...current, [field.name]: event.target.value }))}
                      />
                    ) : (
                      <input
                        type={field.type === 'money' ? 'number' : field.type || 'text'}
                        value={form[field.name]}
                        required={field.required}
                        readOnly={field.readOnly || AUTO_NUMBERING[resource]?.field === field.name}
                        placeholder={field.placeholder}
                        onChange={(event) => setForm((current) => ({ ...current, [field.name]: event.target.value }))}
                      />
                    )}
                  </label>
                ))}
              </div>
              <div className="attachmentsPanel">
                <div className="lineItemsHeader">
                  <strong>Pieces jointes</strong>
                  <label className="fileButton">
                    Ajouter fichier
                    <input type="file" multiple onChange={(event) => addAttachment(event.target.files)} />
                  </label>
                </div>
                {(Array.isArray(form.attachments) && form.attachments.length > 0) ? (
                  <div className="attachmentList">
                    {form.attachments.map((attachment) => (
                      <div className="attachmentItem" key={attachment.id}>
                        <div>
                          <strong>{attachment.name}</strong>
                          <span>{Math.ceil(Number(attachment.size || 0) / 1024)} Ko - {attachment.added_by}</span>
                        </div>
                        <button type="button" className="modalClose" onClick={() => removeAttachment(attachment.id)}>x</button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="notificationEmpty">Aucune piece jointe</div>
                )}
              </div>
            </div>
            <div className="modalFooter">
              <button type="button" className="ghostButton" onClick={closeModal}>Annuler</button>
              {resource === 'devis' && (
                <button type="button" className="ghostButton" onClick={() => generatePdf(form)}>Generer PDF</button>
              )}
              <button className="primaryButton" type="submit" disabled={saving}>{saving ? 'Synchronisation...' : editing ? 'Enregistrer' : submitLabel || 'Ajouter'}</button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}

export default ResourcePage;
