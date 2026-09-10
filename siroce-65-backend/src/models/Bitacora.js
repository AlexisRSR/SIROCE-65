// models/Bitacora.js
// ══════════════════════════════════════════════════════════════
//  Modelo Sequelize — tabla `bitacora`
//  Registro de auditoría del sistema (ver helpers/bitacoraHelper.js,
//  que es quien inserta las filas desde los distintos controladores).
// ══════════════════════════════════════════════════════════════
'use strict';

const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Bitacora = sequelize.define(
  'Bitacora',
  {
    id_bitacora: {
      type         : DataTypes.INTEGER,
      primaryKey   : true,
      autoIncrement: true,
      allowNull    : false,
    },
    descripcion: {
      type     : DataTypes.TEXT,
      allowNull: false,
    },
    fecha: {
      type     : DataTypes.DATEONLY,
      allowNull: false,
    },
    hora: {
      type     : DataTypes.TIME,
      allowNull: false,
    },
    id_usuario: {
      type     : DataTypes.INTEGER,
      allowNull: false,
    },
  },
  {
    tableName      : 'bitacora',
    timestamps     : false,
    freezeTableName: true,
  }
);

module.exports = Bitacora;
