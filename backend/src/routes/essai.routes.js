const express = require('express');
const router = express.Router();
const { authMiddleware } = require('../middleware/auth');
const { getAllEssais, getEssaiById, createEssai, updateEssaiPhase, deleteEssai } = require('../controllers/essai.controller');

router.get('/', authMiddleware, getAllEssais);
router.get('/:id', authMiddleware, getEssaiById);
router.post('/', authMiddleware, createEssai);
router.put('/:id/phase', authMiddleware, updateEssaiPhase);
router.delete('/:id', authMiddleware, deleteEssai);

module.exports = router;
