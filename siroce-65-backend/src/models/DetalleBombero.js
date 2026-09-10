// models/DetalleBombero.js
// ── Modelo Sequelize — tabla pivote `detalle_bombero` ─────────
// Relaciona Servicio (emergencia) N:M Bombero. `es_piloto` marca
// cuál de los bomberos destacados condujo la unidad.
'use strict';

const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const DetalleBombero = sequelize.define(
  'DetalleBombero',
  {
    id_detalle_bombero: {
      type         : DataTypes.INTEGER,
      primaryKey   : true,
      autoIncrement: true,
      allowNull    : false,
    },
    id_bombero: {
      type     : DataTypes.INTEGER,
      allowNull: false,
    },
    id_emergencia: {
      type     : DataTypes.INTEGER,
      allowNull: false,
    },
    es_piloto: {
      type        : DataTypes.BOOLEAN,
      allowNull   : false,
      defaultValue: false,
    },
  },
  {
    tableName      : 'detalle_bombero',
    timestamps     : false,
    freezeTableName: true,
  }
);

module.exports = DetalleBombero;
