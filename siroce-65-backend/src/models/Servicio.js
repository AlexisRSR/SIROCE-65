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
    // 🔥 3NF: los datos del paciente ahora viven en `tb_pacientes` (ver modelo Paciente),
    // y la unidad/piloto/personal destacado se derivan de detalle_vehiculo / detalle_bombero.
    OBSERVACIONES_FINALES: {
      type     : DataTypes.TEXT,
      allowNull: true,
    },

    // 🔥 3NF: reemplazan a los marcadores de texto [CANCELADO...]/[FIRMA VOBO...]
    // que antes vivían embebidos dentro de OBSERVACIONES_FINALES.
    ES_FALSA_ALARMA: {
      type        : DataTypes.BOOLEAN,
      allowNull   : false,
      defaultValue: false,
    },
    MOTIVO_CANCELACION: {
      type     : DataTypes.STRING(255),
      allowNull: true,
    },
    ID_FIRMA_VOBO: {
      type     : DataTypes.INTEGER,
      allowNull: true,
    },
  },
  {
    tableName      : 'TB_SERVICIOS',
    timestamps     : false,
    freezeTableName: true,
  }
);

module.exports = Servicio;