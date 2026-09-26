// src/models/index.js  —  ACTUALIZADO: Fase 1, 2 y 8
'use strict';

// ── IMPORTANTE: Importar la conexión a la BD (Fase 1) ─────────
const { sequelize } = require('../config/database');

// ── FASE 1: Módulo de Seguridad ───────────────────────────────
const Rol     = require('./Rol');
const Usuario = require('./Usuario');

// ── FASE 2: Módulo de Personal / Bomberos ────────────────────
const Persona       = require('./Persona');
const GradoBombero  = require('./GradoBombero');
const EstadoBombero = require('./EstadoBombero');
const CargoBombero  = require('./CargoBombero'); // 🔥 3NF: catálogo que reemplaza TB_BOMBERO.CARGO
const Bombero       = require('./Bombero');

// ── FASE 2: Módulo de Flotilla / Vehículos ───────────────────
const TipoVehiculo   = require('./TipoVehiculo');
const EstadoVehiculo = require('./EstadoVehiculo');
const Vehiculo       = require('./Vehiculo');

// ── FASE 2: Módulo de Servicios / Emergencias ────────────────
const TipoServicio = require('./TipoServicio');
const Servicio     = require('./Servicio');

// ── 3NF: Pacientes y detalle de despacho (unidad / personal) ──
const Paciente        = require('./Paciente');
const DetalleVehiculo = require('./DetalleVehiculo');
const DetalleBombero  = require('./DetalleBombero');

// ── FASE 8: Módulo de Insumos ─────────────────────────────────
const Insumo = require('./Insumo');
const DetalleInsumoServicio = require('./DetalleInsumoServicio');

// ── Módulo de Auditoría ───────────────────────────────────────
const Bitacora = require('./Bitacora');

// ════════════════════════════════════════════════════════════
//  ASOCIACIONES
// ════════════════════════════════════════════════════════════

// ── Fase 1: Rol 1:N Usuario ───────────────────────────────────
Rol.hasMany(Usuario, { foreignKey: 'id_rol', as: 'usuarios', onDelete: 'RESTRICT', onUpdate: 'CASCADE' });
Usuario.belongsTo(Rol, { foreignKey: 'id_rol', as: 'rol' });

// ── Fase 2: Usuario 1:1 Persona ──────────────────────────────
Usuario.hasOne(Persona, { foreignKey: 'ID_USUARIO', as: 'persona', onDelete: 'SET NULL', onUpdate: 'CASCADE' });
Persona.belongsTo(Usuario, { foreignKey: 'ID_USUARIO', as: 'usuario' });

// ── Fase 2: Persona 1:1 Bombero ──────────────────────────────
Persona.hasOne(Bombero, { foreignKey: 'ID_PERSONA', as: 'bombero', onDelete: 'RESTRICT', onUpdate: 'CASCADE' });
Bombero.belongsTo(Persona, { foreignKey: 'ID_PERSONA', as: 'persona' });

// ── Fase 2: GradoBombero 1:N Bombero ─────────────────────────
GradoBombero.hasMany(Bombero, { foreignKey: 'ID_GRADO', as: 'bomberos', onDelete: 'RESTRICT', onUpdate: 'CASCADE' });
Bombero.belongsTo(GradoBombero, { foreignKey: 'ID_GRADO', as: 'grado' });

// ── Fase 2: EstadoBombero 1:N Bombero ────────────────────────
EstadoBombero.hasMany(Bombero, { foreignKey: 'ID_ESTADO_B', as: 'bomberos', onDelete: 'RESTRICT', onUpdate: 'CASCADE' });
Bombero.belongsTo(EstadoBombero, { foreignKey: 'ID_ESTADO_B', as: 'estado' });

// ── 3NF: CargoBombero 1:N Bombero ────────────────────────────
CargoBombero.hasMany(Bombero, { foreignKey: 'ID_CARGO', as: 'bomberos', onDelete: 'RESTRICT', onUpdate: 'CASCADE' });
Bombero.belongsTo(CargoBombero, { foreignKey: 'ID_CARGO', as: 'cargo' });

// ── Fase 2: TipoVehiculo 1:N Vehiculo ────────────────────────
TipoVehiculo.hasMany(Vehiculo, { foreignKey: 'ID_TIPO_V', as: 'vehiculos', onDelete: 'RESTRICT', onUpdate: 'CASCADE' });
Vehiculo.belongsTo(TipoVehiculo, { foreignKey: 'ID_TIPO_V', as: 'tipoVehiculo' });

