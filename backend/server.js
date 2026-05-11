const express = require('express');
const cors = require('cors');
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

// Vérifier que les variables existent
if (!process.env.SUPABASE_URL || !process.env.SUPABASE_KEY) {
    console.error('❌ ERREUR: Les variables SUPABASE_URL et SUPABASE_KEY doivent être définies dans .env');
    process.exit(1);
}

// Connexion à Supabase
const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_KEY
);

console.log('✅ Connexion à Supabase configurée');

// Routes
app.get('/health', (req, res) => {
    res.json({ status: 'OK', message: 'SMARTLAB avec Supabase - En ligne !' });
});

// Récupérer tous les essais
app.get('/api/essais', async (req, res) => {
    try {
        const { data, error } = await supabase
            .from('essais')
            .select('*')
            .order('id', { ascending: false });
        
        if (error) throw error;
        res.json(data);
    } catch (error) {
        console.error('Erreur:', error.message);
        res.status(500).json({ error: error.message });
    }
});

// Récupérer les statistiques
app.get('/api/dashboard/stats', async (req, res) => {
    try {
        const { count: enCours } = await supabase
            .from('essais')
            .select('*', { count: 'exact', head: true })
            .eq('statut', 'en_cours');
        
        const { count: termines } = await supabase
            .from('essais')
            .select('*', { count: 'exact', head: true })
            .eq('statut', 'termine');
        
        res.json({ 
            essaisEnCours: enCours || 0, 
            essaisComplete: termines || 0,
            echantillonsActifs: 93,
            nonConformites: 2
        });
    } catch (error) {
        res.json({ 
            essaisEnCours: 47, 
            essaisComplete: 128,
            echantillonsActifs: 93,
            nonConformites: 2
        });
    }
});

// Créer un essai
app.post('/api/essais', async (req, res) => {
    try {
        const { data, error } = await supabase
            .from('essais')
            .insert([{
                numero: req.body.numero,
                type_essai: req.body.type_essai,
                norme: req.body.norme || 'NF EN 12390-3',
                client_nom: req.body.client_nom || 'Client test',
                technicien: req.body.technicien || 'Technicien',
                statut: 'en_cours'
            }])
            .select();
        
        if (error) throw error;
        res.status(201).json(data[0]);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Démarrer le serveur
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`\n🚀 SMARTLAB Backend démarré sur http://localhost:${PORT}`);
    console.log(`📊 Base de données: Supabase`);
    console.log(`🌐 URL Supabase: ${process.env.SUPABASE_URL}\n`);
});