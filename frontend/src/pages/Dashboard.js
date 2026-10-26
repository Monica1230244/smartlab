import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { listRecords } from '../services/localStore';

const CURRENT_ROLE_KEY = 'smartlab_current_role';

const roleNames = {
  responsable_appel: 'Responsable des offres',
  responsable_technique: 'Responsable technique',
  responsable_qualite: 'Responsable qualite',
  dg: 'Direction generale',
  responsable_labo: 'Responsable laboratoire',
  responsable_metrologie: 'Responsable metrologie',
  responsable_achats: 'Responsable achats',
  responsable_finance: 'Responsable finance',
  receptionniste: 'Reception',
  auditeur: 'Auditeur interne',
  default: 'Direction generale'
};

const resources = [
  'clients',
  'demandesPrestations',
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
  'documentsQualite',
  'actionsQualite',
  'risquesOpportunites',
  'achatsApprovisionnement',
  'fournisseurs',
  'consommablesStocks',
  'factures',
  'financesAvancees',
  'satisfactionClients',
  'competencesFormations',
  'metrologieAvancee',
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

function QuickPanel({ links }) {
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

function rowReference(row) {
  return row.reference || row.numero || row.code || row.id || '-';
}

function rowLabel(row) {
  return row.designation || row.client_nom || row.client || row.objet || row.description || row.titre || row.libelle || '-';
}

function buildRoleDashboard(role, data, computed) {
  const count = (resource) => (data[resource] || []).length;
  const open = (resource, closed = ['cloturee', 'cloture', 'terminee', 'realisee', 'paye', 'annule']) => (data[resource] || []).filter((item) => !closed.includes(String(item.statut || '').toLowerCase())).length;
  const statusColumn = { key: 'statut', label: 'Statut', render: (row) => <span className={`statusBadge ${statusTone(row.statut)}`}>{row.statut || '-'}</span> };
  const commonColumns = [
    { key: 'reference', label: 'Reference', render: rowReference },
    { key: 'objet', label: 'Element', render: rowLabel },
    { key: 'responsable', label: 'Responsable', render: (row) => row.responsable || row.technicien || row.receptionne_par || '-' },
    statusColumn,
    { key: 'date', label: 'Date', render: (row) => row.date || row.date_reception || row.date_creation || row.echeance || '-' }
  ];

  const defaultView = {
    eyebrow: 'TESTLAB MOBILE',
    title: 'Tableau de bord Direction generale',
    subtitle: 'Vue consolidee de l activite, des decisions et des risques du laboratoire.',
    kpis: [
      { label: 'Chiffre d affaires', value: formatMoney(computed.ca), note: 'Commandes enregistrees', tone: 'blue', icon: '$' },
      { label: 'Essais', value: count('essais'), note: 'Objets d essais suivis', tone: 'purple', icon: 'LAB' },
      { label: 'Conformite ISO', value: `${computed.conformityRate}%`, note: 'Resultats conformes', tone: 'green', icon: 'OK' },
      { label: 'Reclamations ouvertes', value: computed.openReclamations.length, note: 'A traiter', tone: 'red', icon: 'MSG' },
      { label: 'Alertes critiques', value: computed.criticalAlerts, note: 'Action requise', tone: 'amber', icon: '!' }
    ],
    quickLinks: [
      { to: '/essais', label: 'Nouvel essai', icon: 'BE' },
      { to: '/rapports', label: 'Nouveau rapport', icon: 'RP' },
      { to: '/non-conformites', label: 'Nouvelle NC', icon: 'NC' },
      { to: '/devis', label: 'Nouveau devis', icon: 'DV' }
    ],
    primaryTitle: 'Decisions et suivis prioritaires',
    primaryRows: computed.decisions,
    primaryColumns: [
      { key: 'numero', label: 'Reference' },
      { key: 'type', label: 'Type' },
      { key: 'client_nom', label: 'Client' },
      { key: 'montant', label: 'Montant', render: (row) => formatMoney(row.montant) },
      statusColumn,
      { key: 'date_demande', label: 'Date', render: (row) => row.date_demande || '-' }
    ],
    primaryFooterTo: '/devis',
    primaryFooterLabel: 'Voir les demandes de direction',
    secondaryTitle: 'Risques qualite ouverts',
    secondaryRows: computed.openNc,
    secondaryFooterTo: '/non-conformites',
    secondaryFooterLabel: 'Voir toutes les non-conformites'
  };

  const views = {
    responsable_appel: {
      eyebrow: 'TESTLAB COMMERCIAL', title: 'Tableau de bord Offres', subtitle: 'Pilotez les demandes, devis, clients et commandes de votre portefeuille.',
      kpis: [
        { label: 'Clients actifs', value: count('clients'), note: 'Fiches clients', tone: 'blue', icon: 'CL' },
        { label: 'Demandes ouvertes', value: open('demandesPrestations'), note: 'A qualifier', tone: 'amber', icon: 'DP' },
        { label: 'Devis en attente', value: open('devis', ['valide_client', 'commande_creee', 'refuse', 'expire', 'annule']), note: 'A relancer ou soumettre', tone: 'purple', icon: 'DV' },
        { label: 'Commandes creees', value: count('commandes'), note: 'Depuis les devis valides', tone: 'green', icon: 'CM' },
        { label: 'Montant commandes', value: formatMoney(computed.ca), note: 'Somme des commandes', tone: 'blue', icon: '$' }
      ],
      quickLinks: [{ to: '/demandes-prestations', label: 'Nouvelle demande', icon: 'DP' }, { to: '/devis', label: 'Nouveau devis', icon: 'DV' }, { to: '/clients', label: 'Nouveau client', icon: 'CL' }, { to: '/commandes', label: 'Voir commandes', icon: 'CM' }],
      primaryTitle: 'Devis a suivre', primaryRows: byRecent(data.devis).slice(0, 6), primaryColumns: commonColumns, primaryFooterTo: '/devis', primaryFooterLabel: 'Voir tous les devis',
      secondaryTitle: 'Demandes de prestation ouvertes', secondaryRows: byRecent(data.demandesPrestations).filter((item) => item.statut !== 'cloturee').slice(0, 5), secondaryFooterTo: '/demandes-prestations', secondaryFooterLabel: 'Voir toutes les demandes'
    },
    responsable_technique: {
      eyebrow: 'TESTLAB TECHNIQUE', title: 'Tableau de bord Technique', subtitle: 'Validez les prestations, résultats et rapports avant leur diffusion.',
      kpis: [
        { label: 'Essais a executer', value: open('essais'), note: 'Planifies ou en cours', tone: 'blue', icon: 'ES' },
        { label: 'Resultats a valider', value: open('resultatsEssais', ['valide', 'valide_techniquement', 'exploitable']), note: 'Revue technique', tone: 'amber', icon: 'RS' },
        { label: 'Rapports a verifier', value: open('rapports', ['valide', 'envoye', 'archive']), note: 'Avant diffusion', tone: 'purple', icon: 'RP' },
        { label: 'Non-conformites', value: open('nonConformites'), note: 'Suivi technique', tone: 'red', icon: 'NC' },
        { label: 'Equipements actifs', value: count('equipements'), note: 'Disponibles au labo', tone: 'green', icon: 'EQ' }
      ],
      quickLinks: [{ to: '/essais', label: 'Affecter un essai', icon: 'ES' }, { to: '/resultats-essais', label: 'Valider resultats', icon: 'RS' }, { to: '/rapports', label: 'Verifier rapport', icon: 'RP' }, { to: '/non-conformites', label: 'Declarer une NC', icon: 'NC' }],
      primaryTitle: 'Resultats techniques a traiter', primaryRows: byRecent(data.resultatsEssais).filter((item) => !['valide', 'valide_techniquement', 'exploitable'].includes(item.statut)).slice(0, 6), primaryColumns: commonColumns, primaryFooterTo: '/resultats-essais', primaryFooterLabel: 'Voir tous les resultats',
      secondaryTitle: 'Essais en cours', secondaryRows: byRecent(data.essais).filter((item) => !['termine', 'cloture'].includes(item.statut)).slice(0, 5), secondaryFooterTo: '/essais', secondaryFooterLabel: 'Voir tous les essais'
    },
    responsable_qualite: {
      eyebrow: 'TESTLAB QUALITE ISO 17025 / ISO 9001', title: 'Tableau de bord Qualite', subtitle: 'Surveillez la conformite, les documents, les audits et les actions d amelioration.',
      kpis: [
        { label: 'Conformite globale', value: `${computed.conformityRate}%`, note: 'Resultats conformes', tone: 'green', icon: 'OK' },
        { label: 'Documents en vigueur', value: (data.documentsQualite || []).filter((item) => item.statut === 'en_vigueur').length, note: `${count('documentsQualite')} documents au total`, tone: 'blue', icon: 'DQ' },
        { label: 'Non-conformites ouvertes', value: open('nonConformites'), note: 'A traiter', tone: 'red', icon: 'NC' },
        { label: 'Actions en cours', value: open('actionsQualite'), note: 'Correctives et preventives', tone: 'purple', icon: 'AC' },
        { label: 'Audits planifies', value: open('audits', ['realise', 'cloture']), note: 'Programme qualite', tone: 'amber', icon: 'AQ' }
      ],
      quickLinks: [{ to: '/non-conformites', label: 'Enregistrer une NC', icon: 'NC' }, { to: '/actions-qualite', label: 'Creer une action', icon: 'AC' }, { to: '/audits', label: 'Planifier un audit', icon: 'AQ' }, { to: '/documents-qualite', label: 'Ajouter un document', icon: 'DQ' }],
      primaryTitle: 'Actions qualite prioritaires', primaryRows: byRecent(data.actionsQualite).filter((item) => !['terminee', 'cloturee'].includes(item.statut)).slice(0, 6), primaryColumns: commonColumns, primaryFooterTo: '/actions-qualite', primaryFooterLabel: 'Voir toutes les actions',
      secondaryTitle: 'Non-conformites ouvertes', secondaryRows: byRecent(data.nonConformites).filter((item) => item.statut !== 'cloturee').slice(0, 5), secondaryFooterTo: '/non-conformites', secondaryFooterLabel: 'Voir toutes les non-conformites'
    },
    responsable_labo: {
      eyebrow: 'TESTLAB OPERATIONS', title: 'Tableau de bord Laboratoire', subtitle: 'Organisez la reception, l execution des essais et la production des rapports.',
      kpis: [
        { label: 'Objets d essais', value: count('essais'), note: 'Dossiers enregistres', tone: 'blue', icon: 'OE' },
        { label: 'Essais en cours', value: open('essais'), note: 'A executer', tone: 'amber', icon: 'ES' },
        { label: 'Resultats saisis', value: count('resultatsEssais'), note: 'Mesures disponibles', tone: 'purple', icon: 'RS' },
        { label: 'Rapports produits', value: count('rapports'), note: 'Documents de resultat', tone: 'green', icon: 'RP' },
        { label: 'Equipements', value: count('equipements'), note: 'Parc laboratoire', tone: 'blue', icon: 'EQ' }
      ],
      quickLinks: [{ to: '/essais', label: 'Nouvel objet d essai', icon: 'OE' }, { to: '/resultats-essais', label: 'Saisir un resultat', icon: 'RS' }, { to: '/rapports', label: 'Creer un rapport', icon: 'RP' }, { to: '/planning-projets', label: 'Ouvrir le planning', icon: 'PL' }],
      primaryTitle: 'Essais a traiter', primaryRows: byRecent(data.essais).filter((item) => !['termine', 'cloture'].includes(item.statut)).slice(0, 6), primaryColumns: commonColumns, primaryFooterTo: '/essais', primaryFooterLabel: 'Voir tous les objets d essais',
      secondaryTitle: 'Derniers resultats saisis', secondaryRows: byRecent(data.resultatsEssais).slice(0, 5), secondaryFooterTo: '/resultats-essais', secondaryFooterLabel: 'Voir tous les resultats'
    },
    responsable_metrologie: {
      eyebrow: 'TESTLAB METROLOGIE', title: 'Tableau de bord Metrologie', subtitle: 'Pilotez les equipements, etalonnages, maintenances et alertes de conformite.',
      kpis: [
        { label: 'Equipements', value: count('equipements'), note: 'Parc enregistre', tone: 'blue', icon: 'EQ' },
        { label: 'A etalonner', value: open('metrologieAvancee', ['conforme']), note: 'Operations ouvertes', tone: 'amber', icon: 'ET' },
        { label: 'Hors service', value: (data.equipements || []).filter((item) => item.statut === 'hors_service').length, note: 'Action requise', tone: 'red', icon: 'HS' },
        { label: 'Maintenances', value: open('actionsQualite'), note: 'Actions liees', tone: 'purple', icon: 'MA' },
        { label: 'Stocks critiques', value: open('consommablesStocks'), note: 'A verifier', tone: 'green', icon: 'ST' }
      ],
      quickLinks: [{ to: '/equipements', label: 'Ajouter equipement', icon: 'EQ' }, { to: '/metrologie-avancee', label: 'Planifier etalonnage', icon: 'ET' }, { to: '/stocks-consommables', label: 'Voir les stocks', icon: 'ST' }, { to: '/non-conformites', label: 'Voir les alertes', icon: 'NC' }],
      primaryTitle: 'Equipements a surveiller', primaryRows: byRecent(data.equipements).filter((item) => ['hors_service', 'a_surveiller', 'en_maintenance'].includes(item.statut)).slice(0, 6), primaryColumns: commonColumns, primaryFooterTo: '/equipements', primaryFooterLabel: 'Voir tous les equipements',
      secondaryTitle: 'Operations metrologiques en cours', secondaryRows: byRecent(data.metrologieAvancee).filter((item) => item.statut !== 'conforme').slice(0, 5), secondaryFooterTo: '/metrologie-avancee', secondaryFooterLabel: 'Voir la metrologie'
    },
    responsable_achats: {
      eyebrow: 'TESTLAB ACHATS', title: 'Tableau de bord Achats & Approvisionnements', subtitle: 'Suivez les besoins, fournisseurs, receptions, stocks et commandes du laboratoire.',
      kpis: [
        { label: 'Demandes d achats', value: count('achatsApprovisionnement'), note: 'Besoins enregistres', tone: 'blue', icon: 'AA' },
        { label: 'A valider', value: open('achatsApprovisionnement'), note: 'En attente de traitement', tone: 'amber', icon: 'VL' },
        { label: 'Fournisseurs', value: count('fournisseurs'), note: 'Base fournisseurs', tone: 'purple', icon: 'FR' },
        { label: 'Stocks a surveiller', value: open('consommablesStocks'), note: 'Seuils et peremptions', tone: 'red', icon: 'ST' },
        { label: 'Commandes', value: count('commandes'), note: 'Commandes laboratoire', tone: 'green', icon: 'CM' }
      ],
      quickLinks: [{ to: '/achats-approvisionnement', label: 'Nouvelle demande', icon: 'AA' }, { to: '/fournisseurs', label: 'Ajouter fournisseur', icon: 'FR' }, { to: '/stocks-consommables', label: 'Enregistrer stock', icon: 'ST' }, { to: '/portail-fournisseur', label: 'Portail fournisseur', icon: 'PF' }],
      primaryTitle: 'Demandes d approvisionnement', primaryRows: byRecent(data.achatsApprovisionnement).slice(0, 6), primaryColumns: commonColumns, primaryFooterTo: '/achats-approvisionnement', primaryFooterLabel: 'Voir toutes les demandes',
      secondaryTitle: 'Stocks et consommables a surveiller', secondaryRows: byRecent(data.consommablesStocks).filter((item) => !['conforme', 'disponible'].includes(item.statut)).slice(0, 5), secondaryFooterTo: '/stocks-consommables', secondaryFooterLabel: 'Voir tous les stocks'
    },
    responsable_finance: {
      eyebrow: 'TESTLAB FINANCE', title: 'Tableau de bord Finance', subtitle: 'Suivez les factures, encaissements, commandes et resultats financiers du laboratoire.',
      kpis: [
        { label: 'Chiffre commandes', value: formatMoney(computed.ca), note: 'Commandes creees', tone: 'blue', icon: '$' },
        { label: 'Factures', value: count('factures'), note: 'Emises et suivies', tone: 'purple', icon: 'FC' },
        { label: 'Factures en attente', value: open('factures', ['paye', 'annulee']), note: 'A recouvrer', tone: 'amber', icon: 'AT' },
        { label: 'Operations finance', value: count('financesAvancees'), note: 'Ecritures enregistrees', tone: 'green', icon: 'FI' },
        { label: 'Clients', value: count('clients'), note: 'Comptes clients', tone: 'blue', icon: 'CL' }
      ],
      quickLinks: [{ to: '/factures', label: 'Nouvelle facture', icon: 'FC' }, { to: '/finances-avancees', label: 'Enregistrer operation', icon: 'FI' }, { to: '/commandes', label: 'Suivre commandes', icon: 'CM' }, { to: '/clients', label: 'Voir clients', icon: 'CL' }],
      primaryTitle: 'Factures a suivre', primaryRows: byRecent(data.factures).filter((item) => !['paye', 'annulee'].includes(item.statut)).slice(0, 6), primaryColumns: commonColumns, primaryFooterTo: '/factures', primaryFooterLabel: 'Voir toutes les factures',
      secondaryTitle: 'Dernieres commandes', secondaryRows: byRecent(data.commandes).slice(0, 5), secondaryFooterTo: '/commandes', secondaryFooterLabel: 'Voir toutes les commandes'
    },
    receptionniste: {
      eyebrow: 'TESTLAB RECEPTION', title: 'Tableau de bord Reception', subtitle: 'Recevez les objets d essais, verifiez les informations et orientez les dossiers.',
      kpis: [
        { label: 'Objets a receptionner', value: open('essais'), note: 'Dossiers en attente', tone: 'amber', icon: 'OE' },
        { label: 'Commandes actives', value: open('commandes'), note: 'A accueillir', tone: 'blue', icon: 'CM' },
        { label: 'Clients', value: count('clients'), note: 'Fiches disponibles', tone: 'green', icon: 'CL' },
        { label: 'Demandes nouvelles', value: open('demandesPrestations'), note: 'A transmettre', tone: 'purple', icon: 'DP' },
        { label: 'Reclamations', value: open('reclamations'), note: 'A signaler', tone: 'red', icon: 'RC' }
      ],
      quickLinks: [{ to: '/essais', label: 'Recevoir un objet', icon: 'OE' }, { to: '/commandes', label: 'Voir commandes', icon: 'CM' }, { to: '/clients', label: 'Rechercher client', icon: 'CL' }, { to: '/demandes-prestations', label: 'Nouvelle demande', icon: 'DP' }],
      primaryTitle: 'Objets d essais a receptionner', primaryRows: byRecent(data.essais).filter((item) => ['en_attente_reception', 'a_receptionner', 'en_attente'].includes(item.statut)).slice(0, 6), primaryColumns: commonColumns, primaryFooterTo: '/essais', primaryFooterLabel: 'Voir tous les objets d essais',
      secondaryTitle: 'Commandes recentes', secondaryRows: byRecent(data.commandes).slice(0, 5), secondaryFooterTo: '/commandes', secondaryFooterLabel: 'Voir toutes les commandes'
    },
    auditeur: {
      eyebrow: 'TESTLAB AUDIT', title: 'Tableau de bord Auditeur interne', subtitle: 'Consultez les preuves, ecarts, audits et actions sans modifier les donnees metier.',
      kpis: [
        { label: 'Documents qualite', value: count('documentsQualite'), note: 'Preuves documentaires', tone: 'blue', icon: 'DQ' },
        { label: 'Audits', value: count('audits'), note: 'Programme et preuves', tone: 'purple', icon: 'AQ' },
        { label: 'Non-conformites', value: count('nonConformites'), note: 'Ecarts traces', tone: 'red', icon: 'NC' },
        { label: 'Actions', value: count('actionsQualite'), note: 'Plans d actions', tone: 'amber', icon: 'AC' },
        { label: 'Risques', value: count('risquesOpportunites'), note: 'Matrice qualite', tone: 'green', icon: 'RI' }
      ],
      quickLinks: [{ to: '/documents-qualite', label: 'Consulter documents', icon: 'DQ' }, { to: '/audits', label: 'Voir les audits', icon: 'AQ' }, { to: '/actions-qualite', label: 'Verifier actions', icon: 'AC' }, { to: '/assistant-audit-iso', label: 'Preparation audit', icon: 'AI' }],
      primaryTitle: 'Dernieres preuves qualite', primaryRows: byRecent(data.documentsQualite).slice(0, 6), primaryColumns: commonColumns, primaryFooterTo: '/documents-qualite', primaryFooterLabel: 'Voir tous les documents',
      secondaryTitle: 'Ecarts et actions a verifier', secondaryRows: [...byRecent(data.nonConformites), ...byRecent(data.actionsQualite)].slice(0, 5), secondaryFooterTo: '/actions-qualite', secondaryFooterLabel: 'Voir les actions qualite'
    }
  };

  return views[role] || defaultView;
}

function Dashboard() {
  const { user } = useAuth();
  const [role, setRole] = useState(user?.role || localStorage.getItem(CURRENT_ROLE_KEY) || 'dg');
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

  useEffect(() => {
    if (user?.role) setRole(user.role);
  }, [user?.role]);

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

  const view = buildRoleDashboard(role, data, computed);
  const secondaryColumns = [
    { key: 'reference', label: 'Reference', render: rowReference },
    { key: 'objet', label: 'Element', render: rowLabel },
    { key: 'statut', label: 'Statut', render: (row) => <span className={`statusBadge ${statusTone(row.statut)}`}>{row.statut || '-'}</span> },
    { key: 'date', label: 'Echeance / date', render: (row) => row.echeance || row.date || row.date_reception || '-' }
  ];

  return (
    <div className="dashMockPage">
      <div className="dashMockHeader">
        <div>
          <p className="eyebrow">TESTLAB MOBILE</p>
          <h2>{view.title}</h2>
          <span className="dashHeaderSubtitle">{view.subtitle}</span>
        </div>
        <div className="dashMockSearch">Rechercher un essai, client, echantillon...</div>
        <span className="dashRoleBadge">{roleNames[role] || roleNames.default}</span>
      </div>

      <div className="dashKpiGrid">
        {view.kpis.map((card) => <KpiCard key={card.label} {...card} />)}
      </div>

      <div className="dashMainGrid">
        <ActivityChart data={data} />
        <StatusDonut essais={data.essais || []} />
        <AlertsPanel alerts={computed.alerts} />
      </div>

      <div className="dashContentGrid">
        <div className="dashLeftStack">
          <DataTable
            title={view.primaryTitle}
            badge={view.primaryRows.length}
            rows={view.primaryRows.slice(0, 6)}
            columns={view.primaryColumns}
            footerTo={view.primaryFooterTo}
            footerLabel={view.primaryFooterLabel}
          />
          <DataTable
            title={view.secondaryTitle}
            badge={view.secondaryRows.length}
            rows={view.secondaryRows.slice(0, 5)}
            columns={secondaryColumns}
            footerTo={view.secondaryFooterTo}
            footerLabel={view.secondaryFooterLabel}
          />
        </div>
        <div className="dashRightStack">
          <RecentPanel items={computed.recent} />
          <QuickPanel links={view.quickLinks} />
        </div>
      </div>
    </div>
  );
}

export default Dashboard;
