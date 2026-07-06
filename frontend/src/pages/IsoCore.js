import React, { useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import { deleteRecord, listRecords, upsertRecord } from '../services/localStore';
import { downloadCsv } from '../utils/exportCsv';

const today = () => new Date().toISOString().slice(0, 10);

function percent(count, total) {
  return total ? Math.round((count / total) * 100) : 0;
}

function nextCode(records, prefix) {
  const year = new Date().getFullYear();
  const max = records.reduce((highest, record) => {
    const match = String(record.reference || '').match(new RegExp(`^${prefix}-${year}-(\\d+)$`, 'i'));
    return match ? Math.max(highest, Number(match[1])) : highest;
  }, 0);
  return `${prefix}-${year}-${String(max + 1).padStart(3, '0')}`;
}

function priorityTone(value) {
  if (String(value).toLowerCase() === 'haute') return 'danger';
  if (String(value).toLowerCase() === 'moyenne') return 'warning';
  return 'success';
}

function statusTone(value) {
  const status = String(value || '').toLowerCase();
  if (['cloturee', 'cloture', 'terminee', 'realisee', 'maitrise'].includes(status)) return 'success';
  if (['en_cours', 'en_suivi', 'en_preparation'].includes(status)) return 'warning';
  if (['ouverte', 'ouvert'].includes(status)) return 'info';
  return 'neutral';
}

function riskScore(record) {
  return Number(record.probabilite || 0) * Number(record.impact || 0);
}

function riskLevel(record) {
  const value = riskScore(record);
  if (value >= 16) return ['Critique', 'danger'];
  if (value >= 9) return ['Majeur', 'warning'];
  return ['Maitrise', 'success'];
}

function CoreModal({ config, form, setForm, editing, onClose, onSubmit }) {
  const update = (field, value) => setForm((current) => ({ ...current, [field]: value }));
  return (
    <div className="modalOverlay" onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
      <form className="modalPanel" onSubmit={onSubmit}>
        <div className="modalHeader"><strong>{editing ? config.editTitle : config.createTitle}</strong><button type="button" className="modalClose" onClick={onClose}>x</button></div>
        <div className="modalBody"><div className="formGrid">
          {config.fields.map((field) => {
            const value = form[field.name] ?? '';
            if (field.type === 'textarea') return <label key={field.name} className={field.full ? 'full' : ''}><span>{field.label}</span><textarea rows={field.rows || 3} required={field.required} value={value} onChange={(event) => update(field.name, event.target.value)} /></label>;
            if (field.type === 'select') return <label key={field.name} className={field.full ? 'full' : ''}><span>{field.label}</span><select value={value} required={field.required} onChange={(event) => update(field.name, event.target.value)}>{field.options.map((option) => <option key={option.value || option} value={option.value || option}>{option.label || option}</option>)}</select></label>;
            return <label key={field.name} className={field.full ? 'full' : ''}><span>{field.label}</span><input type={field.type || 'text'} min={field.min} max={field.max} readOnly={field.readOnly} required={field.required} value={value} onChange={(event) => update(field.name, field.type === 'number' ? Number(event.target.value) : event.target.value)} /></label>;
          })}
        </div></div>
        <div className="modalFooter"><button type="button" className="ghostButton" onClick={onClose}>Annuler</button><button type="submit" className="primaryButton">Enregistrer</button></div>
      </form>
    </div>
  );
}

const actionsConfig = {
  resource: 'actionsQualite',
  prefix: 'ACT',
  eyebrow: 'TESTLAB QMS',
  title: 'Gestion des actions',
  subtitle: 'Centralisez les actions correctives, preventives et d amelioration issues des audits, risques, reclamations et non-conformites.',
  createTitle: 'Nouvelle action qualite',
  editTitle: 'Modifier action qualite',
  defaultForm: { reference: '', origine: 'Non-conformite', source: '', type: 'corrective', objet: '', responsable: '', processus: 'Management Qualite', priorite: 'moyenne', date_ouverture: today(), echeance: today(), statut: 'ouverte', avancement: 0, efficacite: 'non_verifiee' },
  workflow: ['Detecter', 'Analyser', 'Planifier', 'Realiser', 'Verifier efficacite', 'Cloturer'],
  evidence: ['Source documentee', 'Responsable nomme', 'Echeance', 'Verification efficacite'],
  focus: 'Actions issues des audits, risques, reclamations et non-conformites',
  fields: [
    { name: 'reference', label: 'Reference', readOnly: true },
    { name: 'origine', label: 'Origine', type: 'select', options: ['Non-conformite', 'Reclamation', 'Audit', 'Risque', 'Revue de direction'] },
    { name: 'source', label: 'Source' },
    { name: 'type', label: 'Type', type: 'select', options: [{ value: 'corrective', label: 'Corrective' }, { value: 'preventive', label: 'Preventive' }, { value: 'amelioration', label: 'Amelioration' }] },
    { name: 'objet', label: 'Objet de l action', full: true, required: true },
    { name: 'responsable', label: 'Responsable', required: true },
    { name: 'processus', label: 'Processus' },
    { name: 'priorite', label: 'Priorite', type: 'select', options: [{ value: 'faible', label: 'Faible' }, { value: 'moyenne', label: 'Moyenne' }, { value: 'haute', label: 'Haute' }] },
    { name: 'echeance', label: 'Echeance', type: 'date' },
    { name: 'statut', label: 'Statut', type: 'select', options: [{ value: 'ouverte', label: 'Ouverte' }, { value: 'en_cours', label: 'En cours' }, { value: 'terminee', label: 'Terminee' }, { value: 'cloturee', label: 'Cloturee' }] },
    { name: 'avancement', label: 'Avancement (%)', type: 'number', min: 0, max: 100 },
    { name: 'efficacite', label: 'Verification efficacite', type: 'select', full: true, options: [{ value: 'non_verifiee', label: 'Non verifiee' }, { value: 'a_verifier', label: 'A verifier' }, { value: 'efficace', label: 'Efficace' }, { value: 'inefficace', label: 'Inefficace' }] }
  ]
};

const risksConfig = {
  resource: 'risquesOpportunites',
  prefix: 'RIS',
  eyebrow: 'ISO 9001 + ISO 17025',
  title: 'Risques & opportunites',
  subtitle: 'Identifiez, evaluez et suivez les risques et opportunites qui influencent la conformite du laboratoire.',
  createTitle: 'Nouveau risque / opportunite',
  editTitle: 'Modifier risque / opportunite',
  defaultForm: { reference: '', type: 'risque', categorie: 'Qualite', description: '', cause: '', probabilite: 1, impact: 1, responsable: '', action_associee: '', statut: 'ouvert', echeance: today() },
  workflow: ['Identifier', 'Evaluer', 'Classer', 'Traiter', 'Surveiller', 'Revoir'],
  evidence: ['Score criticite', 'Cause identifiee', 'Action associee', 'Suivi direction'],
  focus: 'Matrice probabilite x impact et actions preventives automatiques',
  fields: [
    { name: 'reference', label: 'Reference', readOnly: true },
    { name: 'type', label: 'Type', type: 'select', options: [{ value: 'risque', label: 'Risque' }, { value: 'opportunite', label: 'Opportunite' }] },
    { name: 'categorie', label: 'Categorie' },
    { name: 'responsable', label: 'Responsable', required: true },
    { name: 'description', label: 'Description', type: 'textarea', full: true, required: true },
    { name: 'cause', label: 'Cause / opportunite', type: 'textarea', full: true },
    { name: 'probabilite', label: 'Probabilite (1-5)', type: 'number', min: 1, max: 5 },
    { name: 'impact', label: 'Impact (1-5)', type: 'number', min: 1, max: 5 },
    { name: 'action_associee', label: 'Action associee' },
    { name: 'echeance', label: 'Echeance', type: 'date' },
    { name: 'statut', label: 'Statut', type: 'select', full: true, options: [{ value: 'ouvert', label: 'Ouvert' }, { value: 'en_suivi', label: 'En suivi' }, { value: 'maitrise', label: 'Maitrise' }, { value: 'cloture', label: 'Cloture' }] }
  ]
};

const reviewsConfig = {
  resource: 'revuesDirection',
  prefix: 'RD',
  eyebrow: 'Gouvernance ISO',
  title: 'Revues de direction',
  subtitle: 'Preparez les revues avec les donnees consolidees: risques, actions, audits, reclamations et satisfaction.',
  createTitle: 'Nouvelle revue de direction',
  editTitle: 'Modifier revue de direction',
  defaultForm: { reference: '', periode: '', responsable: 'Direction Generale', date_prevue: today(), statut: 'en_preparation', participants: '', decisions: '', conclusion: '' },
  workflow: ['Consolider KPI', 'Analyser risques', 'Decider', 'Affecter actions', 'Suivre efficacite'],
  evidence: ['Indicateurs', 'Risques', 'Actions', 'Decisions direction'],
  focus: 'Synthese automatique pour la direction et les audits ISO',
  fields: [
    { name: 'reference', label: 'Reference', readOnly: true },
    { name: 'periode', label: 'Periode', required: true },
    { name: 'responsable', label: 'Responsable' },
    { name: 'date_prevue', label: 'Date prevue', type: 'date' },
    { name: 'participants', label: 'Participants', full: true },
    { name: 'decisions', label: 'Decisions', type: 'textarea', full: true, rows: 4 },
    { name: 'conclusion', label: 'Conclusion', type: 'textarea', full: true, rows: 4 },
    { name: 'statut', label: 'Statut', type: 'select', full: true, options: [{ value: 'en_preparation', label: 'En preparation' }, { value: 'realisee', label: 'Realisee' }, { value: 'cloturee', label: 'Cloturee' }] }
  ]
};

function IsoRegister({ config }) {
  const [records, setRecords] = useState([]);
  const [query, setQuery] = useState('');
  const [selectedId, setSelectedId] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(config.defaultForm);

  const load = async () => {
    const next = await listRecords(config.resource);
    setRecords(next);
    setSelectedId((current) => current || next[0]?.id || null);
  };

  useEffect(() => {
    load();
    window.addEventListener('smartlab:data-changed', load);
    return () => window.removeEventListener('smartlab:data-changed', load);
  }, []);

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return records
      .filter((item) => !needle || Object.values(item).join(' ').toLowerCase().includes(needle))
      .sort((a, b) => String(a.reference || '').localeCompare(String(b.reference || ''), 'fr', { numeric: true }));
  }, [query, records]);

  const selected = records.find((item) => item.id === selectedId) || filtered[0] || null;
  const openCreate = () => { setEditing(null); setForm({ ...config.defaultForm, reference: nextCode(records, config.prefix) }); setModalOpen(true); };
  const openEdit = (record) => { setEditing(record); setForm({ ...config.defaultForm, ...record }); setModalOpen(true); };
  const submit = async (event) => {
    event.preventDefault();
    const saved = await upsertRecord(config.resource, { ...form, id: editing?.id || form.id, reference: form.reference || nextCode(records, config.prefix) });
    toast.success(editing ? 'Modification enregistree' : 'Enregistrement cree');
    setSelectedId(saved.id);
    setModalOpen(false);
    load();
  };
  const remove = async (record) => {
    if (!window.confirm(`Supprimer ${record.reference} ?`)) return;
    await deleteRecord(config.resource, record.id);
    toast.success('Element supprime');
    setSelectedId(null);
    load();
  };

  const open = records.filter((item) => !['cloturee', 'cloture', 'terminee', 'realisee'].includes(item.statut)).length;
  const closed = records.length - open;
  const critical = config.resource === 'risquesOpportunites' ? records.filter((item) => riskScore(item) >= 16 && item.statut !== 'cloture').length : records.filter((item) => item.priorite === 'haute' && !['cloturee', 'terminee'].includes(item.statut)).length;

  return (
    <div className="reclamMockPage">
      <div className="dashMockHeader reclamHeader"><div><p className="eyebrow">{config.eyebrow}</p><h2>{config.title}</h2><span className="achatSubtitle">{config.subtitle}</span></div><div className="dashMockSearch"><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Rechercher..." /></div></div>
      <div className="dashKpiGrid reclamKpiGrid"><section className="dashKpiCard blue"><div><span>Total</span><strong>{records.length}</strong><small>Donnees metier</small></div><b>{config.prefix}</b></section><section className="dashKpiCard amber"><div><span>Ouverts</span><strong>{open}</strong><small>A piloter</small></div><b>OU</b></section><section className="dashKpiCard red"><div><span>Prioritaires</span><strong>{critical}</strong><small>Action requise</small></div><b>!</b></section><section className="dashKpiCard green"><div><span>Maitrises</span><strong>{closed}</strong><small>{percent(closed, records.length)}% du registre</small></div><b>OK</b></section></div>
      <section className="isoCommandPanel"><div><span>Processus pilote</span><strong>{config.focus}</strong><small>Les workflows automatiques creent des actions, notifications et preuves d'audit lorsque les regles metier sont declenchees.</small></div><div className="isoWorkflowRail">{config.workflow.map((step, index) => <div key={step} className={index <= 1 ? 'active' : ''}><b>{index + 1}</b><span>{step}</span></div>)}</div><div className="isoEvidenceGrid">{config.evidence.map((item) => <span key={item}>{item}</span>)}</div></section>
      <div className="reclamLayout"><main className="reclamMain"><section className="dashPanel reclamTablePanel"><div className="quoteTableTop"><strong>Registre</strong><div className="rowActions"><button type="button" className="ghostButton" onClick={() => downloadCsv(`${config.resource}.csv`, filtered)}>Exporter</button><button type="button" className="primaryButton" onClick={openCreate}>+ Nouveau</button></div></div><div className="tableScroll"><table><thead><tr><th>Reference</th><th>Objet / description</th><th>Responsable</th><th>Statut</th><th>Priorite / score</th><th>Echeance</th><th>Actions</th></tr></thead><tbody>{filtered.map((record) => { const isRisk = config.resource === 'risquesOpportunites'; const [riskLabel, riskToneCls] = isRisk ? riskLevel(record) : ['', '']; return <tr key={record.id} className={selected?.id === record.id ? 'selectedRow' : ''} onClick={() => setSelectedId(record.id)}><td><strong>{record.reference}</strong><br /><small>{record.origine || record.type || record.periode || ''}</small></td><td>{record.objet || record.description || record.decisions || '-'}<br /><small>{record.source || record.cause || record.conclusion || record.justification || ''}</small></td><td>{record.responsable || '-'}</td><td><span className={`statusBadge ${statusTone(record.statut)}`}>{record.statut || '-'}</span></td><td>{isRisk ? <span className={`statusBadge ${riskToneCls}`}>{riskLabel} ({riskScore(record)})</span> : <span className={`statusBadge ${priorityTone(record.priorite)}`}>{record.priorite || '-'}</span>}</td><td>{record.echeance || record.date_prevue || '-'}</td><td><div className="rowActions"><button type="button" className="ghostButton iconOnlyButton" onClick={(event) => { event.stopPropagation(); openEdit(record); }}>M</button><button type="button" className="dangerButton" onClick={(event) => { event.stopPropagation(); remove(record); }}>Suppr.</button></div></td></tr>; })}{filtered.length === 0 && <tr><td colSpan="7" className="emptyCell">Aucune donnee trouvee</td></tr>}</tbody></table></div></section></main><aside className="reclamRightStack"><section className="dashPanel reclamDetailPanel isoDetailPanel"><div className="dashPanelHeader"><strong>{selected?.reference || 'Detail'}</strong><span className={`statusBadge ${statusTone(selected?.statut)}`}>{selected?.statut || '-'}</span></div><div className="quoteDetailBody"><h4>Informations et preuve ISO</h4><dl>{selected ? Object.entries(selected).filter(([key]) => !['id'].includes(key)).slice(0, 12).map(([key, value]) => <React.Fragment key={key}><dt>{key.replaceAll('_', ' ')}</dt><dd>{typeof value === 'object' ? JSON.stringify(value) : String(value || '-')}</dd></React.Fragment>) : <><dt>Selection</dt><dd>Aucune donnee</dd></>}</dl></div></section>{config.resource === 'risquesOpportunites' && <section className="dashPanel isoHeatmapPanel"><div className="dashPanelHeader"><strong>Matrice criticite</strong></div><div className="isoHeatmap">{[5,4,3,2,1].map((impact) => [1,2,3,4,5].map((probabilite) => { const count = records.filter((item) => Number(item.impact) === impact && Number(item.probabilite) === probabilite).length; const value = impact * probabilite; return <div key={`${impact}-${probabilite}`} className={value >= 16 ? 'danger' : value >= 9 ? 'warning' : 'success'}><b>{value}</b><small>{count}</small></div>; }))}</div></section>}</aside></div>
      {modalOpen && <CoreModal config={config} form={form} setForm={setForm} editing={editing} onClose={() => setModalOpen(false)} onSubmit={submit} />}
    </div>
  );
}

