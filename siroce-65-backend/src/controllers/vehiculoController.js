// src/controllers/vehiculoController.js
// ── Controlador del Módulo de Flotilla Vehicular ─────────────
// Gestiona la entidad TB_VEHICULO y sus catálogos.
'use strict';

const {
  Vehiculo,
  TipoVehiculo,
  EstadoVehiculo,
} = require('../models');

// 🔥 IMPORTAMOS EL SERVICIO DE ALERTAS
const { enviarAlertaVehiculo } = require('../utils/alertaService');

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
 * POST /api/vehiculos
 * Registra un nuevo vehículo en la flotilla.
 */
const createVehiculo = async (req, res) => {
  try {
    // 🔥 AHORA SE EXTRAEN LOS CAMPOS NUEVOS
    const { NUMERO_UNIDAD, MARCA, MODELO, ANIO, PLACA, ID_TIPO_V, ID_ESTADO_V, KILOMETRAJE_ACTUAL, FECHA_INGRESO, OBSERVACIONES, CHASIS, MOTOR } = req.body;

    if (!NUMERO_UNIDAD || !MARCA || !MODELO || !PLACA) {
      return fail(res, 'Los campos Número de Unidad, Marca, Modelo y Placa son obligatorios.', 400);
    }

    // Verificar placa única
    const placaExiste = await Vehiculo.findOne({ where: { PLACA } });
    if (placaExiste) {
      return fail(res, `Ya existe un vehículo con placa "${PLACA}".`, 409);
    }

    const nuevoVehiculo = await Vehiculo.create({
      NUMERO_UNIDAD, MARCA, MODELO, ANIO, PLACA, ID_TIPO_V, ID_ESTADO_V,
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

    await vehiculo.destroy();
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
  getVehiculoById,
  createVehiculo,
  updateVehiculo,
  deleteVehiculo,
  getTiposVehiculo,
  getEstadosVehiculo,
};