// src/controllers/servicioController.js
// ── Controlador del Módulo de Servicios / Emergencias ────────
'use strict';

const { Op }         = require('sequelize');
const { Servicio, TipoServicio } = require('../models');

const ok   = (res, data, status = 200)    => res.status(status).json({ ok: true,  data });
const fail = (res, message, status = 500) => res.status(status).json({ ok: false, message });

const INCLUDE_SERVICIO_COMPLETO = [
  { model: TipoServicio, as: 'tipoServicio' },
];

const getAllServicios = async (req, res) => {
  try {
    const { desde, hasta } = req.query;
    const where = {};
    if (desde || hasta) {
      where.FECHA_SERVICIO = {};
      if (desde) where.FECHA_SERVICIO[Op.gte] = desde;
      if (hasta) where.FECHA_SERVICIO[Op.lte] = hasta;
    }
    const servicios = await Servicio.findAll({
      where,
      include: INCLUDE_SERVICIO_COMPLETO,
      order  : [['FECHA_SERVICIO', 'DESC']],
    });
    return ok(res, servicios);
  } catch (error) {
    console.error('[ServicioCtrl.getAllServicios]', error.message);
    return fail(res, 'Error al obtener el listado de servicios.');
  }
};

const getServicioById = async (req, res) => {
  try {
    const servicio = await Servicio.findByPk(req.params.id, { include: INCLUDE_SERVICIO_COMPLETO });
    if (!servicio) return fail(res, `Servicio con ID ${req.params.id} no encontrado.`, 404);
    return ok(res, servicio);
  } catch (error) {
    console.error('[ServicioCtrl.getServicioById]', error.message);
    return fail(res, 'Error al obtener el servicio.');
  }
};

const createServicio = async (req, res) => {
  try {
    const { 
      ID_TIPO_SERVICIO, DESCRIPCION, FECHA_SERVICIO, DIRECCION_SERVICIO, 
      ID_SOLICITANTE, NOMBRE_SOLICITANTE, TELEFONO_SOLICITANTE,
      NOMBRE_PACIENTE, EDAD_PACIENTE, FALLECIDO, ACOMPANANTE, 
      LUGAR_TRASLADO, UNIDAD_DESTACADA, PILOTO, PERSONAL_DESTACADO, OBSERVACIONES_FINALES
    } = req.body;

    if (!ID_TIPO_SERVICIO || !FECHA_SERVICIO || !DIRECCION_SERVICIO) {
      return fail(res, 'Los campos ID_TIPO_SERVICIO, FECHA_SERVICIO y DIRECCION_SERVICIO son obligatorios.', 400);
    }

    const tipoExiste = await TipoServicio.findByPk(ID_TIPO_SERVICIO);
    if (!tipoExiste) return fail(res, `No existe un Tipo de Servicio con ID ${ID_TIPO_SERVICIO}.`, 404);

    const nuevoServicio = await Servicio.create({
      ID_TIPO_SERVICIO, DESCRIPCION, FECHA_SERVICIO, DIRECCION_SERVICIO, 
      ID_SOLICITANTE, NOMBRE_SOLICITANTE, TELEFONO_SOLICITANTE,
      NOMBRE_PACIENTE, EDAD_PACIENTE, FALLECIDO, ACOMPANANTE, 
      LUGAR_TRASLADO, UNIDAD_DESTACADA, PILOTO, PERSONAL_DESTACADO, OBSERVACIONES_FINALES,
      ESTADO: 'En Curso' 
    });

    const servicioCompleto = await Servicio.findByPk(nuevoServicio.ID_SERVICIO, { include: INCLUDE_SERVICIO_COMPLETO });
    return ok(res, servicioCompleto, 201);
  } catch (error) {
    console.error('[ServicioCtrl.createServicio]', error.message);
    return fail(res, 'Error al registrar el servicio.');
  }
};

const updateServicio = async (req, res) => {
  try {
    const servicio = await Servicio.findByPk(req.params.id);
    if (!servicio) return fail(res, `Servicio con ID ${req.params.id} no encontrado.`, 404);

    const { 
      ID_TIPO_SERVICIO, DESCRIPCION, FECHA_SERVICIO, DIRECCION_SERVICIO, 
      NOMBRE_SOLICITANTE, TELEFONO_SOLICITANTE,
      NOMBRE_PACIENTE, EDAD_PACIENTE, FALLECIDO, ACOMPANANTE, 
      LUGAR_TRASLADO, UNIDAD_DESTACADA, PILOTO, PERSONAL_DESTACADO, OBSERVACIONES_FINALES,
      ESTADO
    } = req.body;

    let estadoFinal = ESTADO || servicio.ESTADO || 'Pendiente';

    if (!ESTADO) {
      estadoFinal = (OBSERVACIONES_FINALES || NOMBRE_PACIENTE) ? 'Finalizada' : (servicio.ESTADO || 'Pendiente');
    }

    await servicio.update({
      ID_TIPO_SERVICIO, DESCRIPCION, FECHA_SERVICIO, DIRECCION_SERVICIO, 
      NOMBRE_SOLICITANTE, TELEFONO_SOLICITANTE,
      NOMBRE_PACIENTE, EDAD_PACIENTE, FALLECIDO, ACOMPANANTE, 
      LUGAR_TRASLADO, UNIDAD_DESTACADA, PILOTO, PERSONAL_DESTACADO, OBSERVACIONES_FINALES,
      ESTADO: estadoFinal
    });

    const servicioActualizado = await Servicio.findByPk(servicio.ID_SERVICIO, { include: INCLUDE_SERVICIO_COMPLETO });
    return ok(res, servicioActualizado);
  } catch (error) {
    console.error('[ServicioCtrl.updateServicio]', error.message);
    return fail(res, 'Error al actualizar el servicio.');
  }
};

