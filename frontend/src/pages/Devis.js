import React, { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import ResourcePage from '../components/ResourcePage';
import { listRecords, upsertRecord } from '../services/localStore';

const statusOptions = [
  { value: 'redaction', label: 'Redaction' },
  { value: 'validation_technique', label: 'Validation technique' },
  { value: 'validation_dg', label: 'Validation DG' },
  { value: 'pret_envoi', label: 'Pret a envoyer' },
  { value: 'envoye_client', label: 'Envoye au client' },
  { value: 'valide_client', label: 'Valide client' },
  { value: 'commande_creee', label: 'Commande creee' },
  { value: 'refuse', label: 'Refuse' }
];

const canalOptions = [
  { value: 'whatsapp', label: 'WhatsApp' },
  { value: 'email', label: 'Email' },
  { value: 'sms', label: 'SMS' }
];

const validationOptions = [
  { value: 'responsable_appel', label: 'Responsable des appels' },
  { value: 'responsable_technique', label: 'Responsable technique' },
  { value: 'dg', label: 'DG' },
  { value: 'client', label: 'Client' }
];

const fields = [
  { name: 'numero', label: 'Numero', required: true, placeholder: 'DEV-2026-032', hidden: true },
  {
    name: 'client_nom',
    label: 'Client',
    required: true,
    optionsResource: 'clients',
    optionValue: 'raison_sociale',
    optionLabel: 'raison_sociale',
    fillFrom: { client_whatsapp: 'telephone', client_email: 'email' }
  },
  { name: 'projet', label: 'Nom du projet', required: true, placeholder: 'Saisir le nom du projet' },
  { name: 'client_whatsapp', label: 'WhatsApp client', required: true, placeholder: '+229 97 12 34 56' },
  { name: 'client_email', label: 'Email client', placeholder: 'client@exemple.com' },
  { name: 'canal_envoi', label: 'Canal d’envoi', required: true, options: canalOptions, defaultValue: 'whatsapp' },
  { name: 'objet', label: 'Objet du devis', required: true, placeholder: 'Ex: Essais beton - Pont de Cotonou', full: true },
  {
    name: 'prestations',
    label: 'Prestations',
    type: 'lineItems',
    full: true,
    defaultValue: [
      { designation: 'Compression beton Rc28 (lot 3)', quantite: 8, prix_unitaire: 150000 },
      { designation: 'Proctor modifie', quantite: 4, prix_unitaire: 200000 }
    ]
  },
  { name: 'montant_ht', label: 'Montant HT', type: 'money', required: true, hidden: true },
  { name: 'canal_validation', label: 'Circuit validation', options: validationOptions, defaultValue: 'responsable_appel', hidden: true },
  { name: 'code_validation', label: 'Code QR validation client', type: 'validationCode', readOnly: true, hidden: true },
  { name: 'date', label: 'Date', type: 'date', hidden: true },
  { name: 'statut', label: 'Statut', options: statusOptions, defaultValue: 'redaction', hidden: true }
];

const columns = [
  { name: 'numero', label: 'N' },
  { name: 'client_nom', label: 'Client' },
  { name: 'projet', label: 'Projet' },
  { name: 'objet', label: 'Objet' },
  { name: 'prestations', label: 'Prestations', type: 'lineItems' },
  { name: 'montant_ht', label: 'Montant HT', type: 'money' },
  { name: 'canal_envoi', label: 'Canal' },
  { name: 'code_validation', label: 'Code client' },
  { name: 'statut', label: 'Statut', badge: true }
];

function formatCompactMoney(value) {
  const amount = Number(value || 0);
  if (amount >= 1000000) return `${(amount / 1000000).toLocaleString('fr-FR', { maximumFractionDigits: 1 })}M`;
  if (amount >= 1000) return `${Math.round(amount / 1000).toLocaleString('fr-FR')}k`;
  return amount.toLocaleString('fr-FR');
}

function formatMoney(value) {
  return Number(value || 0).toLocaleString('fr-FR');
}

function lineItemTotal(item) {
  return Number(item.quantite || 0) * Number(item.prix_unitaire || 0);
}

function lineItemsTotal(items) {
  return (Array.isArray(items) ? items : []).reduce((sum, item) => sum + lineItemTotal(item), 0);
}

function nextCommandNumber(commandes) {
  const year = new Date().getFullYear();
  const max = commandes.reduce((highest, commande) => {
    const match = String(commande.numero || '').match(new RegExp(`^CMD-${year}-(\\d+)$`, 'i'));
    return match ? Math.max(highest, Number(match[1])) : highest;
  }, 0);
  return `CMD-${year}-${String(max + 1).padStart(3, '0')}`;
}

async function createOrderFromQuote(quote) {
  const commandes = await listRecords('commandes');
  const existing = commandes.find((commande) => commande.reference_devis === quote.numero);
  if (existing) return existing;

  const order = {
    numero: nextCommandNumber(commandes),
    reference_devis: quote.numero,
    client_nom: quote.client_nom,
    client_whatsapp: quote.client_whatsapp,
    projet: quote.projet,
    prestations: Array.isArray(quote.prestations) ? quote.prestations : [],
    montant_ht: Number(quote.montant_ht || lineItemsTotal(quote.prestations)),
    date: new Date().toISOString().slice(0, 10),
    statut: 'nouvelle'
  };

  return upsertRecord('commandes', order);
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
    const order = await createOrderFromQuote(quote);
    const validatedQuote = {
      ...quote,
      statut: 'commande_creee',
      canal_validation: 'client',
      validation_client: 'valide',
      date_validation_client: new Date().toISOString(),
      commande_numero: order.numero
    };
    await upsertRecord('devis', validatedQuote);
    setQuote(validatedQuote);
    setResult(`Devis valide. Commande ${order.numero} creee automatiquement.`);
  };

  const rejectQuote = async () => {
    if (!quote) return;
    if (!reason.trim()) {
      setResult('Veuillez indiquer la raison du rejet.');
      return;
    }

    const rejectedQuote = {
      ...quote,
      statut: 'refuse',
      canal_validation: 'client',
      validation_client: 'rejete',
      motif_refus: reason.trim(),
      date_rejet_client: new Date().toISOString(),
      responsable_notification: 'responsable_technique'
    };

    await upsertRecord('devis', rejectedQuote);
    setQuote(rejectedQuote);
    setRejecting(false);
    setResult('Rejet enregistre et renvoye au responsable technique dans SMARTLAB.');
  };

  const total = useMemo(() => lineItemsTotal(quote?.prestations), [quote]);

  if (loading) {
    return <div className="validationPortal"><div className="tablePanel"><div className="emptyCell">Chargement du devis...</div></div></div>;
  }

  if (!quote) {
    return <div className="validationPortal"><div className="tablePanel"><div className="emptyCell">Code de validation introuvable.</div></div></div>;
  }

  const alreadyAnswered = ['commande_creee', 'refuse'].includes(quote.statut);

  return (
    <div className="validationPortal">
      <div className="welcomeBand">
        <div>
          <h2>Validation du devis {quote.numero}</h2>
          <p>{quote.client_nom} - {quote.projet}</p>
        </div>
        <strong>{formatMoney(quote.montant_ht || total)} FCFA</strong>
      </div>

      <div className="tablePanel validationPanel">
        <div className="tableTools">
          <strong>{quote.objet}</strong>
          <span className={`statusBadge ${quote.statut === 'refuse' ? 'danger' : 'info'}`}>{quote.statut}</span>
        </div>
        <div className="validationBody">
          <h3>Prestations</h3>
          {(quote.prestations || []).map((item, index) => (
            <div className="kpi-row" key={`${item.designation}-${index}`}>
              <div className="kpi-name">{item.designation}</div>
              <div className="kpi-value">{item.quantite} x {formatMoney(item.prix_unitaire)} FCFA</div>
            </div>
          ))}

          {quote.motif_refus && (
            <div className="rejectionReason">
              <strong>Motif de rejet</strong>
              <p>{quote.motif_refus}</p>
            </div>
          )}

          {result && <div className="scoreBox ok"><strong>Information</strong>{result}</div>}

          {!alreadyAnswered && !rejecting && (
            <div className="formActions validationActions">
              <button type="button" className="primaryButton" onClick={acceptQuote}>Valider le devis</button>
              <button type="button" className="dangerButton" onClick={() => setRejecting(true)}>Rejeter le devis</button>
            </div>
          )}

          {rejecting && (
            <div className="scoreBox">
              <label className="full">
                <span>Raison du rejet</span>
                <textarea
                  value={reason}
                  onChange={(event) => setReason(event.target.value)}
                  placeholder="Expliquez pourquoi vous rejetez ce devis..."
                  rows="4"
                />
              </label>
              <div className="formActions validationActions">
                <button type="button" className="ghostButton" onClick={() => setRejecting(false)}>Annuler</button>
                <button type="button" className="dangerButton" onClick={rejectQuote}>Confirmer le rejet</button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function Devis() {
  const [searchParams] = useSearchParams();
  const validationCode = searchParams.get('validation');

  const summaryCards = (records) => {
    const totalAmount = records.reduce((sum, item) => sum + Number(item.montant_ht || 0), 0);
    const sent = records.filter((item) => item.statut === 'envoye_client').length;
    const signed = records.filter((item) => ['valide_client', 'commande_creee'].includes(item.statut)).length;
    const drafts = records.filter((item) => item.statut === 'redaction').length;
    return [
      { label: 'Total devis', value: records.length, tone: 'blue' },
      { label: 'Montant total', value: formatCompactMoney(totalAmount), tone: 'green', note: 'FCFA' },
      { label: 'Devis envoyes', value: sent, tone: 'amber' },
      { label: 'Devis signes', value: signed, tone: 'green', note: `${drafts} brouillon(s)` }
    ];
  };

  if (validationCode) {
    return <QuoteValidationPortal code={validationCode} />;
  }

  return (
    <ResourcePage
      title="Devis"
      subtitle="Creation, suivi et envoi des devis aux clients."
      resource="devis"
      fields={fields}
      columns={columns}
      primaryLabel="Nouveau Devis"
      summaryCards={summaryCards}
      submitLabel="Enregistrer le devis"
    />
  );
}
