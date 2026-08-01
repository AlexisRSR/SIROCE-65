// routes/bomberoRoutes.js
// ── Rutas del Módulo Personal / Bomberos ─────────────────────
// TODAS las rutas están protegidas con authMiddleware (JWT requerido).
// Se montan en app.js bajo el prefijo: /api
'use strict';

const { Router } = require('express');
const authMiddleware = require('../middlewares/authMiddleware');
const ctrl = require('../controllers/bomberoController');

const router = Router();

// Aplicar el middleware de autenticación a TODAS las rutas de este archivo
router.use(authMiddleware);

// ════════════════════════════════════════════════════════════
//  CATÁLOGOS (GET de solo lectura — para poblar selects en frontend)
// ════════════════════════════════════════════════════════════
//  GET /api/grados            → lista de grados (Bombero, Cabo, Sargento...)
//  GET /api/estados-bombero    → lista de estados (Activo, Inactivo...)
router.get('/grados',          ctrl.getGrados);
router.get('/estados-bombero',  ctrl.getEstadosBombero);

// ════════════════════════════════════════════════════════════
//  PERSONAS — TB_PERSONAS
// ════════════════════════════════════════════════════════════
//  GET    /api/personas        → todos los registros (con usuario vinculado)
//  GET    /api/personas/:id    → una persona por ID
//  POST   /api/personas        → crear nueva persona
//  PUT    /api/personas/:id    → actualizar persona
//  DELETE /api/personas/:id    → eliminar persona
router.get   ('/personas',     ctrl.getAllPersonas);
router.get   ('/personas/:id', ctrl.getPersonaById);
router.post  ('/personas',     ctrl.createPersona);
router.put   ('/personas/:id', ctrl.updatePersona);
router.delete('/personas/:id', ctrl.deletePersona);

// ════════════════════════════════════════════════════════════
//  BOMBEROS — TB_BOMBERO
// ════════════════════════════════════════════════════════════
//  POST   /api/bomberos/completo   → ESPECIAL: crea Persona + Bombero en transacción
//  GET    /api/bomberos            → todos los bomberos (con persona, grado, estado)
//  GET    /api/bomberos/activos    → SOLO bomberos activos para despacho (🔥 NUEVO)
//  GET    /api/bomberos/:id        → un bombero por ID
//  POST   /api/bomberos            → crear perfil bombero (Persona debe existir)
//  PUT    /api/bomberos/:id        → actualizar grado, estado o fecha de ingreso
//  DELETE /api/bomberos/:id        → eliminar perfil de bombero
//
//  ⚠ Las rutas fijas '/completo' y '/activos' deben ir ANTES de '/:id'.
router.post  ('/bomberos/completo', ctrl.createBomberoCompleto);
router.get   ('/bomberos',          ctrl.getAllBomberos);
router.get   ('/bomberos/activos',  ctrl.getBomberosActivos); // 🔥 Inyectado en la secuencia correcta
router.get   ('/bomberos/:id',      ctrl.getBomberoById);
router.post  ('/bomberos',          ctrl.createBombero);
router.put   ('/bomberos/:id',      ctrl.updateBombero);
router.delete('/bomberos/:id',      ctrl.deleteBombero);

module.exports = router;