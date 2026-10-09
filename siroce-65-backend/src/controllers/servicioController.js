// src/controllers/servicioController.js
// ── Controlador del Módulo de Servicios / Emergencias ────────
'use strict';

const { Op }         = require('sequelize');
const {
  Servicio, TipoServicio, Insumo, DetalleInsumoServicio,
  Paciente, Vehiculo, TipoVehiculo, Bombero, Persona, CargoBombero,
  DetalleVehiculo, DetalleBombero,
} = require('../models');

// 📝 Importamos nuestro Helper de Auditoría (Bitácora)
const { registrarBitacora } = require('../helpers/bitacoraHelper');

// 📦 Alerta de inventario bajo + regla de ESTADO derivado del STOCK (misma
// fuente única de verdad que usa insumoController.js)
const { enviarAlertaInsumo } = require('../utils/alertaService');
const { calcularEstadoPorStock } = require('../helpers/insumoHelper');

const ok   = (res, data, status = 200)    => res.status(status).json({ ok: true,  data });
const fail = (res, message, status = 500) => res.status(status).json({ ok: false, message });

const INCLUDE_SERVICIO_COMPLETO = [
  { model: TipoServicio, as: 'tipoServicio' },
  {
    model: Insumo,
    as: 'insumosUtilizados',
    through: { attributes: ['cantidad_utilizada'] },
    required: false, // LEFT JOIN: un servicio sin insumos registrados no debe desaparecer del listado
  },
  {
    // 🔥 3NF: los datos clínicos del(los) paciente(s) ahora viven en tb_pacientes
    model: Paciente,
    as: 'pacientes',
    required: false,
  },
  {
    // 🔥 3NF: unidad(es) destacada(s), derivada de detalle_vehiculo
    model: Vehiculo,
    as: 'vehiculosAsignados',
    through: { attributes: [] },
    include: [{ model: TipoVehiculo, as: 'tipoVehiculo' }],
    required: false,
  },
  {
    // 🔥 3NF: personal destacado y bandera de piloto, derivado de detalle_bombero
    model: Bombero,
    as: 'bomberosAsignados',
    through: { attributes: ['es_piloto'] },
    include: [{ model: Persona, as: 'persona' }],
    required: false,
  },
  {
    // 🔥 3NF: bombero que firma el Vo.Bo. del informe (reemplaza al marcador de texto [FIRMA VOBO])
    model: Bombero,
    as: 'firmaVobo',
    include: [{ model: Persona, as: 'persona' }, { model: CargoBombero, as: 'cargo' }],
    required: false,
  },
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

// 🔥 Normaliza el arreglo PACIENTES recibido del frontend a filas listas para tb_pacientes
const construirFilasPacientes = (idServicio, pacientes = []) => {
  if (!Array.isArray(pacientes)) return [];
  return pacientes
    .filter((p) => p?.NOMBRE_PACIENTE || p?.EDAD_PACIENTE)
    .map((p) => ({
      ID_SERVICIO    : idServicio,
      NOMBRE_PACIENTE: p.NOMBRE_PACIENTE || null,
      EDAD_PACIENTE  : p.EDAD_PACIENTE || null,
      FALLECIDO      : p.FALLECIDO || 'NO',
      ACOMPANANTE    : p.ACOMPANANTE || null,
      LUGAR_TRASLADO : p.LUGAR_TRASLADO || null,
    }));
};

// ── Helpers de validación / sincronización (extraídos para bajar la complejidad cognitiva) ──

// Valida los campos obligatorios y la existencia del Tipo de Servicio antes de crear un registro
const validarDatosCreacionServicio = async ({ ID_TIPO_SERVICIO, FECHA_SERVICIO, DIRECCION_SERVICIO }) => {
  if (!ID_TIPO_SERVICIO || !FECHA_SERVICIO || !DIRECCION_SERVICIO) {
    return { message: 'Los campos ID_TIPO_SERVICIO, FECHA_SERVICIO y DIRECCION_SERVICIO son obligatorios.', status: 400 };
  }

  const tipoExiste = await TipoServicio.findByPk(ID_TIPO_SERVICIO);
  if (!tipoExiste) {
    return { message: `No existe un Tipo de Servicio con ID ${ID_TIPO_SERVICIO}.`, status: 404 };
  }

  return null;
};

// Determina el ESTADO final del servicio al actualizarlo (early returns en vez de ternarios anidados)
const calcularEstadoFinal = ({ ESTADO, OBSERVACIONES_FINALES, PACIENTES }, servicio) => {
  if (ESTADO) return ESTADO;

  const hayPacienteConNombre = Array.isArray(PACIENTES) && PACIENTES.some((p) => p?.NOMBRE_PACIENTE);
  if (OBSERVACIONES_FINALES || hayPacienteConNombre) return 'Finalizada';

  return servicio.ESTADO || 'Pendiente';
};

// 🔥 3NF: sincroniza los pacientes atendidos (borra y reinserta, igual que los insumos)
const sincronizarPacientesServicio = async (idServicio, pacientes, transaction) => {
  await Paciente.destroy({ where: { ID_SERVICIO: idServicio }, transaction });
  const filasPacientes = construirFilasPacientes(idServicio, pacientes);
  if (filasPacientes.length > 0) {
    await Paciente.bulkCreate(filasPacientes, { transaction });
  }
};

// Devuelve al inventario el stock de los insumos previamente registrados en el servicio
// y limpia el detalle anterior — si no se restaura antes de reinsertar, se descuenta dos veces.
const liberarInsumosPrevios = async (idServicio, transaction) => {
  const detallesPrevios = await DetalleInsumoServicio.findAll({
    where: { id_servicio: idServicio },
    transaction,
  });

  for (const detalle of detallesPrevios) {
    // 🔥 Se usa update() en vez de increment() para poder recalcular el
    // ESTADO junto con el STOCK en la misma operación (misma regla de
    // negocio que aplicarInsumosUtilizados) y no dejarlo desincronizado.
    const insumo = await Insumo.findByPk(detalle.id_insumo, { transaction, lock: transaction.LOCK.UPDATE });
    if (!insumo) continue;

    const nuevoStock = insumo.STOCK + detalle.cantidad_utilizada;
    await insumo.update({ STOCK: nuevoStock, ESTADO: calcularEstadoPorStock(nuevoStock, insumo.id_tipo_insumo) }, { transaction });
  }

  await DetalleInsumoServicio.destroy({ where: { id_servicio: idServicio }, transaction });
};

// Registra los insumos gastados y descuenta el stock, uno por uno; retorna los insumos con stock bajo
const aplicarInsumosUtilizados = async (idServicio, insumosUtilizados, transaction) => {
  const alertasStockBajo = [];

  for (const item of insumosUtilizados) {
    const idInsumo = Number(item.id_insumo);
    const cantidad = Number(item.cantidad);

    if (!idInsumo || !cantidad || cantidad <= 0) continue;

    // Bloquea la fila (SELECT ... FOR UPDATE) para evitar condiciones de
    // carrera si dos cierres descuentan el mismo insumo al mismo tiempo.
    const insumo = await Insumo.findByPk(idInsumo, { transaction, lock: transaction.LOCK.UPDATE });
    if (!insumo) {
      const error = new Error(`El insumo con ID ${idInsumo} no existe en el catálogo.`);
      error.status = 400;
      throw error;
    }

    const nuevoStock = insumo.STOCK - cantidad;
    if (nuevoStock < 0) {
      const error = new Error(`Stock insuficiente para el insumo "${insumo.NOMBRE}". Disponible: ${insumo.STOCK}, solicitado: ${cantidad}.`);
      error.status = 400;
      throw error;
    }

    await DetalleInsumoServicio.create({
      id_servicio       : idServicio,
      id_insumo         : idInsumo,
      cantidad_utilizada: cantidad,
    }, { transaction });

    await insumo.update({ STOCK: nuevoStock, ESTADO: calcularEstadoPorStock(nuevoStock, insumo.id_tipo_insumo) }, { transaction });

    // 🔥 Se guarda para avisar DESPUÉS del commit — si la transacción se
    // revierte más adelante por otro insumo, este descuento nunca ocurrió
    // de verdad y no debe generar una alerta falsa. Umbral dinámico según
    // clasificación: ya no dispara falsos positivos en Herramienta/EPP.
    if (calcularEstadoPorStock(nuevoStock, insumo.id_tipo_insumo) !== 'Activo') {
      alertasStockBajo.push(insumo);
    }
  }

  return alertasStockBajo;
};

const createServicio = async (req, res) => {
  const t = await Servicio.sequelize.transaction();
  try {
    const {
      ID_TIPO_SERVICIO, DESCRIPCION, FECHA_SERVICIO, DIRECCION_SERVICIO,
      NOMBRE_SOLICITANTE, TELEFONO_SOLICITANTE,
      OBSERVACIONES_FINALES, ES_FALSA_ALARMA, MOTIVO_CANCELACION, ID_FIRMA_VOBO,
      PACIENTES = []
    } = req.body;

    const errorValidacion = await validarDatosCreacionServicio(req.body);
    if (errorValidacion) {
      await t.rollback();
      return fail(res, errorValidacion.message, errorValidacion.status);
    }

    const nuevoServicio = await Servicio.create({
      ID_TIPO_SERVICIO, DESCRIPCION, FECHA_SERVICIO, DIRECCION_SERVICIO,
      NOMBRE_SOLICITANTE, TELEFONO_SOLICITANTE,
      OBSERVACIONES_FINALES,
      ES_FALSA_ALARMA: !!ES_FALSA_ALARMA,
      MOTIVO_CANCELACION: MOTIVO_CANCELACION || null,
      ID_FIRMA_VOBO: ID_FIRMA_VOBO || null,
    }, { transaction: t });

    // 🔥 3NF: cada víctima atendida se guarda como su propia fila en tb_pacientes
    const filasPacientes = construirFilasPacientes(nuevoServicio.ID_SERVICIO, PACIENTES);
    if (filasPacientes.length > 0) {
      await Paciente.bulkCreate(filasPacientes, { transaction: t });
    }

    await t.commit();

    const servicioCompleto = await Servicio.findByPk(nuevoServicio.ID_SERVICIO, { include: INCLUDE_SERVICIO_COMPLETO });

    // 📝 REGISTRO EN BITÁCORA
    const idUsuarioToken = req.usuario?.id_usuario || req.user?.id_usuario || null;
    await registrarBitacora(idUsuarioToken, `Apertura de nueva emergencia. Folio asignado: #${nuevoServicio.ID_SERVICIO}`);

    return ok(res, servicioCompleto, 201);
  } catch (error) {
    await t.rollback();
    console.error('[ServicioCtrl.createServicio]', error.message);
    return fail(res, 'Error al registrar el servicio.');
  }
};

const updateServicio = async (req, res) => {
  const t = await Servicio.sequelize.transaction();
  let committed = false;
  try {
    const servicio = await Servicio.findByPk(req.params.id, { transaction: t });
    if (!servicio) {
      await t.rollback();
      return fail(res, `Servicio con ID ${req.params.id} no encontrado.`, 404);
    }

    const {
      ID_TIPO_SERVICIO, DESCRIPCION, FECHA_SERVICIO, DIRECCION_SERVICIO,
      NOMBRE_SOLICITANTE, TELEFONO_SOLICITANTE,
      OBSERVACIONES_FINALES, ESTADO,
      ES_FALSA_ALARMA, MOTIVO_CANCELACION, ID_FIRMA_VOBO,
      PACIENTES = [], INSUMOS_UTILIZADOS = []
    } = req.body;

    const estadoFinal = calcularEstadoFinal({ ESTADO, OBSERVACIONES_FINALES, PACIENTES }, servicio);

    // a) Actualiza los datos básicos del servicio
    await servicio.update({
      ID_TIPO_SERVICIO, DESCRIPCION, FECHA_SERVICIO, DIRECCION_SERVICIO,
      NOMBRE_SOLICITANTE, TELEFONO_SOLICITANTE,
      OBSERVACIONES_FINALES,
      ES_FALSA_ALARMA: !!ES_FALSA_ALARMA,
      MOTIVO_CANCELACION: ES_FALSA_ALARMA ? (MOTIVO_CANCELACION || null) : null,
      ID_FIRMA_VOBO: ID_FIRMA_VOBO || null,
      ESTADO: estadoFinal
    }, { transaction: t });

    // b) 🔥 3NF: sincroniza los pacientes atendidos (borra y reinserta, igual que los insumos)
    await sincronizarPacientesServicio(servicio.ID_SERVICIO, PACIENTES, t);

    // c-d) Devuelve al inventario el stock de los insumos previos y limpia el detalle anterior
    //      (si no se restaura antes de reinsertar, se descuentan OTRA VEZ / doble resta).
    await liberarInsumosPrevios(servicio.ID_SERVICIO, t);

    // e) Registra los insumos gastados y descuenta el stock, uno por uno
    const alertasStockBajo = await aplicarInsumosUtilizados(servicio.ID_SERVICIO, INSUMOS_UTILIZADOS, t);

    await t.commit();
    committed = true;

    // 📦 Alertas de inventario bajo (fire-and-forget, no bloquea la respuesta)
    alertasStockBajo.forEach((insumo) => enviarAlertaInsumo(insumo));

    const servicioActualizado = await Servicio.findByPk(servicio.ID_SERVICIO, { include: INCLUDE_SERVICIO_COMPLETO });

    // 📝 REGISTRO EN BITÁCORA
    const idUsuarioToken = req.usuario?.id_usuario || req.user?.id_usuario || null;
    await registrarBitacora(idUsuarioToken, `Actualización de datos o cierre de informe médico en la emergencia Folio #${servicio.ID_SERVICIO}`);

    return ok(res, servicioActualizado);
  } catch (error) {
    if (!committed) await t.rollback();
    console.error('[ServicioCtrl.updateServicio]', error.message);
    return fail(res, error.status ? error.message : 'Error al actualizar el servicio.', error.status || 500);
  }
};

// 🔥 Regla de auditoría: una emergencia deja de ser eliminable en cuanto se
// le dio SALIDA (quedó despachada, sin importar si ya regresó o cerró informe)
// o si fue marcada como Cancelada/Falsa alarma. Solo es borrable recién creada
// o con recursos asignados pero aún sin marcar la salida.
const puedeEliminarseServicio = (servicio) => {
  if (servicio.ES_FALSA_ALARMA) return false; // Cancelada
  if (servicio.HORA_SALIDA) return false;      // Ya despachada (En Atención / Redactando / Finalizada)
  return true;
};

const deleteServicio = async (req, res) => {
  try {
    const servicio = await Servicio.findByPk(req.params.id);
    if (!servicio) return fail(res, `Servicio con ID ${req.params.id} no encontrado.`, 404);

    // 🔥 Integridad de auditoría: no se borra una emergencia ya despachada o cancelada
    if (!puedeEliminarseServicio(servicio)) {
      const mensaje = servicio.ES_FALSA_ALARMA
        ? 'No se puede eliminar un registro histórico (Cancelado). Acción denegada.'
        : 'No se puede eliminar una emergencia que ya fue despachada.';
      return fail(res, mensaje, 400);
    }

    await servicio.destroy();

    // 📝 REGISTRO EN BITÁCORA
    const idUsuarioToken = req.usuario?.id_usuario || req.user?.id_usuario || null;
    await registrarBitacora(idUsuarioToken, `Eliminación permanente de la emergencia Folio #${req.params.id}`);

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

    const servicio = await Servicio.findByPk(idServicio, { transaction: t });
    if (!servicio) {
      await t.rollback();
      return fail(res, `Servicio con ID ${idServicio} no encontrado.`, 404);
    }

    await DetalleVehiculo.destroy({ where: { id_emergencia: idServicio }, transaction: t });
    await DetalleBombero.destroy({ where: { id_emergencia: idServicio }, transaction: t });

    if (vehiculos.length > 0) {
      await DetalleVehiculo.bulkCreate(
        vehiculos.map((id) => ({ id_vehiculo: Number(id), id_emergencia: idServicio })),
        { transaction: t }
      );
    }

    if (bomberos.length > 0) {
      // 🔥 Cada bombero puede venir como ID plano (compatibilidad) o como
      // { id_bombero, es_piloto } — el selector de piloto del frontend envía este último.
      const filasBomberos = bomberos.map((b) => {
        const esObjeto = b && typeof b === 'object';
        return {
          id_bombero    : Number(esObjeto ? b.id_bombero : b),
          id_emergencia : idServicio,
          es_piloto     : !!(esObjeto && b.es_piloto),
        };
      });

      await DetalleBombero.bulkCreate(filasBomberos, {
        // 🔥 Fuerza a Sequelize a incluir SIEMPRE estas 3 columnas en el INSERT,
        // sin importar cómo infiera los campos a partir de los objetos recibidos.
        fields: ['id_bombero', 'id_emergencia', 'es_piloto'],
        transaction: t,
      });
    }

    await t.commit();

    // 📝 REGISTRO EN BITÁCORA
    const idUsuarioToken = req.usuario?.id_usuario || req.user?.id_usuario || null;
    await registrarBitacora(idUsuarioToken, `Se asignaron recursos (Unidades/Bomberos) a la emergencia Folio #${idServicio}`);

    return ok(res, { message: 'Recursos asignados y despachados correctamente.' });
  } catch (error) {
    await t.rollback();
    console.error('[ServicioCtrl.asignarRecursos]', error.message);
    return fail(res, 'Error al asignar los recursos en la base de datos.');
  }
};

const getAsignaciones = async (req, res) => {
  try {
    const idServicio = req.params.id;

    // 1. Obtiene los asignados a la emergencia actual (incluye la bandera de piloto)
    const detallesVehiculo = await DetalleVehiculo.findAll({ where: { id_emergencia: idServicio } });
    const detallesBombero  = await DetalleBombero.findAll({ where: { id_emergencia: idServicio } });
    const detallePiloto    = detallesBombero.find((d) => d.es_piloto);

    // 2. MAGIA OPERATIVA: Obtiene los recursos bloqueados (ocupados en otras emergencias activas)
    const [ocupadosVehiculos] = await Servicio.sequelize.query(`
      SELECT DISTINCT dv.id_vehiculo
      FROM detalle_vehiculo dv
      INNER JOIN TB_SERVICIOS s ON dv.id_emergencia = s.ID_SERVICIO
      WHERE s.ESTADO NOT IN ('Finalizada', 'Cancelada (Error de cabina)', 'Falsa Alarma')
        AND s.HORA_ENTRADA IS NULL
        AND s.ID_SERVICIO != :idServicio
    `, { replacements: { idServicio } });

    const [ocupadosBomberos] = await Servicio.sequelize.query(`
      SELECT DISTINCT db.id_bombero
      FROM detalle_bombero db
      INNER JOIN TB_SERVICIOS s ON db.id_emergencia = s.ID_SERVICIO
      WHERE s.ESTADO NOT IN ('Finalizada', 'Cancelada (Error de cabina)', 'Falsa Alarma')
        AND s.HORA_ENTRADA IS NULL
        AND s.ID_SERVICIO != :idServicio
    `, { replacements: { idServicio } });

    return ok(res, {
      vehiculos: detallesVehiculo.map((d) => d.id_vehiculo),
      bomberos : detallesBombero.map((d) => d.id_bombero),
      pilotoId : detallePiloto ? detallePiloto.id_bombero : null,
      ocupados : {
        vehiculos: ocupadosVehiculos.map(v => v.id_vehiculo),
        bomberos : ocupadosBomberos.map(b => b.id_bombero)
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
      // 🔒 Regla de unidad mínima: no se puede despachar sin al menos un vehículo y un bombero asignados
      const [totalVehiculos, totalBomberos] = await Promise.all([
        DetalleVehiculo.count({ where: { id_emergencia: idServicio } }),
        DetalleBombero.count({ where: { id_emergencia: idServicio } }),
      ]);

      if (totalVehiculos === 0 || totalBomberos === 0) {
        return res.status(400).json({ msg: 'Validación fallida: Debe asignar al menos un vehículo y un piloto para despachar la emergencia.' });
      }

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

    // 📝 REGISTRO EN BITÁCORA
    const idUsuarioToken = req.usuario?.id_usuario || req.user?.id_usuario || null;
    await registrarBitacora(idUsuarioToken, `Se marcó la ${accion} de las unidades en la emergencia Folio #${idServicio}`);

    return ok(res, { message: `Operación de ${accion} registrada correctamente.` });
  } catch (error) {
    console.error('[ServicioCtrl.cambiarEstadoOperativo]', error.message);
    return fail(res, 'Error al registrar el tiempo en la base de datos.');
  }
};

module.exports = {
  getAllServicios, getServicioById, createServicio, updateServicio, deleteServicio, asignarRecursos, getAsignaciones, cambiarEstadoOperativo,
};
