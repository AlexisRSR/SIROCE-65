// src/controllers/vehiculoController.js
// ── Controlador del Módulo de Flotilla Vehicular ─────────────
// Gestiona la entidad TB_VEHICULO y sus catálogos.
'use strict';

const { Op } = require('sequelize');
const {
  Vehiculo,
  TipoVehiculo,
  EstadoVehiculo,
  DetalleVehiculo,
} = require('../models');

// 🔥 IMPORTAMOS EL SERVICIO DE ALERTAS
const { enviarAlertaVehiculo } = require('../utils/alertaService');
const { registrarBitacora } = require('../helpers/bitacoraHelper');

// ════════════════════════════════════════════════════════════
//  Helpers de respuesta estandarizados
// ════════════════════════════════════════════════════════════
const ok   = (res, data, status = 200)    => res.status(status).json({ ok: true,  data });
const fail = (res, message, status = 500) => res.status(status).json({ ok: false, message });

// ── Include reutilizable para Vehiculo completo ───────────────
const INCLUDE_VEHICULO_COMPLETO = [
  { model: TipoVehiculo,   as: 'tipoVehiculo'   },
  { model: EstadoVehiculo, as: 'estadoVehiculo' },
];

// 🔥 Prefijo y arranque del correlativo autogenerado de unidades (B-101, B-102, ...)
const PREFIJO_NUMERO_UNIDAD = 'B-';
const NUMERO_UNIDAD_INICIAL = 101;

/**
 * Calcula el siguiente NUMERO_UNIDAD correlativo (formato 'B-XXX') a partir
 * del mayor número ya registrado — no del último ID ni del orden de inserción,
 * así que sobrevive a unidades borradas o insertadas fuera de orden.
 * Si no hay ninguna unidad con ese formato, arranca en 'B-101'.
 */
const generarSiguienteNumeroUnidad = async () => {
  const vehiculos = await Vehiculo.findAll({ attributes: ['NUMERO_UNIDAD'] });

  let maxNumero = NUMERO_UNIDAD_INICIAL - 1;
  for (const v of vehiculos) {
    const match = /^B-(\d+)$/i.exec(String(v.NUMERO_UNIDAD || '').trim());
    if (match) {
      const numero = parseInt(match[1], 10);
      if (numero > maxNumero) maxNumero = numero;
    }
  }

  return `${PREFIJO_NUMERO_UNIDAD}${maxNumero + 1}`;
};

/**
 * Busca si NUMERO_UNIDAD o PLACA ya están registrados en OTRO vehículo.
 * @param {string} numeroUnidad
 * @param {string} placa
 * @param {number|null} excludeId ID del propio vehículo (para el UPDATE, se excluye de la búsqueda)
 * @returns {Promise<string|null>} Mensaje de error si hay duplicado, o null si está libre.
 */
const buscarDuplicadoVehiculo = async (numeroUnidad, placa, excludeId = null) => {
  const where = {
    [Op.or]: [{ NUMERO_UNIDAD: numeroUnidad }, { PLACA: placa }],
  };
  if (excludeId) {
    where.ID_VEHICULO = { [Op.ne]: excludeId };
  }

  const duplicado = await Vehiculo.findOne({ where });
  if (!duplicado) return null;

  if (duplicado.NUMERO_UNIDAD === numeroUnidad) {
    return 'El número de unidad ya está registrado en otro vehículo.';
  }
  return 'La placa ya está registrada en otro vehículo.';
};

// ════════════════════════════════════════════════════════════
//  CRUD — TB_VEHICULO
// ════════════════════════════════════════════════════════════

/**
 * GET /api/vehiculos
 * Retorna todos los vehículos con tipo y estado operativo.
 */
const getAllVehiculos = async (req, res) => {
  try {
    const vehiculos = await Vehiculo.findAll({
      include: INCLUDE_VEHICULO_COMPLETO,
      order  : [['MARCA', 'ASC'], ['MODELO', 'ASC']],
    });
    return ok(res, vehiculos);
  } catch (error) {
    console.error('[VehiculoCtrl.getAllVehiculos]', error.message);
    return fail(res, 'Error al obtener el listado de vehículos.');
  }
};

