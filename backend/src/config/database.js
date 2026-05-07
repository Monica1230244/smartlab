const mysql = require('mysql2/promise');

const pool = mysql.createPool({
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 3306,
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'smartlab',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

const testConnection = async () => {
    try {
        const connection = await pool.getConnection();
        console.log('✅ Connexion MySQL établie');
        connection.release();
    } catch (err) {
        console.error('❌ Erreur de connexion MySQL:', err.message);
        process.exit(1);
    }
};

module.exports = { pool, testConnection };
