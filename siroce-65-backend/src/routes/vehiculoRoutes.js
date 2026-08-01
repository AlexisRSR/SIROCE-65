// routes/vehiculoRoutes.js
// ── Rutas del Módulo de Flotilla Vehicular ───────────────────
// TODAS las rutas están protegidas con authMiddleware (JWT requerido).
// Se montan en app.js bajo el prefijo: /api
'use strict';

const { Router } = require('express');
const authMiddleware = require('../middlewares/authMiddleware');
const ctrl = require('../controllers/vehiculoController');

const router = Router();

// Aplicar el middleware de autenticación a TODAS las rutas
router.use(authMiddleware);

// ════════════════════════════════════════════════════════════
//  CATÁLOGOS (GET de solo lectura)
// ════════════════════════════════════════════════════════════
//  GET /api/tipos-vehiculo     → lista de tipos (Autobomba, Ambulancia...)
//  GET /api/estados-vehiculo   → lista de estados (Disponible, En Servicio...)
router.get('/tipos-vehiculo',   ctrl.getTiposVehiculo);
router.get('/estados-vehiculo', ctrl.getEstadosVehiculo);

// ════════════════════════════════════════════════════════════
//  VEHÍCULOS — TB_VEHICULO
// ════════════════════════════════════════════════════════════
//  GET    /api/vehiculos             → todos los vehículos (con tipo y estado)
//  GET    /api/vehiculos/disponibles → SOLO vehículos operativos para despacho (🔥 NUEVO)
//  GET    /api/vehiculos/:id         → un vehículo por ID
//  POST   /api/vehiculos             → registrar nuevo vehículo
//  PUT    /api/vehiculos/:id         → actualizar datos del vehículo
//  DELETE /api/vehiculos/:id         → eliminar vehículo
//
//  ⚠ '/disponibles' debe ir ANTES de '/:id' para evitar colisiones de enrutamiento.
router.get   ('/vehiculos',             ctrl.getAllVehiculos);
router.get   ('/vehiculos/disponibles', ctrl.getVehiculosDisponibles); // 🔥 Corregido alias 'ctrl' y posición
router.get   ('/vehiculos/:id',         ctrl.getVehiculoById);
router.post  ('/vehiculos',             ctrl.createVehiculo);
router.put   ('/vehiculos/:id',         ctrl.updateVehiculo);
router.delete('/vehiculos/:id',         ctrl.deleteVehiculo);

module.exports = router;