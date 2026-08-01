// models/Bombero.js
// ── Modelo Sequelize: tabla `TB_BOMBERO` ─────────────────────
// Entidad central del módulo de Personal.
// Vincula a una Persona con su grado, estado operativo, turno y fecha de ingreso.
// FK: ID_PERSONA → TB_PERSONAS | ID_GRADO → TB_GRADO_BOMBERO | ID_ESTADO_B → TB_ESTADO_BOMBERO
'use strict';

const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Bombero = sequelize.define(
  'Bombero',
  {
    // PK — ID_BOMBERO INT PRIMARY KEY AUTO_INCREMENT
    ID_BOMBERO: {
      type         : DataTypes.INTEGER,
      primaryKey   : true,
      autoIncrement: true,
      allowNull    : false,
    },

    // ID_PERSONA INT → FK a TB_PERSONAS
    ID_PERSONA: {
      type     : DataTypes.INTEGER,
      allowNull: true,
    },

    // ID_GRADO INT → FK a TB_GRADO_BOMBERO
    ID_GRADO: {
      type     : DataTypes.INTEGER,
      allowNull: true,
    },

    // ID_ESTADO_B INT → FK a TB_ESTADO_BOMBERO
    ID_ESTADO_B: {
      type     : DataTypes.INTEGER,
      allowNull: true,
    },

    // FECHA_INGRESO DATE — (Fecha de alta según tesis)
    FECHA_INGRESO: {
      type     : DataTypes.DATEONLY,
      allowNull: true,
    },

    // 🔥 NUEVO CAMPO: TURNO SEGÚN REQUERIMIENTO DE TESIS
    TURNO: {
      type     : DataTypes.STRING(50),
      allowNull: true,
    },
    // Dentro de la definición del modelo Bombero en Sequelize:
    CARGO: {
      type: DataTypes.STRING(100),
      allowNull: true,
      defaultValue: 'Bombero de Línea'
    }
  },
  {
    tableName      : 'TB_BOMBERO',
    timestamps     : false,
    freezeTableName: true,
  }
);

module.exports = Bombero;