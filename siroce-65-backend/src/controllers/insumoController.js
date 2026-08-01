// controllers/insumoController.js
// ══════════════════════════════════════════════════════════════
//  InsumoController — SIROCE-65
// ──────────────────────────────────────────────────────────────
//  5 métodos CRUD habilitados:
//    getAllInsumos  → GET    /api/insumos
//    getInsumoById  → GET    /api/insumos/:id
//    createInsumo   → POST   /api/insumos
//    updateInsumo   → PUT    /api/insumos/:id
//    deleteInsumo   → DELETE /api/insumos/:id
//
//  Respuestas estándar: { ok: true/false, data/message }
//  El campo STOCK se auto-ajusta a 'Bajo Stock' si cae por debajo de 10.
// ══════════════════════════════════════════════════════════════
'use strict';

const { Op }   = require('sequelize');
const Insumo   = require('../models/Insumo');

// 🔥 IMPORTAMOS EL SERVICIO DE ALERTAS
const { enviarAlertaInsumo } = require('../utils/alertaService');

// ── Helpers de respuesta estandarizados ──────────────────────
const ok   = (res, data, status = 200)    => res.status(status).json({ ok: true,  data });
const fail = (res, message, status = 500) => res.status(status).json({ ok: false, message });

/** Umbral de stock bajo — si cae por debajo, ESTADO se actualiza automáticamente */
const STOCK_BAJO = 10;

// ════════════════════════════════════════════════════════════
//  GET /api/insumos
// ════════════════════════════════════════════════════════════
const getAllInsumos = async (req, res) => {
  try {
    const where = {};
    if (req.query.tipo) {
      where.TIPO_INSUMO = req.query.tipo;
    }
    const insumos = await Insumo.findAll({
      where,
      order: [['NOMBRE', 'ASC']],
    });
    return ok(res, insumos);
  } catch (error) {
    console.error('[InsumoCtrl.getAllInsumos]', error.message);
    return fail(res, 'Error al obtener el listado de insumos.');
  }
};

// ════════════════════════════════════════════════════════════
//  GET /api/insumos/:id
// ════════════════════════════════════════════════════════════
const getInsumoById = async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) return fail(res, 'El parámetro id debe ser un número entero.', 400);

    const insumo = await Insumo.findByPk(id);
    if (!insumo) return fail(res, `Insumo con ID ${id} no encontrado.`, 404);

    return ok(res, insumo);
  } catch (error) {
    console.error('[InsumoCtrl.getInsumoById]', error.message);
    return fail(res, 'Error al obtener el insumo.');
  }
};

// ════════════════════════════════════════════════════════════
//  POST /api/insumos
// ════════════════════════════════════════════════════════════
const createInsumo = async (req, res) => {
  try {
    // 🔥 Tesis: Se extraen los nuevos campos del request
    const { NOMBRE, DESCRIPCION, TIPO_INSUMO, STOCK, ESTADO, MARCA, MODELO, NUMERO_SERIE, PROPOSITO } = req.body;

    if (!NOMBRE || typeof NOMBRE !== 'string' || NOMBRE.trim() === '') {
      return fail(res, 'El campo NOMBRE es obligatorio.', 400);
    }
    if (!TIPO_INSUMO) return fail(res, 'El campo TIPO_INSUMO es obligatorio.', 400);

    const stockNum = STOCK !== undefined ? parseInt(STOCK, 10) : 0;
    const estadoFinal = ESTADO || (stockNum < STOCK_BAJO ? 'Bajo Stock' : 'Activo');

    const nuevoInsumo = await Insumo.create({
      NOMBRE     : NOMBRE.trim(),
      DESCRIPCION: DESCRIPCION?.trim() ?? '',
      TIPO_INSUMO,
      STOCK      : stockNum,
      ESTADO     : estadoFinal,
      // 🔥 Tesis: Guardando los campos opcionales
      MARCA      : MARCA?.trim() || null,
      MODELO     : MODELO?.trim() || null,
      NUMERO_SERIE: NUMERO_SERIE?.trim() || null,
      PROPOSITO  : PROPOSITO?.trim() || null
    });

    return ok(res, nuevoInsumo, 201);
  } catch (error) {
    if (error.name === 'SequelizeValidationError') {
      const msgs = error.errors.map(e => e.message).join(', ');
      return fail(res, `Datos inválidos: ${msgs}`, 400);
    }
    console.error('[InsumoCtrl.createInsumo]', error.message);
    return fail(res, 'Error al crear el insumo.');
  }
};

