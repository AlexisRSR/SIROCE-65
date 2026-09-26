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
// controllers/insumoController.js
'use strict';

const { Op, fn, col, where } = require('sequelize');
const Insumo   = require('../models/Insumo');
const Servicio = require('../models/Servicio');
const DetalleInsumoServicio = require('../models/DetalleInsumoServicio');

// 🔥 IMPORTAMOS EL SERVICIO DE ALERTAS
const { enviarAlertaInsumo } = require('../utils/alertaService');
const { registrarBitacora } = require('../helpers/bitacoraHelper');
// 🔥 Fuente única de verdad: el ESTADO se deriva del STOCK (con umbral dinámico
// por clasificación), salvo que sea un estado manual explícito (En Reparación/Prestado)
const { calcularEstadoPorStock, calcularEstadoFinal } = require('../helpers/insumoHelper');

// ── Helpers de respuesta estandarizados ──────────────────────
const ok   = (res, data, status = 200)    => res.status(status).json({ ok: true,  data });
const fail = (res, message, status = 500) => res.status(status).json({ ok: false, message });

// 🔥 Restricción de unicidad lógica del nombre del recurso: TRIM + LOWER en la
// propia consulta para ignorar espacios accidentales y mayúsculas/minúsculas.
// excludeId permite que un recurso se guarde a sí mismo sin auto-bloquearse.
const buscarDuplicadoPorNombre = async (nombre, excludeId = null) => {
  if (!nombre || !String(nombre).trim()) return null;
  const nombreNormalizado = String(nombre).trim().toLowerCase();
  const condicionNombre = where(fn('LOWER', fn('TRIM', col('NOMBRE'))), nombreNormalizado);
  const condiciones = excludeId
    ? { [Op.and]: [condicionNombre, { ID_INSUMO: { [Op.ne]: excludeId } }] }
    : condicionNombre;
  return Insumo.findOne({ where: condiciones });
};

