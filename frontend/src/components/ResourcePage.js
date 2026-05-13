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

function ResourcePage({ title, subtitle, resource, fields, columns, primaryLabel }) {
  const [records, setRecords] = useState([]);
  const [query, setQuery] = useState('');
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(emptyForm(fields));

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

  const startCreate = () => {
    setEditing(null);
    setForm(emptyForm(fields));
  };

  const startEdit = (record) => {
    setEditing(record.id);
    setForm(fields.reduce((acc, field) => ({ ...acc, [field.name]: record[field.name] || '' }), {}));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const submit = (event) => {
    event.preventDefault();
    upsertRecord(resource, { ...form, id: editing });
    toast.success(editing ? 'Modification enregistrée' : 'Ajout enregistré');
    startCreate();
  };

  const remove = (record) => {
    const label = record.numero || record.code || record.raison_sociale || 'cet element';
    if (!window.confirm(`Supprimer ${label} ?`)) return;
    deleteRecord(resource, record.id);
    toast.success('Suppression effectuée');
  };

  return (
    <div className="pageStack">
      <div className="pageHeader">
        <div>
          <h2>{title}</h2>
          <p>{subtitle}</p>
        </div>
        <button className="secondaryButton" onClick={startCreate}>Nouveau</button>
      </div>

      <form className="editorPanel" onSubmit={submit}>
        <div className="formHeader">
          <strong>{editing ? 'Modifier' : primaryLabel}</strong>
          {editing && <button type="button" className="ghostButton" onClick={startCreate}>Annuler</button>}
        </div>
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
        <div className="formActions">
          <button className="primaryButton" type="submit">{editing ? 'Enregistrer' : 'Ajouter'}</button>
        </div>
      </form>

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
                    <td key={column.name}>{formatValue(record[column.name], column)}</td>
                  ))}
                  <td>
                    <div className="rowActions">
                      <button className="ghostButton" onClick={() => startEdit(record)}>Modifier</button>
                      <button className="dangerButton" onClick={() => remove(record)}>Supprimer</button>
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
    </div>
  );
}

export default ResourcePage;
