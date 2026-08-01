// routes/mailerRoutes.js
const express = require('express');
const router = express.Router();
const { enviarCorreoPrueba } = require('../controllers/mailerController');

// Ruta GET para probar el envío
router.get('/test', enviarCorreoPrueba);

module.exports = router;