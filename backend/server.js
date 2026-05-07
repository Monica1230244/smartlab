const express = require('express');
const cors = require('cors');
const app = express();

app.use(cors());
app.use(express.json());

// Données fictives (pas besoin de MySQL)
const essais = [
  { id: 1, numero: 'EA-2026-001', type_essai: 'Compression béton', client_nom: 'Sogéa BTP', statut: 'en_cours' },
  { id: 2, numero: 'EA-2026-002', type_essai: 'Proctor', client_nom: 'AGETUR', statut: 'termine' },
  { id: 3, numero: 'EA-2026-003', type_essai: 'CBR', client_nom: 'Colas Bénin', statut: 'en_cours' }
];

const clients = [
  { id: 1, code: 'CLI-001', raison_sociale: 'Sogéa BTP Bénin', contact_nom: 'M. Fonton', secteur: 'BTP' },
  { id: 2, code: 'CLI-002', raison_sociale: 'AGETUR Bénin', contact_nom: 'Mme Ahoton', secteur: 'Infrastructure' }
];

// Routes API
app.get('/health', (req, res) => {
  res.json({ status: 'OK', message: 'SMARTLAB API - Mode démo' });
});

app.get('/api/essais', (req, res) => {
  res.json(essais);
});

app.get('/api/clients', (req, res) => {
  res.json(clients);
});

app.get('/api/dashboard/stats', (req, res) => {
  res.json({
    essaisEnCours: 47,
    essaisComplete: 128,
    echantillonsActifs: 93,
    nonConformites: 2
  });
});

const PORT = 5000;
app.listen(PORT, () => {
  console.log(`✅ Serveur SMARTLAB démarré sur http://localhost:${PORT}`);
  console.log(`📋 Mode démo - Données fictives`);
});
