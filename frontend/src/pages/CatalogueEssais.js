import React from 'react';
import ResourcePage from '../components/ResourcePage';

const familleOptions = [
  { value: 'Beton', label: 'Beton' },
  { value: 'Sols', label: 'Sols' },
  { value: 'Granulats', label: 'Granulats' },
  { value: 'Bitume', label: 'Bitume' },
  { value: 'Acier', label: 'Acier' },
  { value: 'Eau', label: 'Eau' }
];

const statutOptions = [
  { value: 'actif', label: 'Actif' },
  { value: 'a_reviser', label: 'A reviser' },
  { value: 'inactif', label: 'Inactif' }
];

const fields = [
  { name: 'code', label: 'Code catalogue', required: true },
  { name: 'abreviation', label: 'Abreviation', required: true, placeholder: 'RC28, OPM, CBR...' },
  { name: 'designation', label: 'Designation', required: true, placeholder: 'Nom complet de l essai', full: true },
  { name: 'famille', label: 'Famille', required: true, options: familleOptions },
  { name: 'norme_reference', label: 'Norme / methode', required: true, placeholder: 'NF EN 12390-3, ISO, ASTM...' },
  { name: 'type_echantillon', label: 'Type echantillon', placeholder: 'Sol, beton, eau...' },
  { name: 'quantite_minimale', label: 'Quantite minimale', placeholder: 'Ex: 3 eprouvettes, 25 kg' },
  { name: 'delai_jours', label: 'Delai standard (jours)', type: 'number', required: true },
  { name: 'prix_unitaire', label: 'Prix unitaire', type: 'money', required: true },
  { name: 'equipements', label: 'Equipements requis', type: 'textarea', full: true, placeholder: 'Presse, balance, etuve, tamis...' },
  { name: 'criteres_acceptation', label: 'Criteres acceptation', type: 'textarea', full: true, placeholder: 'Regles de conformite, seuils, observations ISO...' },
  { name: 'statut', label: 'Statut', options: statutOptions, defaultValue: 'actif' }
];

const columns = [
  { name: 'code', label: 'Code' },
  { name: 'abreviation', label: 'Abr.' },
  { name: 'designation', label: 'Designation' },
  { name: 'famille', label: 'Famille' },
  { name: 'norme_reference', label: 'Norme' },
  { name: 'delai_jours', label: 'Delai' },
  { name: 'prix_unitaire', label: 'Prix', type: 'money' },
  { name: 'statut', label: 'Statut', badge: true }
];

export default function CatalogueEssais() {
  const summaryCards = (records) => {
    const actifs = records.filter((item) => item.statut === 'actif').length;
    const familles = new Set(records.map((item) => item.famille).filter(Boolean)).size;
    const prixMoyen = records.length
      ? records.reduce((sum, item) => sum + Number(item.prix_unitaire || 0), 0) / records.length
      : 0;

    return [
      { label: 'Essais catalogues', value: records.length, tone: 'blue' },
      { label: 'Essais actifs', value: actifs, tone: 'green' },
      { label: 'Familles couvertes', value: familles, tone: 'amber' },
      { label: 'Prix moyen', value: `${Math.round(prixMoyen / 1000).toLocaleString('fr-FR')}k`, tone: 'green', note: 'FCFA' }
    ];
  };

  return (
    <ResourcePage
      title="Catalogue des essais"
      subtitle="Essais normalises, normes applicables, delais, prix et criteres d acceptation du laboratoire."
      resource="catalogueEssais"
      fields={fields}
      columns={columns}
      primaryLabel="Nouvel essai catalogue"
      summaryCards={summaryCards}
    />
  );
}
