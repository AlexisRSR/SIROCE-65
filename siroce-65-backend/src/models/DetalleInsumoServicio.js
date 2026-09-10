// models/DetalleInsumoServicio.js
// ══════════════════════════════════════════════════════════════
//  Modelo Sequelize — tabla pivote `detalle_insumo_servicio`
//  Relaciona Servicio (emergencia) N:M Insumo, con la cantidad
//  utilizada de cada insumo en el cierre operativo del servicio.
// ══════════════════════════════════════════════════════════════
'use strict';

const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const DetalleInsumoServicio = sequelize.define(
  'DetalleInsumoServicio',
  {
    id_detalle_is: {
      type         : DataTypes.INTEGER,
      primaryKey   : true,
      autoIncrement: true,
      allowNull    : false,
    },
    id_insumo: {
      type     : DataTypes.INTEGER,
      allowNull: false,
    },
    id_servicio: {
      type     : DataTypes.INTEGER,
      allowNull: false,
    },
    cantidad_utilizada: {
      type     : DataTypes.INTEGER,
      allowNull: false,
    },
  },
  {
    tableName      : 'detalle_insumo_servicio',
    timestamps     : false,
    freezeTableName: true,
  }
);

module.exports = DetalleInsumoServicio;
