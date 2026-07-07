import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { listRecords } from '../services/localStore';

const CURRENT_ROLE_KEY = 'smartlab_current_role';

const roleNames = {
  responsable_appel: 'Responsable des offres',
  responsable_technique: 'Responsable technique',
  dg: 'Direction generale',
  responsable_labo: 'Responsable laboratoire',
  receptionniste: 'Reception',
  default: 'Direction generale'
};

const resources = [
  'clients',
  'devis',
  'commandes',
  'essais',
  'rapports',
  'equipements',
  'audits',
  'nonConformites',
  'reclamations',
  'personnel',
  'projets',
  'catalogueEssais',
  'resultatsEssais',
  'notifications'
];

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

function formatMoney(value) {
  const amount = Number(value || 0);
  if (amount >= 1000000) return `${(amount / 1000000).toFixed(2)}M FCFA`;
  return `${amount.toLocaleString('fr-FR')} FCFA`;
}

function statusTone(value) {
  const key = String(value || '').toLowerCase();
  if (['termine', 'valide', 'envoye', 'commande_creee', 'cloturee', 'conforme', 'actif', 'traite'].includes(key)) return 'success';
  if (['en_cours', 'en_traitement', 'validation_dg', 'validation_technique', 'planifie', 'pret_envoi'].includes(key)) return 'info';
  if (['ouverte', 'en_attente', 'redaction', 'brouillon', 'a_surveiller', 'a_suivre'].includes(key)) return 'warning';
  if (['refuse', 'hors_service', 'non_conforme', 'annule'].includes(key)) return 'danger';
  return 'neutral';
}

function safeDate(record) {
  return record.date || record.date_demande || record.date_reception || record.date_prelevement || record.date_resultat || record.updated_at || '';
}

function byRecent(records) {
  return [...records].sort((a, b) => String(safeDate(b)).localeCompare(String(safeDate(a))));
}

function percent(value, total) {
  if (!total) return 0;
  return Math.round((value / total) * 100);
}

function countBy(records, field) {
  return records.reduce((acc, record) => {
    const key = record[field] || 'Non renseigne';
    acc[key] = (acc[key] || 0) + 1;
    return acc;
  }, {});
}

function lastMonthsLabels() {
  return ['Juil.', 'Aout', 'Sept.', 'Oct.', 'Nov.', 'Dec.', 'Janv.', 'Fevr.', 'Mars', 'Avr.', 'Mai', 'Juin'];
}

function buildSeries(counts, factor = 1) {
  const values = lastMonthsLabels().map((_, index) => Math.max(0, Math.round((counts + index * factor + ((index % 3) * factor)) / 2)));
  const max = Math.max(...values, 1);
  return values.map((value, index) => ({
    x: 20 + index * 52,
    y: 120 - (value / max) * 95,
    value
  }));
}

function points(series) {
  return series.map((point) => `${point.x},${point.y}`).join(' ');
}

function KpiCard({ label, value, note, tone, icon }) {
  return (
    <section className={`dashKpiCard ${tone || 'blue'}`}>
      <div>
        <span>{label}</span>
        <strong>{value}</strong>
        {note && <small>{note}</small>}
      </div>
      <b>{icon}</b>
    </section>
  );
}

function ActivityChart({ data }) {
  const devis = buildSeries((data.devis || []).length, 3);
  const essais = buildSeries((data.essais || []).length, 5);
  const rapports = buildSeries((data.rapports || []).length, 2);
  const reclamations = buildSeries((data.reclamations || []).length, 1);
  const labels = lastMonthsLabels();

  return (
    <section className="dashPanel dashActivity">
      <div className="dashPanelHeader">
        <strong>Activite du laboratoire</strong>
        <span>12 derniers mois</span>
      </div>
      <div className="dashLegend">
        <i className="blue" /> Devis
        <i className="purple" /> Essais
        <i className="green" /> Rapports
        <i className="red" /> Reclamations
      </div>
      <svg className="dashLineChart" viewBox="0 0 620 160" role="img" aria-label="Activite du laboratoire">
        {[35, 65, 95, 125].map((y) => <line key={y} x1="20" y1={y} x2="592" y2={y} />)}
        <polyline className="line blue" points={points(devis)} />
        <polyline className="line purple" points={points(essais)} />
        <polyline className="line green" points={points(rapports)} />
        <polyline className="line red" points={points(reclamations)} />
        {labels.map((label, index) => <text key={label} x={20 + index * 52} y="152">{label}</text>)}
      </svg>
    </section>
  );
}

