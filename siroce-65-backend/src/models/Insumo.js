// models/Insumo.js
// ══════════════════════════════════════════════════════════════
//  Modelo Sequelize — tabla `TB_INSUMOS`
// ──────────────────────────────────────────────────────────────
//  ANTES de usar este modelo, ejecuta en MySQL:
//
//  CREATE TABLE IF NOT EXISTS TB_INSUMOS (
//    ID_INSUMO    INT          NOT NULL AUTO_INCREMENT,
//    NOMBRE       VARCHAR(150) NOT NULL,
//    DESCRIPCION  TEXT,
//    TIPO_INSUMO  VARCHAR(50)  NOT NULL,   -- 'Herramienta' | 'Médico' | 'Rescate'
//    STOCK        INT          NOT NULL DEFAULT 0,
//    ESTADO       VARCHAR(50)  NOT NULL DEFAULT 'Activo', -- 'Activo' | 'Bajo Stock' | 'Inactivo'
//    CONSTRAINT pk_insumo        PRIMARY KEY (ID_INSUMO),
//    CONSTRAINT chk_stock_nn     CHECK (STOCK >= 0)
//  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
//
//  Regla: TODAS las columnas van en MAYÚSCULAS para coherencia
//  con el resto de tablas TB_* del sistema SIROCE-65.
// ══════════════════════════════════════════════════════════════
'use strict';

const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Insumo = sequelize.define(
  'Insumo',
  {
    // PK — ID_INSUMO INT NOT NULL AUTO_INCREMENT
    ID_INSUMO: {
      type         : DataTypes.INTEGER,
      primaryKey   : true,
      autoIncrement: true,
      allowNull    : false,
    },

    // NOMBRE VARCHAR(150) NOT NULL
    NOMBRE: {
      type     : DataTypes.STRING(150),
      allowNull: false,
      validate : {
        notEmpty: { msg: 'El NOMBRE no puede estar vacío.' },
        len     : { args: [2, 150], msg: 'NOMBRE debe tener entre 2 y 150 caracteres.' },
      },
    },

    // DESCRIPCION TEXT NULL
    DESCRIPCION: {
      type     : DataTypes.TEXT,
      allowNull: true,
      defaultValue: '',
    },

    // TIPO_INSUMO VARCHAR(50) NOT NULL
    TIPO_INSUMO: {
      type     : DataTypes.STRING(50),
      allowNull: false,
      validate : {
        isIn: {
          // 🔥 Tesis: Se ampliaron los tipos para soportar el Catálogo Unificado
          args: [['Insumo Médico', 'Herramienta', 'EPP', 'Médico', 'Rescate']],
          msg : 'TIPO_INSUMO inválido.',
        },
      },
    },

    // 🔥 NUEVOS CAMPOS DE LA TESIS (Opcionales para compatibilidad)
    MARCA: {
      type     : DataTypes.STRING(100),
      allowNull: true,
    },
    MODELO: {
      type     : DataTypes.STRING(100),
      allowNull: true,
    },
    NUMERO_SERIE: {
      type     : DataTypes.STRING(50),
      allowNull: true,
    },
    PROPOSITO: {
      type     : DataTypes.STRING(150),
      allowNull: true,
    },

    // STOCK INT NOT NULL DEFAULT 0
    STOCK: {
      type        : DataTypes.INTEGER,
      allowNull   : false,
      defaultValue: 0,
      validate    : {
        min: { args: [0], msg: 'El STOCK no puede ser negativo.' },
      },
    },

    // ESTADO VARCHAR(50) NOT NULL DEFAULT 'Activo'
    ESTADO: {
      type        : DataTypes.STRING(50),
      allowNull   : false,
      defaultValue: 'Activo',
      validate    : {
        isIn: {
          // 🔥 Tesis: Se agregaron los estados de Herramientas
          args: [['Activo', 'Bajo Stock', 'Inactivo', 'Disponible', 'En Reparación', 'Prestado', 'De Baja']],
          msg : 'ESTADO inválido.',
        },
      },
    },
  },
  {
    tableName     : 'TB_INSUMOS',
    timestamps    : false,
    freezeTableName: true,
  }
);

module.exports = Insumo;