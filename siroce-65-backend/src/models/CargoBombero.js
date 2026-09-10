// models/CargoBombero.js
// ── Modelo Sequelize: tabla `tb_cargo_bombero` ────────────────
// Catálogo de cargos/funciones operativas del personal de bomberos.
// Reemplaza el antiguo campo de texto libre TB_BOMBERO.CARGO (3NF).
'use strict';

const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const CargoBombero = sequelize.define(
  'CargoBombero',
  {
    ID_CARGO: {
      type         : DataTypes.INTEGER,
      primaryKey   : true,
      autoIncrement: true,
      allowNull    : false,
    },
    CARGO: {
      type     : DataTypes.STRING(100),
      allowNull: false,
    },
  },
  {
    tableName      : 'tb_cargo_bombero',
    timestamps     : false,
    freezeTableName: true,
  }
);

module.exports = CargoBombero;
