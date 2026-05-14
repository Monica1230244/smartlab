import React, { useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import { deleteRecord, listRecords, upsertRecord } from '../services/localStore';

function emptyForm(fields) {
  return fields.reduce((acc, field) => ({ ...acc, [field.name]: field.defaultValue || '' }), {});
}

function formatValue(value, field) {
  if (field.type === 'money') {
    return `${Number(value || 0).toLocaleString('fr-FR')} FCFA`;
  }
  return value || '-';
}

function statusTone(value) {
  const key = String(value || '').toLowerCase();
  if (['termine', 'paye', 'livree', 'valide', 'envoye', 'signe', 'conforme', 'accepte', 'active', 'actif', 'realise', 'cloture', 'cloturee'].includes(key)) return 'success';
  if (['en_cours', 'en_essai', 'controle', 'recu', 'en_traitement', 'planifie', 'en_preparation'].includes(key)) return 'info';
  if (['haute', 'urgente', 'brouillon', 'nouvelle', 'en_attente', 'a_surveiller', 'en_suivi', 'a_renouveler', 'a_configurer', 'ouverte'].includes(key)) return 'warning';
  if (['annulee', 'archive', 'hors_service', 'refuse', 'suspendue', 'inactif'].includes(key)) return 'danger';
  return 'neutral';
}

function ResourcePage({ title, subtitle, resource, fields, columns, primaryLabel, summaryCards = [] }) {
  const [records, setRecords] = useState([]);
  const [query, setQuery] = useState('');
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(emptyForm(fields));
  const [modalOpen, setModalOpen] = useState(false);

  const refresh = () => setRecords(listRecords(resource));

  useEffect(() => {
    refresh();
    const handler = () => refresh();
    window.addEventListener('smartlab:data-changed', handler);
    return () => window.removeEventListener('smartlab:data-changed', handler);
  }, [resource]);

  const filteredRecords = useMemo(() => {
    const needle = query.trim().toLowerCase();
    if (!needle) return records;
    return records.filter((record) => Object.values(record).join(' ').toLowerCase().includes(needle));
  }, [records, query]);

  const openCreate = () => {
    setEditing(null);
    setForm(emptyForm(fields));
    setModalOpen(true);
  };

  const openEdit = (record) => {
    setEditing(record.id);
    setForm(fields.reduce((acc, field) => ({ ...acc, [field.name]: record[field.name] || '' }), {}));
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setEditing(null);
    setForm(emptyForm(fields));
  };

  const submit = (event) => {
    event.preventDefault();
    upsertRecord(resource, { ...form, id: editing });
    toast.success(editing ? 'Modification enregistree' : 'Ajout enregistre');
    closeModal();
  };

  const remove = (record) => {
    const label = record.numero || record.code || record.raison_sociale || record.reference || 'cet element';
    if (!window.confirm(`Supprimer ${label} ?`)) return;
    deleteRecord(resource, record.id);
    toast.success('Suppression effectuee');
  };

  return (
    <div className="pageStack">
      <div className="pageHeader">
        <div>
          <h2>{title}</h2>
          <p>{subtitle}</p>
        </div>
        <button type="button" className="secondaryButton" onClick={openCreate}>+ {primaryLabel}</button>
      </div>

      {summaryCards.length > 0 && (
        <div className="statsGrid">
          {summaryCards.map((card) => (
            <div className={`statCard ${card.tone || 'blue'}`} key={card.label}>
              <span>{card.label}</span>
              <strong>{card.value}</strong>
              {card.note && <small>{card.note}</small>}
            </div>
          ))}
        </div>
      )}

      <div className="tablePanel">
        <div className="tableTools">
          <strong>{records.length} element(s)</strong>
          <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Rechercher..." />
        </div>
        <div className="tableScroll">
          <table>
            <thead>
              <tr>
                {columns.map((column) => <th key={column.name}>{column.label}</th>)}
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredRecords.map((record) => (
                <tr key={record.id}>
                  {columns.map((column) => (
                    <td key={column.name}>
                      {column.badge ? (
                        <span className={`statusBadge ${statusTone(record[column.name])}`}>
                          {formatValue(record[column.name], column)}
                        </span>
                      ) : (
                        formatValue(record[column.name], column)
                      )}
                    </td>
                  ))}
                  <td>
                    <div className="rowActions">
                      <button type="button" className="ghostButton" onClick={() => openEdit(record)}>Modifier</button>
                      <button type="button" className="dangerButton" onClick={() => remove(record)}>Supprimer</button>
                    </div>
                  </td>
                </tr>
              ))}
              {filteredRecords.length === 0 && (
                <tr>
                  <td colSpan={columns.length + 1} className="emptyCell">Aucun resultat</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {modalOpen && (
        <div className="modalOverlay" onMouseDown={(event) => event.target === event.currentTarget && closeModal()}>
          <form className="modalPanel" onSubmit={submit}>
            <div className="modalHeader">
              <strong>{editing ? 'Modifier' : primaryLabel}</strong>
              <button type="button" className="modalClose" onClick={closeModal}>x</button>
            </div>
            <div className="modalBody">
              <div className="formGrid">
                {fields.map((field) => (
                  <label key={field.name} className={field.full ? 'full' : ''}>
                    <span>{field.label}</span>
                    {field.options ? (
                      <select
                        value={form[field.name]}
                        required={field.required}
                        onChange={(event) => setForm((current) => ({ ...current, [field.name]: event.target.value }))}
                      >
                        <option value="">Selectionner</option>
                        {field.options.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
                      </select>
                    ) : (
                      <input
                        type={field.type === 'money' ? 'number' : field.type || 'text'}
                        value={form[field.name]}
                        required={field.required}
                        placeholder={field.placeholder}
                        onChange={(event) => setForm((current) => ({ ...current, [field.name]: event.target.value }))}
                      />
                    )}
                  </label>
                ))}
              </div>
            </div>
            <div className="modalFooter">
              <button type="button" className="ghostButton" onClick={closeModal}>Annuler</button>
              <button className="primaryButton" type="submit">{editing ? 'Enregistrer' : 'Ajouter'}</button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}

export default ResourcePage;
