import React, { useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import { deleteRecord, listRecords, upsertRecord } from '../services/localStore';
import { downloadCsv } from '../utils/exportCsv';

function numberValue(value) {
  return Number(value || 0);
}

function formatMoney(value) {
  return `${numberValue(value).toLocaleString('fr-FR')} FCFA`;
}

function statusTone(value) {
  const key = String(value || '').toLowerCase();
  if (['valide', 'envoye', 'actif', 'conforme', 'cloturee', 'resolue', 'termine', 'livree'].includes(key)) return 'success';
  if (['controle', 'en_traitement', 'en_cours', 'a_reviser', 'planifie', 'ouverte'].includes(key)) return 'warning';
  if (['refuse', 'inactif', 'obsolete', 'perime'].includes(key)) return 'danger';
  return 'info';
}

function nextReference(records, config) {
  const { numberField = 'reference', prefix = 'REF', withYear = true, pad = 3 } = config;
  const year = new Date().getFullYear();
  const pattern = withYear ? new RegExp(`^${prefix}-${year}-(\\d+)$`, 'i') : new RegExp(`^${prefix}-(\\d+)$`, 'i');
  const max = records.reduce((highest, record) => {
    const match = String(record[numberField] || '').match(pattern);
    return match ? Math.max(highest, Number(match[1])) : highest;
  }, 0);
  const next = String(max + 1).padStart(pad, '0');
  return withYear ? `${prefix}-${year}-${next}` : `${prefix}-${next}`;
}

function valueOf(record, column) {
  const raw = typeof column.get === 'function' ? column.get(record) : record[column.name];
  if (column.type === 'money') return formatMoney(raw);
  if (Array.isArray(raw)) return raw.join(', ');
  return raw || '-';
}

function percent(count, total) {
  return total ? Math.round((count / total) * 100) : 0;
}

function RegisterModal({ config, form, setForm, editing, onClose, onSubmit }) {
  const update = (field, value) => setForm((current) => ({ ...current, [field]: value }));
  return (
    <div className="modalOverlay" onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
      <form className="modalPanel" onSubmit={onSubmit}>
        <div className="modalHeader"><strong>{editing ? config.editTitle : config.createTitle}</strong><button type="button" className="modalClose" onClick={onClose}>x</button></div>
        <div className="modalBody"><div className="formGrid">
          {config.fields.map((field) => {
            const value = form[field.name] ?? '';
            if (field.type === 'textarea') return <label key={field.name} className={field.full ? 'full' : ''}><span>{field.label}</span><textarea rows={field.rows || 3} value={value} required={field.required} onChange={(event) => update(field.name, event.target.value)} /></label>;
            if (field.options) return <label key={field.name} className={field.full ? 'full' : ''}><span>{field.label}</span><select value={value} required={field.required} onChange={(event) => update(field.name, event.target.value)}>{field.options.map((option) => <option key={option.value || option} value={option.value || option}>{option.label || option}</option>)}</select></label>;
            return <label key={field.name} className={field.full ? 'full' : ''}><span>{field.label}</span><input type={field.type || 'text'} readOnly={field.readOnly} required={field.required} value={value} onChange={(event) => update(field.name, field.type === 'number' ? Number(event.target.value) : event.target.value)} /></label>;
          })}
        </div></div>
        <div className="modalFooter"><button type="button" className="ghostButton" onClick={onClose}>Annuler</button><button type="submit" className="primaryButton">Enregistrer</button></div>
      </form>
    </div>
  );
}

export default function OperationalRegisterPage({ config }) {
  const [records, setRecords] = useState([]);
  const [query, setQuery] = useState('');
  const [selectedId, setSelectedId] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(config.defaultForm || {});

  const load = async () => {
    const data = await listRecords(config.resource);
    const sorted = [...data].sort((a, b) => String(a[config.numberField] || a.reference || a.numero || a.code || '').localeCompare(String(b[config.numberField] || b.reference || b.numero || b.code || ''), 'fr', { numeric: true }));
    setRecords(sorted);
    setSelectedId((current) => sorted.some((record) => record.id === current) ? current : (sorted[0]?.id || ''));
  };

  useEffect(() => {
    load();
    window.addEventListener('smartlab:data-changed', load);
    return () => window.removeEventListener('smartlab:data-changed', load);
  }, []);

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return records.filter((record) => !needle || Object.values(record).join(' ').toLowerCase().includes(needle));
  }, [query, records]);
  const selected = records.find((record) => record.id === selectedId) || filtered[0] || null;
  const summary = config.summary(records);
  const tabs = config.tabs || [];

  const openCreate = () => {
    const next = { ...(config.defaultForm || {}) };
    if (config.numberField) next[config.numberField] = nextReference(records, config);
    setEditing(null);
    setForm(next);
    setModalOpen(true);
  };
  const openEdit = (record) => { setEditing(record); setForm({ ...(config.defaultForm || {}), ...record }); setModalOpen(true); };
  const submit = async (event) => {
    event.preventDefault();
    const saved = await upsertRecord(config.resource, { ...form, id: editing?.id || form.id });
    toast.success(editing ? 'Modification enregistree' : 'Enregistrement ajoute');
    setSelectedId(saved.id);
    setModalOpen(false);
    load();
  };
  const remove = async (record) => {
    if (!window.confirm(`Supprimer ${record[config.numberField] || record.reference || record.numero || record.code || record.id} ?`)) return;
    await deleteRecord(config.resource, record.id);
    toast.success('Enregistrement supprime');
    setSelectedId('');
    load();
  };

  return (
    <div className="proRegisterPage">
      <div className="dashMockHeader reclamHeader"><div><p className="eyebrow">{config.eyebrow || 'TESTLAB'}</p><h2>{config.title}</h2><span className="achatSubtitle">{config.subtitle}</span></div><div className="dashMockSearch"><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder={config.searchPlaceholder || 'Rechercher...'} /></div></div>
      <div className="dashKpiGrid reclamKpiGrid">{summary.map((card) => <section key={card.label} className={`dashKpiCard ${card.tone || 'blue'}`}><div><span>{card.label}</span><strong>{card.value}</strong><small>{card.note || 'Donnees Supabase'}</small></div><b>{card.icon || config.prefix}</b></section>)}</div>
      <section className="isoCommandPanel proCommandPanel"><div><span>Processus module</span><strong>{config.processTitle}</strong><small>{config.processNote}</small></div><div className="isoWorkflowRail">{config.workflow.map((step, index) => <div key={step} className={index <= 1 ? 'active' : ''}><b>{index + 1}</b><span>{step}</span></div>)}</div><div className="isoEvidenceGrid">{config.evidence.map((item) => <span key={item}>{item}</span>)}</div></section>
      <div className="reclamLayout"><main className="reclamMain"><section className="dashPanel reclamTablePanel"><div className="quoteTableTop"><div className="achatTabs">{tabs.map((tab) => <button type="button" key={tab}>{tab}</button>)}</div><div className="rowActions"><button type="button" className="ghostButton" onClick={() => downloadCsv(`${config.resource}.csv`, filtered)}>Exporter</button><button type="button" className="primaryButton" onClick={openCreate}>+ {config.primaryLabel}</button></div></div><div className="tableScroll"><table><thead><tr>{config.columns.map((column) => <th key={column.name || column.label}>{column.label}</th>)}<th>Actions</th></tr></thead><tbody>{filtered.map((record) => <tr key={record.id} className={selected?.id === record.id ? 'selectedRow' : ''} onClick={() => setSelectedId(record.id)}>{config.columns.map((column) => <td key={column.name || column.label}>{column.badge ? <span className={`statusBadge ${statusTone(valueOf(record, column))}`}>{valueOf(record, column)}</span> : valueOf(record, column)}</td>)}<td><div className="rowActions"><button type="button" className="ghostButton iconOnlyButton" onClick={(event) => { event.stopPropagation(); setSelectedId(record.id); }}>o</button><button type="button" className="ghostButton iconOnlyButton" onClick={(event) => { event.stopPropagation(); openEdit(record); }}>M</button><button type="button" className="dangerButton" onClick={(event) => { event.stopPropagation(); remove(record); }}>Suppr.</button></div></td></tr>)}{filtered.length === 0 && <tr><td colSpan={config.columns.length + 1} className="emptyCell">Aucune donnee Supabase pour ce module. Ajoutez un enregistrement pour alimenter l'interface.</td></tr>}</tbody></table></div></section></main><aside className="reclamRightStack"><section className="dashPanel reclamDetailPanel"><div className="dashPanelHeader"><strong>{selected ? (selected[config.numberField] || selected.reference || selected.numero || selected.code) : config.title}</strong>{selected?.statut && <span className={`statusBadge ${statusTone(selected.statut)}`}>{selected.statut}</span>}</div><div className="quoteDetailBody"><div className="quoteDetailTabs">{['Details', 'Documents', 'Historique'].map((tab, index) => <span key={tab} className={index === 0 ? 'active' : ''}>{tab}</span>)}</div><h4>Informations generales</h4><dl>{selected ? config.detailFields.map((field) => <React.Fragment key={field.name}><dt>{field.label}</dt><dd>{valueOf(selected, field)}</dd></React.Fragment>) : <><dt>Selection</dt><dd>Aucune donnee</dd></>}</dl></div></section><section className="dashPanel reclamMiniPanel"><div className="dashPanelHeader"><strong>{config.sideTitle}</strong></div><div className="quoteMiniStats">{config.sideStats(records).map((item) => <div key={item.label}><span>{item.label}</span><i><em style={{ width: `${item.percent || percent(item.value, Math.max(records.length, 1))}%` }} /></i><strong>{item.value}</strong></div>)}</div></section></aside></div>
      {modalOpen && <RegisterModal config={config} form={form} setForm={setForm} editing={editing} onClose={() => setModalOpen(false)} onSubmit={submit} />}
    </div>
  );
}