export function ActionsQualite() {
  return <IsoRegister config={actionsConfig} />;
}

export function RisquesOpportunites() {
  return <IsoRegister config={risksConfig} />;
}

export function RevuesDirection() {
  return <IsoRegister config={reviewsConfig} />;
}

export function AssistantAuditISO() {
  const [data, setData] = useState({ documentsQualite: [], equipements: [], actionsQualite: [], risquesOpportunites: [], reclamations: [], nonConformites: [], auditLogs: [] });
  useEffect(() => {
    const load = async () => {
      const resources = ['documentsQualite', 'equipements', 'actionsQualite', 'risquesOpportunites', 'reclamations', 'nonConformites', 'auditLogs'];
      const entries = await Promise.all(resources.map(async (resource) => [resource, await listRecords(resource)]));
      setData(Object.fromEntries(entries));
    };
    load();
    window.addEventListener('smartlab:data-changed', load);
    return () => window.removeEventListener('smartlab:data-changed', load);
  }, []);

  const lines = useMemo(() => {
    const docsOk = data.documentsQualite.filter((item) => item.statut === 'en_vigueur').length;
    const equipOk = data.equipements.filter((item) => ['conforme', 'en_service'].includes(item.statut)).length;
    const actionsOk = data.actionsQualite.filter((item) => ['terminee', 'cloturee'].includes(item.statut)).length;
    const risksOk = data.risquesOpportunites.filter((item) => ['maitrise', 'cloture'].includes(item.statut)).length;
    const reclamOk = data.reclamations.filter((item) => ['resolue', 'cloturee', 'traite'].includes(item.statut)).length;
    return [
      ['Documents qualite', percent(docsOk, data.documentsQualite.length), `${docsOk}/${data.documentsQualite.length} en vigueur`],
      ['Equipements', percent(equipOk, data.equipements.length), `${equipOk}/${data.equipements.length} conformes`],
      ['Actions qualite', percent(actionsOk, data.actionsQualite.length), `${actionsOk}/${data.actionsQualite.length} cloturees`],
      ['Risques & opportunites', percent(risksOk, data.risquesOpportunites.length), `${risksOk}/${data.risquesOpportunites.length} maitrises`],
      ['Reclamations', percent(reclamOk, data.reclamations.length), `${reclamOk}/${data.reclamations.length} traitees`]
    ];
  }, [data]);
  const global = Math.round(lines.reduce((sum, [, value]) => sum + value, 0) / (lines.length || 1));
  const blockers = [
    ...data.actionsQualite.filter((item) => !['terminee', 'cloturee'].includes(item.statut)).map((item) => `${item.reference} - action non cloturee`),
    ...data.risquesOpportunites.filter((item) => riskScore(item) >= 16 && item.statut !== 'cloture').map((item) => `${item.reference} - risque critique ouvert`),
    ...data.nonConformites.filter((item) => item.statut !== 'cloturee').map((item) => `${item.reference} - non-conformite ouverte`)
  ].slice(0, 8);

  return (
    <div className="reclamMockPage">
      <div className="dashMockHeader reclamHeader"><div><p className="eyebrow">Assistant audit ISO</p><h2>Preparation audit ISO 17025 / 9001</h2><span className="achatSubtitle">Controle automatique des preuves disponibles dans TESTLAB.</span></div></div>
      <div className="dashKpiGrid reclamKpiGrid"><section className={`dashKpiCard ${global >= 90 ? 'green' : global >= 75 ? 'amber' : 'red'}`}><div><span>Preparation globale</span><strong>{global}%</strong><small>Score consolide</small></div><b>ISO</b></section><section className="dashKpiCard blue"><div><span>Preuves auditees</span><strong>{data.auditLogs.length}</strong><small>Journal d audit</small></div><b>LOG</b></section><section className="dashKpiCard red"><div><span>Points bloquants</span><strong>{blockers.length}</strong><small>A corriger</small></div><b>!</b></section></div>
      <div className="reclamLayout"><main className="reclamMain"><section className="dashPanel reclamTablePanel"><div className="dashPanelHeader"><strong>Score par exigence</strong></div><div className="quoteMiniStats isoScoreList">{lines.map(([label, value, detail]) => <div key={label}><span>{label}<small>{detail}</small></span><i><em style={{ width: `${value}%` }} /></i><strong>{value}%</strong></div>)}</div></section><section className="dashPanel reclamTablePanel"><div className="dashPanelHeader"><strong>Journal d audit recent</strong></div><div className="tableScroll"><table><thead><tr><th>Date</th><th>Module</th><th>Action</th><th>Reference</th><th>Utilisateur</th></tr></thead><tbody>{data.auditLogs.slice(-10).reverse().map((log) => <tr key={log.id}><td>{String(log.date_action || '').slice(0, 19).replace('T', ' ')}</td><td>{log.resource}</td><td>{log.action}</td><td>{log.record_reference}</td><td>{log.utilisateur}</td></tr>)}{data.auditLogs.length === 0 && <tr><td colSpan="5" className="emptyCell">Aucun evenement audite pour le moment</td></tr>}</tbody></table></div></section></main><aside className="reclamRightStack"><section className="dashPanel reclamDetailPanel"><div className="dashPanelHeader"><strong>Actions recommandees</strong></div><div className="reclamActionPlan">{blockers.length === 0 ? <div className="done"><b /><span>Aucun blocage critique<small>Preparation satisfaisante</small></span></div> : blockers.map((item) => <div key={item} className="current"><b /><span>{item}<small>Verifier et cloturer avec preuve</small></span></div>)}</div></section></aside></div>
    </div>
  );
}
