// src/controllers/tipoServicioController.js
// ── Controlador del Catálogo de Tipos de Emergencia ──────────
'use strict';

const { Op, fn, col, where } = require('sequelize');
const { TipoServicio } = require('../models');

// 📝 Importamos nuestro Helper de Auditoría (Bitácora)
const { registrarBitacora } = require('../helpers/bitacoraHelper');

const ok   = (res, data, status = 200)    => res.status(status).json({ ok: true,  data });
const fail = (res, message, status = 500) => res.status(status).json({ ok: false, message });

// 🔥 Restricción de unicidad lógica: compara el nombre sin importar mayúsculas/
// minúsculas ni espacios en los extremos (' Maternidad ' === 'maternidad').
// excludeId permite que un registro se guarde a sí mismo sin auto-bloquearse.
const buscarDuplicadoPorNombre = async (nombre, excludeId = null) => {
  const nombreNormalizado = nombre.trim().toLowerCase();
  const condicionNombre = where(fn('LOWER', fn('TRIM', col('TIPO_SERVICIO'))), nombreNormalizado);
  const condiciones = excludeId
    ? { [Op.and]: [condicionNombre, { ID_TIPO_S: { [Op.ne]: excludeId } }] }
    : condicionNombre;
  return TipoServicio.findOne({ where: condiciones });
};

const getTiposServicio = async (req, res) => {
  try {
    const tipos = await TipoServicio.findAll({ order: [['CATEGORIA', 'ASC'], ['TIPO_SERVICIO', 'ASC']] });
    return ok(res, tipos);
  } catch (error) {
    console.error('[TipoServicioCtrl.getTiposServicio]', error.message);
    return fail(res, 'Error al obtener el catálogo de incidentes.');
  }
};

const getTipoServicioById = async (req, res) => {
  try {
    const tipo = await TipoServicio.findByPk(req.params.id);
    if (!tipo) return fail(res, `Tipo de incidente con ID ${req.params.id} no encontrado.`, 404);
    return ok(res, tipo);
  } catch (error) {
    console.error('[TipoServicioCtrl.getTipoServicioById]', error.message);
    return fail(res, 'Error al obtener el incidente.');
  }
};

const createTipoServicio = async (req, res) => {
  try {
    const { nombre, descripcion, prioridad, categoria } = req.body;
    if (!nombre) return fail(res, 'El nombre del incidente es obligatorio.', 400);
    if (!descripcion || !descripcion.trim()) return fail(res, 'La descripción del incidente es obligatoria.', 400);

    const duplicado = await buscarDuplicadoPorNombre(nombre);
    if (duplicado) {
      return fail(res, 'Ya existe un tipo de incidente con este nombre en el catálogo.', 400);
    }

    const nuevoTipo = await TipoServicio.create({
      TIPO_SERVICIO: nombre, CATEGORIA: categoria || 'Emergencia', DESCRIPCION: descripcion || null, PRIORIDAD: prioridad || 'Media'
    });

    // 📝 REGISTRO EN BITÁCORA
    const idUsuarioToken = req.usuario?.id_usuario || req.user?.id_usuario || null;
    await registrarBitacora(idUsuarioToken, `[TIPOS DE EMERGENCIA] - Creó el incidente ${nuevoTipo.TIPO_SERVICIO}`);

    return ok(res, nuevoTipo, 201);
  } catch (error) {
    console.error(error); return fail(res, 'Error al registrar el incidente en el catálogo.');
  }
};

const updateTipoServicio = async (req, res) => {
  try {
    const tipo = await TipoServicio.findByPk(req.params.id);
    if (!tipo) return fail(res, `Tipo de incidente con ID ${req.params.id} no encontrado.`, 404);
    const { nombre, descripcion, prioridad, categoria } = req.body;
    if (!descripcion || !descripcion.trim()) return fail(res, 'La descripción del incidente es obligatoria.', 400);

    if (nombre !== undefined && nombre !== null && String(nombre).trim() !== '') {
      const duplicado = await buscarDuplicadoPorNombre(nombre, tipo.ID_TIPO_S);
      if (duplicado) {
        return fail(res, 'Ya existe un tipo de incidente con este nombre en el catálogo.', 400);
      }
    }

    await tipo.update({
      TIPO_SERVICIO: nombre !== undefined ? nombre : tipo.TIPO_SERVICIO, CATEGORIA: categoria !== undefined ? categoria : tipo.CATEGORIA, DESCRIPCION: descripcion !== undefined ? descripcion : tipo.DESCRIPCION, PRIORIDAD: prioridad !== undefined ? prioridad : tipo.PRIORIDAD
    });

    // 📝 REGISTRO EN BITÁCORA
    const idUsuarioToken = req.usuario?.id_usuario || req.user?.id_usuario || null;
    await registrarBitacora(idUsuarioToken, `[TIPOS DE EMERGENCIA] - Actualizó el incidente ${tipo.TIPO_SERVICIO}`);

    return ok(res, tipo);
  } catch (error) {
    console.error(error); return fail(res, 'Error al actualizar el incidente.');
  }
};

const deleteTipoServicio = async (req, res) => {
  try {
    const tipo = await TipoServicio.findByPk(req.params.id);
    if (!tipo) return fail(res, `Tipo de incidente con ID ${req.params.id} no encontrado.`, 404);

    const nombreEliminado = tipo.TIPO_SERVICIO;
    await tipo.destroy();

    // 📝 REGISTRO EN BITÁCORA
    const idUsuarioToken = req.usuario?.id_usuario || req.user?.id_usuario || null;
    await registrarBitacora(idUsuarioToken, `[TIPOS DE EMERGENCIA] - Eliminó el incidente ${nombreEliminado}`);

    return ok(res, { message: `Incidente ID ${req.params.id} eliminado del catálogo.` });
  } catch (error) {
    if (error.name === 'SequelizeForeignKeyConstraintError') {
      return fail(res, 'No se puede eliminar: este incidente está siendo utilizado por reportes de despacho activos.', 409);
    }
    console.error('[TipoServicioCtrl.deleteTipoServicio]', error.message);
    return fail(res, 'Error al eliminar el incidente.');
  }
};

module.exports = {
  getTiposServicio, getTipoServicioById, createTipoServicio, updateTipoServicio, deleteTipoServicio,
};
