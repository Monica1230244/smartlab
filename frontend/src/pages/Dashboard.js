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
  default: 'Vue generale'
};

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

function statusTone(value) {
  const key = String(value || '').toLowerCase();
  if (['conforme', 'commande_creee', 'envoye_client', 'livree', 'valide', 'termine', 'actif', 'active'].includes(key)) return 'success';
  if (['validation_technique', 'validation_dg', 'pret_envoi', 'en_cours', 'nouvelle', 'recu', 'planifie'].includes(key)) return 'info';
  if (['redaction', 'en_attente', 'a_surveiller', 'brouillon', 'ouverte'].includes(key)) return 'warning';
  if (['refuse', 'non_conforme', 'hors_service', 'inactif'].includes(key)) return 'danger';
  return 'neutral';
}

function money(value) {
  return Number(value || 0).toLocaleString('fr-FR');
}

function compactAmount(value) {
  const amount = Number(value || 0);
  if (amount >= 1000000) return `${(amount / 1000000).toFixed(2)}M`;
  return amount.toLocaleString('fr-FR');
}

function byRecentDate(records, field = 'date') {
  return [...records].sort((a, b) => String(b[field] || b.updated_at || '').localeCompare(String(a[field] || a.updated_at || '')));
}

function StatCards({ cards }) {
  return (
    <div className="statsGrid">
      {cards.map((card) => (
        <Link to={card.to || '#'} className={`statCard ${card.tone || 'blue'} dashboardStatLink`} key={card.label}>
          <span>{card.label}</span>
          <strong>{card.value}</strong>
          {card.note && <small>{card.note}</small>}
        </Link>
      ))}
    </div>
  );
}