// ── Fase 2: EstadoVehiculo 1:N Vehiculo ──────────────────────
EstadoVehiculo.hasMany(Vehiculo, { foreignKey: 'ID_ESTADO_V', as: 'vehiculos', onDelete: 'RESTRICT', onUpdate: 'CASCADE' });
Vehiculo.belongsTo(EstadoVehiculo, { foreignKey: 'ID_ESTADO_V', as: 'estadoVehiculo' });

// ── Fase 2: TipoServicio 1:N Servicio ────────────────────────
TipoServicio.hasMany(Servicio, { foreignKey: 'ID_TIPO_SERVICIO', as: 'servicios', onDelete: 'RESTRICT', onUpdate: 'CASCADE' });
Servicio.belongsTo(TipoServicio, { foreignKey: 'ID_TIPO_SERVICIO', as: 'tipoServicio' });

// ── 3NF: Bombero 1:N Servicio (firma de Vo.Bo. del jefe de turno que cierra el informe) ─
Bombero.hasMany(Servicio, { foreignKey: 'ID_FIRMA_VOBO', as: 'serviciosFirmados', onDelete: 'SET NULL', onUpdate: 'CASCADE' });
Servicio.belongsTo(Bombero, { foreignKey: 'ID_FIRMA_VOBO', as: 'firmaVobo' });

// ── Fase 4/8: Servicio N:M Insumo (a través de DetalleInsumoServicio) ─
Servicio.belongsToMany(Insumo, { through: DetalleInsumoServicio, foreignKey: 'id_servicio', otherKey: 'id_insumo', as: 'insumosUtilizados' });
Insumo.belongsToMany(Servicio, { through: DetalleInsumoServicio, foreignKey: 'id_insumo', otherKey: 'id_servicio', as: 'servicios' });

// ── 3NF: Servicio 1:N Paciente ────────────────────────────────
Servicio.hasMany(Paciente, { foreignKey: 'ID_SERVICIO', as: 'pacientes', onDelete: 'CASCADE', onUpdate: 'CASCADE' });
Paciente.belongsTo(Servicio, { foreignKey: 'ID_SERVICIO', as: 'servicio' });

// ── 3NF: Servicio N:M Vehiculo (a través de DetalleVehiculo) ─
Servicio.belongsToMany(Vehiculo, { through: DetalleVehiculo, foreignKey: 'id_emergencia', otherKey: 'id_vehiculo', as: 'vehiculosAsignados' });
Vehiculo.belongsToMany(Servicio, { through: DetalleVehiculo, foreignKey: 'id_vehiculo', otherKey: 'id_emergencia', as: 'serviciosAsignados' });

// ── 3NF: Servicio N:M Bombero (a través de DetalleBombero, con es_piloto) ─
Servicio.belongsToMany(Bombero, { through: DetalleBombero, foreignKey: 'id_emergencia', otherKey: 'id_bombero', as: 'bomberosAsignados' });
Bombero.belongsToMany(Servicio, { through: DetalleBombero, foreignKey: 'id_bombero', otherKey: 'id_emergencia', as: 'serviciosAsignados' });

// ── Auditoría: Usuario 1:N Bitacora ───────────────────────────
Usuario.hasMany(Bitacora, { foreignKey: 'id_usuario', as: 'bitacoras', onDelete: 'RESTRICT', onUpdate: 'CASCADE' });
Bitacora.belongsTo(Usuario, { foreignKey: 'id_usuario', as: 'usuario' });

// ════════════════════════════════════════════════════════════
//  EXPORTAR TODO
// ════════════════════════════════════════════════════════════
module.exports = {
  sequelize, // ← ¡Esto es vital para no romper la Fase 1!
  Rol, Usuario,
  Persona, GradoBombero, EstadoBombero, CargoBombero, Bombero,
  TipoVehiculo, EstadoVehiculo, Vehiculo,
  TipoServicio, Servicio,
  Paciente, DetalleVehiculo, DetalleBombero, // ← 3NF: pacientes y detalle de despacho
  Insumo, DetalleInsumoServicio, // ← Agregado para la Fase 8
  Bitacora,
};