// ════════════════════════════════════════════════════════════
//  PUT /api/insumos/:id
// ════════════════════════════════════════════════════════════
const updateInsumo = async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) return fail(res, 'El parámetro id debe ser un número entero.', 400);

    const insumo = await Insumo.findByPk(id);
    if (!insumo) return fail(res, `Insumo con ID ${id} no encontrado.`, 404);

    // 🔥 Tesis: Se extraen los nuevos campos para actualizar
    const { NOMBRE, DESCRIPCION, TIPO_INSUMO, STOCK, ESTADO, MARCA, MODELO, NUMERO_SERIE, PROPOSITO } = req.body;

    // Guardar el stock que había antes de actualizar
    const stockAnterior = insumo.STOCK;
    const stockFinal = STOCK !== undefined ? parseInt(STOCK, 10) : insumo.STOCK;
    const estadoFinal = ESTADO || (stockFinal < STOCK_BAJO ? 'Bajo Stock' : 'Activo');

    await insumo.update({
      NOMBRE     : NOMBRE?.trim()      ?? insumo.NOMBRE,
      DESCRIPCION: DESCRIPCION?.trim()   ?? insumo.DESCRIPCION,
      TIPO_INSUMO: TIPO_INSUMO           ?? insumo.TIPO_INSUMO,
      STOCK      : stockFinal,
      ESTADO     : estadoFinal,
      MARCA      : MARCA !== undefined ? MARCA : insumo.MARCA,
      MODELO     : MODELO !== undefined ? MODELO : insumo.MODELO,
      NUMERO_SERIE: NUMERO_SERIE !== undefined ? NUMERO_SERIE : insumo.NUMERO_SERIE,
      PROPOSITO  : PROPOSITO !== undefined ? PROPOSITO : insumo.PROPOSITO
    });

    // 🔥 VIGILANTE PROACTIVO: Enviar correo SOLO si acaba de cruzar la barrera de 10 hacia abajo
    if (stockAnterior >= STOCK_BAJO && stockFinal < STOCK_BAJO) {
      enviarAlertaInsumo(insumo);
    }

    return ok(res, insumo);
  } catch (error) {
    if (error.name === 'SequelizeValidationError') {
      const msgs = error.errors.map(e => e.message).join(', ');
      return fail(res, `Datos inválidos: ${msgs}`, 400);
    }
    console.error('[InsumoCtrl.updateInsumo]', error.message);
    return fail(res, 'Error al actualizar el insumo.');
  }
};

// ════════════════════════════════════════════════════════════
//  DELETE /api/insumos/:id
// ════════════════════════════════════════════════════════════
const deleteInsumo = async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) return fail(res, 'El parámetro id debe ser un número entero.', 400);

    const insumo = await Insumo.findByPk(id);
    if (!insumo) return fail(res, `Insumo con ID ${id} no encontrado.`, 404);

    await insumo.destroy();
    return ok(res, { message: `Insumo ID ${id} eliminado correctamente.` });
  } catch (error) {
    console.error('[InsumoCtrl.deleteInsumo]', error.message);
    return fail(res, 'Error al eliminar el insumo.');
  }
};

module.exports = {
  getAllInsumos,
  getInsumoById,
  createInsumo,
  updateInsumo,
  deleteInsumo,
};