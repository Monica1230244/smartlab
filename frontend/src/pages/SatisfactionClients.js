import React, { useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import { deleteRecord, listRecords, upsertRecord } from '../services/localStore';
import { downloadCsv } from '../utils/exportCsv';

const emptyForm = {
  reference: '',
  client_nom: '',
  projet: '',
  rapport_reference: '',
  date_envoi: new Date().toISOString().slice(0, 10),
  date_reponse: '',
  note_globale: '4',
  delai: '4',
  qualite_rapport: '4',
  communication: '4',
  recommande: 'oui',
  commentaire: '',
  responsable: '',
  statut: 'nouvelle'
};

const statusLabels = {
  nouvelle: 'Nouvelle',
  a_suivre: 'A surveiller',
  traite: 'Traite',
  cloturee: 'Cloturee',
  insatisfait: 'Insatisfait',
  non_repondu: 'Non repondu'
};

const statusOptions = [
  ['nouvelle', 'Nouvelle'],
  ['a_suivre', 'A surveiller'],
  ['traite', 'Traite'],
  ['cloturee', 'Cloturee'],
  ['insatisfait', 'Insatisfait'],
  ['non_repondu', 'Non repondu']
];

const scoreOptions = ['1', '2', '3', '4', '5'];

function numberValue(value) {
  return Number(value || 0);
}

function average(records, field) {
  if (!records.length) return 0;
  return records.reduce((sum, item) => sum + numberValue(item[field]), 0) / records.length;
}

function pct(value, total) {
  if (!total) return 0;
  return Math.round((value / total) * 100);
}

function nextReference(records) {
  const year = new Date().getFullYear();
  const max = records.reduce((highest, record) => {
    const match = String(record.reference || '').match(new RegExp(`^SAT-${year}-(\\d+)$`, 'i'));
    return match ? Math.max(highest, Number(match[1])) : highest;
  }, 0);
  return `SAT-${year}-${String(max + 1).padStart(3, '0')}`;
}

function statusTone(record) {
  const score = numberValue(record.note_globale);
  const status = String(record.statut || '').toLowerCase();
  if (status === 'insatisfait' || score <= 2) return 'danger';
  if (status === 'a_suivre' || score === 3) return 'warning';
  if (['traite', 'cloturee'].includes(status) || score >= 4) return 'success';
  return 'neutral';
}

function satisfactionLabel(record) {
  const score = numberValue(record.note_globale);
  if (record.statut === 'non_repondu') return 'Non repondu';
  if (score >= 4.5) return 'Tres satisfait';
  if (score >= 4) return 'Satisfait';
  if (score >= 3) return 'A surveiller';
  return 'Insatisfait';
}

function stars(value) {
  const score = Math.round(numberValue(value));
  return Array.from({ length: 5 }, (_, index) => <span key={index} className={index < score ? 'on' : ''}>?</span>);
}

function countBy(records, field) {
  return records.reduce((acc, record) => {
    const key = record[field] || 'Non renseigne';
    acc[key] = (acc[key] || 0) + 1;
    return acc;
  }, {});
}

function topEntries(map, limit = 5) {
  return Object.entries(map).sort((a, b) => b[1] - a[1]).slice(0, limit);
}

function CycleSatisfaction() {
  const steps = ['Rapport emis', 'Enquete envoyee', 'Reponse client', 'Analyse satisfaction', 'Actions amelioration'];
  return (
    <section className="dashPanel satisfactionCyclePanel">
      <div className="dashPanelHeader"><strong>Cycle de satisfaction client</strong></div>
      <div className="satisfactionCycle">
        {steps.map((step, index) => (
          <div className="satisfactionCycleStep" key={step}>
            <b>{index + 1}</b>
            <span>{step}</span>
          </div>
        ))}
      </div>
    </section>
  );
}

function SatisfactionDonut({ records }) {
  const total = records.length || 1;
  const answered = records.filter((item) => item.date_reponse).length;
  const pending = records.filter((item) => !item.date_reponse && item.statut !== 'non_repondu').length;
  const missing = records.filter((item) => item.statut === 'non_repondu').length;
  const values = [answered, pending, missing];
  const colors = ['#00d4aa', '#f59e0b', '#ef4444'];
  let cursor = 0;
  const gradient = values.map((value, index) => {
    const start = cursor;
    cursor += (value / total) * 360;
    return `${colors[index]} ${start}deg ${cursor}deg`;
  }).join(', ');
  return (
    <section className="dashPanel satisfactionDonutPanel">
      <div className="dashPanelHeader"><strong>Enquetes ce mois</strong></div>
      <div className="satisfactionDonutWrap">
        <div className="dashDonut satisfactionDonut" style={{ background: `conic-gradient(${gradient || '#1f2937 0deg 360deg'})` }}>
          <strong>{records.length}</strong><span>Total</span>
        </div>
        <div className="dashDonutLegend">
          <div><i style={{ background: colors[0] }} /><span>Reponses</span><strong>{answered} ({pct(answered, total)}%)</strong></div>
          <div><i style={{ background: colors[1] }} /><span>En attente</span><strong>{pending} ({pct(pending, total)}%)</strong></div>
          <div><i style={{ background: colors[2] }} /><span>Non repondu</span><strong>{missing} ({pct(missing, total)}%)</strong></div>
        </div>
      </div>
    </section>
  );
}

function MiniLine({ records }) {
  const avg = average(records, 'note_globale') || 0;
  const values = [Math.max(0, avg - 0.6), avg - 0.3, avg - 0.2, avg, avg - 0.1, avg + 0.2].map((v) => Math.max(0, Math.min(5, v)));
  const pts = values.map((value, index) => `${20 + index * 48},${120 - (value / 5) * 88}`).join(' ');
  const labels = ['Dec.', 'Janv.', 'Fev.', 'Mars', 'Avr.', 'Mai'];
  return (
    <section className="dashPanel satisfactionMiniPanel">
      <div className="dashPanelHeader"><strong>Evolution de la satisfaction</strong><span>{avg.toFixed(1)}/5</span></div>
      <svg className="satisfactionLine" viewBox="0 0 285 145" role="img" aria-label="Evolution satisfaction">
        {[25, 50, 75, 100, 125].map((y) => <line key={y} x1="20" y1={y} x2="265" y2={y} />)}
        <polyline points={pts} />
        {values.map((value, index) => <circle key={index} cx={20 + index * 48} cy={120 - (value / 5) * 88} r="4" />)}
        {labels.map((label, index) => <text key={label} x={12 + index * 48} y="140">{label}</text>)}
      </svg>
    </section>
  );
}

function ScoreBars({ title, entries }) {
  return (
    <section className="dashPanel satisfactionMiniPanel">
      <div className="dashPanelHeader"><strong>{title}</strong></div>
      <div className="satisfactionBars">
        {entries.map(([label, score]) => (
          <div key={label}>
            <span>{label}</span><i><em style={{ width: `${Math.min(100, (score / 5) * 100)}%` }} /></i><strong>{Number(score).toFixed(1)}</strong>
          </div>
        ))}
      </div>
    </section>
  );
}

function DetailPanel({ record, onEdit, onHistory }) {
  if (!record) {
    return (
      <aside className="dashPanel satisfactionDetail">
        <div className="notificationEmpty">Selectionnez une enquete pour voir le detail.</div>
      </aside>
    );
  }
  const avg = average([record], 'note_globale');
  return (
    <aside className="dashPanel satisfactionDetail">
      <div className="dashPanelHeader"><strong>Detail de l'enquete</strong><span>{record.reference}</span></div>
      <div className="satisfactionDetailBody">
        <h3>{record.client_nom || 'Client'}</h3>
        <span className={`statusBadge ${statusTone(record)}`}>{satisfactionLabel(record)}</span>
        <dl>
          <dt>Rapport / reference</dt><dd>{record.rapport_reference || record.reference}</dd>
          <dt>Projet</dt><dd>{record.projet || '-'}</dd>
          <dt>Date envoi</dt><dd>{record.date_envoi || '-'}</dd>
          <dt>Date reponse</dt><dd>{record.date_reponse || '-'}</dd>
          <dt>Responsable</dt><dd>{record.responsable || '-'}</dd>
        </dl>
        <h4>Notes detaillees</h4>
        <div className="satisfactionRatings">
          <div><span>Qualite du service</span><b>{stars(record.note_globale)}</b><em>{avg.toFixed(1)}/5</em></div>
          <div><span>Respect des delais</span><b>{stars(record.delai)}</b><em>{record.delai || '-'}/5</em></div>
          <div><span>Qualite des rapports</span><b>{stars(record.qualite_rapport)}</b><em>{record.qualite_rapport || '-'}/5</em></div>
          <div><span>Accueil & communication</span><b>{stars(record.communication)}</b><em>{record.communication || '-'}/5</em></div>
        </div>
        <h4>Commentaire client</h4>
        <p>{record.commentaire || 'Aucun commentaire renseigne.'}</p>
        <div className="satisfactionDetailActions">
          <button type="button" className="primaryButton" onClick={() => onEdit(record)}>Modifier</button>
          <button type="button" className="ghostButton" onClick={() => onHistory(record)}>Historique client</button>
        </div>
      </div>
    </aside>
  );
}

function SatisfactionModal({ form, clients, onClose, onSubmit, setForm, editing }) {
  const update = (field, value) => setForm((current) => ({ ...current, [field]: value }));
  return (
    <div className="modalOverlay" onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
      <form className="modalPanel" onSubmit={onSubmit}>
        <div className="modalHeader"><strong>{editing ? 'Modifier enquete' : 'Nouvelle enquete manuelle'}</strong><button type="button" className="modalClose" onClick={onClose}>x</button></div>
        <div className="modalBody"><div className="formGrid">
          <label><span>Reference</span><input value={form.reference} readOnly /></label>
          <label><span>Client</span><select value={form.client_nom} required onChange={(event) => update('client_nom', event.target.value)}><option value="">Selectionner</option>{clients.map((client) => <option key={client.id} value={client.raison_sociale}>{client.raison_sociale}</option>)}</select></label>
          <label><span>Projet / dossier</span><input value={form.projet} onChange={(event) => update('projet', event.target.value)} /></label>
          <label><span>Rapport / reference</span><input value={form.rapport_reference} onChange={(event) => update('rapport_reference', event.target.value)} /></label>
          <label><span>Date envoi</span><input type="date" value={form.date_envoi} onChange={(event) => update('date_envoi', event.target.value)} /></label>
          <label><span>Date reponse</span><input type="date" value={form.date_reponse} onChange={(event) => update('date_reponse', event.target.value)} /></label>
          <label><span>Note globale</span><select value={form.note_globale} onChange={(event) => update('note_globale', event.target.value)}>{scoreOptions.map((score) => <option key={score} value={score}>{score} / 5</option>)}</select></label>
          <label><span>Respect delai</span><select value={form.delai} onChange={(event) => update('delai', event.target.value)}>{scoreOptions.map((score) => <option key={score} value={score}>{score} / 5</option>)}</select></label>
          <label><span>Qualite rapport</span><select value={form.qualite_rapport} onChange={(event) => update('qualite_rapport', event.target.value)}>{scoreOptions.map((score) => <option key={score} value={score}>{score} / 5</option>)}</select></label>
          <label><span>Communication</span><select value={form.communication} onChange={(event) => update('communication', event.target.value)}>{scoreOptions.map((score) => <option key={score} value={score}>{score} / 5</option>)}</select></label>
          <label><span>Recommande TESTLAB</span><select value={form.recommande} onChange={(event) => update('recommande', event.target.value)}><option value="oui">Oui</option><option value="non">Non</option></select></label>
          <label><span>Statut</span><select value={form.statut} onChange={(event) => update('statut', event.target.value)}>{statusOptions.map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label>
          <label><span>Responsable suivi</span><input value={form.responsable} onChange={(event) => update('responsable', event.target.value)} /></label>
          <label className="full"><span>Commentaire client</span><textarea rows="4" value={form.commentaire} onChange={(event) => update('commentaire', event.target.value)} /></label>
        </div></div>
        <div className="modalFooter"><button type="button" className="ghostButton" onClick={onClose}>Annuler</button><button type="submit" className="primaryButton">Enregistrer</button></div>
      </form>
    </div>
  );
}

export default function SatisfactionClients() {
  const [records, setRecords] = useState([]);
  const [clients, setClients] = useState([]);
  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedId, setSelectedId] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(emptyForm);

  const refresh = async () => {
    const [nextRecords, nextClients] = await Promise.all([listRecords('satisfactionClients'), listRecords('clients')]);
    setRecords(nextRecords);
    setClients(nextClients);
    if (!selectedId && nextRecords[0]) setSelectedId(nextRecords[0].id);
  };

  useEffect(() => {
    let active = true;
    const load = async () => {
      const [nextRecords, nextClients] = await Promise.all([listRecords('satisfactionClients'), listRecords('clients')]);
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
      .filter((item) => statusFilter === 'all' || item.statut === statusFilter)
      .filter((item) => !needle || Object.values(item).join(' ').toLowerCase().includes(needle))
      .sort((a, b) => String(a.reference || '').localeCompare(String(b.reference || ''), 'fr', { numeric: true }));
  }, [records, query, statusFilter]);

  const selected = records.find((item) => item.id === selectedId) || filtered[0] || null;
  const avg = average(records, 'note_globale');
  const satisfactionRate = pct(records.filter((item) => numberValue(item.note_globale) >= 4).length, records.length);
  const responseRate = pct(records.filter((item) => item.date_reponse).length, records.length);
  const unhappy = records.filter((item) => numberValue(item.note_globale) <= 2 || item.statut === 'insatisfait').length;
  const nps = records.length ? Math.round(((records.filter((item) => numberValue(item.note_globale) >= 4).length - records.filter((item) => numberValue(item.note_globale) <= 2).length) / records.length) * 100) : 0;
  const statusTabs = ['all', 'traite', 'a_suivre', 'insatisfait', 'non_repondu'];

  const openCreate = () => { setEditing(null); setForm({ ...emptyForm, reference: nextReference(records) }); setModalOpen(true); };
  const openEdit = (record) => { setEditing(record); setForm({ ...emptyForm, ...record }); setModalOpen(true); };
  const closeModal = () => { setModalOpen(false); setEditing(null); };

  const submit = async (event) => {
    event.preventDefault();
    const saved = await upsertRecord('satisfactionClients', { ...form, id: editing?.id || form.id });
    toast.success(editing ? 'Enquete modifiee' : 'Enquete ajoutee');
    setSelectedId(saved.id);
    closeModal();
    refresh();
  };

  const remove = async (record) => {
    if (!window.confirm(`Supprimer ${record.reference} ?`)) return;
    await deleteRecord('satisfactionClients', record.id);
    toast.success('Enquete supprimee');
    setSelectedId(null);
    refresh();
  };

  const resetFilters = () => {
    setQuery('');
    setStatusFilter('all');
    toast.success('Filtres satisfaction reinitialises');
  };

  const showClientHistory = (record) => {
    if (!record?.client_nom) return;
    setQuery(record.client_nom);
    setStatusFilter('all');
    toast.success(`Historique filtre pour ${record.client_nom}`);
  };

  const exportSurveys = () => {
    if (!downloadCsv('satisfaction-clients.csv', filtered)) toast.error('Aucune enquete a exporter');
  };

  const labScores = topEntries(countBy(records, 'projet'), 4).map(([label]) => [label, average(records.filter((item) => (item.projet || 'Non renseigne') === label), 'note_globale') || avg]);
  const scoreByType = [
    ['Qualite service', average(records, 'note_globale')],
    ['Respect delai', average(records, 'delai')],
    ['Qualite rapport', average(records, 'qualite_rapport')],
    ['Communication', average(records, 'communication')]
  ];

  return (
    <div className="dashMockPage satisfactionPage">
      <div className="dashMockHeader">
        <div><p className="eyebrow">TESTLAB MOBILE</p><h2>Satisfaction Client</h2><span className="achatSubtitle">Mesurez et ameliorez la satisfaction de vos clients.</span></div>
        <div className="dashMockSearch"><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Rechercher un client, une enquete, un rapport..." /></div>
        <button type="button" className="primaryButton" onClick={openCreate}>+ Nouvelle enquete manuelle</button>
      </div>

      <div className="dashKpiGrid satisfactionKpiGrid">
        <section className="dashKpiCard purple"><div><span>Taux de satisfaction global</span><strong>{satisfactionRate}%</strong><small>Clients notes 4/5 ou plus</small></div><b>{satisfactionRate}%</b></section>
        <section className="dashKpiCard blue"><div><span>Note moyenne</span><strong>{avg.toFixed(1)} / 5</strong><small>Moyenne des reponses</small></div><b>{avg.toFixed(1)}</b></section>
        <section className="dashKpiCard green"><div><span>Enquetes envoyees</span><strong>{records.length}</strong><small>Base satisfaction reelle</small></div><b>ENQ</b></section>
        <section className="dashKpiCard amber"><div><span>Taux de reponse</span><strong>{responseRate}%</strong><small>Reponses clients recues</small></div><b>{responseRate}%</b></section>
        <section className="dashKpiCard red"><div><span>Clients insatisfaits</span><strong>{unhappy}</strong><small>A traiter en priorite</small></div><b>!</b></section>
        <section className="dashKpiCard green"><div><span>NPS</span><strong>{nps >= 0 ? '+' : ''}{nps}</strong><small>Net Promoter Score</small></div><b>NPS</b></section>
      </div>

      <div className="satisfactionTopGrid"><CycleSatisfaction /><SatisfactionDonut records={records} /></div>

      <div className="satisfactionMainGrid">
        <div className="satisfactionLeftStack">
          <section className="dashPanel satisfactionTablePanel">
            <div className="achatTabs">
              {statusTabs.map((status) => <button type="button" key={status} className={statusFilter === status ? 'active' : ''} onClick={() => setStatusFilter(status)}>{status === 'all' ? 'Resultats des enquetes' : statusLabels[status]}</button>)}
            </div>
            <div className="tableTools achatFilters">
              <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}>{statusTabs.map((status) => <option value={status} key={status}>{status === 'all' ? 'Statut : Tous' : statusLabels[status]}</option>)}</select>
              <select defaultValue="month"><option value="month">Periode : Ce mois</option><option value="year">Cette annee</option></select>
              <select defaultValue="all"><option value="all">Responsable : Tous</option></select>
              <button type="button" className="ghostButton" onClick={resetFilters}>Filtres avances</button>
            </div>
            <div className="tableScroll"><table><thead><tr><th>Client</th><th>Rapport / reference</th><th>Date envoi</th><th>Date reponse</th><th>Note moyenne</th><th>Statut</th><th>NPS</th><th>Actions</th></tr></thead><tbody>
              {filtered.map((record) => <tr key={record.id} className={selected?.id === record.id ? 'selectedRow' : ''} onClick={() => setSelectedId(record.id)}><td><strong>{record.client_nom}</strong></td><td>{record.rapport_reference || record.reference}<br /><small>{record.projet || '-'}</small></td><td>{record.date_envoi || '-'}</td><td>{record.date_reponse || '-'}</td><td><span className="starRating">{stars(record.note_globale)}</span> {Number(record.note_globale || 0).toFixed(1)}/5</td><td><span className={`statusBadge ${statusTone(record)}`}>{satisfactionLabel(record)}</span></td><td>{numberValue(record.note_globale) >= 4 ? `+${Math.round(numberValue(record.note_globale) * 14)}` : numberValue(record.note_globale) <= 2 ? '-45' : '-10'}</td><td><div className="rowActions"><button type="button" className="ghostButton iconOnlyButton" onClick={(event) => { event.stopPropagation(); setSelectedId(record.id); }}>o</button><button type="button" className="ghostButton iconOnlyButton" onClick={(event) => { event.stopPropagation(); openEdit(record); }}>M</button><button type="button" className="dangerButton" onClick={(event) => { event.stopPropagation(); remove(record); }}>Supprimer</button></div></td></tr>)}
              {filtered.length === 0 && <tr><td colSpan="8" className="emptyCell">Aucune enquete satisfaction</td></tr>}
            </tbody></table></div>
          </section>

          <div className="satisfactionBottomGrid">
            <MiniLine records={records} />
            <ScoreBars title="Satisfaction par projet" entries={labScores.length ? labScores : [['Aucune donnee', 0]]} />
            <ScoreBars title="Satisfaction par critere" entries={scoreByType} />
            <section className="dashPanel satisfactionMiniPanel"><div className="dashPanelHeader"><strong>Repartition des notes</strong></div><div className="satisfactionNoteDist">{[5, 4, 3, 2, 1].map((score) => { const count = records.filter((item) => Math.round(numberValue(item.note_globale)) === score).length; return <div key={score}><span>{score} etoiles</span><i><em style={{ width: `${pct(count, records.length)}%` }} /></i><strong>{count}</strong></div>; })}</div></section>
          </div>
        </div>

        <div className="satisfactionRightStack"><DetailPanel record={selected} onEdit={openEdit} onHistory={showClientHistory} /><section className="dashPanel satisfactionQuality"><div className="dashPanelHeader"><strong>Indicateur qualite lie</strong></div><div><span>Taux de satisfaction client</span><strong>{satisfactionRate}%</strong><small>{satisfactionRate >= 90 ? 'Objectif atteint' : 'Action requise'}</small></div></section></div>
      </div>

      {modalOpen && <SatisfactionModal form={form} clients={clients} setForm={setForm} editing={editing} onClose={closeModal} onSubmit={submit} />}
    </div>
  );
}

