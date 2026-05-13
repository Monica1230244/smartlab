import React from 'react';
import ResourcePage from '../components/ResourcePage';

const fields = [
  { name: 'code', label: 'Code client', required: true, placeholder: 'CLI-004' },
  { name: 'raison_sociale', label: 'Raison sociale', required: true, placeholder: 'Nom du client' },
  { name: 'contact_nom', label: 'Contact', placeholder: 'Nom du contact' },
  { name: 'telephone', label: 'Telephone', placeholder: '+229 ...' },
  { name: 'email', label: 'Email', type: 'email', placeholder: 'contact@client.com' },
  { name: 'secteur', label: 'Secteur', placeholder: 'BTP, Industrie...' }
];

const columns = [
  { name: 'code', label: 'Code' },
  { name: 'raison_sociale', label: 'Raison sociale' },
  { name: 'contact_nom', label: 'Contact' },
  { name: 'telephone', label: 'Telephone' },
  { name: 'secteur', label: 'Secteur' }
];

export default function Clients() {
  return (
    <ResourcePage
      title="Gestion des clients"
      subtitle="Ajout, modification et suppression du portefeuille client."
      resource="clients"
      fields={fields}
      columns={columns}
      primaryLabel="Nouveau client"
    />
  );
}
