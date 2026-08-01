// config/database.js
// ── Configuración de la conexión a MySQL mediante Sequelize ──
'use strict';

// 1. IMPORTANTE: Cargar las variables del archivo .env
require('dotenv').config();

const { Sequelize } = require('sequelize');

const sequelize = new Sequelize(
  process.env.DB_NAME,     // db_bomberos
  process.env.DB_USER,     // root
  process.env.DB_PASSWORD, // 2. CORREGIDO: Coincide con tu archivo .env
  {
    host    : process.env.DB_HOST || 'localhost',
    port    : parseInt(process.env.DB_PORT) || 3306,
    dialect : 'mysql',

    // Guatemala: UTC-6 (sin horario de verano)
    timezone: '-06:00',

    // Mostrar SQL generado solo en desarrollo
    logging: process.env.NODE_ENV === 'development'
      ? (sql) => console.log(`\n[SQL] ${sql}`)
      : false,

    // Pool de conexiones
    pool: {
      max    : 10,  // máx. conexiones simultáneas
      min    : 0,
      acquire: 30000, // ms antes de lanzar error al obtener conexión
      idle   : 10000, // ms antes de liberar una conexión inactiva
    },

    // Opciones globales para todos los modelos
    define: {
      timestamps    : false, // La BD ya maneja fecha_creacion; no agregar createdAt/updatedAt
      freezeTableName: true, // No pluralizar nombres de tablas (Rol → "Rol", no "Rols")
      underscored   : false, // Respetar nombres de columna tal como están en el SQL
    },
  }
);

/**
 * Establece la conexión con la base de datos.
 * Llama a esta función en el arranque del servidor.
 * @throws Termina el proceso si no puede conectarse.
 */
const connectDB = async () => {
  try {
    await sequelize.authenticate();
    console.log('✅  Conexión a MySQL establecida correctamente → db_bomberos');
  } catch (error) {
    console.error('❌  No se pudo conectar a la base de datos:', error.message);
    process.exit(1); // Forzar cierre; no tiene sentido arrancar sin BD
  }
};

module.exports = { sequelize, connectDB };