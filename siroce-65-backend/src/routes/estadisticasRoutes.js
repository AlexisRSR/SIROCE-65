// src/routes/estadisticasRoutes.js
'use strict';

const { Router } = require('express');
const authMiddleware = require('../middlewares/authMiddleware');
const ctrl = require('../controllers/estadisticasController');

const router = Router();

// Protegemos la ruta con JWT
router.use(authMiddleware);

// Ruta para obtener todo el dashboard
router.get('/dashboard', ctrl.getDashboardData);

module.exports = router;