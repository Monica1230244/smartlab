
import React, { useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import { deleteRecord, listRecords, upsertRecord } from '../services/localStore';

const emptyEquipment = {
  code: '',
  designation: '',
  famille: 'Essai beton',
  laboratoire: 'Labo Beton',
  marque: '',
  modele: '',
  numero_serie: '',
  annee_acquisition: new Date().getFullYear(),
  localisation: '',
  responsable: '',
  date_mise_service: '',
  dernier_etalonnage: '',
  prochain_etalonnage: '',
  statut: 'en_service',
  criticite: 'importante',
  taux_utilisation: 0,
  disponibilite: 98,
  mtbf: 0,
  mttr: 0,
  documents: []
};

const statusLabels = {
  en_service: 'En service',
  maintenance: 'En maintenance',
  en_panne: 'En panne',
  hors_service: 'Hors service',
  conforme: 'En service',
  a_surveiller: 'En maintenance'
};

const criticityLabels = {
  faible: 'Faible',
  moyenne: 'Moyenne',
  importante: 'Importante',
  critique: 'Critique'
};

function normalizeStatus(value) {
  const key = String(value || 'en_service').toLowerCase();
  if (key === 'conforme') return 'en_service';
  if (key === 'a_surveiller') return 'maintenance';
  return key;
}

function statusTone(value) {
  const key = normalizeStatus(value);
  if (key === 'en_service') return 'success';
  if (key === 'maintenance') return 'info';
  if (key === 'en_panne') return 'warning';
  if (key === 'hors_service') return 'danger';
  return 'neutral';
}

function criticityTone(value) {
  const key = String(value || '').toLowerCase();
  if (key === 'critique') return 'danger';
  if (key === 'importante') return 'warning';
  if (key === 'moyenne') return 'info';
  return 'success';
}

function daysUntil(date) {
  if (!date) return null;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const target = new Date(date);
  target.setHours(0, 0, 0, 0);
  return Math.round((target - today) / 86400000);
}

function nextEquipmentCode(records) {
  const max = records.reduce((highest, record) => {
    const match = String(record.code || '').match(/^EQ-(\d+)$/i);
    return match ? Math.max(highest, Number(match[1])) : highest;
  }, 0);
  return `EQ-${String(max + 1).padStart(3, '0')}`;
}

function normalizeEquipment(record) {
  const statut = normalizeStatus(record.statut);
  return {
    ...emptyEquipment,
    ...record,
    statut,
    famille: record.famille || record.type || 'Essai beton',
    laboratoire: record.laboratoire || (record.famille ? `Labo ${record.famille}` : 'Labo Beton'),
    criticite: record.criticite || (statut === 'hors_service' ? 'critique' : statut === 'maintenance' ? 'importante' : 'faible'),
    taux_utilisation: Number(record.taux_utilisation ?? (statut === 'en_service' ? 85 : 0)),
    disponibilite: Number(record.disponibilite ?? (statut === 'en_service' ? 98 : 0)),
    mtbf: Number(record.mtbf ?? 256),
    mttr: Number(record.mttr ?? 4.5),
    documents: Array.isArray(record.documents) ? record.documents : []
  };
}

function countStatus(records, status) {
  return records.filter((item) => normalizeStatus(item.statut) === status).length;
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

function percent(count, total) {
  return total ? Math.round((count / total) * 100) : 0;
}

function Sparkline({ tone = 'blue' }) {
  return <svg className={`quoteSpark ${tone}`} viewBox="0 0 120 28" aria-hidden="true"><polyline points="0,22 18,18 36,13 54,20 72,16 90,15 120,14" /></svg>;
}
function EquipmentModal({ form, setForm, editing, onClose, onSubmit }) {
  const update = (field, value) => setForm((current) => ({ ...current, [field]: value }));
  return (
    <div className="modalOverlay" onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
      <form className="modalPanel equipmentMockModal" onSubmit={onSubmit}>
        <div className="modalHeader"><strong>{editing ? 'Modifier equipement' : 'Nouvel equipement'}</strong><button type="button" className="modalClose" onClick={onClose}>x</button></div>
        <div className="modalBody"><div className="formGrid">
          <label><span>Reference</span><input value={form.code} readOnly /></label>
          <label><span>Designation</span><input value={form.designation} required onChange={(event) => update('designation', event.target.value)} /></label>
          <label><span>Type d'equipement</span><input value={form.famille} onChange={(event) => update('famille', event.target.value)} /></label>
          <label><span>Laboratoire</span><input value={form.laboratoire} onChange={(event) => update('laboratoire', event.target.value)} /></label>
          <label><span>Marque</span><input value={form.marque} onChange={(event) => update('marque', event.target.value)} /></label>
          <label><span>Modele</span><input value={form.modele} onChange={(event) => update('modele', event.target.value)} /></label>
          <label><span>N serie</span><input value={form.numero_serie} onChange={(event) => update('numero_serie', event.target.value)} /></label>
          <label><span>Annee acquisition</span><input type="number" value={form.annee_acquisition} onChange={(event) => update('annee_acquisition', event.target.value)} /></label>
          <label><span>Localisation</span><input value={form.localisation} onChange={(event) => update('localisation', event.target.value)} /></label>
          <label><span>Responsable</span><input value={form.responsable} onChange={(event) => update('responsable', event.target.value)} /></label>
          <label><span>Date mise en service</span><input type="date" value={form.date_mise_service} onChange={(event) => update('date_mise_service', event.target.value)} /></label>
          <label><span>Prochaine calibration</span><input type="date" value={form.prochain_etalonnage} onChange={(event) => update('prochain_etalonnage', event.target.value)} /></label>
          <label><span>Statut</span><select value={form.statut} onChange={(event) => update('statut', event.target.value)}><option value="en_service">En service</option><option value="maintenance">En maintenance</option><option value="en_panne">En panne</option><option value="hors_service">Hors service</option></select></label>
          <label><span>Criticite</span><select value={form.criticite} onChange={(event) => update('criticite', event.target.value)}><option value="faible">Faible</option><option value="moyenne">Moyenne</option><option value="importante">Importante</option><option value="critique">Critique</option></select></label>
          <label><span>Taux utilisation (%)</span><input type="number" min="0" max="100" value={form.taux_utilisation} onChange={(event) => update('taux_utilisation', event.target.value)} /></label>
          <label><span>Disponibilite (%)</span><input type="number" min="0" max="100" value={form.disponibilite} onChange={(event) => update('disponibilite', event.target.value)} /></label>
        </div></div>
        <div className="modalFooter"><button type="button" className="ghostButton" onClick={onClose}>Annuler</button><button type="submit" className="primaryButton">Enregistrer</button></div>
      </form>
    </div>
  );
}

function EquipmentDetail({ record, onEdit }) {
  if (!record) return <aside className="dashPanel equipDetailPanel"><div className="notificationEmpty">Selectionnez un equipement</div></aside>;
  const calibrationDelay = daysUntil(record.prochain_etalonnage);
  const docs = record.documents || [];
  return (
    <aside className="equipRightStack">
      <section className="dashPanel equipDetailPanel">
        <div className="dashPanelHeader"><strong>{record.code}</strong><span className={`statusBadge ${statusTone(record.statut)}`}>{statusLabels[record.statut] || record.statut}</span></div>
        <div className="equipDetailIntro"><div className="equipPhotoBox">EQ</div><div><strong>{record.designation}</strong><small>S/n : {record.numero_serie || '-'}</small><small>{record.laboratoire}</small><span className={`statusBadge ${criticityTone(record.criticite)}`}>{criticityLabels[record.criticite] || record.criticite}</span></div></div>
        <div className="quoteDetailBody"><div className="quoteDetailTabs"><span className="active">Details</span><span>Maintenance</span><span>Calibrations</span><span>Documents</span><span>Historique</span></div><h4>Informations generales</h4><dl><dt>Type equipement</dt><dd>{record.famille}</dd><dt>Marque / Modele</dt><dd>{record.marque || '-'} {record.modele || ''}</dd><dt>Annee acquisition</dt><dd>{record.annee_acquisition || '-'}</dd><dt>Localisation</dt><dd>{record.localisation || '-'}</dd><dt>Responsable</dt><dd>{record.responsable || '-'}</dd><dt>Date mise en service</dt><dd>{record.date_mise_service || '-'}</dd></dl>
          <div className="equipMetrics"><div><span>Utilisation</span><strong>{record.taux_utilisation}%</strong><i><em style={{ width: `${record.taux_utilisation}%` }} /></i></div><div><span>Disponibilite</span><strong>{record.disponibilite}%</strong><i><em style={{ width: `${record.disponibilite}%` }} /></i></div><div><span>MTBF</span><strong>{record.mtbf} h</strong><i><em style={{ width: '74%' }} /></i></div><div><span>MTTR</span><strong>{record.mttr} h</strong><i><em style={{ width: '35%' }} /></i></div></div>
        </div>
      </section>
      <section className="dashPanel equipDetailPanel"><div className="dashPanelHeader"><strong>Prochaine calibration</strong><button type="button" className="ghostButton">Voir planning</button></div><div className="equipCalibration"><strong>{record.prochain_etalonnage || '-'}</strong><span className={calibrationDelay !== null && calibrationDelay < 0 ? 'lateText' : ''}>{calibrationDelay !== null ? `J${calibrationDelay >= 0 ? '+' : ''}${calibrationDelay}` : 'Non planifie'}</span><i><em style={{ width: `${calibrationDelay === null ? 0 : Math.max(8, Math.min(100, 100 - Math.abs(calibrationDelay)))}%` }} /></i></div></section>
      <section className="dashPanel equipDetailPanel"><div className="dashPanelHeader"><strong>Derniere intervention</strong><button type="button" className="ghostButton">Voir detail</button></div><div className="equipIntervention"><b>MT</b><span>Maintenance preventive<br /><small>Effectuee le {record.dernier_etalonnage || '-'}</small></span></div></section>
      <section className="dashPanel equipDetailPanel"><div className="dashPanelHeader"><strong>Documents associes</strong><span>{docs.length}</span></div><div className="equipDocsList">{docs.slice(0, 4).map((doc) => <div key={doc.id || doc.titre}><span>{doc.titre || doc.type || 'Document'}</span><button type="button" className="ghostButton">↗</button></div>)}{docs.length === 0 && <div className="notificationEmpty">Aucun document associe</div>}</div><button type="button" className="primaryButton" onClick={() => onEdit(record)}>Modifier l'equipement</button></section>
    </aside>
  );
}

function MiniPanel({ title, children }) {
  return <section className="dashPanel equipMiniPanel"><div className="dashPanelHeader"><strong>{title}</strong></div>{children}</section>;
}

export default function Equipements() {
  const [records, setRecords] = useState([]);
  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [labFilter, setLabFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [selectedId, setSelectedId] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(emptyEquipment);

  const sortRecords = (items) => [...items].sort((a, b) => String(a.code || '').localeCompare(String(b.code || ''), 'fr', { numeric: true }));

  useEffect(() => {
    let active = true;
    const load = async () => {
      const items = sortRecords((await listRecords('equipements')).map(normalizeEquipment));
      if (!active) return;
      setRecords(items);
      setSelectedId((current) => current || items[0]?.id || null);
    };
    load();
    window.addEventListener('smartlab:data-changed', load);
    return () => {
      active = false;
      window.removeEventListener('smartlab:data-changed', load);
    };
  }, []);

  const labs = useMemo(() => [...new Set(records.map((item) => item.laboratoire).filter(Boolean))], [records]);
  const types = useMemo(() => [...new Set(records.map((item) => item.famille).filter(Boolean))], [records]);

  const filtered = useMemo(() => records.filter((item) => {
    const text = `${item.code} ${item.designation} ${item.famille} ${item.laboratoire} ${item.marque} ${item.modele}`.toLowerCase();
    const matchesQuery = text.includes(query.toLowerCase());
    const matchesStatus = statusFilter === 'all' || item.statut === statusFilter;
    const matchesLab = labFilter === 'all' || item.laboratoire === labFilter;
    const matchesType = typeFilter === 'all' || item.famille === typeFilter;
    return matchesQuery && matchesStatus && matchesLab && matchesType;
  }), [records, query, statusFilter, labFilter, typeFilter]);

  const selected = records.find((item) => item.id === selectedId) || filtered[0] || records[0];
  const total = records.length;
  const enService = countStatus(records, 'en_service');
  const maintenance = countStatus(records, 'maintenance');
  const enPanne = countStatus(records, 'en_panne');
  const horsService = countStatus(records, 'hors_service');
  const calibrations = records.filter((item) => {
    const delay = daysUntil(item.prochain_etalonnage);
    return delay !== null && delay >= 0 && delay <= 30;
  }).length;
  const labDistribution = topEntries(countBy(records, 'laboratoire'), 4);
  const alertItems = records.filter((item) => item.statut !== 'en_service' || (daysUntil(item.prochain_etalonnage) ?? 999) <= 15).slice(0, 4);

  const openCreate = () => {
    setEditing(null);
    setForm({
      ...emptyEquipment,
      id: `eq-${Date.now()}`,
      code: nextEquipmentCode(records),
      date_mise_service: new Date().toISOString().slice(0, 10),
      prochain_etalonnage: new Date(Date.now() + 30 * 86400000).toISOString().slice(0, 10)
    });
    setModalOpen(true);
  };

  const openEdit = (record) => {
    setEditing(record);
    setForm(normalizeEquipment(record));
    setModalOpen(true);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    const payload = normalizeEquipment({
      ...form,
      id: editing?.id || form.id || `eq-${Date.now()}`,
      documents: editing?.documents || form.documents || []
    });
    const saved = await upsertRecord('equipements', payload);
    const items = sortRecords((await listRecords('equipements')).map(normalizeEquipment));
    setRecords(items);
    setSelectedId(saved.id);
    setModalOpen(false);
    toast.success(editing ? 'Equipement modifie' : 'Equipement ajoute');
    if (saved.__syncError) toast.error(`Enregistre localement, Supabase non joignable: ${saved.__syncError}`);
  };

  const handleDelete = async (record) => {
    if (!record || !window.confirm(`Supprimer ${record.code} ?`)) return;
    await deleteRecord('equipements', record.id);
    const items = sortRecords((await listRecords('equipements')).map(normalizeEquipment));
    setRecords(items);
    setSelectedId(items[0]?.id || null);
    toast.success('Equipement supprime');
  };

  return (
    <div className="equipMockPage">
      <div className="dashMockHeader equipHeader">
        <div><span className="mockEyebrow">TESTLAB MOBILE</span><h2>Equipements</h2><p>Gerez et suivez l'ensemble de vos equipements de laboratoire</p></div>
        <label className="dashMockSearch"><span>⌕</span><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Rechercher un equipement, reference, laboratoire..." /><kbd>Ctrl + K</kbd></label>
        <button type="button" className="primaryButton" onClick={openCreate}>+ Nouvel equipement</button>
      </div>

      <div className="quoteKpiGrid equipKpiGrid">
        <div className="mockKpiCard blue"><div><span>Equipements totaux</span><strong>{total}</strong><small>+ {percent(enService, total)}% operationnels</small></div><i>▣</i><Sparkline /></div>
        <div className="mockKpiCard green"><div><span>En service</span><strong>{enService}</strong><small>{percent(enService, total)}% du parc</small></div><i>▣</i><Sparkline tone="green" /></div>
        <div className="mockKpiCard purple"><div><span>En maintenance</span><strong>{maintenance}</strong><small>{percent(maintenance, total)}% du parc</small></div><i>△</i><Sparkline tone="purple" /></div>
        <div className="mockKpiCard orange"><div><span>En panne</span><strong>{enPanne}</strong><small>{percent(enPanne, total)}% du parc</small></div><i>!</i><Sparkline tone="orange" /></div>
        <div className="mockKpiCard teal"><div><span>Calibrations a venir</span><strong>{calibrations}</strong><small>30 prochains jours</small></div><i>□</i><Sparkline tone="green" /></div>
        <div className="mockKpiCard red"><div><span>Hors service</span><strong>{horsService}</strong><small>{percent(horsService, total)}% du parc</small></div><i>×</i><Sparkline tone="red" /></div>
      </div>

      <div className="equipLayout">
        <main className="equipMain">
          <section className="dashPanel equipTablePanel">
            <div className="equipTableTop">
              <div className="achatTabs"><button className="active" type="button">Vue liste</button><button type="button">Vue par laboratoire</button><button type="button">Calendrier</button><button type="button">Vue Kanban</button></div>
              <div className="quoteTableActions"><button type="button" className="primaryButton" onClick={openCreate}>+ Nouvel equipement</button><button type="button" className="ghostButton">☷</button><button type="button" className="ghostButton">▦</button></div>
            </div>
            <div className="quoteFilters equipFilters"><select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}><option value="all">Statut : Tous</option><option value="en_service">En service</option><option value="maintenance">En maintenance</option><option value="en_panne">En panne</option><option value="hors_service">Hors service</option></select><select value={labFilter} onChange={(event) => setLabFilter(event.target.value)}><option value="all">Laboratoire : Tous</option>{labs.map((lab) => <option key={lab} value={lab}>{lab}</option>)}</select><select value={typeFilter} onChange={(event) => setTypeFilter(event.target.value)}><option value="all">Type : Tous</option>{types.map((type) => <option key={type} value={type}>{type}</option>)}</select><select><option>Criticite : Tous</option></select><button type="button" className="ghostButton">Filtres avances</button></div>
            <div className="tableScroll"><table className="mockTable equipTable"><thead><tr><th>Reference</th><th>Designation</th><th>Type</th><th>Laboratoire</th><th>Statut</th><th>Criticite</th><th>Prochaine calibration</th><th>Taux utilisation</th><th>Actions</th></tr></thead><tbody>{filtered.map((item) => {
              const delay = daysUntil(item.prochain_etalonnage);
              return <tr key={item.id} className={selected?.id === item.id ? 'selectedRow' : ''} onClick={() => setSelectedId(item.id)}><td><div className="equipReference"><span className="equipThumb">EQ</span><strong>{item.code}</strong></div></td><td><strong>{item.designation || '-'}</strong><small>S/n : {item.numero_serie || '-'}</small></td><td><span className="chip">{item.famille}</span></td><td>{item.laboratoire}</td><td><span className={`equipStatusDot ${statusTone(item.statut)}`}>{statusLabels[item.statut] || item.statut}</span></td><td><span className={`statusBadge ${criticityTone(item.criticite)}`}>{criticityLabels[item.criticite] || item.criticite}</span></td><td><strong>{item.prochain_etalonnage || '-'}</strong><small className={delay !== null && delay < 0 ? 'lateText' : ''}>{delay !== null ? `J${delay >= 0 ? '+' : ''}${delay}` : '-'}</small></td><td><div className="equipUsage"><span>{item.taux_utilisation}%</span><i><em style={{ width: `${Math.max(0, Math.min(100, item.taux_utilisation))}%` }} /></i></div></td><td><div className="rowActions"><button type="button" onClick={(event) => { event.stopPropagation(); setSelectedId(item.id); }}>⊙</button><button type="button" onClick={(event) => { event.stopPropagation(); openEdit(item); }}>✎</button><button type="button" onClick={(event) => { event.stopPropagation(); handleDelete(item); }}>⋮</button></div></td></tr>;
            })}{filtered.length === 0 && <tr><td colSpan="9" className="emptyCell">Aucun equipement trouve</td></tr>}</tbody></table></div>
            <div className="tableFooter"><span>Affichage de 1 a {filtered.length} sur {records.length} equipements</span><div><button type="button" className="pageButton active">1</button><button type="button" className="pageButton">2</button><button type="button" className="pageButton">3</button></div><select><option>10 / page</option></select></div>
          </section>

          <div className="equipBottomGrid">
            <MiniPanel title="Repartition par laboratoire"><div className="equipLabDonutWrap"><div className="dashDonut quoteSmallDonut"><strong>{total}</strong><span>Total</span></div><div className="chartLegend">{labDistribution.map(([lab, value], index) => <div key={lab}><i style={{ background: ['#2f8cff', '#22c55e', '#f59e0b', '#06b6d4'][index] }} /><span>{lab}</span><strong>{value} ({percent(value, total)}%)</strong></div>)}</div></div></MiniPanel>
            <MiniPanel title="Echeances calibrations (30 jours)"><div className="equipCalBars"><span style={{ height: '36%' }}>0-7 jours</span><span style={{ height: '52%' }}>8-15 jours</span><span style={{ height: '70%' }}>16-30 jours</span><span style={{ height: '95%' }}>+30 jours</span></div><button type="button" className="linkButton">Voir calendrier complet →</button></MiniPanel>
            <MiniPanel title="Disponibilite des equipements"><div className="equipAvailability"><div><span>Nov.</span><i style={{ height: '75%' }} /></div><div><span>Dec.</span><i style={{ height: '68%' }} /></div><div><span>Janv.</span><i style={{ height: '72%' }} /></div><div><span>Fevr.</span><i style={{ height: '90%' }} /></div><div><span>Mars</span><i style={{ height: '96%' }} /></div><div><span>Mai</span><i style={{ height: '98%' }} /></div></div><button type="button" className="linkButton">Voir le rapport complet →</button></MiniPanel>
            <MiniPanel title="Alertes equipements"><div className="equipAlerts">{alertItems.map((item) => <div key={item.id}><span className={statusTone(item.statut)}>{item.statut === 'en_panne' ? '!' : '△'}</span><strong>{item.statut === 'en_panne' ? 'Panne critique' : 'Calibration proche'}</strong><small>{item.designation}<br />{item.prochain_etalonnage || item.laboratoire}</small></div>)}{alertItems.length === 0 && <div className="notificationEmpty">Aucune alerte active</div>}</div><button type="button" className="linkButton">Voir toutes les alertes →</button></MiniPanel>
          </div>
        </main>
        <EquipmentDetail record={selected} onEdit={openEdit} />
      </div>
      {modalOpen && <EquipmentModal form={form} setForm={setForm} editing={editing} onClose={() => setModalOpen(false)} onSubmit={handleSubmit} />}
    </div>
  );
}
