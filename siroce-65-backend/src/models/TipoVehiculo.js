'use strict';

const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const TipoVehiculo = sequelize.define(
  'TipoVehiculo',
  {
    ID_TIPO_V: {
      type         : DataTypes.INTEGER,
      primaryKey   : true,       // ← Corrección aplicada
      autoIncrement: true,
      allowNull    : false,
    },
    TIPO: {
      type     : DataTypes.STRING(50),
      allowNull: true,
    },
  },
  {
    tableName      : 'TB_TIPO_VEHICULO',
    timestamps     : false,
    freezeTableName: true,
  }
);

module.exports = TipoVehiculo;