const deleteServicio = async (req, res) => {
  try {
    const servicio = await Servicio.findByPk(req.params.id);
    if (!servicio) return fail(res, `Servicio con ID ${req.params.id} no encontrado.`, 404);

    await servicio.destroy();
    return ok(res, { message: `Servicio ID ${req.params.id} eliminado correctamente.` });
  } catch (error) {
    console.error('[ServicioCtrl.deleteServicio]', error.message);
    return fail(res, 'Error al eliminar el servicio.');
  }
};

const asignarRecursos = async (req, res) => {
  const t = await Servicio.sequelize.transaction();
  try {
    const idServicio = req.params.id;
    const { vehiculos = [], bomberos = [] } = req.body;

    const servicio = await Servicio.findByPk(idServicio);
    if (!servicio) {
      await t.rollback();
      return fail(res, `Servicio con ID ${idServicio} no encontrado.`, 404);
    }

    await Servicio.sequelize.query('SET FOREIGN_KEY_CHECKS = 0', { transaction: t });

    await Servicio.sequelize.query(
      `DELETE FROM Detalle_Vehiculo WHERE id_emergencia = :idServicio`,
      { replacements: { idServicio }, transaction: t }
    );
    await Servicio.sequelize.query(
      `DELETE FROM Detalle_Bombero WHERE id_emergencia = :idServicio`,
      { replacements: { idServicio }, transaction: t }
    );

    if (vehiculos.length > 0) {
      const vehiculosValues = vehiculos.map(id => `(${id}, ${idServicio})`).join(',');
      await Servicio.sequelize.query(
        `INSERT INTO Detalle_Vehiculo (id_vehiculo, id_emergencia) VALUES ${vehiculosValues}`,
        { transaction: t }
      );
    }

    if (bomberos.length > 0) {
      const bomberosValues = bomberos.map(id => `(${id}, ${idServicio})`).join(',');
      await Servicio.sequelize.query(
        `INSERT INTO Detalle_Bombero (id_bombero, id_emergencia) VALUES ${bomberosValues}`,
        { transaction: t }
      );
    }

    await Servicio.sequelize.query('SET FOREIGN_KEY_CHECKS = 1', { transaction: t });
    await t.commit();
    return ok(res, { message: 'Recursos asignados y despachados correctamente.' });
  } catch (error) {
    await t.rollback();
    await Servicio.sequelize.query('SET FOREIGN_KEY_CHECKS = 1');
    console.error('[ServicioCtrl.asignarRecursos]', error.message);
    return fail(res, 'Error al asignar los recursos en la base de datos.');
  }
};

const getAsignaciones = async (req, res) => {
  try {
    const idServicio = req.params.id;
    
    // 1. Obtiene los asignados a la emergencia actual
    const [vehiculosDb] = await Servicio.sequelize.query(
      `SELECT id_vehiculo FROM Detalle_Vehiculo WHERE id_emergencia = :idServicio`,
      { replacements: { idServicio } }
    );
    const [bomberosDb] = await Servicio.sequelize.query(
      `SELECT id_bombero FROM Detalle_Bombero WHERE id_emergencia = :idServicio`,
      { replacements: { idServicio } }
    );

    // 🔥 2. MAGIA OPERATIVA: Obtiene los recursos bloqueados (ocupados en otras emergencias activas)
    const [ocupadosVehiculos] = await Servicio.sequelize.query(`
      SELECT DISTINCT dv.id_vehiculo 
      FROM Detalle_Vehiculo dv
      INNER JOIN TB_SERVICIOS s ON dv.id_emergencia = s.ID_SERVICIO
      WHERE s.ESTADO NOT IN ('Finalizada', 'Cancelada (Error de cabina)', 'Falsa Alarma')
        AND s.HORA_ENTRADA IS NULL
        AND s.ID_SERVICIO != :idServicio
    `, { replacements: { idServicio } });

    const [ocupadosBomberos] = await Servicio.sequelize.query(`
      SELECT DISTINCT db.id_bombero 
      FROM Detalle_Bombero db
      INNER JOIN TB_SERVICIOS s ON db.id_emergencia = s.ID_SERVICIO
      WHERE s.ESTADO NOT IN ('Finalizada', 'Cancelada (Error de cabina)', 'Falsa Alarma')
        AND s.HORA_ENTRADA IS NULL
        AND s.ID_SERVICIO != :idServicio
    `, { replacements: { idServicio } });

    return ok(res, { 
      vehiculos: vehiculosDb.map(v => v.id_vehiculo), 
      bomberos: bomberosDb.map(b => b.id_bombero),
      // Enviamos la lista negra al frontend
      ocupados: {
        vehiculos: ocupadosVehiculos.map(v => v.id_vehiculo),
        bomberos: ocupadosBomberos.map(b => b.id_bombero)
      }
    });
  } catch (error) {
    console.error('[ServicioCtrl.getAsignaciones]', error.message);
    return fail(res, 'Error al obtener las asignaciones.');
  }
};

