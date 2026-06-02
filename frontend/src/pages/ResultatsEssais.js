import React, { useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import { deleteRecord, listRecords, upsertRecord } from '../services/localStore';

const emptyForm = {
  numero: '',
  objet_essai: '',
  essai_code: '',
  client_nom: '',
  date_resultat: '',
  valeur_1: '',
  valeur_2: '',
  valeur_3: '',
  valeur_4: '',
  valeur_5: '',
  unite: '',
  exigence: '',
  technicien: '',
  observations: ''
};

function nextResultNumber(records) {
  const year = new Date().getFullYear();
  const max = records.reduce((highest, record) => {
    const match = String(record.numero || '').match(new RegExp(`^RES-${year}-(\\d+)$`, 'i'));
    return match ? Math.max(highest, Number(match[1])) : highest;
  }, 0);
  return `RES-${year}-${String(max + 1).padStart(3, '0')}`;
}

function numericValues(form) {
  return ['valeur_1', 'valeur_2', 'valeur_3', 'valeur_4', 'valeur_5']
    .map((key) => Number(form[key]))
    .filter((value) => Number.isFinite(value) && value !== 0);
}

function round(value) {
  return Math.round(Number(value || 0) * 100) / 100;
}

function calculateResult(form) {
  const values = numericValues(form);
  const code = String(form.essai_code || '').toUpperCase();
  const exigence = Number(form.exigence || 0);

  if (code === 'LA' && Number(form.valeur_1) && Number(form.valeur_2)) {
    const indicePlasticite = round(Number(form.valeur_1) - Number(form.valeur_2));
    return {
      moyenne: indicePlasticite,
      decision: exigence ? (indicePlasticite <= exigence ? 'conforme' : 'non_conforme') : 'a_interpreter',
      formule: 'IP = Limite liquidite - Limite plasticite'
    };
  }

  if (code === 'OPM') {
    return {
      moyenne: round(form.valeur_1),
      decision: 'a_interpreter',
      formule: 'Densite seche max / teneur en eau optimale a reporter'
    };
  }

  if (values.length === 0) {
    return { moyenne: 0, decision: 'a_saisir', formule: 'Saisir les valeurs mesurees' };
  }

  const moyenne = round(values.reduce((sum, value) => sum + value, 0) / values.length);
  return {
    moyenne,
    decision: exigence ? (moyenne >= exigence ? 'conforme' : 'non_conforme') : 'a_interpreter',
    formule: 'Moyenne arithmetique des valeurs mesurees'
  };
}

function statusTone(value) {
  if (value === 'conforme') return 'success';
  if (value === 'non_conforme') return 'danger';
  if (value === 'a_saisir') return 'warning';
  return 'info';
}

function formatMoney(value) {
  return Number(value || 0).toLocaleString('fr-FR');
}

export default function ResultatsEssais() {
  const [records, setRecords] = useState([]);
  const [essais, setEssais] = useState([]);
  const [catalogue, setCatalogue] = useState([]);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [query, setQuery] = useState('');
  const calculation = useMemo(() => calculateResult(form), [form]);

  const refresh = async () => {
    const [nextRecords, nextEssais, nextCatalogue] = await Promise.all([
      listRecords('resultatsEssais'),
      listRecords('essais'),
      listRecords('catalogueEssais')
    ]);
    setRecords(nextRecords);
    setEssais(nextEssais);
    setCatalogue(nextCatalogue);
  };

  useEffect(() => {
    refresh();
    const handler = () => refresh();
    window.addEventListener('smartlab:data-changed', handler);
    return () => window.removeEventListener('smartlab:data-changed', handler);
  }, []);

  const filteredRecords = useMemo(() => {
    const needle = query.trim().toLowerCase();
    if (!needle) return records;
    return records.filter((record) => Object.values(record).join(' ').toLowerCase().includes(needle));
  }, [records, query]);

  const openCreate = () => {
    setEditing(null);
    setForm({
      ...emptyForm,
      numero: nextResultNumber(records),
      date_resultat: new Date().toISOString().slice(0, 10)
    });
  };

  const openEdit = (record) => {
    setEditing(record.id);
    setForm({ ...emptyForm, ...record });
  };

  const remove = async (record) => {
    if (!window.confirm(`Supprimer ${record.numero} ?`)) return;
    await deleteRecord('resultatsEssais', record.id);
    await refresh();
    toast.success('Resultat supprime');
  };

  const changeObjetEssai = (value) => {
    const essai = essais.find((item) => item.numero === value);
    setForm((current) => ({
      ...current,
      objet_essai: value,
      essai_code: essai?.essai_a_realiser || current.essai_code,
      client_nom: essai?.client_nom || current.client_nom
    }));
  };

  const changeEssaiCode = (value) => {
    const item = catalogue.find((entry) => entry.abreviation === value);
    setForm((current) => ({
      ...current,
      essai_code: value,
      unite: value.startsWith('RC') ? 'MPa' : current.unite,
      observations: item?.criteres_acceptation || current.observations
    }));
  };

  const submit = async (event) => {
    event.preventDefault();
    const payload = {
      ...form,
      id: editing,
      moyenne: calculation.moyenne,
      decision: calculation.decision,
      formule: calculation.formule
    };
    const saved = await upsertRecord('resultatsEssais', payload);
    if (saved.__syncError) {
      toast.error(`Enregistre localement, mais pas dans Supabase: ${saved.__syncError}`);
    } else {
      toast.success(editing ? 'Resultat modifie dans Supabase' : 'Resultat enregistre dans Supabase');
    }
    setEditing(null);
    setForm(emptyForm);
    await refresh();
  };

  const totalConformes = records.filter((record) => record.decision === 'conforme').length;
  const totalNonConformes = records.filter((record) => record.decision === 'non_conforme').length;

  return (
    <div className="pageStack">
      <div className="pageHeader">
        <div>
          <h2>Resultats & calculs</h2>
          <p>Saisie des mesures, calcul automatique et decision de conformite des essais.</p>
        </div>
        <button type="button" className="secondaryButton" onClick={openCreate}>+ Nouveau resultat</button>
      </div>

      <div className="statsGrid">
        <div className="statCard blue"><span>Resultats saisis</span><strong>{records.length}</strong></div>
        <div className="statCard green"><span>Conformes</span><strong>{totalConformes}</strong></div>
        <div className="statCard red"><span>Non conformes</span><strong>{totalNonConformes}</strong></div>
        <div className="statCard amber"><span>Essais catalogues</span><strong>{catalogue.length}</strong></div>
      </div>

      {(form.numero || editing) && (
        <form className="editorPanel" onSubmit={submit}>
          <div className="formHeader">
            <strong>{editing ? 'Modifier le resultat' : 'Nouveau resultat'}</strong>
            <button type="button" className="ghostButton" onClick={() => { setEditing(null); setForm(emptyForm); }}>Fermer</button>
          </div>
          <div className="formGrid">
            <label>
              <span>Numero resultat</span>
              <input value={form.numero} readOnly />
            </label>
            <label>
              <span>Objet d essai</span>
              <select value={form.objet_essai} required onChange={(event) => changeObjetEssai(event.target.value)}>
                <option value="">Selectionner</option>
                {essais.map((item) => <option key={item.id} value={item.numero}>{item.numero} - {item.nature}</option>)}
              </select>
            </label>
            <label>
              <span>Essai</span>
              <select value={form.essai_code} required onChange={(event) => changeEssaiCode(event.target.value)}>
                <option value="">Selectionner</option>
                {catalogue.map((item) => <option key={item.id} value={item.abreviation}>{item.abreviation} - {item.designation}</option>)}
              </select>
            </label>
            <label>
              <span>Client</span>
              <input value={form.client_nom} onChange={(event) => setForm((current) => ({ ...current, client_nom: event.target.value }))} />
            </label>
            <label>
              <span>Date resultat</span>
              <input type="date" value={form.date_resultat} onChange={(event) => setForm((current) => ({ ...current, date_resultat: event.target.value }))} />
            </label>
            <label>
              <span>Technicien</span>
              <input value={form.technicien} required onChange={(event) => setForm((current) => ({ ...current, technicien: event.target.value }))} />
            </label>
            {['valeur_1', 'valeur_2', 'valeur_3', 'valeur_4', 'valeur_5'].map((key, index) => (
              <label key={key}>
                <span>Valeur {index + 1}</span>
                <input type="number" step="0.01" value={form[key]} onChange={(event) => setForm((current) => ({ ...current, [key]: event.target.value }))} />
              </label>
            ))}
            <label>
              <span>Unite</span>
              <input value={form.unite} placeholder="MPa, %, kN..." onChange={(event) => setForm((current) => ({ ...current, unite: event.target.value }))} />
            </label>
            <label>
              <span>Exigence</span>
              <input type="number" step="0.01" value={form.exigence} placeholder="Seuil de conformite" onChange={(event) => setForm((current) => ({ ...current, exigence: event.target.value }))} />
            </label>
            <label className="full">
              <span>Observations</span>
              <textarea rows="3" value={form.observations} onChange={(event) => setForm((current) => ({ ...current, observations: event.target.value }))} />
            </label>
          </div>
          <div className={`scoreBox ${calculation.decision === 'conforme' ? 'ok' : calculation.decision === 'non_conforme' ? 'ko' : ''}`}>
            <strong>{calculation.moyenne} {form.unite}</strong>
            <span>{calculation.formule} - Decision: {calculation.decision}</span>
          </div>
          <div className="formActions">
            <button className="primaryButton" type="submit">Enregistrer le resultat</button>
          </div>
        </form>
      )}

      <div className="tablePanel">
        <div className="tableTools">
          <strong>{records.length} resultat(s)</strong>
          <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Rechercher..." />
        </div>
        <div className="tableScroll">
          <table>
            <thead>
              <tr>
                <th>Numero</th>
                <th>Objet</th>
                <th>Essai</th>
                <th>Client</th>
                <th>Moyenne</th>
                <th>Exigence</th>
                <th>Decision</th>
                <th>Technicien</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredRecords.map((record) => (
                <tr key={record.id}>
                  <td>{record.numero}</td>
                  <td>{record.objet_essai}</td>
                  <td>{record.essai_code}</td>
                  <td>{record.client_nom}</td>
                  <td>{formatMoney(record.moyenne)} {record.unite}</td>
                  <td>{record.exigence || '-'}</td>
                  <td><span className={`statusBadge ${statusTone(record.decision)}`}>{record.decision}</span></td>
                  <td>{record.technicien}</td>
                  <td>
                    <div className="rowActions">
                      <button type="button" className="ghostButton" onClick={() => openEdit(record)}>Modifier</button>
                      <button type="button" className="dangerButton" onClick={() => remove(record)}>Supprimer</button>
                    </div>
                  </td>
                </tr>
              ))}
              {filteredRecords.length === 0 && (
                <tr><td colSpan="9" className="emptyCell">Aucun resultat</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