/**
 * GET /api/vehiculos/disponibles
 * Retorna SOLO los vehículos operativos para el módulo de despacho.
 */
const getVehiculosDisponibles = async (req, res) => {
  try {
    const vehiculos = await Vehiculo.findAll({
      include: INCLUDE_VEHICULO_COMPLETO,
      where: {
        '$estadoVehiculo.ESTADO$': ['Operativo', 'Disponible'] // Filtro directo en BD
      },
      order  : [['MARCA', 'ASC'], ['MODELO', 'ASC']],
    });
    return ok(res, vehiculos);
  } catch (error) {
    console.error('[VehiculoCtrl.getVehiculosDisponibles]', error.message);
    // Tolerancia a fallos: Si falla el filtro estricto, mandamos todos y que Angular filtre
    const todos = await Vehiculo.findAll({ include: INCLUDE_VEHICULO_COMPLETO });
    return ok(res, todos); 
  }
};

/**
 * GET /api/vehiculos/:id
 * Retorna un vehículo específico con tipo y estado.
 */
const getVehiculoById = async (req, res) => {
  try {
    const vehiculo = await Vehiculo.findByPk(req.params.id, {
      include: INCLUDE_VEHICULO_COMPLETO,
    });
    if (!vehiculo) return fail(res, `Vehículo con ID ${req.params.id} no encontrado.`, 404);
    return ok(res, vehiculo);
  } catch (error) {
    console.error('[VehiculoCtrl.getVehiculoById]', error.message);
    return fail(res, 'Error al obtener el vehículo.');
  }
};

/**
 * GET /api/vehiculos/siguiente-numero
 * Devuelve el próximo NUMERO_UNIDAD que se asignará al crear una unidad —
 * uso puramente informativo/preview para el formulario del frontend.
 */
const getSiguienteNumeroUnidad = async (req, res) => {
  try {
    const numeroUnidad = await generarSiguienteNumeroUnidad();
    return ok(res, { numeroUnidad });
  } catch (error) {
    console.error('[VehiculoCtrl.getSiguienteNumeroUnidad]', error.message);
    return fail(res, 'Error al calcular el siguiente número de unidad.');
  }
};

/**
 * POST /api/vehiculos
 * Registra un nuevo vehículo en la flotilla.
 */
const createVehiculo = async (req, res) => {
  try {
    // 🔥 NUMERO_UNIDAD ya NO se recibe del body: se autogenera correlativo,
    // ignorando por completo cualquier valor que haya mandado el frontend.
    const { MARCA, MODELO, ANIO, PLACA, ID_TIPO_V, ID_ESTADO_V, KILOMETRAJE_ACTUAL, FECHA_INGRESO, OBSERVACIONES, CHASIS, MOTOR } = req.body;

    if (!MARCA || !MODELO || !PLACA) {
      return fail(res, 'Los campos Marca, Modelo y Placa son obligatorios.', 400);
    }

    const numeroUnidadGenerado = await generarSiguienteNumeroUnidad();

    // Verificar que la PLACA no esté ya registrada en otro vehículo
    // (NUMERO_UNIDAD se incluye por reutilizar el helper, pero al ser recién
    // calculado del máximo actual nunca debería chocar).
    const mensajeDuplicado = await buscarDuplicadoVehiculo(numeroUnidadGenerado, PLACA);
    if (mensajeDuplicado) {
      return fail(res, mensajeDuplicado, 400);
    }

    const nuevoVehiculo = await Vehiculo.create({
      NUMERO_UNIDAD: numeroUnidadGenerado, MARCA, MODELO, ANIO, PLACA, ID_TIPO_V, ID_ESTADO_V,
      KILOMETRAJE_ACTUAL: KILOMETRAJE_ACTUAL ?? 0.00,
      FECHA_INGRESO: FECHA_INGRESO || null,
      OBSERVACIONES: OBSERVACIONES || null,
      CHASIS: CHASIS || null,
      MOTOR: MOTOR || null
    });

    // Recargar con datos relacionados
    const vehiculoCompleto = await Vehiculo.findByPk(nuevoVehiculo.ID_VEHICULO, {
      include: INCLUDE_VEHICULO_COMPLETO,
    });

    // 📝 REGISTRO EN BITÁCORA
    const idUsuarioToken = req.usuario?.id_usuario || req.user?.id_usuario || null;
    await registrarBitacora(idUsuarioToken, `[UNIDADES] - Registró el vehículo ${vehiculoCompleto.PLACA}`);

    return ok(res, vehiculoCompleto, 201);
  } catch (error) {
    console.error('[VehiculoCtrl.createVehiculo]', error.message);
    return fail(res, 'Error al registrar el vehículo.');
  }
};

