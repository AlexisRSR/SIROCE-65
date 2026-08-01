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
const Bombero       = require('./Bombero');

// ── FASE 2: Módulo de Flotilla / Vehículos ───────────────────
const TipoVehiculo   = require('./TipoVehiculo');
const EstadoVehiculo = require('./EstadoVehiculo');
const Vehiculo       = require('./Vehiculo');

// ── FASE 2: Módulo de Servicios / Emergencias ────────────────
const TipoServicio = require('./TipoServicio');
const Servicio     = require('./Servicio');

// ── FASE 8: Módulo de Insumos ─────────────────────────────────
const Insumo = require('./Insumo');

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

// ── Fase 2: TipoVehiculo 1:N Vehiculo ────────────────────────
TipoVehiculo.hasMany(Vehiculo, { foreignKey: 'ID_TIPO_V', as: 'vehiculos', onDelete: 'RESTRICT', onUpdate: 'CASCADE' });
Vehiculo.belongsTo(TipoVehiculo, { foreignKey: 'ID_TIPO_V', as: 'tipoVehiculo' });

// ── Fase 2: EstadoVehiculo 1:N Vehiculo ──────────────────────
EstadoVehiculo.hasMany(Vehiculo, { foreignKey: 'ID_ESTADO_V', as: 'vehiculos', onDelete: 'RESTRICT', onUpdate: 'CASCADE' });
Vehiculo.belongsTo(EstadoVehiculo, { foreignKey: 'ID_ESTADO_V', as: 'estadoVehiculo' });

// ── Fase 2: TipoServicio 1:N Servicio ────────────────────────
TipoServicio.hasMany(Servicio, { foreignKey: 'ID_TIPO_SERVICIO', as: 'servicios', onDelete: 'RESTRICT', onUpdate: 'CASCADE' });
Servicio.belongsTo(TipoServicio, { foreignKey: 'ID_TIPO_SERVICIO', as: 'tipoServicio' });

// Nota: El modelo Insumo es actualmente una entidad independiente (sin asociaciones).

// ════════════════════════════════════════════════════════════
//  EXPORTAR TODO
// ════════════════════════════════════════════════════════════
module.exports = {
  sequelize, // ← ¡Esto es vital para no romper la Fase 1!
  Rol, Usuario,
  Persona, GradoBombero, EstadoBombero, Bombero,
  TipoVehiculo, EstadoVehiculo, Vehiculo,
  TipoServicio, Servicio,
  Insumo, // ← Agregado para la Fase 8
};