const { pool } = require('../config/database');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

const login = async (req, res) => {
    try {
        const { email, password } = req.body;
        
        const [rows] = await pool.execute(
            'SELECT * FROM utilisateurs WHERE email = ?',
            [email]
        );
        
        if (rows.length === 0) {
            return res.status(401).json({ error: 'Email ou mot de passe incorrect' });
        }
        
        const user = rows[0];
        const validPassword = await bcrypt.compare(password, user.password_hash);
        
        if (!validPassword) {
            return res.status(401).json({ error: 'Email ou mot de passe incorrect' });
        }
        
        const token = jwt.sign(
            { userId: user.id, email: user.email, role: user.role },
            process.env.JWT_SECRET,
            { expiresIn: process.env.JWT_EXPIRE }
        );
        
        const { password_hash, ...userWithoutPassword } = user;
        res.json({ token, user: userWithoutPassword });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

const getMe = async (req, res) => {
    try {
        const [rows] = await pool.execute(
            'SELECT id, nom, prenom, email, role FROM utilisateurs WHERE id = ?',
            [req.userId]
        );
        
        if (rows.length === 0) {
            return res.status(404).json({ error: 'Utilisateur non trouvé' });
        }
        
        res.json(rows[0]);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

module.exports = { login, getMe };
