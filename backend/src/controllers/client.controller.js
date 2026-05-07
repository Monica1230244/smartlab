const { pool } = require('../config/database');

const getAllClients = async (req, res) => {
    try {
        const [rows] = await pool.execute('SELECT * FROM clients ORDER BY created_at DESC');
        res.json(rows);
    } catch (err) {
        res.json([]);
    }
};

const createClient = async (req, res) => {
    try {
        const { code, raison_sociale, contact_nom, contact_telephone, secteur } = req.body;
        const [result] = await pool.execute(`
            INSERT INTO clients (code, raison_sociale, contact_nom, contact_telephone, secteur)
            VALUES (?, ?, ?, ?, ?)
        `, [code, raison_sociale, contact_nom, contact_telephone, secteur]);
        
        const [newClient] = await pool.execute('SELECT * FROM clients WHERE id = ?', [result.insertId]);
        res.status(201).json(newClient[0]);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

module.exports = { getAllClients, createClient };
