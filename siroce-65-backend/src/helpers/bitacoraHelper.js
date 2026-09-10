// src/helpers/bitacoraHelper.js
'use strict';

const { sequelize } = require('../config/database');

const registrarBitacora = async (idUsuario, descripcion) => {
  try {
    const fechaActual = new Date().toISOString().slice(0, 10); // Formato YYYY-MM-DD
    const horaActual = new Date().toTimeString().slice(0, 8);   // Formato HH:MM:SS

    await sequelize.query(
      `INSERT INTO bitacora (fecha, hora, descripcion, id_usuario) VALUES (:fecha, :hora, :descripcion, :idUsuario)`,
      {
        replacements: {
          fecha: fechaActual,
          hora: horaActual,
          descripcion: descripcion,
          idUsuario: idUsuario || null
        }
      }
    );
  } catch (error) {
    console.error('[BitacoraHelper] Error al registrar en bitácora:', error.message);
  }
};

module.exports = { registrarBitacora };