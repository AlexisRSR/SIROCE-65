// src/routes/authRoutes.js
'use strict';

const { Router } = require('express');
const { login, recuperarPassword, cambiarPassword, updateMandatoryPassword } = require('../controllers/authController');

const router = Router();

// ────────────────────────────────────────────────────────────
//  POST /api/login
// ────────────────────────────────────────────────────────────
router.post('/login', login);

router.get('/login', (req, res) => {
  res.status(405).json({
    ok     : false,
    message: 'Método no permitido. Usa POST /api/login con { nombre_usuario, password }.',
  });
});

// ────────────────────────────────────────────────────────────
//  POST /api/recuperar-password
// ────────────────────────────────────────────────────────────
router.post('/recuperar-password', recuperarPassword);

// ────────────────────────────────────────────────────────────
//  PUT /api/cambiar-password
// ────────────────────────────────────────────────────────────
router.put('/cambiar-password', cambiarPassword);

// ────────────────────────────────────────────────────────────
//  POST /api/auth/update-password
//  Pública (sin JWT): el usuario aún no tiene sesión válida
//  porque está condicionado a cambiar la contraseña obligatoria.
// ────────────────────────────────────────────────────────────
router.post('/auth/update-password', updateMandatoryPassword);

module.exports = router;