// models/Vehiculo.js
// ── Modelo Sequelize: tabla `TB_VEHICULO` ─────────────────────
// Entidad central del módulo de Flotilla vehicular.
// FK: ID_TIPO_V → TB_TIPO_VEHICULO | ID_ESTADO_V → TB_ESTADO_VEHICULO
// NOTA: Esta tabla (TB_VEHICULO) es distinta de Vehiculo (Fase 1).
'use strict';

const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Vehiculo = sequelize.define(
  'Vehiculo',
  {
    // PK — ID_VEHICULO INT PRIMARY KEY AUTO_INCREMENT
    ID_VEHICULO: {
      type         : DataTypes.INTEGER,
      primaryKey   : true,
      autoIncrement: true,
      allowNull    : false,
    },

    // 🔥 NUEVO: NUMERO_UNIDAD VARCHAR(20)
    NUMERO_UNIDAD: {
      type     : DataTypes.STRING(20),
      allowNull: false,
    },

    // MARCA VARCHAR(50)
    MARCA: {
      type     : DataTypes.STRING(50),
      allowNull: true,
    },

    // MODELO VARCHAR(50)
    MODELO: {
      type     : DataTypes.STRING(50),
      allowNull: true,
    },

    ANIO: {
      type     : DataTypes.INTEGER,
      allowNull: true,
    },

    // PLACA VARCHAR(20)
    PLACA: {
      type     : DataTypes.STRING(20),
      allowNull: true,
    },

    // ID_TIPO_V INT → FK a TB_TIPO_VEHICULO
    ID_TIPO_V: {
      type     : DataTypes.INTEGER,
      allowNull: true,
    },

    // ID_ESTADO_V INT → FK a TB_ESTADO_VEHICULO
    ID_ESTADO_V: {
      type     : DataTypes.INTEGER,
      allowNull: true,
    },

    // KILOMETRAJE_ACTUAL DECIMAL(10,2)
    KILOMETRAJE_ACTUAL: {
      type        : DataTypes.DECIMAL(10, 2),
      allowNull   : true,
      defaultValue: 0.00,
    },

    CHASIS: {
      type     : DataTypes.STRING(50),
      allowNull: true,
    },
    MOTOR: {
      type     : DataTypes.STRING(50),
      allowNull: true,
    },

    // 🔥 NUEVO: FECHA_INGRESO DATE
    FECHA_INGRESO: {
      type     : DataTypes.DATEONLY,
      allowNull: true,
    },

    // 🔥 NUEVO: OBSERVACIONES TEXT
    OBSERVACIONES: {
      type     : DataTypes.TEXT,
      allowNull: true,
    },
  },
  {
    tableName      : 'TB_VEHICULO',
    timestamps     : false,
    freezeTableName: true,
  }
);

// Asociaciones definidas en models/index.js
module.exports = Vehiculo;