function StatusDonut({ essais }) {
  const counts = countBy(essais, 'statut');
  const entries = Object.entries(counts);
  const total = essais.length || 1;
  const colors = ['#2f80ed', '#f59e0b', '#7c3aed', '#22c55e', '#ef4444'];
  let cursor = 0;
  const gradient = entries.map(([, count], index) => {
    const start = cursor;
    cursor += (count / total) * 360;
    return `${colors[index % colors.length]} ${start}deg ${cursor}deg`;
  }).join(', ');

  return (
    <section className="dashPanel dashDonutPanel">
      <div className="dashPanelHeader">
        <strong>Repartition des essais par statut</strong>
        <span>Ce mois</span>
      </div>
      <div className="dashDonutWrap">
        <div className="dashDonut" style={{ background: `conic-gradient(${gradient || '#1f2937 0deg 360deg'})` }}>
          <strong>{essais.length}</strong>
          <span>Total</span>
        </div>
        <div className="dashDonutLegend">
          {entries.map(([label, count], index) => (
            <div key={label}>
              <i style={{ background: colors[index % colors.length] }} />
              <span>{label}</span>
              <strong>{count} ({percent(count, total)}%)</strong>
            </div>
          ))}
          {entries.length === 0 && <div>Aucun essai</div>}
        </div>
      </div>
    </section>
  );
}

function AlertsPanel({ alerts }) {
  return (
    <section className="dashPanel dashSideCard">
      <div className="dashPanelHeader">
        <strong>Alertes & notifications</strong>
        <Link to="/non-conformites">Voir tout</Link>
      </div>
      <div className="dashAlertList">
        {alerts.slice(0, 4).map((alert) => (
          <Link to={alert.to} className={`dashAlertItem ${alert.tone}`} key={`${alert.title}-${alert.message}`}>
            <b>{alert.icon}</b>
            <span>
              <strong>{alert.title}</strong>
              <small>{alert.message}</small>
            </span>
            <em>{alert.time}</em>
          </Link>
        ))}
        {alerts.length === 0 && <div className="notificationEmpty">Aucune alerte active</div>}
      </div>
    </section>
  );
}

function RecentPanel({ items }) {
  return (
    <section className="dashPanel dashSideCard">
      <div className="dashPanelHeader">
        <strong>Activite recente</strong>
      </div>
      <div className="dashRecentList">
        {items.slice(0, 5).map((item) => (
          <Link to={item.to} key={item.id} className="dashRecentItem">
            <b className={item.tone}>{item.icon}</b>
            <span>
              <strong>{item.title}</strong>
              <small>{item.when}</small>
            </span>
          </Link>
        ))}
        {items.length === 0 && <div className="notificationEmpty">Aucune activite recente</div>}
      </div>
    </section>
  );
}

function QuickPanel() {
  const links = [
    { to: '/essais', label: 'Nouvel essai', icon: 'BE' },
    { to: '/rapports', label: 'Nouveau rapport', icon: 'RP' },
    { to: '/non-conformites', label: 'Nouvelle NC', icon: 'NC' },
    { to: '/devis', label: 'Nouveau devis', icon: 'DV' }
  ];
  return (
    <section className="dashPanel dashSideCard">
      <div className="dashPanelHeader">
        <strong>Acces rapides</strong>
      </div>
      <div className="dashQuickGrid">
        {links.map((link) => <Link to={link.to} key={link.to}><b>{link.icon}</b>{link.label}</Link>)}
      </div>
    </section>
  );
}

function DataTable({ title, badge, rows, columns, footerTo, footerLabel }) {
  return (
    <section className="dashPanel dashTablePanel">
      <div className="dashPanelHeader">
        <strong>{title} {badge ? <em>{badge}</em> : null}</strong>
      </div>
      <div className="tableScroll">
        <table>
          <thead>
            <tr>{columns.map((column) => <th key={column.key}>{column.label}</th>)}</tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.id || row.numero || row.reference}>
                {columns.map((column) => (
                  <td key={column.key}>{column.render ? column.render(row) : row[column.key] || '-'}</td>
                ))}
              </tr>
            ))}
            {rows.length === 0 && <tr><td colSpan={columns.length} className="emptyCell">Aucune donnee</td></tr>}
          </tbody>
        </table>
      </div>
      {footerTo && <Link className="dashTableFooter" to={footerTo}>{footerLabel}</Link>}
    </section>
  );
}

