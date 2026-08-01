// src/routes/servicioRoutes.js
// ── Rutas del Módulo de Servicios / Emergencias ──────────────
// TODAS las rutas están protegidas con authMiddleware (JWT requerido).
// Se montan en app.js bajo el prefijo: /api
'use strict';

const { Router } = require('express');
const authMiddleware = require('../middlewares/authMiddleware');
const ctrl = require('../controllers/servicioController');

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

// ════════════════════════════════════════════════════════════
//  SERVICIOS — TB_SERVICIOS Y DESPACHO TÁCTICO
// ════════════════════════════════════════════════════════════
router.get   ('/servicios',      ctrl.getAllServicios);
router.get   ('/servicios/:id',  ctrl.getServicioById);
router.post  ('/servicios',      ctrl.createServicio);
router.put   ('/servicios/:id',  ctrl.updateServicio);
router.delete('/servicios/:id',  ctrl.deleteServicio);

// 🔥 NUEVAS RUTAS PARA ASIGNACIÓN Y CRONÓMETRO 🔥
router.get   ('/servicios/:id/asignaciones', ctrl.getAsignaciones);
router.post  ('/servicios/:id/asignaciones', ctrl.asignarRecursos);
router.put   ('/servicios/:id/estado',       ctrl.cambiarEstadoOperativo);

module.exports = router;