// ════════════════════════════════════════════════════════════
//  GET /api/insumos
// ════════════════════════════════════════════════════════════
const getAllInsumos = async (req, res) => {
  try {
    const where = {};
    if (req.query.tipo) {
      where.id_tipo_insumo = req.query.tipo; // Cambiado a la llave foránea
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
    // 🔥 Extraemos id_tipo_insumo en lugar de TIPO_INSUMO
    const { NOMBRE, DESCRIPCION, id_tipo_insumo, STOCK, ESTADO, MARCA, MODELO, NUMERO_SERIE, PROPOSITO } = req.body;

    if (!NOMBRE || typeof NOMBRE !== 'string' || NOMBRE.trim() === '') {
      return fail(res, 'El campo NOMBRE es obligatorio.', 400);
    }

    const duplicadoNombre = await buscarDuplicadoPorNombre(NOMBRE);
    if (duplicadoNombre) {
      return fail(res, 'Ya existe un recurso con este nombre en el catálogo.', 400);
    }

    const stockNum = STOCK !== undefined ? parseInt(STOCK, 10) : 0;
    // 🔥 Si ESTADO es explícitamente 'En Reparación'/'Prestado' se respeta tal
    // cual; cualquier otro valor (o vacío) se recalcula del stock — ver insumoHelper.js
    const estadoFinal = calcularEstadoFinal(ESTADO, stockNum, id_tipo_insumo);

    const nuevoInsumo = await Insumo.create({
      NOMBRE     : NOMBRE.trim(),
      DESCRIPCION: DESCRIPCION?.trim() ?? '',
      id_tipo_insumo, // Insertamos la llave foránea
      STOCK      : stockNum,
      ESTADO     : estadoFinal,
      MARCA      : MARCA?.trim() || null,
      MODELO     : MODELO?.trim() || null,
      NUMERO_SERIE: NUMERO_SERIE?.trim() || null,
      PROPOSITO  : PROPOSITO?.trim() || null
    });

    // 📝 REGISTRO EN BITÁCORA
    const idUsuarioToken = req.usuario?.id_usuario || req.user?.id_usuario || null;
    await registrarBitacora(idUsuarioToken, `[INSUMOS] - Creó el insumo ${nuevoInsumo.NOMBRE}`);

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

    // 🔥 Extraemos id_tipo_insumo
    const { NOMBRE, DESCRIPCION, id_tipo_insumo, STOCK, ESTADO, MARCA, MODELO, NUMERO_SERIE, PROPOSITO } = req.body;

    if (NOMBRE !== undefined && NOMBRE !== null && String(NOMBRE).trim() !== '') {
      const duplicadoNombre = await buscarDuplicadoPorNombre(NOMBRE, insumo.ID_INSUMO);
      if (duplicadoNombre) {
        return fail(res, 'Ya existe un recurso con este nombre en el catálogo.', 400);
      }
    }

    const tipoFinal = id_tipo_insumo !== undefined ? id_tipo_insumo : insumo.id_tipo_insumo;
    const stockAnterior = insumo.STOCK;
    const stockFinal = STOCK !== undefined ? parseInt(STOCK, 10) : insumo.STOCK;
    // 🔥 Si ESTADO es explícitamente 'En Reparación'/'Prestado' se respeta tal
    // cual; cualquier otro valor (o vacío) se recalcula del stock — ver insumoHelper.js
    const estadoFinal = calcularEstadoFinal(ESTADO, stockFinal, tipoFinal);

    await insumo.update({
      NOMBRE     : NOMBRE?.trim()      ?? insumo.NOMBRE,
      DESCRIPCION: DESCRIPCION?.trim()   ?? insumo.DESCRIPCION,
      id_tipo_insumo: tipoFinal,
      STOCK      : stockFinal,
      ESTADO     : estadoFinal,
      MARCA      : MARCA !== undefined ? MARCA : insumo.MARCA,
      MODELO     : MODELO !== undefined ? MODELO : insumo.MODELO,
      NUMERO_SERIE: NUMERO_SERIE !== undefined ? NUMERO_SERIE : insumo.NUMERO_SERIE,
      PROPOSITO  : PROPOSITO !== undefined ? PROPOSITO : insumo.PROPOSITO
    });

    // 🔥 Alerta cuando el stock real cruza hacia "Bajo Stock" según el umbral
    // dinámico de su clasificación (independiente de si ESTADO quedó en un
    // valor manual como 'Prestado' — la existencia física sigue siendo baja).
    const cruzaABajoStock = calcularEstadoPorStock(stockAnterior, tipoFinal) !== 'Bajo Stock'
      && calcularEstadoPorStock(stockFinal, tipoFinal) === 'Bajo Stock';
    if (cruzaABajoStock) {
      enviarAlertaInsumo(insumo);
    }

    // 📝 REGISTRO EN BITÁCORA — mensaje detallado si cambió el STOCK, genérico si no
    const idUsuarioToken = req.usuario?.id_usuario || req.user?.id_usuario || null;
    const mensajeBitacora = stockFinal !== stockAnterior
      ? `[INSUMOS] - Modificó el stock del insumo ${insumo.NOMBRE}: de ${stockAnterior} a ${stockFinal}`
      : `[INSUMOS] - Actualizó los detalles del recurso ${insumo.NOMBRE}`;
    await registrarBitacora(idUsuarioToken, mensajeBitacora);

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

    // 🔥 Integridad referencial: no se borra un insumo con historial operativo
    // (consumo registrado en detalle_insumo_servicio) — se debe dar de baja, no eliminar.
    const tieneHistorial = await DetalleInsumoServicio.count({ where: { id_insumo: id } });
    if (tieneHistorial > 0) {
      return fail(res, 'No se puede eliminar: tiene historial operativo. Cámbielo a estado De Baja.', 400);
    }

    const nombreEliminado = insumo.NOMBRE;
    await insumo.destroy();

    // 📝 REGISTRO EN BITÁCORA
    const idUsuarioToken = req.usuario?.id_usuario || req.user?.id_usuario || null;
    await registrarBitacora(idUsuarioToken, `[INSUMOS] - Eliminó el insumo ${nombreEliminado}`);

    return ok(res, { message: `Insumo ID ${id} eliminado correctamente.` });
  } catch (error) {
    console.error('[InsumoCtrl.deleteInsumo]', error.message);
    return fail(res, 'Error al eliminar el insumo.');
  }
};

// ════════════════════════════════════════════════════════════
//  GET /api/insumos/historial-consumo?fechaInicio=&fechaFin=
//  Consumo total por insumo (vía Servicio ⇄ Insumo, tabla
//  pivote detalle_insumo_servicio) dentro de un rango de fechas.
// ════════════════════════════════════════════════════════════
const getHistorialConsumo = async (req, res) => {
  try {
    const { fechaInicio, fechaFin } = req.query;

    if (!fechaInicio || !fechaFin) {
      return fail(res, 'Debe indicar fechaInicio y fechaFin.', 400);
    }

    // 🔥 DetalleInsumoServicio no tiene FECHA propia: el rango se filtra
    // por la fecha del Servicio (emergencia) al que pertenece el consumo.
    const servicios = await Servicio.findAll({
      where: {
        FECHA_SERVICIO: { [Op.between]: [fechaInicio, fechaFin] },
      },
      include: [{
        model: Insumo,
        as: 'insumosUtilizados',
        attributes: ['ID_INSUMO', 'NOMBRE', 'id_tipo_insumo', 'ESTADO'],
        through: { attributes: ['cantidad_utilizada'] },
      }],
    });

    // Agrupamos por insumo la cantidad total gastada en el periodo
    const consumoPorInsumo = {};
    servicios.forEach((servicio) => {
      (servicio.insumosUtilizados || []).forEach((insumo) => {
        const cantidad = insumo.DetalleInsumoServicio?.cantidad_utilizada || 0;
        if (!consumoPorInsumo[insumo.ID_INSUMO]) {
          consumoPorInsumo[insumo.ID_INSUMO] = {
            id_insumo     : insumo.ID_INSUMO,
            nombre        : insumo.NOMBRE,
            id_tipo_insumo: insumo.id_tipo_insumo,
            estado        : insumo.ESTADO,
            cantidad_total: 0,
          };
        }
        consumoPorInsumo[insumo.ID_INSUMO].cantidad_total += cantidad;
      });
    });

    const resultado = Object.values(consumoPorInsumo)
      .sort((a, b) => b.cantidad_total - a.cantidad_total);

    return ok(res, resultado, 200);
  } catch (error) {
    console.error('[InsumoCtrl.getHistorialConsumo]', error.message);
    return fail(res, 'Error al obtener el historial de consumo de insumos.', 500);
  }
};

module.exports = {
  getAllInsumos,
  getInsumoById,
  createInsumo,
  updateInsumo,
  deleteInsumo,
  getHistorialConsumo,
};