function SimpleTable({ title, rows, columns, empty = 'Aucune donnee prioritaire' }) {
  return (
    <div className="tablePanel">
      <div className="tableTools">
        <strong>{title}</strong>
      </div>
      <div className="tableScroll">
        <table>
          <thead>
            <tr>{columns.map((column) => <th key={column.key}>{column.label}</th>)}</tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.id || row.numero || row.reference || JSON.stringify(row)}>
                {columns.map((column) => (
                  <td key={column.key}>
                    {column.badge ? (
                      <span className={`statusBadge ${statusTone(row[column.key])}`}>{column.render ? column.render(row) : row[column.key] || '-'}</span>
                    ) : (
                      column.render ? column.render(row) : row[column.key] || '-'
                    )}
                  </td>
                ))}
              </tr>
            ))}
            {rows.length === 0 && (
              <tr><td className="emptyCell" colSpan={columns.length}>{empty}</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function buildDashboard(role, data) {
  const devis = data.devis || [];
  const commandes = data.commandes || [];
  const essais = data.essais || [];
  const clients = data.clients || [];
  const nonConformites = data.nonConformites || [];
  const reclamations = data.reclamations || [];
  const equipements = data.equipements || [];
  const personnel = data.personnel || [];
  const resultats = data.resultatsEssais || [];

  const quotesByStatus = (status) => devis.filter((item) => normalizeQuoteStatus(item.statut) === status);
  const activeOrders = commandes.filter((item) => item.statut !== 'livree');
  const ordersAmount = commandes.reduce((sum, item) => sum + Number(item.montant_ht || 0), 0);
  const openNc = nonConformites.filter((item) => item.statut !== 'cloturee');
  const openReclamations = reclamations.filter((item) => item.statut !== 'cloturee');
  const nonConformingResults = resultats.filter((item) => item.decision === 'non_conforme');
  const equipmentWatch = equipements.filter((item) => ['a_surveiller', 'hors_service'].includes(item.statut));

  if (role === 'responsable_appel') {
    return {
      eyebrow: 'Tableau de bord offres',
      title: 'Cotations, offres et transformation en prestations',
      subtitle: 'Vous receptionnez les demandes de prestation, etablissez les cotations, redigez les contrats/devis et suivez leur transformation en commandes.',
      highlight: `${compactAmount(ordersAmount)} FCFA`,
      cards: [
        { label: 'Cotations a rediger', value: quotesByStatus('redaction').length, tone: 'amber', to: '/devis' },
        { label: 'Offres chez RT', value: quotesByStatus('validation_technique').length, tone: 'blue', to: '/devis' },
        { label: 'Offres chez DG', value: quotesByStatus('validation_dg').length, tone: 'blue', to: '/devis' },
        { label: 'Envoyees client', value: quotesByStatus('envoye_client').length, tone: 'green', to: '/devis' },
        { label: 'Prestations gagnees', value: quotesByStatus('commande_creee').length, tone: 'green', to: '/commandes' },
        { label: 'Offres refusees', value: quotesByStatus('refuse').length, tone: 'red', to: '/devis' }
      ],
      tables: [
        {
          title: 'Suivi des offres soumises et transformees',
          rows: byRecentDate(devis.filter((item) => ['validation_technique', 'validation_dg', 'envoye_client', 'refuse', 'commande_creee'].includes(normalizeQuoteStatus(item.statut))), 'date').slice(0, 8),
          columns: [
            { key: 'numero', label: 'Devis' },
            { key: 'client_nom', label: 'Client' },
            { key: 'montant_ht', label: 'Montant', render: (row) => `${money(row.montant_ht)} FCFA` },
            { key: 'statut', label: 'Statut', badge: true, render: (row) => normalizeQuoteStatus(row.statut) },
            { key: 'commande_numero', label: 'Commande' }
          ]
        }
      ]
    };
  }

  if (role === 'responsable_technique') {
    return {
      eyebrow: 'Tableau de bord technique',
      title: 'Revue des demandes, validation technique et risques',
      subtitle: 'Vous orientez les demandes clients, validez les offres et rapports, surveillez les resultats, les non-conformites et les competences techniques.',
      highlight: `${quotesByStatus('validation_technique').length} devis RT`,
      cards: [
        { label: 'Demandes a revoir', value: quotesByStatus('validation_technique').length, tone: 'blue', to: '/devis' },
        { label: 'Documents a transmettre', value: quotesByStatus('pret_envoi').length, tone: 'green', to: '/devis' },
        { label: 'Rapports a valider', value: (data.rapports || []).filter((item) => item.statut === 'brouillon').length, tone: 'amber', to: '/rapports' },
        { label: 'Resultats non conformes', value: nonConformingResults.length, tone: 'red', to: '/resultats-essais' },
        { label: 'NC ouvertes', value: openNc.length, tone: 'red', to: '/non-conformites' },
        { label: 'Reclamations', value: openReclamations.length, tone: 'red', to: '/reclamations' },
        { label: 'Personnel technique', value: personnel.length, tone: 'blue', to: '/personnel' }
      ],
      tables: [
        {
          title: 'Revue des demandes et offres a valider',
          rows: quotesByStatus('validation_technique').slice(0, 8),
          columns: [
            { key: 'numero', label: 'Devis' },
            { key: 'client_nom', label: 'Client' },
            { key: 'projet', label: 'Projet' },
            { key: 'date_vue_technique', label: 'Vu RT' },
            { key: 'montant_ht', label: 'Montant', render: (row) => `${money(row.montant_ht)} FCFA` }
          ]
        },
        {
          title: 'Resultats / conformites a surveiller',
          rows: nonConformingResults.slice(0, 6),
          columns: [
            { key: 'numero', label: 'Resultat' },
            { key: 'objet_essai', label: 'Objet' },
            { key: 'essai_code', label: 'Essai' },
            { key: 'decision', label: 'Decision', badge: true },
            { key: 'technicien', label: 'Technicien' }
          ]
        }
      ]
    };
  }

  if (role === 'dg') {
    return {
      eyebrow: 'Tableau de bord direction',
      title: 'Validation finale, activite et risques',
      subtitle: 'Vous gardez la vision de decision : devis importants, commandes creees, chiffre d affaires et alertes qualite.',
      highlight: `${compactAmount(ordersAmount)} FCFA`,
      cards: [
        { label: 'Devis chez DG', value: quotesByStatus('validation_dg').length, tone: 'blue', to: '/devis' },
        { label: 'Commandes actives', value: activeOrders.length, tone: 'green', to: '/commandes' },
        { label: 'CA commandes', value: compactAmount(ordersAmount), note: 'FCFA', tone: 'green', to: '/commandes' },
        { label: 'Devis refuses', value: quotesByStatus('refuse').length, tone: 'red', to: '/devis' },
        { label: 'NC ouvertes', value: openNc.length, tone: 'red', to: '/non-conformites' },
        { label: 'Reclamations', value: openReclamations.length, tone: 'red', to: '/reclamations' },
        { label: 'Projets suivis', value: (data.projets || []).length, tone: 'blue', to: '/projets' }
      ],
      tables: [
        {
          title: 'Decisions DG attendues',
          rows: quotesByStatus('validation_dg').slice(0, 8),
          columns: [
            { key: 'numero', label: 'Devis' },
            { key: 'client_nom', label: 'Client' },
            { key: 'projet', label: 'Projet' },
            { key: 'montant_ht', label: 'Montant', render: (row) => `${money(row.montant_ht)} FCFA` },
            { key: 'valide_technique_par', label: 'Validation RT' }
          ]
        },
        {
          title: 'Risques qualite ouverts',
          rows: openNc.slice(0, 6),
          columns: [
            { key: 'reference', label: 'NC' },
            { key: 'origine', label: 'Origine' },
            { key: 'responsable', label: 'Responsable' },
            { key: 'statut', label: 'Statut', badge: true }
          ]
        }
      ]
    };
  }

  if (role === 'responsable_labo') {
    return {
      eyebrow: 'Tableau de bord laboratoire',
      title: 'Programmation, realisation des essais et rapports',
      subtitle: 'Vous programmez les essais, encadrez les operateurs, suivez les cahiers d essais, traitez les resultats et montez les rapports a soumettre au RT.',
      highlight: `${activeOrders.length} commandes`,
      cards: [
        { label: 'Programmes essais', value: activeOrders.length, tone: 'blue', to: '/commandes' },
        { label: 'Essais en cours', value: essais.filter((item) => item.statut === 'en_cours').length, tone: 'amber', to: '/essais' },
        { label: 'Objets transmis RL', value: essais.filter((item) => item.responsable_labo).length, tone: 'green', to: '/essais' },
        { label: 'Resultats a traiter', value: resultats.length, tone: 'green', to: '/resultats-essais' },
        { label: 'Materiel a surveiller', value: equipmentWatch.length, tone: 'red', to: '/equipements' },
        { label: 'Rapports a monter', value: (data.rapports || []).filter((item) => item.statut === 'brouillon').length, tone: 'amber', to: '/rapports' }
      ],
      tables: [
        {
          title: 'Programme des essais a realiser',
          rows: activeOrders.slice(0, 8),
          columns: [
            { key: 'numero', label: 'Commande' },
            { key: 'reference_devis', label: 'Devis' },
            { key: 'client_nom', label: 'Client' },
            { key: 'projet', label: 'Projet' },
            { key: 'statut', label: 'Statut', badge: true }
          ]
        },
        {
          title: 'Objets d essais transmis au laboratoire',
          rows: essais.filter((item) => item.statut === 'en_cours').slice(0, 8),
          columns: [
            { key: 'numero', label: 'Objet' },
            { key: 'nature', label: 'Nature' },
            { key: 'essai_a_realiser', label: 'Essais', render: (row) => Array.isArray(row.essai_a_realiser) ? row.essai_a_realiser.join(', ') : row.essai_a_realiser },
            { key: 'delai_livraison', label: 'Livraison' },
            { key: 'responsable_labo', label: 'Resp. labo' }
          ]
        }
      ]
    };
  }

  if (role === 'receptionniste') {
    return {
      eyebrow: 'Tableau de bord reception',
      title: 'Codification, transmission RL et confidentialite client',
      subtitle: 'Vous receptionnez les objets d essais, verifiez les criteres d acceptation, codifiez, transmettez au RL et decodifiez les rapports avant transmission au RT.',
      highlight: `${clients.length} clients`,
      cards: [
        { label: 'Objets a codifier', value: essais.filter((item) => !item.receptionniste).length, tone: 'amber', to: '/essais' },
        { label: 'Objets transmis RL', value: essais.filter((item) => item.responsable_labo).length, tone: 'green', to: '/essais' },
        { label: 'Commandes a receptionner', value: activeOrders.length, tone: 'blue', to: '/commandes' },
        { label: "Objets d'essais recus", value: essais.filter((item) => item.date || item.date_prelevement).length, tone: 'green', to: '/essais' },
        { label: 'NC reception', value: openNc.filter((item) => String(item.origine || '').toLowerCase().includes('reception')).length, tone: 'red', to: '/non-conformites' },
        { label: 'Reclamations', value: openReclamations.length, tone: 'red', to: '/reclamations' },
        { label: 'Clients identifies', value: clients.length, tone: 'blue', to: '/clients' }
      ],
      tables: [
        {
          title: 'Commandes / objets a receptionner',
          rows: activeOrders.slice(0, 8),
          columns: [
            { key: 'numero', label: 'Commande' },
            { key: 'client_nom', label: 'Client' },
            { key: 'projet', label: 'Projet' },
            { key: 'reference_devis', label: 'Devis' },
            { key: 'statut', label: 'Statut', badge: true }
          ]
        },
        {
          title: 'Codification et transmission des objets',
          rows: byRecentDate(essais, 'date').slice(0, 8),
          columns: [
            { key: 'numero', label: 'Objet' },
            { key: 'client_nom', label: 'Client' },
            { key: 'nature', label: 'Nature' },
            { key: 'date', label: 'Reception' },
            { key: 'receptionniste', label: 'Receptionniste' }
          ]
        }
      ]
    };
  }

  return {
    eyebrow: 'Vue generale',
    title: 'Gestion operationnelle du laboratoire',
    subtitle: 'Selectionnez un role dans la barre du haut pour afficher le tableau de bord correspondant.',
    highlight: `${compactAmount(ordersAmount)} FCFA`,
    cards: [
      { label: 'Clients', value: clients.length, tone: 'blue', to: '/clients' },
      { label: 'Devis', value: devis.length, tone: 'green', to: '/devis' },
      { label: 'Commandes', value: commandes.length, tone: 'blue', to: '/commandes' },
      { label: 'Objets essais', value: essais.length, tone: 'amber', to: '/essais' },
      { label: 'NC ouvertes', value: openNc.length, tone: 'red', to: '/non-conformites' },
      { label: 'Reclamations', value: openReclamations.length, tone: 'red', to: '/reclamations' },
      { label: 'Personnel actif', value: personnel.filter((item) => item.habilitation === 'active').length, tone: 'green', to: '/personnel' }
    ],
    tables: [
      {
        title: 'Activite recente',
        rows: byRecentDate(essais, 'date').slice(0, 8),
        columns: [
          { key: 'numero', label: 'Objet' },
          { key: 'nature', label: 'Nature' },
          { key: 'client_nom', label: 'Client' },
          { key: 'statut', label: 'Statut', badge: true }
        ]
      }
    ]
  };
}

function Dashboard() {
  const [role, setRole] = useState(localStorage.getItem(CURRENT_ROLE_KEY) || 'responsable_appel');
  const [data, setData] = useState({
    clients: [],
    devis: [],
    commandes: [],
    essais: [],
    rapports: [],
    equipements: [],
    audits: [],
    nonConformites: [],
    reclamations: [],
    personnel: [],
    projets: [],
    catalogueEssais: [],
    resultatsEssais: []
  });

  useEffect(() => {
    let active = true;
    const resources = Object.keys(data);

    const refresh = async () => {
      const entries = await Promise.all(resources.map(async (resource) => [resource, await listRecords(resource)]));
      if (!active) return;
      setData(Object.fromEntries(entries));
    };

    const roleHandler = (event) => setRole(event.detail || localStorage.getItem(CURRENT_ROLE_KEY) || 'responsable_appel');

    refresh();
    window.addEventListener('smartlab:data-changed', refresh);
    window.addEventListener('smartlab:role-changed', roleHandler);
    return () => {
      active = false;
      window.removeEventListener('smartlab:data-changed', refresh);
      window.removeEventListener('smartlab:role-changed', roleHandler);
    };
  }, []);

  const dashboard = useMemo(() => buildDashboard(role, data), [role, data]);
  const statusDistribution = useMemo(() => {
    const essais = data.essais || [];
    const statuses = essais.reduce((acc, item) => {
      const key = item.statut || 'non_renseigne';
      acc[key] = (acc[key] || 0) + 1;
      return acc;
    }, {});
    return Object.entries(statuses).sort((a, b) => b[1] - a[1]).slice(0, 5);
  }, [data.essais]);
  const recentActivity = useMemo(() => {
    const toActivity = (items, type, labelField, path) => items.map((item) => ({
      id: `${type}-${item.id}`,
      type,
      title: item[labelField] || item.numero || item.reference || item.raison_sociale || type,
      date: item.date || item.created_at || item.updated_at || '',
      path
    }));
    return [
      ...toActivity(data.devis || [], 'Devis', 'numero', '/devis'),
      ...toActivity(data.commandes || [], 'Commande', 'numero', '/commandes'),
      ...toActivity(data.essais || [], "Objet d'essai", 'numero', '/essais'),
      ...toActivity(data.nonConformites || [], 'Non-conformite', 'reference', '/non-conformites'),
      ...toActivity(data.reclamations || [], 'Reclamation', 'reference', '/reclamations')
    ].sort((a, b) => String(b.date).localeCompare(String(a.date))).slice(0, 6);
  }, [data]);
  const dashboardAlerts = useMemo(() => {
    const openNc = (data.nonConformites || []).filter((item) => item.statut !== 'cloturee');
    const openReclamations = (data.reclamations || []).filter((item) => item.statut !== 'cloturee');
    const lateOrders = (data.commandes || []).filter((item) => item.delai_livraison && item.delai_livraison < new Date().toISOString().slice(0, 10));
    return [
      ...openNc.map((item) => ({ label: item.reference || 'Non-conformite', detail: item.description || item.origine || 'A traiter', to: '/non-conformites', tone: 'red' })),
      ...openReclamations.map((item) => ({ label: item.reference || 'Reclamation', detail: item.objet || item.description || 'A traiter', to: '/reclamations', tone: 'amber' })),
      ...lateOrders.map((item) => ({ label: item.numero || 'Commande', detail: 'Delai depasse', to: '/commandes', tone: 'red' }))
    ].slice(0, 5);
  }, [data]);
  const quickLinks = [
    { label: 'Nouvel objet', to: '/essais' },
    { label: 'Nouveau rapport', to: '/rapports' },
    { label: 'Nouvelle NC', to: '/non-conformites' },
    { label: 'Nouveau devis', to: '/devis' }
  ];
  const activityBars = useMemo(() => {
    const values = [
      (data.devis || []).length,
      (data.essais || []).length,
      (data.rapports || []).length,
      (data.reclamations || []).length,
      (data.commandes || []).length
    ];
    const max = Math.max(...values, 1);
    return [
      ['Devis', values[0]],
      ['Objets', values[1]],
      ['Rapports', values[2]],
      ['Reclam.', values[3]],
      ['Cmdes', values[4]]
    ].map(([label, value]) => ({ label, value, width: Math.max(8, Math.round((value / max) * 100)) }));
  }, [data]);

  return (
    <div className="pageStack dashboardDesignPage">
      <div className="welcomeBand">
        <div>
          <p className="eyebrow">{dashboard.eyebrow}</p>
          <h2>{dashboard.title}</h2>
          <p>{dashboard.subtitle}</p>
          <div className="roleDashboardPill">{roleNames[role] || roleNames.default}</div>
        </div>
        <strong>{dashboard.highlight}</strong>
      </div>

      <StatCards cards={dashboard.cards} />

      <div className="dashboardDesignGrid">
        <section className="dashboardChartPanel">
          <div className="panelTitleRow">
            <strong>Activite du laboratoire</strong>
            <span>Données reelles</span>
          </div>
          <div className="dashboardBars">
            {activityBars.map((bar) => (
              <div className="dashboardBarRow" key={bar.label}>
                <span>{bar.label}</span>
                <div><i style={{ width: `${bar.width}%` }} /></div>
                <strong>{bar.value}</strong>
              </div>
            ))}
          </div>
        </section>
        <section className="dashboardStatusPanel">
          <div className="panelTitleRow">
            <strong>Repartition des objets par statut</strong>
            <span>{(data.essais || []).length} total</span>
          </div>
          {statusDistribution.length > 0 ? statusDistribution.map(([status, count]) => (
            <div className="infoRow" key={status}>
              <span>{status}</span>
              <strong>{count}</strong>
            </div>
          )) : <div className="notificationEmpty">Aucun objet d'essai</div>}
        </section>
        <section className="dashboardSidePanel">
          <div className="panelTitleRow">
            <strong>Alertes & notifications</strong>
            <Link to="/non-conformites">Voir tout</Link>
          </div>
          {dashboardAlerts.length > 0 ? dashboardAlerts.map((alert) => (
            <Link className={`dashboardAlert ${alert.tone}`} to={alert.to} key={`${alert.label}-${alert.detail}`}>
              <strong>{alert.label}</strong>
              <span>{alert.detail}</span>
            </Link>
          )) : <div className="notificationEmpty">Aucune alerte critique</div>}
        </section>
      </div>

      {dashboard.tables.map((table) => (
        <SimpleTable key={table.title} {...table} />
      ))}

      <div className="dashboardBottomGrid">
        <section className="dashboardSidePanel">
          <div className="panelTitleRow">
            <strong>Activite recente</strong>
            <span>{recentActivity.length}</span>
          </div>
          {recentActivity.length > 0 ? recentActivity.map((item) => (
            <Link className="recentActivityItem" to={item.path} key={item.id}>
              <strong>{item.title}</strong>
              <span>{item.type}{item.date ? ` - ${item.date}` : ''}</span>
            </Link>
          )) : <div className="notificationEmpty">Aucune activite recente</div>}
        </section>
        <section className="dashboardSidePanel">
          <div className="panelTitleRow">
            <strong>Acces rapides</strong>
            <span>{roleNames[role] || roleNames.default}</span>
          </div>
          <div className="quickActionGrid">
            {quickLinks.map((link) => <Link to={link.to} key={link.to}>{link.label}</Link>)}
          </div>
        </section>
      </div>
    </div>
  );
}

export default Dashboard;
