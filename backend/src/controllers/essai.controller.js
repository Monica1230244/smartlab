const { pool } = require('../config/database');

const getAllEssais = async (req, res) => {
    try {
        const [rows] = await pool.execute(`
            SELECT e.*, c.raison_sociale as client_nom
            FROM essais e
            LEFT JOIN clients c ON e.client_id = c.id
            ORDER BY e.created_at DESC
        `);
        res.json(rows);
    } catch (err) {
        res.json([]);
    }
};

const getEssaiById = async (req, res) => {
    try {
        const { id } = req.params;
        const [rows] = await pool.execute('SELECT * FROM essais WHERE id = ?', [id]);
        if (rows.length === 0) {
            return res.status(404).json({ error: 'Essai non trouvé' });
        }
        res.json(rows[0]);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

const createEssai = async (req, res) => {
    try {
        const { numero, type_essai, norme, client_id, date_planification, priorite, observations } = req.body;
        const [result] = await pool.execute(`
            INSERT INTO essais (numero, type_essai, norme, client_id, date_planification, priorite, observations, phase, statut)
            VALUES (?, ?, ?, ?, ?, ?, ?, 'reception', 'en_cours')
        `, [numero, type_essai, norme, client_id, date_planification, priorite, observations]);
        
        const [newEssai] = await pool.execute('SELECT * FROM essais WHERE id = ?', [result.insertId]);
        res.status(201).json(newEssai[0]);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

const updateEssaiPhase = async (req, res) => {
    try {
        const { id } = req.params;
        const { phase, statut } = req.body;
        await pool.execute(`
            UPDATE essais SET phase = COALESCE(?, phase), statut = COALESCE(?, statut)
            WHERE id = ?
        `, [phase, statut, id]);
        
        const [updated] = await pool.execute('SELECT * FROM essais WHERE id = ?', [id]);
        res.json(updated[0]);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

const deleteEssai = async (req, res) => {
    try {
        const { id } = req.params;
        await pool.execute('DELETE FROM essais WHERE id = ?', [id]);
        res.json({ message: 'Essai supprimé' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

module.exports = { getAllEssais, getEssaiById, createEssai, updateEssaiPhase, deleteEssai };
