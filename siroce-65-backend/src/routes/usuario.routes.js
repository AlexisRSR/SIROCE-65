// src/routes/usuario.routes.js
'use strict';

const { Router } = require('express');
// 🔥 UNA SOLA LÍNEA importando las 4 funciones:
const { obtenerUsuarios, crearUsuario, cambiarEstado, actualizarUsuario } = require('../controllers/usuario.controller');

// const { validarJWT } = require('../middlewares/validar-jwt'); // (Si ya tienes tu middleware de seguridad)

const router = Router();

// Ruta para listar todos los usuarios (GET /api/usuarios)
router.get('/', obtenerUsuarios);

// Ruta para crear un nuevo usuario (POST /api/usuarios)
router.post('/', crearUsuario);

// Ruta para actualizar un usuario (PUT /api/usuarios/:id)
// Nota: Esta ruta debe ir ANTES de la ruta de estado para evitar conflictos de lectura
router.put('/:id', actualizarUsuario);

// Ruta para activar/desactivar un usuario (PUT /api/usuarios/:id/estado)
router.put('/:id/estado', cambiarEstado);


module.exports = router;