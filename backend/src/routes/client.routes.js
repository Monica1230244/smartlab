const express = require('express');
const router = express.Router();
const { authMiddleware } = require('../middleware/auth');
const { getAllClients, createClient } = require('../controllers/client.controller');

router.get('/', authMiddleware, getAllClients);
router.post('/', authMiddleware, createClient);

module.exports = router;
