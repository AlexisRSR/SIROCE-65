'use strict';

const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const EstadoBombero = sequelize.define(
  'EstadoBombero',
  {
    ID_ESTADO_B: {
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
    tableName      : 'TB_ESTADO_BOMBERO',
    timestamps     : false,
    freezeTableName: true,
  }
);

module.exports = EstadoBombero;