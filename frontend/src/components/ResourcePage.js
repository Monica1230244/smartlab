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
  devis: { field: 'numero', prefix: 'DEV', withYear: true, pad: 3 },
  echantillons: { field: 'code', prefix: 'ECH', withYear: false, pad: 3 },
  equipements: { field: 'code', prefix: 'EQ', withYear: false, pad: 3 },
  essais: { field: 'numero', prefix: 'EA', withYear: true, pad: 3 },
  nonConformites: { field: 'reference', prefix: 'NC', withYear: true, pad: 3 },
  projets: { field: 'reference', prefix: 'PRJ', withYear: true, pad: 3 },
  rapports: { field: 'numero', prefix: 'RAP', withYear: true, pad: 3 }
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
  if (['termine', 'paye', 'livree', 'valide', 'envoye', 'signe', 'conforme', 'accepte', 'active', 'actif', 'realise', 'cloture', 'cloturee'].includes(key)) return 'success';
  if (['en_cours', 'en_essai', 'controle', 'recu', 'en_traitement', 'planifie', 'en_preparation'].includes(key)) return 'info';
  if (['haute', 'urgente', 'brouillon', 'nouvelle', 'en_attente', 'a_surveiller', 'en_suivi', 'a_renouveler', 'a_configurer', 'ouverte'].includes(key)) return 'warning';
  if (['annulee', 'archive', 'hors_service', 'refuse', 'suspendue', 'inactif'].includes(key)) return 'danger';
  return 'neutral';
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

function buildPdfHtml({ title, fields, record }) {
  const rows = fields.filter((field) => !field.hidden).map((field) => {
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
          body { font-family: Arial, sans-serif; color: #111827; margin: 36px; }
          header { border-bottom: 3px solid #3b9eff; padding-bottom: 16px; margin-bottom: 26px; }
          h1 { margin: 0; font-size: 26px; }
          p { margin: 6px 0 0; color: #64748b; }
          table { width: 100%; border-collapse: collapse; margin-top: 18px; }
          th, td { border: 1px solid #dbe4f0; padding: 12px; text-align: left; }
          th { width: 34%; background: #f1f5f9; color: #334155; }
          table.inner { margin: 0; }
          table.inner th { width: auto; }
          footer { margin-top: 32px; color: #64748b; font-size: 12px; }
        </style>
      </head>
      <body>
        <header>
          <h1>SMARTLAB</h1>
          <p>${escapeHtml(title)} - ${new Date().toLocaleDateString('fr-FR')}</p>
        </header>
        <table>${rows}</table>
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
    const nextForm = emptyForm(fields);
    const config = AUTO_NUMBERING[resource];
    if (config && fields.some((field) => field.name === config.field)) {
      nextForm[config.field] = nextAutomaticNumber(resource, records);
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
    setForm(fields.reduce((acc, field) => {
      const value = record[field.name];
      return { ...acc, [field.name]: Array.isArray(value) ? value.map((item) => ({ ...item })) : value || '' };
    }, {}));
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

  const sendWhatsApp = (record) => {
    const phone = normalizeWhatsAppNumber(record.client_whatsapp || record.client_telephone || record.telephone || record.whatsapp);
    if (!phone) {
      toast.error('Numero WhatsApp client manquant');
      return;
    }
    const amount = record.montant_ht ? `${Number(record.montant_ht).toLocaleString('fr-FR')} FCFA HT` : 'montant a confirmer';
    const message = `Bonjour ${record.client_nom || ''}, votre devis ${record.numero || ''} SMARTLAB concernant "${record.objet || 'votre demande'}" a ete cree. Montant: ${amount}.`;
    window.open(`https://wa.me/${phone}?text=${encodeURIComponent(message)}`, '_blank', 'noopener,noreferrer');
  };

  const submit = async (event) => {
    event.preventDefault();
    setSaving(true);
    const lineItemsField = fields.find((field) => field.type === 'lineItems');
    const payload = lineItemsField
      ? { ...form, montant_ht: lineItemsTotal(form[lineItemsField.name]) }
      : form;
    const savedRecord = await upsertRecord(resource, { ...payload, id: editing });
    setRecords(await listRecords(resource));
    setSaving(false);
    if (savedRecord.__syncError) {
      toast.error(`Enregistre localement, mais pas dans Supabase: ${savedRecord.__syncError}`);
    } else {
      toast.success(editing ? 'Modification enregistree dans Supabase' : 'Ajout enregistre dans Supabase');
    }
    if (whatsappOnSubmit) sendWhatsApp(savedRecord);
    closeModal();
  };

  const remove = async (record) => {
    const label = record.numero || record.code || record.raison_sociale || record.reference || 'cet element';
    if (!window.confirm(`Supprimer ${label} ?`)) return;
    await deleteRecord(resource, record.id);
    setRecords(await listRecords(resource));
    toast.success('Suppression effectuee');
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