/**
 * PUT /api/vehiculos/:id
 * Actualiza los datos de un vehículo y dispara alerta si queda inoperativo.
 */
const updateVehiculo = async (req, res) => {
  try {
    const vehiculo = await Vehiculo.findByPk(req.params.id);
    if (!vehiculo) return fail(res, `Vehículo con ID ${req.params.id} no encontrado.`, 404);

    const estadoAnteriorId = vehiculo.ID_ESTADO_V;

    // Verificar que NUMERO_UNIDAD y PLACA no queden duplicados en OTRO vehículo
    const numeroUnidadNuevo = req.body.NUMERO_UNIDAD !== undefined ? req.body.NUMERO_UNIDAD : vehiculo.NUMERO_UNIDAD;
    const placaNueva        = req.body.PLACA !== undefined ? req.body.PLACA : vehiculo.PLACA;

    const mensajeDuplicado = await buscarDuplicadoVehiculo(numeroUnidadNuevo, placaNueva, vehiculo.ID_VEHICULO);
    if (mensajeDuplicado) {
      return fail(res, mensajeDuplicado, 400);
    }

    // Validar que el kilometraje no retroceda respecto al registro actual
    if (req.body.KILOMETRAJE_ACTUAL !== undefined) {
      const kmActual = Number(vehiculo.KILOMETRAJE_ACTUAL);
      const kmNuevo  = Number(req.body.KILOMETRAJE_ACTUAL);
      if (kmNuevo < kmActual) {
        return fail(res, `El kilometraje no puede ser menor al registro actual (${kmActual} km)`, 400);
      }
    }

    // 🔥 MAPEO EXPLÍCITO DE CAMPOS PARA ACTUALIZAR CON SEGURIDAD
    vehiculo.NUMERO_UNIDAD = req.body.NUMERO_UNIDAD !== undefined ? req.body.NUMERO_UNIDAD : vehiculo.NUMERO_UNIDAD;
    vehiculo.MARCA = req.body.MARCA !== undefined ? req.body.MARCA : vehiculo.MARCA;
    vehiculo.MODELO = req.body.MODELO !== undefined ? req.body.MODELO : vehiculo.MODELO;
    vehiculo.PLACA = req.body.PLACA !== undefined ? req.body.PLACA : vehiculo.PLACA;
    vehiculo.ID_TIPO_V = req.body.ID_TIPO_V !== undefined ? req.body.ID_TIPO_V : vehiculo.ID_TIPO_V;
    vehiculo.ID_ESTADO_V = req.body.ID_ESTADO_V !== undefined ? req.body.ID_ESTADO_V : vehiculo.ID_ESTADO_V;
    vehiculo.KILOMETRAJE_ACTUAL = req.body.KILOMETRAJE_ACTUAL !== undefined ? req.body.KILOMETRAJE_ACTUAL : vehiculo.KILOMETRAJE_ACTUAL;
    vehiculo.FECHA_INGRESO = req.body.FECHA_INGRESO !== undefined ? req.body.FECHA_INGRESO : vehiculo.FECHA_INGRESO;
    vehiculo.OBSERVACIONES = req.body.OBSERVACIONES !== undefined ? req.body.OBSERVACIONES : vehiculo.OBSERVACIONES;
    vehiculo.ANIO = req.body.ANIO !== undefined ? req.body.ANIO : vehiculo.ANIO;
    vehiculo.CHASIS = req.body.CHASIS !== undefined ? req.body.CHASIS : vehiculo.CHASIS;
    vehiculo.MOTOR = req.body.MOTOR !== undefined ? req.body.MOTOR : vehiculo.MOTOR;

    // Guardar cambios físicamente
    await vehiculo.save();

    // Recargar la instancia fresca
    const vehiculoActualizado = await Vehiculo.findByPk(vehiculo.ID_VEHICULO, {
      include: INCLUDE_VEHICULO_COMPLETO,
    });

    // Vigilante proactivo
    const nuevoEstadoId = vehiculoActualizado.ID_ESTADO_V;
    
    if (nuevoEstadoId !== estadoAnteriorId && nuevoEstadoId !== 1) {
      enviarAlertaVehiculo(vehiculoActualizado);
    }

    // 📝 REGISTRO EN BITÁCORA
    const idUsuarioToken = req.usuario?.id_usuario || req.user?.id_usuario || null;
    await registrarBitacora(idUsuarioToken, `[UNIDADES] - Actualizó datos del vehículo ${vehiculoActualizado.PLACA}`);

    return ok(res, vehiculoActualizado);
  } catch (error) {
    console.error('[VehiculoCtrl.updateVehiculo]', error.message);
    return fail(res, 'Error al actualizar el vehículo.');
  }
};

