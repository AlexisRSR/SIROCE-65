// models/Paciente.js
// ── Modelo Sequelize: tabla `tb_pacientes` ────────────────────
// 3NF: los datos clínicos del(los) paciente(s) atendidos en un
// servicio ya NO viven en TB_SERVICIOS — cada víctima es una fila
// propia enlazada por ID_SERVICIO (1 servicio : N pacientes).
'use strict';

const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Paciente = sequelize.define(
  'Paciente',
  {
    ID_PACIENTE: {
      type         : DataTypes.INTEGER,
      primaryKey   : true,
      autoIncrement: true,
      allowNull    : false,
    },
    ID_SERVICIO: {
      type     : DataTypes.INTEGER,
      allowNull: false,
    },
    NOMBRE_PACIENTE: {
      type     : DataTypes.STRING(150),
      allowNull: true,
    },
    EDAD_PACIENTE: {
      type     : DataTypes.INTEGER,
      allowNull: true,
    },
    FALLECIDO: {
      type        : DataTypes.STRING(2),
      defaultValue: 'NO',
    },
    ACOMPANANTE: {
      type     : DataTypes.STRING(150),
      allowNull: true,
    },
    LUGAR_TRASLADO: {
      type     : DataTypes.STRING(150),
      allowNull: true,
    },
  },
  {
    tableName      : 'tb_pacientes',
    timestamps     : false,
    freezeTableName: true,
  }
);

module.exports = Paciente;
