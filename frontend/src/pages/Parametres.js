import React from 'react';
import ResourcePage from '../components/ResourcePage';

const statusOptions = [
  { value: 'actif', label: 'Actif' },
  { value: 'inactif', label: 'Inactif' },
  { value: 'a_configurer', label: 'A configurer' }
];

const fields = [
  { name: 'module', label: 'Module', required: true, placeholder: 'Normes, rapports, utilisateurs...' },
  { name: 'valeur', label: 'Configuration', required: true, placeholder: 'Parametre ou modele active', full: true },
  { name: 'statut', label: 'Statut', options: statusOptions, defaultValue: 'actif' }
];

const columns = [
  { name: 'module', label: 'Module' },
  { name: 'valeur', label: 'Configuration' },
  { name: 'statut', label: 'Statut', badge: true }
];

export default function Parametres() {
  return (
    <ResourcePage
      title="Parametrage et personnalisation"
      subtitle="Normes utilisees, modeles de rapports, activation des modules et droits d'acces."
      resource="parametres"
      fields={fields}
      columns={columns}
      primaryLabel="Nouveau parametre"
    />
  );
}
