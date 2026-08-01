// models/Rol.js
// ── Modelo Sequelize: tabla `Rol` ─────────────────────────────
// Fuente de verdad: script SQL de Fase 1 (db_bomberos).
// Columnas mapeadas exactamente a los nombres del DDL.
'use strict';

const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database'); // ← RUTA CORREGIDA

const Rol = sequelize.define(
  'Rol',           // Nombre interno del modelo en Sequelize
  {
    // PK — id_rol INT NOT NULL AUTO_INCREMENT
    id_rol: {
      type         : DataTypes.INTEGER,
      primaryKey   : true,
      autoIncrement: true,
      allowNull    : false,
    },

    // nombre VARCHAR(50) NOT NULL UNIQUE
    nombre: {
      type     : DataTypes.STRING(50),
      allowNull: false,
      unique   : true,
    },

    // descripcion TEXT NULL
    descripcion: {
      type     : DataTypes.TEXT,
      allowNull: true,
    },

    // activo TINYINT(1) NOT NULL DEFAULT 1
    // DataTypes.BOOLEAN → TINYINT(1) en MySQL; Sequelize convierte 1↔true, 0↔false
    activo: {
      type        : DataTypes.BOOLEAN,
      allowNull   : false,
      defaultValue: true,
    },
  },
  {
    tableName : 'Rol',   // Nombre EXACTO de la tabla en MySQL (case-sensitive en Linux)
    timestamps: false,   // Sin createdAt / updatedAt automáticos
  }
);

// Las asociaciones se definen en models/index.js (evita dependencias circulares)
module.exports = Rol;