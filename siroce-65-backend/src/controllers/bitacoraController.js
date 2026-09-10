// src/controllers/bitacoraController.js
// ── Controlador del Módulo de Bitácora (Log de Auditoría) ────
// Solo lectura. Acceso restringido a ADMIN vía validarRolAdmin
// en bitacora.routes.js.
'use strict';

const { Bitacora, Usuario } = require('../models');

const ok   = (res, data, status = 200)    => res.status(status).json({ ok: true,  data });
const fail = (res, message, status = 500) => res.status(status).json({ ok: false, message });

// ────────────────────────────────────────────────────────────
//  GET /api/bitacora
// ────────────────────────────────────────────────────────────
const getBitacora = async (req, res) => {
  try {
    const registros = await Bitacora.findAll({
      include: [
        { model: Usuario, as: 'usuario', attributes: ['id_usuario', 'nombre_usuario'] },
      ],
      order: [['id_bitacora', 'DESC']],
    });
    return ok(res, registros);
  } catch (error) {
    console.error('[BitacoraCtrl.getBitacora]', error.message);
    return fail(res, 'Error al obtener la bitácora de auditoría.');
  }
};

module.exports = { getBitacora };