const cambiarEstadoOperativo = async (req, res) => {
  try {
    const idServicio = req.params.id;
    const { accion } = req.body; 

    const servicio = await Servicio.findByPk(idServicio);
    if (!servicio) return fail(res, `Servicio no encontrado.`, 404);

    if (accion === 'SALIDA') {
      await Servicio.sequelize.query(
        `UPDATE TB_SERVICIOS SET HORA_SALIDA = NOW() WHERE ID_SERVICIO = :idServicio`,
        { replacements: { idServicio } }
      );
    } else if (accion === 'ENTRADA') {
      await Servicio.sequelize.query(
        `UPDATE TB_SERVICIOS SET HORA_ENTRADA = NOW() WHERE ID_SERVICIO = :idServicio`,
        { replacements: { idServicio } }
      );
    } else {
      return fail(res, 'Acción inválida. Usa SALIDA o ENTRADA.', 400);
    }

    return ok(res, { message: `Operación de ${accion} registrada correctamente.` });
  } catch (error) {
    console.error('[ServicioCtrl.cambiarEstadoOperativo]', error.message);
    return fail(res, 'Error al registrar el tiempo en la base de datos.');
  }
};

const getTiposServicio = async (req, res) => {
  try {
    const tipos = await TipoServicio.findAll({ order: [['CATEGORIA', 'ASC'], ['TIPO_SERVICIO', 'ASC']] });
    return ok(res, tipos);
  } catch (error) {
    return fail(res, 'Error al obtener el catálogo de incidentes.');
  }
};

const getTipoServicioById = async (req, res) => {
  try {
    const tipo = await TipoServicio.findByPk(req.params.id);
    if (!tipo) return fail(res, `Tipo de incidente con ID ${req.params.id} no encontrado.`, 404);
    return ok(res, tipo);
  } catch (error) {
    return fail(res, 'Error al obtener el incidente.');
  }
};

const createTipoServicio = async (req, res) => {
  try {
    const { nombre, descripcion, prioridad, categoria, idTipoV } = req.body;
    if (!nombre) return fail(res, 'El nombre del incidente es obligatorio.', 400);
    const nuevoTipo = await TipoServicio.create({
      TIPO_SERVICIO: nombre, CATEGORIA: categoria || 'Emergencia', DESCRIPCION: descripcion || null, PRIORIDAD: prioridad || 'Media', ID_TIPO_V: idTipoV || null 
    });
    return ok(res, nuevoTipo, 201);
  } catch (error) {
    console.error(error); return fail(res, 'Error al registrar el incidente en el catálogo.');
  }
};

const updateTipoServicio = async (req, res) => {
  try {
    const tipo = await TipoServicio.findByPk(req.params.id);
    if (!tipo) return fail(res, `Tipo de incidente con ID ${req.params.id} no encontrado.`, 404);
    const { nombre, descripcion, prioridad, categoria, idTipoV } = req.body;
    await tipo.update({
      TIPO_SERVICIO: nombre !== undefined ? nombre : tipo.TIPO_SERVICIO, CATEGORIA: categoria !== undefined ? categoria : tipo.CATEGORIA, DESCRIPCION: descripcion !== undefined ? descripcion : tipo.DESCRIPCION, PRIORIDAD: prioridad !== undefined ? prioridad : tipo.PRIORIDAD, ID_TIPO_V: idTipoV !== undefined ? idTipoV : tipo.ID_TIPO_V
    });
    return ok(res, tipo);
  } catch (error) {
    console.error(error); return fail(res, 'Error al actualizar el incidente.');
  }
};

const deleteTipoServicio = async (req, res) => {
  try {
    const tipo = await TipoServicio.findByPk(req.params.id);
    if (!tipo) return fail(res, `Tipo de incidente con ID ${req.params.id} no encontrado.`, 404);
    await tipo.destroy(); return ok(res, { message: `Incidente ID ${req.params.id} eliminado del catálogo.` });
  } catch (error) {
    if (error.name === 'SequelizeForeignKeyConstraintError') {
      return fail(res, 'No se puede eliminar: este incidente está siendo utilizado por reportes de despacho activos.', 409);
    }
    return fail(res, 'Error al eliminar el incidente.');
  }
};

module.exports = {
  getAllServicios, getServicioById, createServicio, updateServicio, deleteServicio, asignarRecursos, getAsignaciones, cambiarEstadoOperativo, getTiposServicio, getTipoServicioById, createTipoServicio, updateTipoServicio, deleteTipoServicio,
};