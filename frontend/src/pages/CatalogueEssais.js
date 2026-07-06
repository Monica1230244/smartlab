import React from 'react';
import OperationalRegisterPage from '../components/OperationalRegisterPage';

const familleOptions = ['Beton', 'Sols', 'Granulats', 'Bitume', 'Acier', 'Eau'].map((value) => ({ value, label: value }));
const statutOptions = [{ value: 'actif', label: 'Actif' }, { value: 'a_reviser', label: 'A reviser' }, { value: 'inactif', label: 'Inactif' }];

export default function CatalogueEssais() {
  return <OperationalRegisterPage config={{
    resource: 'catalogueEssais',
    prefix: 'CAT',
    withYear: false,
    numberField: 'code',
    title: 'Catalogue des essais',
    eyebrow: 'Referentiel laboratoire',
    subtitle: 'Maitrisez les familles d essais, normes, delais, prix, criteres et equipements associes.',
    searchPlaceholder: 'Rechercher un essai, norme, abreviation...',
    primaryLabel: 'Nouvel essai catalogue',
    createTitle: 'Nouvel essai catalogue',
    editTitle: 'Modifier essai catalogue',
    processTitle: 'Referentiel technique controle',
    processNote: 'Le catalogue pilote les devis, les objets d essais, les resultats et les rapports.',
    workflow: ['Definir methode', 'Associer norme', 'Fixer delai', 'Lier equipements', 'Valider tarif', 'Publier'],
    evidence: ['Norme applicable', 'Criteres acceptation', 'Equipements requis', 'Tarif maitrise'],
    tabs: ['Tous les essais', 'Actifs', 'A reviser', 'Inactifs'],
    defaultForm: { code: '', abreviation: '', designation: '', famille: 'Beton', norme_reference: '', type_echantillon: '', quantite_minimale: '', delai_jours: 1, prix_unitaire: 0, equipements: '', criteres_acceptation: '', statut: 'actif' },
    fields: [
      { name: 'code', label: 'Code catalogue', readOnly: true },
      { name: 'abreviation', label: 'Abreviation', required: true },
      { name: 'designation', label: 'Designation', required: true, full: true },
      { name: 'famille', label: 'Famille', options: familleOptions },
      { name: 'norme_reference', label: 'Norme / methode', required: true },
      { name: 'type_echantillon', label: 'Type echantillon' },
      { name: 'quantite_minimale', label: 'Quantite minimale' },
      { name: 'delai_jours', label: 'Delai standard (jours)', type: 'number' },
      { name: 'prix_unitaire', label: 'Prix unitaire', type: 'number' },
      { name: 'statut', label: 'Statut', options: statutOptions },
      { name: 'equipements', label: 'Equipements requis', type: 'textarea', full: true },
      { name: 'criteres_acceptation', label: 'Criteres acceptation', type: 'textarea', full: true }
    ],
    columns: [
      { name: 'code', label: 'Code' },
      { name: 'abreviation', label: 'Abr.' },
      { name: 'designation', label: 'Designation' },
      { name: 'famille', label: 'Famille' },
      { name: 'norme_reference', label: 'Norme' },
      { name: 'delai_jours', label: 'Delai' },
      { name: 'prix_unitaire', label: 'Prix', type: 'money' },
      { name: 'statut', label: 'Statut', badge: true }
    ],
    detailFields: [
      { name: 'designation', label: 'Designation' },
      { name: 'norme_reference', label: 'Norme' },
      { name: 'type_echantillon', label: 'Type echantillon' },
      { name: 'quantite_minimale', label: 'Quantite minimale' },
      { name: 'equipements', label: 'Equipements' },
      { name: 'criteres_acceptation', label: 'Criteres' }
    ],
    summary: (records) => [
      { label: 'Essais catalogues', value: records.length, tone: 'blue', icon: 'CE' },
      { label: 'Actifs', value: records.filter((item) => item.statut === 'actif').length, tone: 'green', icon: 'OK' },
      { label: 'A reviser', value: records.filter((item) => item.statut === 'a_reviser').length, tone: 'amber', icon: 'RV' },
      { label: 'Familles', value: new Set(records.map((item) => item.famille).filter(Boolean)).size, tone: 'purple', icon: 'FM' },
      { label: 'Prix moyen', value: records.length ? `${Math.round(records.reduce((sum, item) => sum + Number(item.prix_unitaire || 0), 0) / records.length / 1000)}k` : '0', tone: 'green', icon: 'FC' }
    ],
    sideTitle: 'Top familles',
    sideStats: (records) => Array.from(new Set(records.map((item) => item.famille).filter(Boolean))).map((famille) => ({ label: famille, value: records.filter((item) => item.famille === famille).length }))
  }} />;
}
