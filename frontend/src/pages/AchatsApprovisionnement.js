import React, { useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import { deleteRecord, listRecords, upsertRecord } from '../services/localStore';

const emptyForm = {
  reference: '',
  fournisseur: '',
  famille: 'Consommables',
  objet: '',
  montant_ht: '',
  date_demande: new Date().toISOString().slice(0, 10),
  demandeur: '',
  responsable: '',
  priorite: 'normale',
  statut: 'en_attente'
};

const statusLabels = {
  en_attente: 'En attente',
  valide: 'Valide',
  commande: 'Commande',
  recu: 'Recu',
  annule: 'Annule'
};

const priorityLabels = {
  basse: 'Basse',
  normale: 'Normale',
  urgente: 'Urgente'
};

function formatMoney(value) {
  const amount = Number(value || 0);
  if (amount >= 1000000) return `${(amount / 1000000).toFixed(2)}M FCFA`;
  return `${amount.toLocaleString('fr-FR')} FCFA`;
}

function statusTone(value) {
  const key = String(value || '').toLowerCase();
  if (['valide', 'recu', 'conforme', 'qualifie'].includes(key)) return 'success';
  if (['commande', 'en_cours'].includes(key)) return 'info';
  if (['en_attente', 'normale', 'moyenne'].includes(key)) return 'warning';
  if (['urgente', 'annule', 'retard'].includes(key)) return 'danger';
  return 'neutral';
}

function nextReference(records) {
  const year = new Date().getFullYear();
  const max = records.reduce((highest, record) => {
    const match = String(record.reference || '').match(new RegExp(`^ACH-${year}-(\\d+)$`, 'i'));
    return match ? Math.max(highest, Number(match[1])) : highest;
  }, 0);
  return `ACH-${year}-${String(max + 1).padStart(3, '0')}`;
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

function statusCount(records, status) {
  return records.filter((item) => item.statut === status).length;
}

function CycleAchats() {
  const steps = [
    'Expression du besoin',
    'Validation',
    'Consultation fournisseurs',
    'Comparaison offres',
    'Bon de commande',
    'Suivi commande',
    'Reception',
    'Controle reception',
    'Facturation',
    'Evaluation fournisseur'
  ];

  return (
    <section className="dashPanel achatCyclePanel">
      <div className="dashPanelHeader"><strong>Cycle de gestion des achats</strong></div>
      <div className="achatCycle">
        {steps.map((step, index) => (
          <div className="achatCycleStep" key={step}>
            <b>{index + 1}</b>
            <span>{step}</span>
          </div>
        ))}
      </div>
    </section>
  );
}

function AchatDonut({ title, records, field }) {
  const entries = topEntries(countBy(records, field), 5);
  const total = records.length || 1;
  const colors = ['#2f80ed', '#00d4aa', '#f59e0b', '#7c3aed', '#ef4444'];
  let cursor = 0;
  const gradient = entries.map(([, count], index) => {
    const start = cursor;
    cursor += (count / total) * 360;
    return `${colors[index % colors.length]} ${start}deg ${cursor}deg`;
  }).join(', ');

  return (
    <section className="dashPanel achatMiniPanel">
      <div className="dashPanelHeader"><strong>{title}</strong></div>
      <div className="achatDonutContent">
        <div className="dashDonut achatSmallDonut" style={{ background: `conic-gradient(${gradient || '#1f2937 0deg 360deg'})` }}>
          <strong>{records.length}</strong>
          <span>Total</span>
        </div>
        <div className="dashDonutLegend">
          {entries.map(([label, count], index) => (
            <div key={label}>
              <i style={{ background: colors[index % colors.length] }} />
              <span>{field === 'statut' ? statusLabels[label] || label : priorityLabels[label] || label}</span>
              <strong>{count}</strong>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function SupplierPanel({ records }) {
  const suppliers = topEntries(countBy(records, 'fournisseur'), 5);
  return (
    <section className="dashPanel achatSidePanel">
      <div className="dashPanelHeader"><strong>Top 5 fournisseurs</strong><span>Score moyen</span></div>
      <div className="achatSupplierList">
        {suppliers.map(([name, count], index) => {
          const score = Math.max(72, 96 - index * 4 + Math.min(count, 3));
          return (
            <div className="achatSupplier" key={name}>
              <b>{index + 1}</b><span>{name}</span><i><em style={{ width: `${score}%` }} /></i><strong>{score}%</strong>
            </div>
          );
        })}
        {suppliers.length === 0 && <div className="notificationEmpty">Aucun fournisseur</div>}
      </div>
    </section>
  );
}

function AlertsAchats({ records }) {
  const alerts = [
    ...records.filter((item) => item.priorite === 'urgente').map((item) => ({ title: 'Demande urgente', text: item.objet, tone: 'red' })),
    ...records.filter((item) => item.statut === 'en_attente').map((item) => ({ title: 'Validation attendue', text: item.objet, tone: 'amber' })),
    ...records.filter((item) => item.statut === 'commande').map((item) => ({ title: 'Reception a suivre', text: item.fournisseur, tone: 'blue' }))
  ].slice(0, 5);

  return (
    <section className="dashPanel achatSidePanel">
      <div className="dashPanelHeader"><strong>Alertes achats</strong></div>
      <div className="dashAlertList">
        {alerts.map((alert, index) => (
          <div className={`dashAlertItem ${alert.tone}`} key={`${alert.title}-${index}`}>
            <b>!</b><span><strong>{alert.title}</strong><small>{alert.text || 'A verifier'}</small></span><em>Voir</em>
          </div>
        ))}
        {alerts.length === 0 && <div className="notificationEmpty">Aucune alerte achat</div>}
      </div>
    </section>
  );
}

function ExpensesPanel({ records }) {
  const total = records.reduce((sum, item) => sum + Number(item.montant_ht || 0), 0);
  const values = Array.from({ length: 12 }, (_, index) => Math.round((total / 12) * (0.55 + (index % 4) * 0.12)));
  const max = Math.max(...values, 1);
  const pts = values.map((value, index) => `${20 + index * 38},${110 - (value / max) * 85}`).join(' ');
  const labels = ['Jan.', 'Fev.', 'Mar.', 'Avr.', 'Mai', 'Juin', 'Juil.', 'Aout', 'Sept.', 'Oct.', 'Nov.', 'Dec.'];

  return (
    <section className="dashPanel achatSidePanel">
      <div className="dashPanelHeader"><strong>Depenses par mois</strong><span>{formatMoney(total)}</span></div>
      <svg className="achatExpenseChart" viewBox="0 0 470 140" role="img" aria-label="Depenses achats">
        {[30, 60, 90, 120].map((y) => <line key={y} x1="20" y1={y} x2="445" y2={y} />)}
        <polyline points={pts} />
        {labels.map((label, index) => <text key={label} x={20 + index * 38} y="135">{label}</text>)}
      </svg>
    </section>
  );
}

function PurchaseModal({ form, setForm, onClose, onSubmit, editing }) {
  const update = (field, value) => setForm((current) => ({ ...current, [field]: value }));
  return (
    <div className="modalOverlay" onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
      <form className="modalPanel" onSubmit={onSubmit}>
        <div className="modalHeader"><strong>{editing ? 'Modifier demande achat' : 'Nouvelle demande achat'}</strong><button type="button" className="modalClose" onClick={onClose}>x</button></div>
        <div className="modalBody"><div className="formGrid">
          <label><span>Reference</span><input value={form.reference} readOnly /></label>
          <label><span>Fournisseur</span><input value={form.fournisseur} required onChange={(event) => update('fournisseur', event.target.value)} /></label>
          <label><span>Famille</span><select value={form.famille} onChange={(event) => update('famille', event.target.value)}>{['Consommables', 'Equipement', 'Maintenance', 'Etalonnage', 'Service'].map((item) => <option key={item}>{item}</option>)}</select></label>
          <label><span>Montant HT</span><input type="number" min="0" value={form.montant_ht} required onChange={(event) => update('montant_ht', event.target.value)} /></label>
          <label className="full"><span>Objet / besoin</span><textarea value={form.objet} required rows="3" onChange={(event) => update('objet', event.target.value)} /></label>
          <label><span>Date demande</span><input type="date" value={form.date_demande} onChange={(event) => update('date_demande', event.target.value)} /></label>
          <label><span>Demandeur</span><input value={form.demandeur} onChange={(event) => update('demandeur', event.target.value)} /></label>
          <label><span>Responsable</span><input value={form.responsable} onChange={(event) => update('responsable', event.target.value)} /></label>
          <label><span>Urgence</span><select value={form.priorite} onChange={(event) => update('priorite', event.target.value)}><option value="basse">Basse</option><option value="normale">Normale</option><option value="urgente">Urgente</option></select></label>
          <label><span>Statut</span><select value={form.statut} onChange={(event) => update('statut', event.target.value)}><option value="en_attente">En attente</option><option value="valide">Valide</option><option value="commande">Commande</option><option value="recu">Recu</option><option value="annule">Annule</option></select></label>
        </div></div>
        <div className="modalFooter"><button type="button" className="ghostButton" onClick={onClose}>Annuler</button><button className="primaryButton" type="submit">{editing ? 'Enregistrer' : 'Ajouter'}</button></div>
      </form>
    </div>
  );
}

export default function AchatsApprovisionnement() {
  const [records, setRecords] = useState([]);
  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(emptyForm);

  const refresh = async () => setRecords(await listRecords('achatsApprovisionnement'));

  useEffect(() => {
    let active = true;
    const load = async () => {
      const next = await listRecords('achatsApprovisionnement');
      if (active) setRecords(next);
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
  }, [query, records, statusFilter]);

  const totalBudget = records.reduce((sum, item) => sum + Number(item.montant_ht || 0), 0);
  const suppliers = new Set(records.map((item) => item.fournisseur).filter(Boolean));
  const compliance = records.length ? Math.round((records.filter((item) => ['valide', 'commande', 'recu'].includes(item.statut)).length / records.length) * 100) : 100;
  const statusTabs = ['all', 'en_attente', 'valide', 'commande', 'recu', 'annule'];

  const openCreate = () => { setEditing(null); setForm({ ...emptyForm, reference: nextReference(records) }); setModalOpen(true); };
  const openEdit = (record) => { setEditing(record); setForm({ ...emptyForm, ...record }); setModalOpen(true); };
  const closeModal = () => { setModalOpen(false); setEditing(null); };

  const submit = async (event) => {
    event.preventDefault();
    await upsertRecord('achatsApprovisionnement', { ...form, id: editing?.id || form.id });
    toast.success(editing ? 'Demande achat modifiee' : 'Demande achat ajoutee');
    closeModal();
    refresh();
  };

  const remove = async (record) => {
    if (!window.confirm(`Supprimer ${record.reference} ?`)) return;
    await deleteRecord('achatsApprovisionnement', record.id);
    toast.success('Demande achat supprimee');
    refresh();
  };

  return (
    <div className="dashMockPage achatsPage">
      <div className="dashMockHeader">
        <div><p className="eyebrow">TESTLAB MOBILE</p><h2>Achats & Approvisionnements</h2><span className="achatSubtitle">Gerez l'ensemble de votre processus d'achats et vos fournisseurs.</span></div>
        <div className="dashMockSearch"><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Rechercher un besoin, commande, fournisseur..." /></div>
        <button type="button" className="primaryButton" onClick={openCreate}>+ Nouvelle demande</button>
      </div>

      <div className="dashKpiGrid achatKpiGrid">
        <section className="dashKpiCard blue"><div><span>Budget annuel</span><strong>{formatMoney(totalBudget)}</strong><small>Montant des demandes reelles</small></div><b>FCFA</b></section>
        <section className="dashKpiCard green"><div><span>Commandes en cours</span><strong>{statusCount(records, 'commande')}</strong><small>Demandes en commande</small></div><b>OK</b></section>
        <section className="dashKpiCard amber"><div><span>Livraisons attendues</span><strong>{statusCount(records, 'en_attente')}</strong><small>Validation ou reception attendue</small></div><b>BC</b></section>
        <section className="dashKpiCard red"><div><span>Retards fournisseurs</span><strong>{records.filter((item) => item.priorite === 'urgente').length}</strong><small>Demandes urgentes</small></div><b>!</b></section>
        <section className="dashKpiCard purple"><div><span>Fournisseurs qualifies</span><strong>{suppliers.size}</strong><small>Fournisseurs utilises</small></div><b>FR</b></section>
        <section className="dashKpiCard green"><div><span>Taux conformite fournisseurs</span><strong>{compliance}%</strong><small>Objectif : 90%</small></div><b>{compliance}%</b></section>
      </div>

      <CycleAchats />

      <div className="achatMainGrid">
        <div className="achatLeftStack">
          <section className="dashPanel achatTablePanel">
            <div className="achatTabs">
              {statusTabs.map((status) => <button type="button" key={status} className={statusFilter === status ? 'active' : ''} onClick={() => setStatusFilter(status)}>{status === 'all' ? 'Demandes achats' : statusLabels[status] || status}</button>)}
            </div>
            <div className="tableTools achatFilters">
              <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}>{statusTabs.map((status) => <option value={status} key={status}>{status === 'all' ? 'Statut : Tous' : statusLabels[status]}</option>)}</select>
              <select defaultValue="all"><option value="all">Urgence : Tous</option><option value="urgente">Urgente</option><option value="normale">Normale</option><option value="basse">Basse</option></select>
              <button type="button" className="ghostButton">Filtres avances</button>
            </div>
            <div className="tableScroll"><table><thead><tr><th>Reference</th><th>Objet / besoin</th><th>Demandeur</th><th>Urgence</th><th>Statut</th><th>Fournisseur</th><th>Date demande</th><th>Actions</th></tr></thead><tbody>
              {filtered.map((record) => <tr key={record.id}><td><strong>{record.reference}</strong></td><td>{record.objet}<br /><small>{record.famille}</small></td><td>{record.demandeur || '-'}</td><td><span className={`statusBadge ${statusTone(record.priorite)}`}>{priorityLabels[record.priorite] || record.priorite}</span></td><td><span className={`statusBadge ${statusTone(record.statut)}`}>{statusLabels[record.statut] || record.statut}</span></td><td>{record.fournisseur || '-'}</td><td>{record.date_demande || '-'}</td><td><div className="rowActions"><button type="button" className="ghostButton iconOnlyButton" title="Modifier" onClick={() => openEdit(record)}>o</button><button type="button" className="dangerButton" onClick={() => remove(record)}>Supprimer</button></div></td></tr>)}
              {filtered.length === 0 && <tr><td colSpan="8" className="emptyCell">Aucune demande achat</td></tr>}
            </tbody></table></div>
          </section>

          <div className="achatBottomGrid">
            <AchatDonut title="Repartition par statut des commandes" records={records} field="statut" />
            <AchatDonut title="Repartition par urgence des demandes" records={records} field="priorite" />
            <section className="dashPanel achatMiniPanel"><div className="dashPanelHeader"><strong>Commandes par etape</strong></div><div className="achatStageList">{Object.entries(countBy(records, 'statut')).map(([status, count]) => <div key={status}><span>{statusLabels[status] || status}</span><strong>{count}</strong><i style={{ width: `${Math.max(12, (count / Math.max(records.length, 1)) * 100)}%` }} /></div>)}</div></section>
            <section className="dashPanel achatMiniPanel"><div className="dashPanelHeader"><strong>Evaluation fournisseurs</strong></div><div className="achatStageList">{['Respect delai', 'Qualite produit', 'Conformite livraison', 'Reactivite', 'Prix competitif'].map((label, index) => <div key={label}><span>{label}</span><strong>{(4.8 - index * 0.15).toFixed(1)}/5</strong><i style={{ width: `${94 - index * 5}%` }} /></div>)}</div></section>
          </div>
        </div>

        <div className="achatRightStack"><AlertsAchats records={records} /><SupplierPanel records={records} /><ExpensesPanel records={records} /></div>
      </div>

      <section className="dashPanel achatQuickPanel"><div className="dashPanelHeader"><strong>Acces rapides</strong></div><div className="dashQuickGrid achatQuickGrid"><button type="button" onClick={openCreate}><b>ND</b>Nouvelle demande</button><button type="button"><b>BC</b>Nouveau bon de commande</button><button type="button"><b>CS</b>Nouvelle consultation</button><button type="button"><b>RC</b>Enregistrer reception</button><button type="button"><b>FA</b>Nouvelle facture fournisseur</button><button type="button"><b>EV</b>Evaluer un fournisseur</button></div></section>

      {modalOpen && <PurchaseModal form={form} setForm={setForm} editing={editing} onClose={closeModal} onSubmit={submit} />}
    </div>
  );
}