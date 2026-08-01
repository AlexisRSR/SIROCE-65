// src/models/Servicio.js
'use strict';

const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Servicio = sequelize.define(
  'Servicio',
  {
    ID_SERVICIO: {
      type         : DataTypes.INTEGER,
      primaryKey   : true,
      autoIncrement: true,
      allowNull    : false,
    },
    ID_TIPO_SERVICIO: {
      type     : DataTypes.INTEGER,
      allowNull: false,
    },
    DESCRIPCION: {
      type     : DataTypes.STRING(300),
      allowNull: true,
    },
    FECHA_SERVICIO: {
      type     : DataTypes.DATEONLY,
      allowNull: false,
    },
    DIRECCION_SERVICIO: {
      type     : DataTypes.STRING(150),
      allowNull: false,
    },
    NOMBRE_SOLICITANTE: {
      type     : DataTypes.STRING(100),
      allowNull: true,
    },
    TELEFONO_SOLICITANTE: {
      type     : DataTypes.STRING(20),
      allowNull: true,
    },
    HORA_SALIDA: {
      type     : DataTypes.DATE,
      allowNull: true,
    },
    HORA_ENTRADA: {
      type     : DataTypes.DATE,
      allowNull: true,
    },
    // 🔥 NUEVOS CAMPOS: INFORME DE LLAMADA OPERATIVA (CIERRE) 🔥
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
    UNIDAD_DESTACADA: {
      type     : DataTypes.STRING(50),
      allowNull: true,
    },
    PILOTO: {
      type     : DataTypes.STRING(150),
      allowNull: true,
    },
    PERSONAL_DESTACADO: {
      type     : DataTypes.STRING(255),
      allowNull: true,
    },
    OBSERVACIONES_FINALES: {
      type     : DataTypes.TEXT,
      allowNull: true,
    }
  },
  {
    tableName      : 'TB_SERVICIOS',
    timestamps     : false,
    freezeTableName: true,
  }
);

module.exports = Servicio;