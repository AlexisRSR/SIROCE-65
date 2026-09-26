// src/routes/usuario.routes.js
'use strict';

const { Router } = require('express');
// 🔥 UNA SOLA LÍNEA importando las 4 funciones:
const { obtenerUsuarios, crearUsuario, cambiarEstado, actualizarUsuario } = require('../controllers/usuario.controller');
const { authMiddleware, validarRolAdmin } = require('../middlewares/authMiddleware');

const router = Router();

// 🔥 CRÍTICO: estas rutas administran cuentas (incluida la creación de ADMIN)
// y no tenían NINGÚN middleware de seguridad — quedaban abiertas sin JWT.
// Además, sin req.user poblado, el registro en bitácora de este módulo
// nunca podía insertar (id_usuario es NOT NULL en la tabla `bitacora`).
router.use(authMiddleware);
router.use(validarRolAdmin);

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