'use strict';

const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const EstadoVehiculo = sequelize.define(
  'EstadoVehiculo',
  {
    ID_ESTADO_V: {
      type         : DataTypes.INTEGER,
      primaryKey   : true,       // ← Corrección aplicada
      autoIncrement: true,
      allowNull    : false,
    },
    ESTADO: {
      type     : DataTypes.STRING(50),
      allowNull: true,
    },
  },
  {
    tableName      : 'TB_ESTADO_VEHICULO',
    timestamps     : false,
    freezeTableName: true,
  }
);

module.exports = EstadoVehiculo;