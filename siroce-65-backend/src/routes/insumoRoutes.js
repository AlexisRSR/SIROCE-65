// src/routes/insumoRoutes.js
// ══════════════════════════════════════════════════════════════
//  InsumoRoutes — SIROCE-65 (Estación de Bomberos)
// ──────────────────────────────────────────────────────────────
//  Monta las rutas del módulo de Insumos.
//  TODAS las rutas están protegidas con authMiddleware (JWT).
// ══════════════════════════════════════════════════════════════
'use strict';

const { Router }     = require('express');
const authMiddleware = require('../middlewares/authMiddleware');
const ctrl           = require('../controllers/insumoController');

const router = Router();

// Proteger TODAS las rutas del módulo con JWT
router.use(authMiddleware);

// ── Rutas CRUD ────────────────────────────────────────────────
//  GET    /api/insumos          → todos
//  GET    /api/insumos/:id      → uno por ID
//  POST   /api/insumos          → crear nuevo
//  PUT    /api/insumos/:id      → actualizar por ID
//  DELETE /api/insumos/:id      → eliminar por ID

router.get   ('/insumos',     ctrl.getAllInsumos);
router.get   ('/insumos/:id', ctrl.getInsumoById);
router.post  ('/insumos',     ctrl.createInsumo);
router.put   ('/insumos/:id', ctrl.updateInsumo);
router.delete('/insumos/:id', ctrl.deleteInsumo);

module.exports = router;