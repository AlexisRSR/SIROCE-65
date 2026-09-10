// src/routes/bitacora.routes.js
// ── Rutas del Módulo de Bitácora (Log de Auditoría) ──────────
// Protegida con authMiddleware (JWT) + validarRolAdmin (solo ADMIN).
// Se monta en app.js bajo el prefijo: /api
'use strict';

const { Router } = require('express');
const { authMiddleware, validarRolAdmin } = require('../middlewares/authMiddleware');
const ctrl = require('../controllers/bitacoraController');

const router = Router();

router.get('/bitacora', authMiddleware, validarRolAdmin, ctrl.getBitacora);

module.exports = router;
