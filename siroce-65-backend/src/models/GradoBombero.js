'use strict';

const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const GradoBombero = sequelize.define(
  'GradoBombero',
  {
    ID_GRADO: {
      type         : DataTypes.INTEGER,
      primaryKey   : true,       // ← Aquí le decimos cuál es la llave primaria real
      autoIncrement: true,
      allowNull    : false,
    },
    GRADO: {
      type     : DataTypes.STRING(50),
      allowNull: true,
    },
  },
  {
    tableName      : 'TB_GRADO_BOMBERO', // ← Nombre exacto en MySQL
    timestamps     : false,              // ← Sin createdAt / updatedAt
    freezeTableName: true,               // ← Evita que Sequelize le agregue una "s" al final
  }
);

module.exports = GradoBombero;