/**
 * DELETE /api/vehiculos/:id
 * Elimina un vehículo del sistema.
 */
const deleteVehiculo = async (req, res) => {
  try {
    const vehiculo = await Vehiculo.findByPk(req.params.id);
    if (!vehiculo) return fail(res, `Vehículo con ID ${req.params.id} no encontrado.`, 404);

    // Protección contra ON DELETE CASCADE: si el vehículo ya participó en
    // emergencias, no se destruye físicamente (se perdería el historial).
    const tieneHistorial = await DetalleVehiculo.count({ where: { id_vehiculo: vehiculo.ID_VEHICULO } });
    if (tieneHistorial > 0) {
      return fail(res, 'Unidad con historial. Cámbiela a Fuera de Servicio.', 400);
    }

    const placaEliminada = vehiculo.PLACA;
    await vehiculo.destroy();

    // 📝 REGISTRO EN BITÁCORA
    const idUsuarioToken = req.usuario?.id_usuario || req.user?.id_usuario || null;
    await registrarBitacora(idUsuarioToken, `[UNIDADES] - Eliminó el vehículo ${placaEliminada}`);

    return ok(res, { message: `Vehículo ID ${req.params.id} eliminado correctamente.` });
  } catch (error) {
    if (error.name === 'SequelizeForeignKeyConstraintError') {
      return fail(res, 'No se puede eliminar: el vehículo tiene servicios registrados.', 409);
    }
    console.error('[VehiculoCtrl.deleteVehiculo]', error.message);
    return fail(res, 'Error al eliminar el vehículo.');
  }
};

// ════════════════════════════════════════════════════════════
//  CATÁLOGOS — Solo lectura
// ════════════════════════════════════════════════════════════

const getTiposVehiculo = async (req, res) => {
  try {
    const tipos = await TipoVehiculo.findAll({ order: [['TIPO', 'ASC']] });
    return ok(res, tipos);
  } catch (error) {
    return fail(res, 'Error al obtener los tipos de vehículo.');
  }
};

const getEstadosVehiculo = async (req, res) => {
  try {
    const estados = await EstadoVehiculo.findAll({ order: [['ESTADO', 'ASC']] });
    return ok(res, estados);
  } catch (error) {
    return fail(res, 'Error al obtener los estados de vehículo.');
  }
};

// ════════════════════════════════════════════════════════════
//  EXPORTS
// ════════════════════════════════════════════════════════════
module.exports = {
  getAllVehiculos,           // <--- ESTA ES LA QUE SE HABÍA BORRADO
  getVehiculosDisponibles,   // <--- LA NUEVA QUE AGREGAMOS
  getSiguienteNumeroUnidad,
  getVehiculoById,
  createVehiculo,
  updateVehiculo,
  deleteVehiculo,
  getTiposVehiculo,
  getEstadosVehiculo,
};