import React, { useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import { deleteRecord, listRecords, upsertRecord } from '../services/localStore';

const todayIso = () => new Date().toISOString().slice(0, 10);

const essaiOptions = [
  { value: 'OPM', label: 'OPM - Optimum Proctor Modifie' },
  { value: 'RC7', label: 'RC7 - Resistance compression 7 jours' },
  { value: 'RC28', label: 'RC28 - Resistance compression 28 jours' },
  { value: 'AE', label: 'AE - Analyse eau' },
  { value: 'CBR', label: 'CBR - California Bearing Ratio' },
  { value: 'GRAN', label: 'GRAN - Granulometrie' },
  { value: 'LA', label: "LA - Limites d'Atterberg" }
];

const emptyForm = {
  numero: '',
  reference_devis: '',
  client_nom: '',
  nature: '',
  provenance: '',
  point_prelevement: '',
  date_prelevement: '',
  date: '',
  delai_livraison: '',
  essai_a_realiser: [],
  priorite: 'moyenne',
  statut: 'reception',
  receptionniste: '',
  responsable_labo: '',
  laboratoire: '',
  progression: 0,
  commentaire: ''
};

const statusOptions = [
  { value: 'reception', label: 'Reception' },
  { value: 'enregistrement', label: 'Enregistrement' },
  { value: 'preparation', label: 'Preparation' },
  { value: 'en_analyse', label: 'En analyse' },
  { value: 'validation', label: 'Validation' },
  { value: 'rapport', label: 'Rapport' },
  { value: 'livraison', label: 'Livraison' }
];

const processSteps = [
  { key: 'reception', label: 'Reception', icon: '□' },
  { key: 'enregistrement', label: 'Enregistrement', icon: '▣' },
  { key: 'preparation', label: 'Preparation', icon: '△' },
  { key: 'en_analyse', label: 'Analyse', icon: '⌁' },
  { key: 'validation', label: 'Validation', icon: '✓' },
  { key: 'rapport', label: 'Rapport', icon: '▤' },
  { key: 'livraison', label: 'Livraison', icon: '↗' }
];

const priorityOptions = [
  { value: 'basse', label: 'Basse' },
  { value: 'moyenne', label: 'Moyenne' },
  { value: 'haute', label: 'Haute' }
];

function normalizeStatus(value) {
  const aliases = {
    en_cours: 'en_analyse',
    en_attente: 'reception',
    termine: 'livraison',
    transmis: 'livraison',
    cloture: 'livraison'
  };
  return aliases[value] || value || 'reception';
}

function statusLabel(value) {
  const normalized = normalizeStatus(value);
  return statusOptions.find((option) => option.value === normalized)?.label || normalized;
}

function statusTone(value) {
  const normalized = normalizeStatus(value);
  if (['livraison', 'rapport', 'validation'].includes(normalized)) return 'success';
  if (['en_analyse', 'preparation'].includes(normalized)) return 'info';
  if (['enregistrement', 'reception'].includes(normalized)) return 'warning';
  return 'neutral';
}

function priorityTone(value) {
  if (value === 'haute') return 'danger';
  if (value === 'moyenne') return 'warning';
  return 'success';
}

function normalizeEssais(value) {
  if (Array.isArray(value)) return value;
  if (!value) return [];
  return String(value).split(',').map((item) => item.trim()).filter(Boolean);
}

function displayEssais(value) {
  const essais = normalizeEssais(value);
  return essais.length > 0 ? essais.join(', ') : '-';
}

function compareRecords(a, b) {
  return String(a.numero || '').localeCompare(String(b.numero || ''), 'fr', {
    numeric: true,
    sensitivity: 'base'
  });
}

function nextNumber(records) {
  const year = new Date().getFullYear();
  const max = records.reduce((highest, record) => {
    const match = String(record.numero || '').match(new RegExp(`^EA-${year}-(\\d+)$`, 'i'));
    return match ? Math.max(highest, Number(match[1])) : highest;
  }, 0);
  return `EA-${year}-${String(max + 1).padStart(3, '0')}`;
}

function percentFor(record) {
  if (record.progression !== undefined && record.progression !== '') {
    return Math.max(0, Math.min(100, Number(record.progression) || 0));
  }
  const index = processSteps.findIndex((step) => step.key === normalizeStatus(record.statut));
  if (index < 0) return 0;
  return Math.round(((index + 1) / processSteps.length) * 100);
}

function isSameDay(value, day = todayIso()) {
  return String(value || '').slice(0, 10) === day;
}

function isLate(record) {
  if (!record.delai_livraison) return false;
  return record.delai_livraison < todayIso() && normalizeStatus(record.statut) !== 'livraison';
}

function formFromRecord(record) {
  return {
    ...emptyForm,
    ...record,
    statut: normalizeStatus(record.statut),
    essai_a_realiser: normalizeEssais(record.essai_a_realiser),
    progression: percentFor(record)
  };
}

function buildListHtml(records) {
  const rows = records.map((record) => `
    <tr>
      <td>${record.numero || ''}</td>
      <td>${record.client_nom || ''}</td>
      <td>${record.nature || ''}</td>
      <td>${record.provenance || ''}</td>
      <td>${displayEssais(record.essai_a_realiser)}</td>
      <td>${statusLabel(record.statut)}</td>
      <td>${record.date || ''}</td>
      <td>${record.delai_livraison || ''}</td>
    </tr>
  `).join('');

  return `<!doctype html>
  <html>
    <head>
      <title>Liste des objets d'essais</title>
      <style>
        body{font-family:Arial,sans-serif;color:#0f172a;padding:24px}
        h1{font-size:22px;margin:0 0 4px}
        p{color:#64748b;margin:0 0 18px}
        table{width:100%;border-collapse:collapse;font-size:12px}
        th,td{border:1px solid #cbd5e1;padding:8px;text-align:left}
        th{background:#e2e8f0}
      </style>
    </head>
    <body>
      <h1>TESTLAB - Liste des objets d'essais</h1>
      <p>Document genere le ${new Date().toLocaleString('fr-FR')}</p>
      <table>
        <thead><tr><th>N essai</th><th>Client</th><th>Nature</th><th>Provenance</th><th>Essais</th><th>Statut</th><th>Reception</th><th>Livraison prevue</th></tr></thead>
        <tbody>${rows}</tbody>
      </table>
    </body>
  </html>`;
}

export default function Essais() {
  const [records, setRecords] = useState([]);
  const [clients, setClients] = useState([]);
  const [devis, setDevis] = useState([]);
  const [commandes, setCommandes] = useState([]);
  const [rapports, setRapports] = useState([]);
  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [natureFilter, setNatureFilter] = useState('');
  const [clientFilter, setClientFilter] = useState('');
  const [selectedId, setSelectedId] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState('');
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);

  const load = async () => {
    const [nextRecords, nextClients, nextDevis, nextCommandes, nextRapports] = await Promise.all([
      listRecords('essais'),
      listRecords('clients'),
      listRecords('devis'),
      listRecords('commandes'),
      listRecords('rapports')
    ]);
    const sorted = [...nextRecords].sort(compareRecords);
    setRecords(sorted);
    setClients(nextClients);
    setDevis(nextDevis);
    setCommandes(nextCommandes);
    setRapports(nextRapports);
    setSelectedId((current) => current || sorted[0]?.id || '');
  };

  useEffect(() => {
    load();
    const handler = () => load();
    window.addEventListener('smartlab:data-changed', handler);
    return () => window.removeEventListener('smartlab:data-changed', handler);
  }, []);

  const filteredRecords = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return records.filter((record) => {
      const matchesQuery = !needle || Object.values(record).join(' ').toLowerCase().includes(needle);
      const matchesStatus = !statusFilter || normalizeStatus(record.statut) === statusFilter;
      const matchesNature = !natureFilter || record.nature === natureFilter;
      const matchesClient = !clientFilter || record.client_nom === clientFilter;
      return matchesQuery && matchesStatus && matchesNature && matchesClient;
    }).sort(compareRecords);
  }, [records, query, statusFilter, natureFilter, clientFilter]);

  const selected = records.find((record) => record.id === selectedId) || filteredRecords[0] || records[0];
  const uniqueNatures = Array.from(new Set(records.map((record) => record.nature).filter(Boolean))).sort();
  const uniqueClients = Array.from(new Set([
    ...clients.map((client) => client.raison_sociale),
    ...records.map((record) => record.client_nom)
  ].filter(Boolean))).sort();

  const stats = [
    { label: "Echantillons recus aujourd'hui", value: records.filter((item) => isSameDay(item.date)).length, tone: 'cyan', note: '+20% vs hier' },
    { label: 'En analyse', value: records.filter((item) => normalizeStatus(item.statut) === 'en_analyse').length, tone: 'purple', note: '+12% vs hier' },
    { label: 'En validation', value: records.filter((item) => normalizeStatus(item.statut) === 'validation').length, tone: 'amber', note: '+8% vs hier' },
    { label: "Rapports generes aujourd'hui", value: rapports.filter((item) => isSameDay(item.date)).length, tone: 'green', note: '+15% vs hier' },
    { label: "Livraisons prevues aujourd'hui", value: records.filter((item) => isSameDay(item.delai_livraison)).length, tone: 'blue', note: '+10% vs hier' },
    { label: 'En retard', value: records.filter(isLate).length, tone: 'red', note: '-25% vs hier' }
  ];

  const stepCounts = processSteps.map((step) => ({
    ...step,
    count: records.filter((record) => normalizeStatus(record.statut) === step.key).length
  }));

  const openCreate = () => {
    setEditingId('');
    setForm({
      ...emptyForm,
      numero: nextNumber(records),
      date: todayIso(),
      date_prelevement: todayIso()
    });
    setModalOpen(true);
  };

  const openEdit = (record) => {
    setEditingId(record.id);
    setForm(formFromRecord(record));
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setEditingId('');
    setForm(emptyForm);
  };

  const changeField = (field, value) => {
    setForm((current) => ({ ...current, [field]: value }));
  };

  const selectDevis = (value) => {
    const quote = devis.find((item) => item.numero === value);
    setForm((current) => ({
      ...current,
      reference_devis: value,
      client_nom: quote?.client_nom || current.client_nom,
      provenance: quote?.projet || current.provenance,
      delai_livraison: quote?.delai_livraison || current.delai_livraison
    }));
  };

  const toggleEssai = (value, checked) => {
    setForm((current) => {
      const currentValues = normalizeEssais(current.essai_a_realiser);
      const nextValues = checked
        ? Array.from(new Set([...currentValues, value]))
        : currentValues.filter((item) => item !== value);
      return { ...current, essai_a_realiser: nextValues };
    });
  };

  const save = async (event) => {
    event.preventDefault();
    setSaving(true);
    if (form.reference_devis) {
      const hasCommande = commandes.some((commande) => commande.reference_devis === form.reference_devis);
      if (!hasCommande) {
        toast.error('Reception impossible: aucune commande liee a ce devis');
        setSaving(false);
        return;
      }
    }
    const payload = {
      ...form,
      id: editingId || undefined,
      statut: normalizeStatus(form.statut),
      essai_a_realiser: normalizeEssais(form.essai_a_realiser),
      progression: percentFor(form)
    };
    const saved = await upsertRecord('essais', payload);
    setSaving(false);
    if (saved.__syncError) {
      toast.error(`Enregistre localement, mais pas dans Supabase: ${saved.__syncError}`);
    } else {
      toast.success(editingId ? 'Objet modifie dans Supabase' : 'Objet ajoute dans Supabase');
    }
    closeModal();
    await load();
    setSelectedId(saved.id);
  };

  const remove = async (record) => {
    if (!window.confirm(`Supprimer ${record.numero || 'cet objet'} ?`)) return;
    await deleteRecord('essais', record.id);
    toast.success('Objet supprime');
    await load();
  };

  const generateListPdf = () => {
    const doc = window.open('', '_blank');
    if (!doc) {
      toast.error('Fenetre PDF bloquee par le navigateur');
      return;
    }
    doc.document.write(buildListHtml(filteredRecords));
    doc.document.close();
    doc.focus();
    setTimeout(() => doc.print(), 250);
  };

  return (
    <div className="essaisWorkspace">
      <section className="essaisHero">
        <div>
          <h2>Objets d'essais</h2>
          <p>Suivi en temps reel des objets recus, analyses, valides et livres par le laboratoire.</p>
        </div>
        <div className="essaisHeroSearch">
          <span>⌕</span>
          <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Rechercher (N essai, client, nature, provenance...)" />
        </div>
      </section>

      <section className="essaisStatsGrid">
        {stats.map((card) => (
          <article className={`essaisMetric ${card.tone}`} key={card.label}>
            <span className="metricIcon">□</span>
            <small>{card.label}</small>
            <strong>{card.value}</strong>
            <em>{card.note}</em>
            <span className="sparkline" />
          </article>
        ))}
      </section>

      <section className="essaisProcess">
        {stepCounts.map((step, index) => (
          <div className={`processNode ${step.key === 'en_analyse' ? 'active' : ''}`} key={step.key}>
            <div className="processIcon">{step.icon}</div>
            <strong>{step.label}</strong>
            <span>{step.count}</span>
            <small>{index % 2 === 0 ? '+2' : '+1'} aujourd'hui</small>
          </div>
        ))}
      </section>

      <section className="essaisMainGrid">
        <div className="essaisCenter">
          <div className="essaisToolbar">
            <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Rechercher un objet d'essai..." />
            <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}>
              <option value="">Statut: Tous</option>
              {statusOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
            </select>
            <select value={natureFilter} onChange={(event) => setNatureFilter(event.target.value)}>
              <option value="">Nature: Tous</option>
              {uniqueNatures.map((nature) => <option key={nature} value={nature}>{nature}</option>)}
            </select>
            <select value={clientFilter} onChange={(event) => setClientFilter(event.target.value)}>
              <option value="">Client: Tous</option>
              {uniqueClients.map((client) => <option key={client} value={client}>{client}</option>)}
            </select>
            <button type="button" className="ghostButton" onClick={generateListPdf}>Generer PDF liste</button>
            <button type="button" className="primaryButton" onClick={openCreate}>+ Nouvel objet</button>
          </div>

          <div className="essaisBoard">
            <div className="essaisTableCard">
              <div className="essaisViewTabs">
                <span className="active">Vue tableau</span>
                <span>Vue Kanban</span>
              </div>
              <div className="tableScroll">
                <table>
                  <thead>
                    <tr>
                      <th>N essai</th>
                      <th>Client</th>
                      <th>Nature</th>
                      <th>Provenance</th>
                      <th>Statut</th>
                      <th>Priorite</th>
                      <th>Reception</th>
                      <th>Progression</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredRecords.map((record) => (
                      <tr className={selected?.id === record.id ? 'selectedRow' : ''} key={record.id} onClick={() => setSelectedId(record.id)}>
                        <td><strong>{record.numero}</strong></td>
                        <td>{record.client_nom || '-'}</td>
                        <td>{record.nature || '-'}</td>
                        <td>{record.provenance || '-'}</td>
                        <td><span className={`statusBadge ${statusTone(record.statut)}`}>{statusLabel(record.statut)}</span></td>
                        <td><span className={`statusBadge ${priorityTone(record.priorite)}`}>{record.priorite || '-'}</span></td>
                        <td>{record.date || '-'}</td>
                        <td>
                          <div className="progressMini"><span style={{ width: `${percentFor(record)}%` }} /></div>
                          <small>{percentFor(record)}%</small>
                        </td>
                        <td>
                          <div className="iconActions">
                            <button type="button" title="Voir" onClick={(event) => { event.stopPropagation(); setSelectedId(record.id); }}>○</button>
                            <button type="button" title="Modifier" onClick={(event) => { event.stopPropagation(); openEdit(record); }}>✎</button>
                            <button type="button" title="Supprimer" onClick={(event) => { event.stopPropagation(); remove(record); }}>×</button>
                          </div>
                        </td>
                      </tr>
                    ))}
                    {filteredRecords.length === 0 && (
                      <tr><td colSpan="9" className="emptyCell">Aucun objet d'essai trouve</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
              <div className="essaisTableFooter">
                <span>Affichage de {filteredRecords.length} sur {records.length} objets d'essais</span>
                <span>10 / page</span>
              </div>
            </div>

            <div className="essaisKanban">
              {processSteps.slice(0, 4).map((step) => {
                const rows = filteredRecords.filter((record) => normalizeStatus(record.statut) === step.key).slice(0, 3);
                return (
                  <div className="kanbanColumn" key={step.key}>
                    <strong>{step.label} ({rows.length})</strong>
                    {rows.map((record) => (
                      <button type="button" key={record.id} className="kanbanCard" onClick={() => setSelectedId(record.id)}>
                        <span>{record.numero}</span>
                        <small>{record.nature || '-'} - {record.provenance || '-'}</small>
                        <div className="progressMini"><span style={{ width: `${percentFor(record)}%` }} /></div>
                      </button>
                    ))}
                    <button type="button" className="kanbanAdd" onClick={openCreate}>+ Ajouter</button>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        <aside className="essaisDetailPanel">
          {selected ? (
            <>
              <div className="detailHeader">
                <div>
                  <h3>{selected.numero}</h3>
                  <span className={`statusBadge ${statusTone(selected.statut)}`}>{statusLabel(selected.statut)}</span>
                </div>
                <button type="button" className="modalClose" onClick={() => setSelectedId('')}>x</button>
              </div>
              <div className="detailTabs">
                <span className="active">Details</span>
                <span>Analyses</span>
                <span>Documents</span>
                <span>Historique</span>
              </div>
              <dl className="detailList">
                <dt>Client</dt><dd>{selected.client_nom || '-'}</dd>
                <dt>Nature</dt><dd>{selected.nature || '-'}</dd>
                <dt>Provenance</dt><dd>{selected.provenance || '-'}</dd>
                <dt>Point de prelevement</dt><dd>{selected.point_prelevement || '-'}</dd>
                <dt>Date prelevement</dt><dd>{selected.date_prelevement || '-'}</dd>
                <dt>Date reception</dt><dd>{selected.date || '-'}</dd>
                <dt>Receptionne par</dt><dd>{selected.receptionniste || '-'}</dd>
                <dt>Responsable labo</dt><dd>{selected.responsable_labo || '-'}</dd>
                <dt>Date livraison prevue</dt><dd>{selected.delai_livraison || '-'}</dd>
                <dt>Essais a realiser</dt><dd>{displayEssais(selected.essai_a_realiser)}</dd>
                <dt>Priorite</dt><dd><span className={`statusBadge ${priorityTone(selected.priorite)}`}>{selected.priorite || '-'}</span></dd>
                <dt>Observations</dt><dd>{selected.commentaire || '-'}</dd>
              </dl>
              <div className="detailProgress">
                <span>Progression globale</span>
                <div className="progressMini"><span style={{ width: `${percentFor(selected)}%` }} /></div>
                <strong>{percentFor(selected)}%</strong>
              </div>
              <div className="detailActionsGrid">
                <button type="button" className="ghostButton" onClick={() => openEdit(selected)}>Modifier</button>
                <button type="button" className="ghostButton" onClick={generateListPdf}>Imprimer liste</button>
                <button type="button" className="ghostButton">Creer rapport</button>
                <button type="button" className="dangerButton" onClick={() => remove(selected)}>Annuler</button>
              </div>
            </>
          ) : (
            <div className="emptyCell">Selectionnez un objet d'essai</div>
          )}
        </aside>
      </section>

      <section className="essaisBottomGrid">
        <article className="essaisInfoCard">
          <h3>Origine des prelevements</h3>
          {['Djougou', 'Parakou', 'Cotonou', 'Porto-Novo', 'Abomey'].map((city, index) => (
            <div className="infoRow" key={city}><span>{city}</span><strong>{Math.max(1, records.length - index)}</strong></div>
          ))}
        </article>
        <article className="essaisInfoCard">
          <h3>Charge des laboratoires</h3>
          <div className="labLoads">
            <div><strong>85%</strong><span>Chimie des eaux</span></div>
            <div><strong>60%</strong><span>Beton & Materiaux</span></div>
            <div><strong>40%</strong><span>Metrologie</span></div>
          </div>
        </article>
        <article className="essaisInfoCard">
          <h3>Calendrier du laboratoire</h3>
          <div className="calendarMini">
            {Array.from({ length: 21 }, (_, index) => <span className={index === 13 ? 'active' : ''} key={index}>{index + 1}</span>)}
          </div>
        </article>
        <article className="essaisInfoCard">
          <h3>Alertes intelligentes</h3>
          <div className="alertItem">Rapport a rendre dans 24h</div>
          <div className="alertItem">Analyse bloquee depuis 3 jours</div>
          <div className="alertItem">Resultat non valide</div>
        </article>
      </section>

      {modalOpen && (
        <div className="modalOverlay" onMouseDown={(event) => event.target === event.currentTarget && closeModal()}>
          <form className="modalPanel essaisModal" onSubmit={save}>
            <div className="modalHeader">
              <strong>{editingId ? 'Modifier objet d essai' : 'Nouvel objet d essai'}</strong>
              <button type="button" className="modalClose" onClick={closeModal}>x</button>
            </div>
            <div className="modalBody">
              <div className="formGrid">
                <label>
                  <span>Numero essai</span>
                  <input value={form.numero} readOnly required />
                </label>
                <label>
                  <span>Numero devis</span>
                  <select value={form.reference_devis} onChange={(event) => selectDevis(event.target.value)}>
                    <option value="">Sans devis</option>
                    {devis.map((quote) => <option key={quote.id} value={quote.numero}>{quote.numero} - {quote.client_nom || 'Client'}</option>)}
                  </select>
                </label>
                <label>
                  <span>Client</span>
                  <input value={form.client_nom} onChange={(event) => changeField('client_nom', event.target.value)} required />
                </label>
                <label>
                  <span>Nature</span>
                  <input value={form.nature} onChange={(event) => changeField('nature', event.target.value)} required placeholder="Beton C25, eau, sol..." />
                </label>
                <label>
                  <span>Provenance</span>
                  <input value={form.provenance} onChange={(event) => changeField('provenance', event.target.value)} required placeholder="Chantier, forage, carriere..." />
                </label>
                <label>
                  <span>Point de prelevement</span>
                  <input value={form.point_prelevement} onChange={(event) => changeField('point_prelevement', event.target.value)} placeholder="Zone ou point exact" />
                </label>
                <label>
                  <span>Date de prelevement</span>
                  <input type="date" value={form.date_prelevement} onChange={(event) => changeField('date_prelevement', event.target.value)} />
                </label>
                <label>
                  <span>Date de reception</span>
                  <input type="date" value={form.date} onChange={(event) => changeField('date', event.target.value)} />
                </label>
                <label>
                  <span>Delai de livraison</span>
                  <input type="date" value={form.delai_livraison} onChange={(event) => changeField('delai_livraison', event.target.value)} />
                </label>
                <label>
                  <span>Priorite</span>
                  <select value={form.priorite} onChange={(event) => changeField('priorite', event.target.value)}>
                    {priorityOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
                  </select>
                </label>
                <label>
                  <span>Statut</span>
                  <select value={form.statut} onChange={(event) => changeField('statut', event.target.value)}>
                    {statusOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
                  </select>
                </label>
                <label>
                  <span>Progression (%)</span>
                  <input type="number" min="0" max="100" value={form.progression} onChange={(event) => changeField('progression', event.target.value)} />
                </label>
                <label>
                  <span>Receptionniste</span>
                  <input value={form.receptionniste} onChange={(event) => changeField('receptionniste', event.target.value)} />
                </label>
                <label>
                  <span>Responsable labo</span>
                  <input value={form.responsable_labo} onChange={(event) => changeField('responsable_labo', event.target.value)} />
                </label>
                <label>
                  <span>Laboratoire</span>
                  <input value={form.laboratoire} onChange={(event) => changeField('laboratoire', event.target.value)} placeholder="Beton, chimie, metrologie..." />
                </label>
                <label className="full">
                  <span>Essais a realiser</span>
                  <div className="multiSelectPanel">
                    {essaiOptions.map((option) => {
                      const selectedValues = normalizeEssais(form.essai_a_realiser);
                      return (
                        <label className="multiSelectOption" key={option.value}>
                          <input
                            type="checkbox"
                            checked={selectedValues.includes(option.value)}
                            onChange={(event) => toggleEssai(option.value, event.target.checked)}
                          />
                          <span>{option.label}</span>
                        </label>
                      );
                    })}
                  </div>
                </label>
                <label className="full">
                  <span>Commentaire</span>
                  <textarea value={form.commentaire} rows="3" onChange={(event) => changeField('commentaire', event.target.value)} placeholder="Observations, conditions de prelevement..." />
                </label>
              </div>
            </div>
            <div className="modalFooter">
              <button type="button" className="ghostButton" onClick={closeModal}>Annuler</button>
              <button type="submit" className="primaryButton" disabled={saving}>{saving ? 'Synchronisation...' : 'Enregistrer'}</button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
