// models/TipoServicio.js
'use strict';

const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const TipoServicio = sequelize.define(
  'TipoServicio',
  {
    ID_TIPO_S: {
      type         : DataTypes.INTEGER,
      primaryKey   : true,
      autoIncrement: true,
      allowNull    : false,
    },
    TIPO_SERVICIO: {
      type     : DataTypes.STRING(100),
      allowNull: true,
    },
    // 🔥 NUEVO: Distingue entre Emergencia o Servicio
    CATEGORIA: {
      type        : DataTypes.STRING(50),
      allowNull   : false,
      defaultValue: 'Emergencia',
    },
    DESCRIPCION: {
      type     : DataTypes.STRING(300),
      allowNull: true,
    },
    PRIORIDAD: {
      type        : DataTypes.STRING(20),
      allowNull   : true,
      defaultValue: 'Media',
    },
    // 🔥 NUEVO: Relaciona este incidente con el vehículo ideal
    ID_TIPO_V: {
      type     : DataTypes.INTEGER,
      allowNull: true,
    }
  },
  {
    tableName      : 'TB_TIPO_SERVICIOS',
    timestamps     : false,
    freezeTableName: true,
  }
);

module.exports = TipoServicio;