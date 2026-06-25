
import React, { useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import { deleteRecord, listRecords, upsertRecord } from '../services/localStore';
import { downloadCsv } from '../utils/exportCsv';

const emptyForm = {
  reference: '',
  client_nom: '',
  contact: '',
  telephone: '',
  email: '',
  origine: 'Email',
  canal: 'email',
  objet: '',
  type: 'Erreur de resultat',
  description: '',
  responsable: '',
  priorite: 'moyenne',
  date_reception: new Date().toISOString().slice(0, 10),
  echeance: '',
  statut: 'ouverte',
  action_prevue: ''
};

const statusLabels = {
  ouverte: 'Ouverte',
  en_traitement: 'En cours',
  resolue: 'Resolue',
  cloturee: 'Cloturee'
};

const priorityLabels = {
  faible: 'Faible',
  moyenne: 'Moyenne',
  haute: 'Haute'
};

const typeOptions = ['Erreur de resultat', 'Delais de rapport', 'Non-conformite methode', 'Contestation facture', 'Endommagement echantillon', 'Interpretation des resultats', 'Demande information'];

function normalizeStatus(value) {
  const key = String(value || 'ouverte').toLowerCase();
  if (['traite', 'resolue', 'resolu'].includes(key)) return 'resolue';
  if (['en_cours', 'en_traitement'].includes(key)) return 'en_traitement';
  if (['cloture', 'cloturee'].includes(key)) return 'cloturee';
  return key;
}

function statusTone(value) {
  const key = normalizeStatus(value);
  if (['resolue', 'cloturee'].includes(key)) return 'success';
  if (key === 'en_traitement') return 'warning';
  if (key === 'ouverte') return 'info';
  return 'neutral';
}

function priorityTone(value) {
  const key = String(value || '').toLowerCase();
  if (key === 'haute') return 'danger';
  if (key === 'moyenne') return 'warning';
  return 'success';
}

function nextReference(records) {
  const year = new Date().getFullYear();
  const max = records.reduce((highest, record) => {
    const match = String(record.reference || '').match(new RegExp(`^(R|REC)-${year}-(\\d+)$`, 'i'));
    return match ? Math.max(highest, Number(match[2])) : highest;
  }, 0);
  return `R-${year}-${String(max + 1).padStart(3, '0')}`;
}

function daysLate(date) {
  if (!date) return null;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const target = new Date(date);
  target.setHours(0, 0, 0, 0);
  return Math.round((target - today) / 86400000);
}

function countBy(records, getter) {
  return records.reduce((acc, record) => {
    const key = typeof getter === 'function' ? getter(record) : record[getter];
    const label = key || 'Non renseigne';
    acc[label] = (acc[label] || 0) + 1;
    return acc;
  }, {});
}

function topEntries(map, limit = 5) {
  return Object.entries(map).sort((a, b) => b[1] - a[1]).slice(0, limit);
}

function percent(count, total) {
  return total ? Math.round((count / total) * 100) : 0;
}

function Sparkline({ tone = 'blue' }) {
  return <svg className={`quoteSpark ${tone}`} viewBox="0 0 120 28" aria-hidden="true"><polyline points="0,22 20,18 37,12 55,17 72,15 92,20 120,13" /></svg>;
}

function DonutCard({ title, total, entries }) {
  const colors = ['#2f80ed', '#f59e0b', '#00d4aa', '#94a3b8', '#7c3aed'];
  let cursor = 0;
  const gradient = entries.map(([, count], index) => {
    const start = cursor;
    cursor += total ? (count / total) * 360 : 0;
    return `${colors[index % colors.length]} ${start}deg ${cursor}deg`;
  }).join(', ');
  return (
    <section className="dashPanel reclamMiniPanel">
      <div className="dashPanelHeader"><strong>{title}</strong></div>
      <div className="reclamDonutWrap">
        <div className="dashDonut reclamDonut" style={{ background: `conic-gradient(${gradient || '#1f2937 0deg 360deg'})` }}><strong>{total}</strong><span>Total</span></div>
        <div className="dashDonutLegend">{entries.map(([label, count], index) => <div key={label}><i style={{ background: colors[index % colors.length] }} /><span>{label}</span><strong>{count} ({percent(count, total)}%)</strong></div>)}</div>
      </div>
    </section>
  );
}
function ReclamationModal({ form, setForm, clients, editing, onClose, onSubmit }) {
  const update = (field, value) => setForm((current) => ({ ...current, [field]: value }));
  const updateClient = (name) => {
    const client = clients.find((item) => item.raison_sociale === name);
    setForm((current) => ({ ...current, client_nom: name, contact: client?.contact_nom || current.contact, telephone: client?.telephone || current.telephone, email: client?.email || current.email }));
  };
  return (
    <div className="modalOverlay" onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
      <form className="modalPanel" onSubmit={onSubmit}>
        <div className="modalHeader"><strong>{editing ? 'Modifier reclamation' : 'Nouvelle reclamation'}</strong><button type="button" className="modalClose" onClick={onClose}>x</button></div>
        <div className="modalBody"><div className="formGrid">
          <label><span>Reference</span><input value={form.reference} readOnly /></label>
          <label><span>Client</span><select value={form.client_nom} required onChange={(event) => updateClient(event.target.value)}><option value="">Selectionner</option>{clients.map((client) => <option key={client.id} value={client.raison_sociale}>{client.raison_sociale}</option>)}</select></label>
          <label><span>Contact</span><input value={form.contact} onChange={(event) => update('contact', event.target.value)} /></label>
          <label><span>Telephone</span><input value={form.telephone} onChange={(event) => update('telephone', event.target.value)} /></label>
          <label><span>Email</span><input type="email" value={form.email} onChange={(event) => update('email', event.target.value)} /></label>
          <label><span>Origine</span><select value={form.origine} onChange={(event) => update('origine', event.target.value)}><option>Email</option><option>WhatsApp</option><option>Telephone</option><option>Visite client</option><option>Courrier</option></select></label>
          <label><span>Type</span><select value={form.type} onChange={(event) => update('type', event.target.value)}>{typeOptions.map((type) => <option key={type}>{type}</option>)}</select></label>
          <label><span>Priorite</span><select value={form.priorite} onChange={(event) => update('priorite', event.target.value)}><option value="faible">Faible</option><option value="moyenne">Moyenne</option><option value="haute">Haute</option></select></label>
          <label><span>Date reception</span><input type="date" value={form.date_reception} onChange={(event) => update('date_reception', event.target.value)} /></label>
          <label><span>Echeance</span><input type="date" value={form.echeance} onChange={(event) => update('echeance', event.target.value)} /></label>
          <label><span>Responsable</span><input value={form.responsable} onChange={(event) => update('responsable', event.target.value)} /></label>
          <label><span>Statut</span><select value={form.statut} onChange={(event) => update('statut', event.target.value)}><option value="ouverte">Ouverte</option><option value="en_traitement">En traitement</option><option value="resolue">Resolue</option><option value="cloturee">Cloturee</option></select></label>
          <label className="full"><span>Objet concerne</span><input value={form.objet} required onChange={(event) => update('objet', event.target.value)} /></label>
          <label className="full"><span>Description</span><textarea rows="4" value={form.description} required onChange={(event) => update('description', event.target.value)} /></label>
          <label className="full"><span>Action prevue</span><textarea rows="3" value={form.action_prevue} onChange={(event) => update('action_prevue', event.target.value)} /></label>
        </div></div>
        <div className="modalFooter"><button type="button" className="ghostButton" onClick={onClose}>Annuler</button><button type="submit" className="primaryButton">Enregistrer</button></div>
      </form>
    </div>
  );
}

function DetailPanel({ record, onEdit, onPlan }) {
  if (!record) return <aside className="dashPanel reclamDetailPanel"><div className="notificationEmpty">Selectionnez une reclamation</div></aside>;
  const delay = daysLate(record.echeance);
  const progress = normalizeStatus(record.statut) === 'cloturee' ? 100 : normalizeStatus(record.statut) === 'resolue' ? 85 : normalizeStatus(record.statut) === 'en_traitement' ? 65 : 25;
  const steps = [
    ['Analyse de la reclamation', normalizeStatus(record.statut) !== 'ouverte' ? 'done' : 'current'],
    ['Verification des donnees et recalcul', ['en_traitement', 'resolue', 'cloturee'].includes(normalizeStatus(record.statut)) ? 'current' : 'pending'],
    ['Reponse au client', ['resolue', 'cloturee'].includes(normalizeStatus(record.statut)) ? 'done' : 'pending'],
    ['Cloture et satisfaction client', normalizeStatus(record.statut) === 'cloturee' ? 'done' : 'pending']
  ];
  return (
    <aside className="reclamRightStack">
      <section className="dashPanel reclamDetailPanel">
        <div className="dashPanelHeader"><strong>{record.reference}</strong><span className={`statusBadge ${priorityTone(record.priorite)}`}>{priorityLabels[record.priorite] || record.priorite || 'Moyenne'}</span></div>
        <div className="quoteDetailBody"><div className="quoteDetailTabs"><span className="active">Details</span><span>Traitement</span><span>Communications</span><span>Pieces jointes</span><span>Historique</span></div><h4>Informations generales</h4><dl><dt>Client</dt><dd>{record.client_nom || '-'}</dd><dt>Contact</dt><dd>{record.contact || '-'}</dd><dt>Telephone</dt><dd>{record.telephone || '-'}</dd><dt>Email</dt><dd>{record.email || '-'}</dd><dt>Date reception</dt><dd>{record.date_reception || '-'}</dd><dt>Origine</dt><dd>{record.origine || record.canal || '-'}</dd><dt>Objet concerne</dt><dd>{record.objet || '-'}</dd><dt>Type</dt><dd>{record.type || '-'}</dd><dt>Description</dt><dd>{record.description || '-'}</dd></dl></div>
      </section>
      <section className="dashPanel reclamDetailPanel"><div className="dashPanelHeader"><strong>Suivi du traitement</strong></div><div className="reclamTracking"><dl><dt>Statut actuel</dt><dd><span className={`statusBadge ${statusTone(record.statut)}`}>{statusLabels[normalizeStatus(record.statut)] || record.statut}</span></dd><dt>Priorite</dt><dd><span className={`statusBadge ${priorityTone(record.priorite)}`}>{priorityLabels[record.priorite] || record.priorite || 'Moyenne'}</span></dd><dt>Responsable</dt><dd>{record.responsable || '-'}</dd><dt>Date echeance</dt><dd className={delay !== null && delay < 0 ? 'lateText' : ''}>{record.echeance || '-'} {delay !== null ? `(${delay >= 0 ? 'J+' : 'J'}${delay})` : ''}</dd><dt>Avancement</dt><dd>{progress}%</dd></dl><div className="dashProgress quoteProgress"><i style={{ width: `${progress}%` }} /></div></div></section>
      <section className="dashPanel reclamDetailPanel"><div className="dashPanelHeader"><strong>Plan d'actions</strong></div><div className="reclamActionPlan">{steps.map(([label, state]) => <div key={label} className={state}><b /> <span>{label}<small>{state === 'done' ? 'Termine' : state === 'current' ? 'En cours' : 'En attente'}</small></span></div>)}</div><div className="reclamDetailActions"><button type="button" className="primaryButton" onClick={() => onEdit(record)}>Modifier</button><button type="button" className="ghostButton" onClick={() => onPlan(record)}>+ Plan d'actions</button></div></section>
    </aside>
  );
}
export default function Reclamations() {
  const [records, setRecords] = useState([]);
  const [clients, setClients] = useState([]);
  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [clientFilter, setClientFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [selectedId, setSelectedId] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(emptyForm);

  const refresh = async () => {
    const [nextRecords, nextClients] = await Promise.all([listRecords('reclamations'), listRecords('clients')]);
    setRecords(nextRecords);
    setClients(nextClients);
    if (!selectedId && nextRecords[0]) setSelectedId(nextRecords[0].id);
  };

  useEffect(() => {
    let active = true;
    const load = async () => {
      const [nextRecords, nextClients] = await Promise.all([listRecords('reclamations'), listRecords('clients')]);
      if (!active) return;
      setRecords(nextRecords);
      setClients(nextClients);
      setSelectedId((current) => current || nextRecords[0]?.id || null);
    };
    load();
    window.addEventListener('smartlab:data-changed', load);
    return () => { active = false; window.removeEventListener('smartlab:data-changed', load); };
  }, []);

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return records
      .filter((item) => statusFilter === 'all' || normalizeStatus(item.statut) === statusFilter)
      .filter((item) => clientFilter === 'all' || item.client_nom === clientFilter)
      .filter((item) => typeFilter === 'all' || (item.type || 'Non renseigne') === typeFilter)
      .filter((item) => !needle || Object.values(item).join(' ').toLowerCase().includes(needle))
      .sort((a, b) => String(a.reference || '').localeCompare(String(b.reference || ''), 'fr', { numeric: true }));
  }, [clientFilter, query, records, statusFilter, typeFilter]);

  const selected = records.find((item) => item.id === selectedId) || filtered[0] || null;
  const opened = records.filter((item) => normalizeStatus(item.statut) === 'ouverte').length;
  const processing = records.filter((item) => normalizeStatus(item.statut) === 'en_traitement').length;
  const resolved = records.filter((item) => ['resolue', 'cloturee'].includes(normalizeStatus(item.statut))).length;
  const resolvedRate = percent(resolved, records.length);
  const clientsList = Array.from(new Set(records.map((item) => item.client_nom).filter(Boolean)));
  const typesList = Array.from(new Set(records.map((item) => item.type || 'Non renseigne')));

  const openCreate = () => { setEditing(null); setForm({ ...emptyForm, reference: nextReference(records) }); setModalOpen(true); };
  const openEdit = (record) => { setEditing(record); setForm({ ...emptyForm, ...record, statut: normalizeStatus(record.statut), priorite: record.priorite || 'moyenne', type: record.type || 'Erreur de resultat' }); setModalOpen(true); };
  const closeModal = () => { setModalOpen(false); setEditing(null); };

  const submit = async (event) => {
    event.preventDefault();
    const payload = { ...form, id: editing?.id || form.id, canal: form.canal || String(form.origine || '').toLowerCase() };
    const saved = await upsertRecord('reclamations', payload);
    toast.success(editing ? 'Reclamation modifiee' : 'Reclamation ajoutee');
    setSelectedId(saved.id);
    closeModal();
    refresh();
  };

  const remove = async (record) => {
    if (!window.confirm(`Supprimer ${record.reference} ?`)) return;
    await deleteRecord('reclamations', record.id);
    toast.success('Reclamation supprimee');
    setSelectedId(null);
    refresh();
  };

  const resetFilters = () => {
    setQuery('');
    setStatusFilter('all');
    setClientFilter('all');
    setTypeFilter('all');
    toast.success('Filtres reclamations reinitialises');
  };

  const exportClaims = () => {
    if (!downloadCsv('reclamations.csv', filtered)) toast.error('Aucune reclamation a exporter');
  };

  const openActionPlan = (record) => {
    openEdit({
      ...record,
      action_prevue: record.action_prevue || 'Analyser la reclamation\nVerifier les donnees et recalculs\nRepondre au client\nCloturer apres satisfaction client',
      statut: normalizeStatus(record.statut) === 'ouverte' ? 'en_traitement' : normalizeStatus(record.statut)
    });
  };

  return (
    <div className="reclamMockPage">
      <div className="dashMockHeader reclamHeader"><div><p className="eyebrow">TESTLAB MOBILE</p><h2>Reclamations</h2><span className="achatSubtitle">Enregistrez, traitez et suivez toutes les reclamations clients.</span></div><div className="dashMockSearch"><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Rechercher une reclamation, client, objet..." /></div></div>
      <div className="dashKpiGrid reclamKpiGrid"><section className="dashKpiCard blue"><div><span>Total reclamations</span><strong>{records.length}</strong><small>Base reclamations reelle</small></div><b>REC</b><Sparkline /></section><section className="dashKpiCard amber"><div><span>Ouvertes</span><strong>{opened}</strong><small>A traiter</small></div><b>OU</b><Sparkline tone="amber" /></section><section className="dashKpiCard green"><div><span>En cours de traitement</span><strong>{processing}</strong><small>Actions en cours</small></div><b>TR</b><Sparkline tone="green" /></section><section className="dashKpiCard purple"><div><span>Resolues ce mois</span><strong>{resolved}</strong><small>Cloture ou resolution</small></div><b>OK</b><Sparkline tone="purple" /></section><section className="dashKpiCard green reclamResolveCard"><div className="dashDonut quoteSmallDonut" style={{ background: `conic-gradient(#00d4aa 0deg ${resolvedRate * 3.6}deg, #1f2937 ${resolvedRate * 3.6}deg 360deg)` }}><strong>{resolvedRate}%</strong><span>Objectif 90%</span></div><small>Taux de resolution</small></section></div>
      <div className="reclamLayout"><main className="reclamMain"><section className="dashPanel reclamTablePanel"><div className="quoteTableTop"><div className="achatTabs">{[['all', 'Toutes les reclamations'], ['ouverte', 'Ouvertes'], ['en_traitement', 'En cours'], ['resolue', 'Resolues'], ['cloturee', 'Cloturees']].map(([value, label]) => <button key={value} type="button" className={statusFilter === value ? 'active' : ''} onClick={() => setStatusFilter(value)}>{label}</button>)}</div><button type="button" className="primaryButton" onClick={openCreate}>+ Nouvelle reclamation</button></div><div className="tableTools achatFilters"><select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}><option value="all">Statut : Tous</option><option value="ouverte">Ouverte</option><option value="en_traitement">En cours</option><option value="resolue">Resolue</option><option value="cloturee">Cloturee</option></select><select value={clientFilter} onChange={(event) => setClientFilter(event.target.value)}><option value="all">Client : Tous</option>{clientsList.map((client) => <option key={client} value={client}>{client}</option>)}</select><select value={typeFilter} onChange={(event) => setTypeFilter(event.target.value)}><option value="all">Type : Tous</option>{typesList.map((type) => <option key={type} value={type}>{type}</option>)}</select><button type="button" className="ghostButton" onClick={resetFilters}>Filtres avances</button><button type="button" className="ghostButton" onClick={exportClaims}>Exporter</button></div><div className="tableScroll"><table><thead><tr><th>N reclamation</th><th>Client</th><th>Objet concerne</th><th>Type</th><th>Statut</th><th>Priorite</th><th>Date reception</th><th>Echeance</th><th>Responsable</th><th>Actions</th></tr></thead><tbody>{filtered.map((record) => { const delay = daysLate(record.echeance); return <tr key={record.id} className={selected?.id === record.id ? 'selectedRow' : ''} onClick={() => setSelectedId(record.id)}><td><strong>{record.reference}</strong></td><td>{record.client_nom || '-'}<br /><small>{record.contact || record.origine || record.canal || ''}</small></td><td>{record.objet || '-'}<br /><small>{record.description || ''}</small></td><td>{record.type || '-'}</td><td><span className={`statusBadge ${statusTone(record.statut)}`}>{statusLabels[normalizeStatus(record.statut)] || record.statut}</span></td><td><span className={`statusBadge ${priorityTone(record.priorite)}`}>{priorityLabels[record.priorite] || record.priorite || 'Moyenne'}</span></td><td>{record.date_reception || '-'}</td><td className={delay !== null && delay < 0 ? 'lateText' : ''}>{record.echeance || '-'} {delay !== null ? `J${delay >= 0 ? '+' : ''}${delay}` : ''}</td><td>{record.responsable || '-'}</td><td><div className="rowActions"><button type="button" className="ghostButton iconOnlyButton" onClick={(event) => { event.stopPropagation(); setSelectedId(record.id); }}>o</button><button type="button" className="ghostButton iconOnlyButton" onClick={(event) => { event.stopPropagation(); openEdit(record); }}>M</button><button type="button" className="dangerButton" onClick={(event) => { event.stopPropagation(); remove(record); }}>Suppr.</button></div></td></tr>; })}{filtered.length === 0 && <tr><td colSpan="10" className="emptyCell">Aucune reclamation trouvee</td></tr>}</tbody></table></div></section><div className="reclamBottomGrid"><DonutCard title="Repartition par statut" total={records.length} entries={topEntries(countBy(records, (item) => statusLabels[normalizeStatus(item.statut)] || item.statut), 5)} /><DonutCard title="Repartition par type" total={records.length} entries={topEntries(countBy(records, 'type'), 5)} /><section className="dashPanel reclamMiniPanel"><div className="dashPanelHeader"><strong>Top 5 clients</strong></div><div className="quoteMiniStats">{topEntries(countBy(records, 'client_nom'), 5).map(([label, count]) => <div key={label}><span>{label}</span><i><em style={{ width: `${percent(count, Math.max(...Object.values(countBy(records, 'client_nom')), 1))}%` }} /></i><strong>{count}</strong></div>)}</div></section></div></main><DetailPanel record={selected} onEdit={openEdit} onPlan={openActionPlan} /></div>{modalOpen && <ReclamationModal form={form} setForm={setForm} clients={clients} editing={editing} onClose={closeModal} onSubmit={submit} />}</div>
  );
}

