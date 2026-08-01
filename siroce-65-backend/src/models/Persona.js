// models/Persona.js
// ── Modelo Sequelize: tabla `TB_PERSONAS` ─────────────────────
// Almacena los datos personales de cualquier individuo del sistema.
// ID_USUARIO es FK opcional hacia la tabla `Usuario` (Fase 1).
'use strict';

const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Persona = sequelize.define(
  'Persona',
  {
    // PK — ID_PERSONA INT PRIMARY KEY AUTO_INCREMENT
    ID_PERSONA: {
      type         : DataTypes.INTEGER,
      primaryKey   : true,
      autoIncrement: true,
      allowNull    : false,
    },

    // ID_USUARIO INT → FK hacia tabla `Usuario` (puede ser NULL si no tiene cuenta)
    ID_USUARIO: {
      type     : DataTypes.INTEGER,
      allowNull: true,
    },

    // NOMBRE VARCHAR(100)
    NOMBRE: {
      type     : DataTypes.STRING(100),
      allowNull: true,
    },

    // APELLIDO VARCHAR(100)
    APELLIDO: {
      type     : DataTypes.STRING(100),
      allowNull: true,
    },

    // DPI VARCHAR(20) — Documento Personal de Identificación (Guatemala)
    DPI: {
      type     : DataTypes.STRING(20),
      allowNull: true,
    },

    // FECHA_NACIMIENTO DATE — DATEONLY mapea a DATE en MySQL (sin hora)
    FECHA_NACIMIENTO: {
      type     : DataTypes.DATEONLY,
      allowNull: true,
    },

    // TELEFONO VARCHAR(15)
    TELEFONO: {
      type     : DataTypes.STRING(15),
      allowNull: true,
    },

    // DIRECCION VARCHAR(255)
    DIRECCION: {
      type     : DataTypes.STRING(255),
      allowNull: true,
    },

    // 🔥 NUEVO CAMPO: CORREO (Requerido por la tesis y para seguridad)
    CORREO: {
      type     : DataTypes.STRING(150),
      allowNull: true,
    },
  },
  {
    tableName      : 'TB_PERSONAS',  // Nombre EXACTO de la tabla en MySQL
    timestamps     : false,
    freezeTableName: true,
  }
);

// Asociaciones definidas en models/index.js
module.exports = Persona;