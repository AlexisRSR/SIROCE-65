// src/routes/tipoServicioRoutes.js
// ── Rutas del Catálogo de Tipos de Emergencia ────────────────
// TODAS las rutas están protegidas con authMiddleware (JWT requerido).
// Se montan en app.js bajo el prefijo: /api
'use strict';

const { Router } = require('express');
const { authMiddleware } = require('../middlewares/authMiddleware');
const ctrl = require('../controllers/tipoServicioController');

const router = Router();

// Aplicar el middleware de autenticación a TODAS las rutas
router.use(authMiddleware);

// ════════════════════════════════════════════════════════════
//  CATÁLOGOS — CRUD COMPLETO PARA TIPOS DE EMERGENCIAS
// ════════════════════════════════════════════════════════════
router.get   ('/tipos-servicio',     ctrl.getTiposServicio);
router.get   ('/tipos-servicio/:id', ctrl.getTipoServicioById);
router.post  ('/tipos-servicio',     ctrl.createTipoServicio);
router.put   ('/tipos-servicio/:id', ctrl.updateTipoServicio);
router.delete('/tipos-servicio/:id', ctrl.deleteTipoServicio);

module.exports = router;