function Dashboard() {
  const [role, setRole] = useState(localStorage.getItem(CURRENT_ROLE_KEY) || 'dg');
  const [data, setData] = useState(Object.fromEntries(resources.map((resource) => [resource, []])));

  useEffect(() => {
    let active = true;
    const refresh = async () => {
      const entries = await Promise.all(resources.map(async (resource) => [resource, await listRecords(resource)]));
      if (active) setData(Object.fromEntries(entries));
    };
    const roleHandler = (event) => setRole(event.detail || localStorage.getItem(CURRENT_ROLE_KEY) || 'dg');
    refresh();
    window.addEventListener('smartlab:data-changed', refresh);
    window.addEventListener('smartlab:role-changed', roleHandler);
    return () => {
      active = false;
      window.removeEventListener('smartlab:data-changed', refresh);
      window.removeEventListener('smartlab:role-changed', roleHandler);
    };
  }, []);

  const computed = useMemo(() => {
    const commandes = data.commandes || [];
    const devis = data.devis || [];
    const essais = data.essais || [];
    const rapports = data.rapports || [];
    const resultats = data.resultatsEssais || [];
    const reclamations = data.reclamations || [];
    const nonConformites = data.nonConformites || [];
    const equipements = data.equipements || [];
    const audits = data.audits || [];
    const ca = commandes.reduce((sum, item) => sum + Number(item.montant_ht || 0), 0);
    const conformes = resultats.filter((item) => item.decision !== 'non_conforme').length;
    const conformityRate = resultats.length ? ((conformes / resultats.length) * 100).toFixed(1) : '100.0';
    const openReclamations = reclamations.filter((item) => item.statut !== 'cloturee');
    const openNc = nonConformites.filter((item) => item.statut !== 'cloturee');
    const equipmentAlerts = equipements.filter((item) => ['a_surveiller', 'hors_service'].includes(item.statut));
    const criticalAlerts = openNc.length + equipmentAlerts.length;

    const alerts = [
      ...equipmentAlerts.map((item) => ({ title: 'Echeance equipement', message: item.designation || item.code, to: '/equipements', tone: 'amber', icon: '!', time: '5 min' })),
      ...openNc.map((item) => ({ title: 'Non-conformite critique', message: item.description || item.reference, to: '/non-conformites', tone: 'red', icon: '!', time: '15 min' })),
      ...audits.filter((item) => item.statut !== 'realise').map((item) => ({ title: 'Audit planifie', message: item.type || item.reference, to: '/audits', tone: 'blue', icon: 'A', time: '1 h' })),
      ...openReclamations.map((item) => ({ title: 'Reclamation ouverte', message: item.objet || item.reference, to: '/reclamations', tone: 'red', icon: 'R', time: '2 h' }))
    ];

    const recent = [
      ...rapports.map((item) => ({ id: `rap-${item.id}`, title: `Rapport ${item.numero || ''} ${item.statut || ''}`, to: '/rapports', icon: 'R', tone: 'success', when: item.date || 'Recent' })),
      ...essais.map((item) => ({ id: `ess-${item.id}`, title: `Nouvel essai ${item.numero || ''}`, to: '/essais', icon: 'E', tone: 'info', when: item.date || 'Recent' })),
      ...nonConformites.map((item) => ({ id: `nc-${item.id}`, title: `Non-conformite ${item.reference || ''}`, to: '/non-conformites', icon: 'N', tone: 'warning', when: item.echeance || 'Recent' })),
      ...reclamations.map((item) => ({ id: `rec-${item.id}`, title: `Reclamation ${item.reference || ''}`, to: '/reclamations', icon: 'C', tone: 'danger', when: item.date_reception || 'Recent' })),
      ...equipements.map((item) => ({ id: `eq-${item.id}`, title: `Equipement ${item.code || ''}`, to: '/equipements', icon: 'Q', tone: 'neutral', when: item.prochain_etalonnage || 'Recent' }))
    ].sort((a, b) => String(b.when).localeCompare(String(a.when)));

    const decisions = [
      ...devis.filter((item) => normalizeQuoteStatus(item.statut) === 'validation_dg').map((item) => ({ ...item, type: 'Devis', montant: item.montant_ht, priorite: item.priorite || 'Haute', date_demande: item.date })),
      ...commandes.filter((item) => item.statut === 'validation_dg').map((item) => ({ ...item, type: 'Commande', montant: item.montant_ht, priorite: item.priorite || 'Moyenne', date_demande: item.date }))
    ];

    return { ca, conformityRate, openReclamations, criticalAlerts, alerts, recent, decisions, openNc };
  }, [data]);

  const kpis = [
    { label: 'Chiffre d affaires (Mois)', value: formatMoney(computed.ca), note: '+ 12.4% vs mois precedent', tone: 'blue', icon: '$' },
    { label: 'Essais realises (Mois)', value: (data.essais || []).length, note: '+ 8.7% vs mois precedent', tone: 'purple', icon: 'LAB' },
    { label: 'Taux de conformite ISO', value: `${computed.conformityRate}%`, note: '+ 1.3% vs mois precedent', tone: 'green', icon: 'OK' },
    { label: 'Reclamations ouvertes', value: computed.openReclamations.length, note: '-50% vs mois precedent', tone: 'red', icon: 'MSG' },
    { label: 'Alertes critiques', value: computed.criticalAlerts, note: 'Action requise', tone: 'amber', icon: '!' }
  ];

  return (
    <div className="dashMockPage">
      <div className="dashMockHeader">
        <div>
          <p className="eyebrow">TESTLAB MOBILE</p>
          <h2>Dashboard</h2>
        </div>
        <div className="dashMockSearch">Rechercher un essai, client, echantillon...</div>
        <span className="dashRoleBadge">{roleNames[role] || roleNames.default}</span>
      </div>

      <div className="dashKpiGrid">
        {kpis.map((card) => <KpiCard key={card.label} {...card} />)}
      </div>

      <div className="dashMainGrid">
        <ActivityChart data={data} />
        <StatusDonut essais={data.essais || []} />
        <AlertsPanel alerts={computed.alerts} />
      </div>

      <div className="dashContentGrid">
        <div className="dashLeftStack">
          <DataTable
            title="Decisions DG attendues"
            badge={computed.decisions.length}
            rows={computed.decisions.slice(0, 4)}
            columns={[
              { key: 'numero', label: 'Reference' },
              { key: 'type', label: 'Type' },
              { key: 'client_nom', label: 'Client' },
              { key: 'projet', label: 'Projet' },
              { key: 'montant', label: 'Montant', render: (row) => formatMoney(row.montant) },
              { key: 'priorite', label: 'Priorite', render: (row) => <span className={`statusBadge ${statusTone(row.priorite)}`}>{row.priorite}</span> },
              { key: 'date_demande', label: 'Date demande' },
              { key: 'actions', label: 'Actions', render: () => <span className="dashDecisionActions"><b>OK</b><b>...</b></span> }
            ]}
            footerTo="/devis"
            footerLabel="Voir toutes les demandes"
          />
          <DataTable
            title="Risques qualite ouverts"
            badge={computed.openNc.length}
            rows={computed.openNc.slice(0, 5)}
            columns={[
              { key: 'reference', label: 'Reference' },
              { key: 'origine', label: 'Origine' },
              { key: 'description', label: 'Description' },
              { key: 'responsable', label: 'Responsable' },
              { key: 'statut', label: 'Statut', render: (row) => <span className={`statusBadge ${statusTone(row.statut)}`}>{row.statut}</span> },
              { key: 'niveau', label: 'Niveau', render: () => <span className="statusBadge danger">Majeur</span> },
              { key: 'jours', label: 'Jours restants', render: () => '3 jours' },
              { key: 'progression', label: 'Progression', render: () => <span className="dashProgress"><i style={{ width: '60%' }} /></span> },
              { key: 'actions', label: 'Actions', render: () => <Link className="ghostButton" to="/non-conformites">Voir</Link> }
            ]}
            footerTo="/non-conformites"
            footerLabel="Voir toutes les non-conformites"
          />
        </div>
        <div className="dashRightStack">
          <RecentPanel items={computed.recent} />
          <QuickPanel />
        </div>
      </div>
    </div>
  );
}

export default Dashboard;
