// models/DetalleVehiculo.js
// ── Modelo Sequelize — tabla pivote `detalle_vehiculo` ────────
// Relaciona Servicio (emergencia) N:M Vehiculo (unidades destacadas).
'use strict';

const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const DetalleVehiculo = sequelize.define(
  'DetalleVehiculo',
  {
    id_detalle_vehiculo: {
      type         : DataTypes.INTEGER,
      primaryKey   : true,
      autoIncrement: true,
      allowNull    : false,
    },
    id_vehiculo: {
      type     : DataTypes.INTEGER,
      allowNull: false,
    },
    id_emergencia: {
      type     : DataTypes.INTEGER,
      allowNull: false,
    },
  },
  {
    tableName      : 'detalle_vehiculo',
    timestamps     : false,
    freezeTableName: true,
  }
);

module.exports = DetalleVehiculo;
