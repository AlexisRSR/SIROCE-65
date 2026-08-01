// models/Usuario.js
// ── Modelo Sequelize: tabla `Usuario` ─────────────────────────
// Fuente de verdad: script SQL de Fase 1 (db_bomberos).
// IMPORTANTE: el campo `password` se excluye por defecto en
//             las consultas de listado (ver atributo `select`).
'use strict';

const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database'); // ← RUTA CORREGIDA

const Usuario = sequelize.define(
  'Usuario',
  {
    // PK — id_usuario INT NOT NULL AUTO_INCREMENT
    id_usuario: {
      type         : DataTypes.INTEGER,
      primaryKey   : true,
      autoIncrement: true,
      allowNull    : false,
    },

    // nombre_usuario VARCHAR(50) NOT NULL UNIQUE
    nombre_usuario: {
      type     : DataTypes.STRING(50),
      allowNull: false,
      unique   : true,
    },

    // password VARCHAR(255) NOT NULL  ← Hash BCrypt
    // Se marca con `select: false` para que NO se retorne
    // automáticamente en findAll / findOne salvo que se pida explícitamente.
    password: {
      type     : DataTypes.STRING(255),
      allowNull: false,
      select   : false, // ← protección extra; el controlador de login lo pide con .get()
    },

    // 🔥 NUEVA COLUMNA: Bandera de seguridad para forzar el cambio de clave temporal
    requiere_cambio: {
      type        : DataTypes.BOOLEAN,
      allowNull   : false,
      defaultValue: false,
    },

    // intentos_fallidos INT NOT NULL DEFAULT 0 ← Contador anti fuerza bruta (OWASP)
    intentos_fallidos: {
      type        : DataTypes.INTEGER,
      allowNull   : false,
      defaultValue: 0,
    },

    // bloqueado_hasta DATETIME NULL ← Timestamp de bloqueo temporal por fuerza bruta
    bloqueado_hasta: {
      type        : DataTypes.DATE,
      allowNull   : true,
      defaultValue: null,
    },

    // dpi VARCHAR(13) NOT NULL UNIQUE  ← DPI guatemalteco, 13 dígitos
    dpi: {
      type     : DataTypes.STRING(13),
      allowNull: false,
      unique   : true,
    },

    // id_rol INT NOT NULL  ← FK hacia Rol
    id_rol: {
      type      : DataTypes.INTEGER,
      allowNull : false,
      references: {
        model: 'Rol',
        key  : 'id_rol',
      },
    },

    // activo TINYINT(1) NOT NULL DEFAULT 1
    activo: {
      type        : DataTypes.BOOLEAN,
      allowNull   : false,
      defaultValue: true,
    },

    // fecha_creacion DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
    // DataTypes.DATE → DATETIME en MySQL (no confundir con DATEONLY → DATE)
    fecha_creacion: {
      type        : DataTypes.DATE,
      allowNull   : false,
      defaultValue: DataTypes.NOW,
    },
  },
  {
    tableName : 'Usuario',
    timestamps: false,
  }
);

// Las asociaciones se definen en models/index.js (evita dependencias circulares)
module.exports = Usuario;