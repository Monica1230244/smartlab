
import React, { useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import { useSearchParams } from 'react-router-dom';
import { deleteRecord, listRecords, upsertRecord } from '../services/localStore';
import { downloadCsv } from '../utils/exportCsv';
import { useAuth } from '../contexts/AuthContext';

const emptyLine = { designation: '', quantite: 1, prix_unitaire: 0 };
const emptyForm = { numero: '', client_nom: '', client_whatsapp: '', client_email: '', projet: '', objet: '', prestations: [{ ...emptyLine }], montant_ht: 0, canal_envoi: 'whatsapp', statut: 'redaction', date: new Date().toISOString().slice(0, 10), responsable: '', commentaire: '' };

const statusLabels = { redaction: 'Redaction', validation_technique: 'Chez RT', validation_dg: 'Chez DG', pret_envoi: 'Pret envoi', envoye_client: 'Envoye client', valide_client: 'Valide client', commande_creee: 'Accepte', refuse: 'Refuse', annule: 'Annule', expire: 'Expire' };
const statusTabs = [['all', 'Tous les devis'], ['redaction', 'Redaction'], ['validation_technique', 'Chez RT'], ['validation_dg', 'Chez DG'], ['envoye_client', 'Envoyes'], ['commande_creee', 'Acceptes'], ['refuse', 'Refuses'], ['expire', 'Expires'], ['annule', 'Annules']];
const statusOrder = ['redaction', 'validation_technique', 'validation_dg', 'pret_envoi', 'envoye_client', 'commande_creee'];

function normalizeStatus(value) {
  const key = String(value || 'redaction').toLowerCase();
  if (['accepte', 'signe', 'valide_client'].includes(key)) return 'valide_client';
  if (['commande_creee', 'commande'].includes(key)) return 'commande_creee';
  if (['refus', 'rejete'].includes(key)) return 'refuse';
  return key;
}

function statusTone(value) {
  const key = normalizeStatus(value);
  if (['commande_creee', 'valide_client', 'pret_envoi'].includes(key)) return 'success';
  if (['validation_technique', 'validation_dg', 'envoye_client'].includes(key)) return 'info';
  if (key === 'redaction') return 'warning';
  if (['refuse', 'annule', 'expire'].includes(key)) return 'danger';
  return 'neutral';
}

function roleLabel(role, labels = {}) {
  return labels?.[role] || ({ responsable_appel: 'Responsable des offres', responsable_technique: 'Responsable technique', dg: 'DG', responsable_labo: 'Responsable labo' }[role] || role || 'Utilisateur');
}

function formatMoney(value) { return `${Number(value || 0).toLocaleString('fr-FR')} FCFA`; }
function compactMoney(value) { const amount = Number(value || 0); return amount >= 1000000 ? `${(amount / 1000000).toFixed(2)}M FCFA` : formatMoney(amount); }
function lineItemTotal(item) { return Number(item.quantite || 0) * Number(item.prix_unitaire || 0); }
function lineItemsTotal(items) { return (Array.isArray(items) ? items : []).reduce((sum, item) => sum + lineItemTotal(item), 0); }
function totalQuote(record) { return Number(record?.montant_ht || lineItemsTotal(record?.prestations)); }

function nextNumber(records, prefix) {
  const year = new Date().getFullYear();
  const max = records.reduce((highest, record) => {
    const value = record.numero || record.reference || '';
    const match = String(value).match(new RegExp(`^${prefix}-${year}-(\\d+)$`, 'i'));
    return match ? Math.max(highest, Number(match[1])) : highest;
  }, 0);
  return `${prefix}-${year}-${String(max + 1).padStart(3, '0')}`;
}

function buildValidationCode(numero) {
  const clean = String(numero || 'DEV').replace(/[^a-z0-9]/gi, '').toUpperCase();
  return `QR-${clean}-${Date.now().toString(36).toUpperCase().slice(-5)}`;
}
function buildValidationExpiry() { const expiry = new Date(); expiry.setDate(expiry.getDate() + 30); return expiry.toISOString(); }
function buildValidationUrl(code) { const base = `${window.location.origin}${process.env.PUBLIC_URL || ''}`.replace(/\/$/, ''); return `${base}/#/devis?validation=${encodeURIComponent(code || '')}`; }
function normalizeWhatsAppNumber(value) { const digits = String(value || '').replace(/\D/g, ''); if (!digits) return ''; return digits.startsWith('229') ? digits : `229${digits.replace(/^0+/, '')}`; }
function appendHistory(record, action, detail = '', role = 'systeme') { return [...(Array.isArray(record?.historique_validations) ? record.historique_validations : []), { action, detail, role, acteur: detail, date: new Date().toISOString() }]; }
function countStatus(records, status) { return records.filter((item) => normalizeStatus(item.statut) === status).length; }
function countBy(records, field) { return records.reduce((acc, record) => { const key = record[field] || 'Non renseigne'; acc[key] = (acc[key] || 0) + 1; return acc; }, {}); }
function topEntries(map, limit = 5) { return Object.entries(map).sort((a, b) => b[1] - a[1]).slice(0, limit); }
function amountByClient(records) { return records.reduce((acc, record) => { const key = record.client_nom || 'Non renseigne'; acc[key] = (acc[key] || 0) + totalQuote(record); return acc; }, {}); }

function Sparkline({ tone = 'blue' }) {
  return <svg className={`quoteSpark ${tone}`} viewBox="0 0 120 28" aria-hidden="true"><polyline points="0,20 18,17 34,22 50,12 66,17 82,16 100,7 120,14" /></svg>;
}

async function createSharedNotification({ title, message, tone = 'info', targetRole = 'all', path = '/devis' }) {
  return upsertRecord('notifications', { id: `not-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`, title, message, tone, targetRole, path, read: false, created_at: new Date().toISOString() });
}

async function createOrderFromQuote(quote) {
  const commandes = await listRecords('commandes');
  const existing = commandes.find((commande) => commande.reference_devis === quote.numero);
  if (existing) return existing;
  const order = { numero: nextNumber(commandes, 'CMD'), reference_devis: quote.numero, client_nom: quote.client_nom, client_whatsapp: quote.client_whatsapp, projet: quote.projet, prestations: Array.isArray(quote.prestations) ? quote.prestations : [], montant_ht: totalQuote(quote), date: new Date().toISOString().slice(0, 10), statut: 'nouvelle' };
  return upsertRecord('commandes', order);
}
function quotePdfHtml(record) {
  const code = record.code_validation || buildValidationCode(record.numero);
  const validationUrl = buildValidationUrl(code);
  const rows = (record.prestations || []).map((item) => `<tr><td>${item.designation || ''}</td><td>${item.quantite || 0}</td><td>${formatMoney(item.prix_unitaire || 0)}</td><td>${formatMoney(lineItemTotal(item))}</td></tr>`).join('');
  return `<!doctype html><html><head><meta charset="utf-8"><title>${record.numero}</title><style>body{font-family:Arial,sans-serif;color:#111827;margin:34px}.head{display:flex;justify-content:space-between;border-bottom:3px solid #0ea5e9;padding-bottom:18px}.logo{font-size:28px;font-weight:800;color:#0ea5e9}h1{margin:20px 0 8px}.meta{display:grid;grid-template-columns:160px 1fr;gap:8px;margin:20px 0}.meta b{color:#475569}table{width:100%;border-collapse:collapse;margin-top:18px}th,td{border:1px solid #cbd5e1;padding:10px;text-align:left}th{background:#e0f2fe}.total{text-align:right;font-size:20px;font-weight:800;margin-top:18px}.qr{display:flex;gap:18px;align-items:center;border:1px solid #93c5fd;background:#eff6ff;padding:14px;margin-top:24px}.sign{display:grid;grid-template-columns:1fr 1fr;gap:28px;margin-top:50px}.sign div{border-top:1px solid #64748b;padding-top:8px}</style></head><body><div class="head"><div><div class="logo">TESTLAB</div><small>Laboratoire d'Essais et d'Analyses - ISO 17025</small></div><div><strong>DEVIS</strong><br>${record.numero || ''}<br>${record.date || ''}</div></div><h1>${record.objet || 'Devis client'}</h1><div class="meta"><b>Client</b><span>${record.client_nom || ''}</span><b>Projet</b><span>${record.projet || ''}</span><b>Canal</b><span>${record.canal_envoi || ''}</span><b>Statut</b><span>${statusLabels[normalizeStatus(record.statut)] || record.statut || ''}</span></div><table><thead><tr><th>Designation</th><th>Qte</th><th>P.U.</th><th>Total</th></tr></thead><tbody>${rows}</tbody></table><div class="total">Total HT : ${formatMoney(totalQuote(record))}</div><div class="qr"><img alt="QR validation" src="https://api.qrserver.com/v1/create-qr-code/?size=140x140&data=${encodeURIComponent(validationUrl)}"><div><strong>Validation client en ligne</strong><p>Scanner ce QR code ou ouvrir ce lien pour valider ou rejeter le devis.</p><small>${validationUrl}</small></div></div><div class="sign"><div>Responsable technique / DG</div><div>Client</div></div></body></html>`;
}

function openQuotePdf(record, autoPrint = true) {
  const doc = window.open('', '_blank');
  if (!doc) { toast.error('Fenetre PDF bloquee par le navigateur'); return false; }
  doc.document.write(quotePdfHtml(record));
  doc.document.close();
  doc.focus();
  if (autoPrint) setTimeout(() => doc.print(), 500);
  return true;
}

function sendToClient(record) {
  const code = record.code_validation || buildValidationCode(record.numero);
  const url = buildValidationUrl(code);
  const message = `Bonjour ${record.client_nom || ''}, veuillez trouver le devis PDF TESTLAB ${record.numero || ''}. Le QR code/lien permet de valider ou rejeter le devis. Montant: ${formatMoney(totalQuote(record))}. Lien: ${url}`;
  const channel = record.canal_envoi || 'whatsapp';
  if (channel === 'email') {
    if (!record.client_email) { toast.error('Email client manquant'); return false; }
    window.open(`mailto:${record.client_email}?subject=${encodeURIComponent(`Devis TESTLAB ${record.numero || ''}`)}&body=${encodeURIComponent(message)}`, '_blank');
    return true;
  }
  if (channel === 'sms') {
    if (!record.client_whatsapp) { toast.error('Numero SMS client manquant'); return false; }
    window.open(`sms:${record.client_whatsapp}?&body=${encodeURIComponent(message)}`, '_blank');
    return true;
  }
  const phone = normalizeWhatsAppNumber(record.client_whatsapp);
  if (!phone) { toast.error('Numero WhatsApp client manquant'); return false; }
  window.open(`https://wa.me/${phone}?text=${encodeURIComponent(message)}`, '_blank');
  return true;
}

function QuoteValidationPortal({ code }) {
  const [quote, setQuote] = useState(null);
  const [loading, setLoading] = useState(true);
  const [rejecting, setRejecting] = useState(false);
  const [reason, setReason] = useState('');
  const [result, setResult] = useState('');

  useEffect(() => {
    const loadQuote = async () => {
      const devis = await listRecords('devis');
      setQuote(devis.find((item) => item.code_validation === code) || null);
      setLoading(false);
    };
    loadQuote();
  }, [code]);

  const acceptQuote = async () => {
    if (!quote) return;
    if (quote.validation_expires_at && new Date(quote.validation_expires_at) < new Date()) { setResult('Le lien de validation est expire. Merci de demander un nouveau devis.'); return; }
    const order = await createOrderFromQuote(quote);
    const validatedQuote = { ...quote, statut: 'commande_creee', canal_validation: 'client', validation_client: 'valide', date_validation_client: new Date().toISOString(), commande_numero: order.numero, historique_validations: appendHistory(quote, 'Validation client', `Commande ${order.numero}`, 'client') };
    await upsertRecord('devis', validatedQuote);
    await createSharedNotification({ title: 'Devis valide par le client', message: `${quote.numero} valide. Commande ${order.numero} creee.`, tone: 'online', targetRole: 'responsable_appel' });
    await createSharedNotification({ title: 'Commande creee depuis un devis', message: `${quote.client_nom} a valide ${quote.numero}.`, tone: 'online', targetRole: 'responsable_labo', path: '/commandes' });
    setQuote(validatedQuote);
    setResult(`Devis valide. Commande ${order.numero} creee automatiquement.`);
  };

  const rejectQuote = async () => {
    if (!quote) return;
    if (!reason.trim()) { setResult('Veuillez indiquer la raison du rejet.'); return; }
    const rejectedQuote = { ...quote, statut: 'refuse', canal_validation: 'client', validation_client: 'rejete', motif_refus: reason.trim(), date_rejet_client: new Date().toISOString(), historique_validations: appendHistory(quote, 'Rejet client', reason.trim(), 'client') };
    await upsertRecord('devis', rejectedQuote);
    await createSharedNotification({ title: 'Devis rejete par le client', message: `${quote.numero} rejete. Motif: ${reason.trim()}`, tone: 'offline', targetRole: 'responsable_technique' });
    await createSharedNotification({ title: 'Devis refuse par le client', message: `${quote.client_nom} a refuse ${quote.numero}. Motif: ${reason.trim()}`, tone: 'offline', targetRole: 'responsable_appel' });
    setQuote(rejectedQuote);
    setRejecting(false);
    setResult('Rejet enregistre et renvoye au responsable concerne dans TESTLAB.');
  };

  if (loading) return <div className="validationPortal"><div className="tablePanel"><div className="emptyCell">Chargement du devis...</div></div></div>;
  if (!quote) return <div className="validationPortal"><div className="tablePanel"><div className="emptyCell">Code de validation introuvable. Le devis n'a peut-etre pas encore ete synchronise dans Supabase.</div></div></div>;
  const alreadyAnswered = ['commande_creee', 'refuse'].includes(normalizeStatus(quote.statut));
  return (
    <div className="validationPortal">
      <div className="welcomeBand"><div><h2>Validation du devis {quote.numero}</h2><p>{quote.client_nom} - {quote.projet}</p></div><strong>{formatMoney(totalQuote(quote))}</strong></div>
      <div className="tablePanel validationPanel"><div className="tableTools"><strong>{quote.objet}</strong><span className={`statusBadge ${statusTone(quote.statut)}`}>{statusLabels[normalizeStatus(quote.statut)]}</span></div><div className="validationBody">
        <h3>Prestations</h3>
        {(quote.prestations || []).map((item, index) => <div className="kpi-row" key={`${item.designation}-${index}`}><div className="kpi-name">{item.designation}</div><div className="kpi-value">{item.quantite} x {formatMoney(item.prix_unitaire)}</div></div>)}
        {quote.motif_refus && <div className="rejectionReason"><strong>Motif de rejet</strong><p>{quote.motif_refus}</p></div>}
        {result && <div className="scoreBox ok"><strong>Information</strong>{result}</div>}
        {!alreadyAnswered && !rejecting && <div className="formActions validationActions"><button type="button" className="primaryButton" onClick={acceptQuote}>Valider le devis</button><button type="button" className="dangerButton" onClick={() => setRejecting(true)}>Rejeter le devis</button></div>}
        {rejecting && <div className="scoreBox"><label className="full"><span>Raison du rejet</span><textarea value={reason} onChange={(event) => setReason(event.target.value)} placeholder="Expliquez pourquoi vous rejetez ce devis..." rows="4" /></label><div className="formActions validationActions"><button type="button" className="ghostButton" onClick={() => setRejecting(false)}>Annuler</button><button type="button" className="dangerButton" onClick={rejectQuote}>Confirmer le rejet</button></div></div>}
      </div></div>
    </div>
  );
}
function QuoteModal({ form, setForm, clients, editing, onClose, onSubmit }) {
  const update = (field, value) => setForm((current) => ({ ...current, [field]: value }));
  const updateClient = (name) => {
    const client = clients.find((item) => item.raison_sociale === name);
    setForm((current) => ({ ...current, client_nom: name, client_whatsapp: client?.telephone || current.client_whatsapp, client_email: client?.email || current.client_email }));
  };
  const updateLine = (index, field, value) => setForm((current) => {
    const prestations = (current.prestations || []).map((item, itemIndex) => itemIndex === index ? { ...item, [field]: value } : item);
    return { ...current, prestations, montant_ht: lineItemsTotal(prestations) };
  });
  const addLine = () => setForm((current) => ({ ...current, prestations: [...(current.prestations || []), { ...emptyLine }] }));
  const removeLine = (index) => setForm((current) => {
    const prestations = (current.prestations || []).filter((_, itemIndex) => itemIndex !== index);
    return { ...current, prestations: prestations.length ? prestations : [{ ...emptyLine }], montant_ht: lineItemsTotal(prestations) };
  });
  const total = lineItemsTotal(form.prestations);
  return (
    <div className="modalOverlay" onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
      <form className="modalPanel quoteModal" onSubmit={onSubmit}>
        <div className="modalHeader"><strong>{editing ? 'Modifier devis' : 'Nouveau devis'}</strong><button type="button" className="modalClose" onClick={onClose}>x</button></div>
        <div className="modalBody"><div className="formGrid">
          <label><span>Numero</span><input value={form.numero} readOnly /></label>
          <label><span>Client</span><select value={form.client_nom} required onChange={(event) => updateClient(event.target.value)}><option value="">Selectionner</option>{clients.map((client) => <option key={client.id} value={client.raison_sociale}>{client.raison_sociale}</option>)}</select></label>
          <label><span>WhatsApp client</span><input value={form.client_whatsapp} onChange={(event) => update('client_whatsapp', event.target.value)} /></label>
          <label><span>Email client</span><input value={form.client_email} onChange={(event) => update('client_email', event.target.value)} /></label>
          <label><span>Projet</span><input value={form.projet} required onChange={(event) => update('projet', event.target.value)} /></label>
          <label><span>Canal d'envoi</span><select value={form.canal_envoi} onChange={(event) => update('canal_envoi', event.target.value)}><option value="whatsapp">WhatsApp</option><option value="email">Email</option><option value="sms">SMS</option></select></label>
          <label className="full"><span>Objet du devis</span><input value={form.objet} required onChange={(event) => update('objet', event.target.value)} /></label>
          <div className="full quoteLinesEditor"><div className="quoteLinesHeader"><strong>Prestations</strong><button type="button" className="ghostButton" onClick={addLine}>+ Ligne</button></div>{(form.prestations || []).map((line, index) => <div className="quoteLine" key={index}><input value={line.designation} placeholder="Designation" onChange={(event) => updateLine(index, 'designation', event.target.value)} /><input type="number" min="0" value={line.quantite} onChange={(event) => updateLine(index, 'quantite', event.target.value)} /><input type="number" min="0" value={line.prix_unitaire} onChange={(event) => updateLine(index, 'prix_unitaire', event.target.value)} /><strong>{formatMoney(lineItemTotal(line))}</strong><button type="button" className="dangerButton" onClick={() => removeLine(index)}>x</button></div>)}<div className="quoteTotal">Total HT : <strong>{formatMoney(total)}</strong></div></div>
          <label><span>Responsable</span><input value={form.responsable} onChange={(event) => update('responsable', event.target.value)} /></label>
          <label><span>Statut</span><select value={form.statut} onChange={(event) => update('statut', event.target.value)}>{Object.entries(statusLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label>
          <label className="full"><span>Commentaire</span><textarea value={form.commentaire} rows="3" onChange={(event) => update('commentaire', event.target.value)} /></label>
        </div></div>
        <div className="modalFooter"><button type="button" className="ghostButton" onClick={onClose}>Annuler</button><button type="submit" className="primaryButton">Enregistrer</button></div>
      </form>
    </div>
  );
}

function QuoteMiniStats({ records }) {
  const byClient = amountByClient(records);
  const maxClientAmount = Math.max(...Object.values(byClient), 1);
  return (
    <div className="quoteBottomGrid">
      <section className="dashPanel"><div className="dashPanelHeader"><strong>Repartition par statut</strong></div><div className="quoteMiniStats">{topEntries(countBy(records.map((item) => ({ ...item, statut: statusLabels[normalizeStatus(item.statut)] || item.statut })), 'statut'), 5).map(([label, count]) => <div key={label}><span>{label}</span><i><em style={{ width: `${records.length ? (count / records.length) * 100 : 0}%` }} /></i><strong>{count}</strong></div>)}</div></section>
      <section className="dashPanel"><div className="dashPanelHeader"><strong>Repartition par responsable</strong></div><div className="quoteMiniStats">{topEntries(countBy(records, 'responsable'), 5).map(([label, count]) => <div key={label}><span>{label}</span><i><em style={{ width: `${records.length ? (count / records.length) * 100 : 0}%` }} /></i><strong>{count}</strong></div>)}</div></section>
      <section className="dashPanel"><div className="dashPanelHeader"><strong>Top clients (HT)</strong></div><div className="quoteMiniStats">{topEntries(byClient, 5).map(([label, amount]) => <div key={label}><span>{label}</span><i><em style={{ width: `${Math.min(100, (amount / maxClientAmount) * 100)}%` }} /></i><strong>{compactMoney(amount)}</strong></div>)}</div></section>
    </div>
  );
}
export default function Devis() {
  const [searchParams] = useSearchParams();
  const validationCode = searchParams.get('validation');
  const { user, roleLabels } = useAuth();
  const [records, setRecords] = useState([]);
  const [clients, setClients] = useState([]);
  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [clientFilter, setClientFilter] = useState('all');
  const [selectedId, setSelectedId] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const activeRole = user?.role || localStorage.getItem('smartlab_current_role') || 'responsable_appel';

  const refresh = async () => {
    const [devis, clientList] = await Promise.all([listRecords('devis'), listRecords('clients')]);
    setRecords(devis);
    setClients(clientList);
    if (!selectedId && devis[0]) setSelectedId(devis[0].id);
  };

  useEffect(() => {
    let active = true;
    const load = async () => {
      const [devis, clientList] = await Promise.all([listRecords('devis'), listRecords('clients')]);
      if (!active) return;
      setRecords(devis);
      setClients(clientList);
      setSelectedId((current) => current || devis[0]?.id || null);
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
      .filter((item) => !needle || Object.values(item).join(' ').toLowerCase().includes(needle))
      .sort((a, b) => String(a.numero || '').localeCompare(String(b.numero || ''), 'fr', { numeric: true }));
  }, [clientFilter, query, records, statusFilter]);

  const selected = records.find((item) => item.id === selectedId) || filtered[0] || null;
  const accepted = records.filter((item) => ['commande_creee', 'valide_client'].includes(normalizeStatus(item.statut))).length;
  const waiting = records.filter((item) => ['redaction', 'validation_technique', 'validation_dg', 'pret_envoi', 'envoye_client'].includes(normalizeStatus(item.statut))).length;
  const refused = countStatus(records, 'refuse');
  const expired = countStatus(records, 'expire');
  const transformRate = records.length ? Math.round((accepted / records.length) * 100) : 0;
  const clientsList = Array.from(new Set(records.map((item) => item.client_nom).filter(Boolean)));

  const openCreate = () => {
    const numero = nextNumber(records, 'DEV');
    setEditing(null);
    setForm({ ...emptyForm, numero, date: new Date().toISOString().slice(0, 10), code_validation: buildValidationCode(numero), validation_expires_at: buildValidationExpiry() });
    setModalOpen(true);
  };
  const openEdit = (record) => { setEditing(record); setForm({ ...emptyForm, ...record, prestations: Array.isArray(record.prestations) && record.prestations.length ? record.prestations : [{ ...emptyLine }] }); setModalOpen(true); };
  const closeModal = () => { setModalOpen(false); setEditing(null); };

  const submit = async (event) => {
    event.preventDefault();
    const total = lineItemsTotal(form.prestations);
    const payload = { ...form, id: editing?.id || form.id, montant_ht: total, code_validation: form.code_validation || buildValidationCode(form.numero), validation_expires_at: form.validation_expires_at || buildValidationExpiry(), historique_validations: appendHistory(editing || form, editing ? 'Modification devis' : 'Creation devis', roleLabel(activeRole, roleLabels), activeRole) };
    const saved = await upsertRecord('devis', payload);
    toast.success(editing ? 'Devis modifie' : 'Devis cree');
    setSelectedId(saved.id);
    closeModal();
    refresh();
  };

  const remove = async (record) => {
    if (!window.confirm(`Supprimer ${record.numero} ?`)) return;
    await deleteRecord('devis', record.id);
    toast.success('Devis supprime');
    setSelectedId(null);
    refresh();
  };

  const updateQuote = async (record, status, extra = {}) => {
    const payload = { ...record, ...extra, statut: status, historique_validations: appendHistory(record, statusLabels[status] || status, roleLabel(activeRole, roleLabels), activeRole) };
    await upsertRecord('devis', payload);
    await createSharedNotification({ title: 'Devis - nouvelle etape', message: `${record.numero}: ${statusLabels[status] || status}`, targetRole: status === 'validation_technique' ? 'responsable_technique' : status === 'validation_dg' ? 'dg' : 'responsable_appel' });
    toast.success('Statut devis mis a jour');
    refresh();
  };

  const validateAndSend = async (record) => {
    if (!['responsable_technique', 'dg'].includes(activeRole)) { toast.error('Seul le RT ou le DG peut envoyer au client'); return; }
    const quote = { ...record, statut: 'envoye_client', canal_validation: 'client', code_validation: record.code_validation || buildValidationCode(record.numero), validation_expires_at: record.validation_expires_at || buildValidationExpiry(), date_envoi_client: new Date().toISOString(), envoye_par: roleLabel(activeRole, roleLabels), historique_validations: appendHistory(record, 'Validation et envoi client', roleLabel(activeRole, roleLabels), activeRole) };
    const saved = await upsertRecord('devis', quote);
    if (saved.__syncError) { toast.error('Devis local seulement: lien client non synchronise avec Supabase'); return; }
    openQuotePdf(saved, true);
    sendToClient(saved);
    await createSharedNotification({ title: 'Devis envoye au client', message: `${record.numero} envoye par ${roleLabel(activeRole, roleLabels)}`, tone: 'online', targetRole: 'responsable_appel' });
    toast.success('PDF avec QR code genere et canal client ouvert');
    refresh();
  };

  if (validationCode) return <QuoteValidationPortal code={validationCode} />;

  const selectedStatus = normalizeStatus(selected?.statut);
  const progressIndex = statusOrder.indexOf(selectedStatus);
  const progress = progressIndex >= 0 ? ((progressIndex + 1) / statusOrder.length) * 100 : 35;

  return (
    <div className="quoteMockPage">
      <div className="dashMockHeader quoteHeader"><div><p className="eyebrow">TESTLAB MOBILE</p><h2>Devis</h2><span className="achatSubtitle">Suivez et analysez l'ensemble de vos devis.</span></div><div className="dashMockSearch"><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Rechercher un devis, client, reference..." /></div></div>
      <div className="dashKpiGrid quoteKpiGrid"><section className="dashKpiCard blue"><div><span>Total devis</span><strong>{records.length}</strong><small>Base devis reelle</small></div><b>DV</b><Sparkline /></section><section className="dashKpiCard green"><div><span>Devis acceptes</span><strong>{accepted}</strong><small>{records.length ? Math.round((accepted / records.length) * 100) : 0}% du total</small></div><b>OK</b><Sparkline tone="green" /></section><section className="dashKpiCard amber"><div><span>Devis en attente</span><strong>{waiting}</strong><small>A suivre</small></div><b>AT</b><Sparkline tone="amber" /></section><section className="dashKpiCard red"><div><span>Devis refuses</span><strong>{refused}</strong><small>Motifs a analyser</small></div><b>RF</b><Sparkline tone="red" /></section><section className="dashKpiCard purple"><div><span>Devis expires</span><strong>{expired}</strong><small>A relancer</small></div><b>EX</b><Sparkline tone="purple" /></section><section className="dashKpiCard green quoteTransform"><div className="dashDonut quoteSmallDonut" style={{ background: `conic-gradient(#00d4aa 0deg ${transformRate * 3.6}deg, #f59e0b ${transformRate * 3.6}deg 360deg)` }}><strong>{transformRate}%</strong><span>Objectif 50%</span></div><small>Taux de transformation</small></section></div>
      <div className="quoteLayout"><main className="quoteMain"><section className="dashPanel quoteTablePanel"><div className="quoteTableTop"><div className="achatTabs">{statusTabs.map(([value, label]) => <button key={value} type="button" className={statusFilter === value ? 'active' : ''} onClick={() => setStatusFilter(value)}>{label}</button>)}</div><button type="button" className="primaryButton" onClick={openCreate}>+ Nouveau devis</button></div><div className="tableTools achatFilters"><select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}>{statusTabs.map(([value, label]) => <option value={value} key={value}>Statut : {label}</option>)}</select><select value={clientFilter} onChange={(event) => setClientFilter(event.target.value)}><option value="all">Client : Tous</option>{clientsList.map((client) => <option key={client} value={client}>{client}</option>)}</select><select defaultValue="all"><option value="all">Responsable : Tous</option></select><button type="button" className="ghostButton" onClick={resetFilters}>Filtres avances</button><button type="button" className="ghostButton" onClick={exportQuotes}>Exporter</button></div><div className="tableScroll"><table><thead><tr><th>N devis</th><th>Client</th><th>Projet / objet</th><th>Montant HT</th><th>Statut</th><th>Date creation</th><th>Responsable</th><th>Actions</th></tr></thead><tbody>{filtered.map((record) => <tr key={record.id} className={selected?.id === record.id ? 'selectedRow' : ''} onClick={() => setSelectedId(record.id)}><td><strong>{record.numero}</strong></td><td>{record.client_nom || '-'}<br /><small>{record.client_whatsapp || record.client_email || ''}</small></td><td>{record.projet || '-'}<br /><small>{record.objet || '-'}</small></td><td>{formatMoney(totalQuote(record))}</td><td><span className={`statusBadge ${statusTone(record.statut)}`}>{statusLabels[normalizeStatus(record.statut)] || record.statut}</span></td><td>{record.date || '-'}</td><td>{record.responsable || record.envoye_par || '-'}</td><td><div className="rowActions"><button type="button" className="ghostButton iconOnlyButton" onClick={(event) => { event.stopPropagation(); setSelectedId(record.id); }}>o</button><button type="button" className="ghostButton iconOnlyButton" onClick={(event) => { event.stopPropagation(); openEdit(record); }}>M</button><button type="button" className="dangerButton" onClick={(event) => { event.stopPropagation(); remove(record); }}>Suppr.</button></div></td></tr>)}{filtered.length === 0 && <tr><td colSpan="8" className="emptyCell">Aucun devis trouve</td></tr>}</tbody></table></div></section><QuoteMiniStats records={records} /></main><aside className="dashPanel quoteDetailPanel">{selected ? <><div className="dashPanelHeader"><strong>{selected.numero}</strong><span className={`statusBadge ${statusTone(selected.statut)}`}>{statusLabels[selectedStatus] || selected.statut}</span></div><div className="quoteDetailBody"><div className="quoteDetailTabs"><span className="active">Details</span><span>Lignes</span><span>Documents</span><span>Historique</span></div><h4>Informations generales</h4><dl><dt>Client</dt><dd>{selected.client_nom || '-'}</dd><dt>Projet / Objet</dt><dd>{selected.projet || selected.objet || '-'}</dd><dt>Montant HT</dt><dd>{formatMoney(totalQuote(selected))}</dd><dt>Date creation</dt><dd>{selected.date || '-'}</dd><dt>Responsable</dt><dd>{selected.responsable || selected.envoye_par || '-'}</dd><dt>Code client</dt><dd>{selected.code_validation || '-'}</dd></dl><h4>Prestations</h4><div className="quoteDetailLines">{(selected.prestations || []).map((line, index) => <div key={index}><span>{line.designation}</span><strong>{line.quantite} x {formatMoney(line.prix_unitaire)}</strong></div>)}</div>{selected.motif_refus && <div className="rejectionReason"><strong>Motif de refus</strong><p>{selected.motif_refus}</p></div>}<h4>Progression</h4><div className="dashProgress quoteProgress"><i style={{ width: `${progress}%` }} /></div><div className="quoteDetailActions"><button type="button" className="primaryButton" onClick={() => openEdit(selected)}>Modifier</button><button type="button" className="ghostButton" onClick={() => openQuotePdf(selected, true)}>PDF</button>{selectedStatus === 'redaction' && activeRole === 'responsable_appel' && <button type="button" className="ghostButton" onClick={() => updateQuote(selected, 'validation_technique')}>Soumettre RT</button>}{['validation_technique', 'pret_envoi'].includes(selectedStatus) && ['responsable_technique', 'dg'].includes(activeRole) && <button type="button" className="ghostButton" onClick={() => validateAndSend(selected)}>Valider + envoyer</button>}{selectedStatus === 'validation_dg' && activeRole === 'dg' && <button type="button" className="ghostButton" onClick={() => validateAndSend(selected)}>Valider DG + envoyer</button>}</div></div></> : <div className="notificationEmpty">Selectionnez un devis</div>}</aside></div>{modalOpen && <QuoteModal form={form} setForm={setForm} clients={clients} editing={editing} onClose={closeModal} onSubmit={submit} />}</div>
  );
}

