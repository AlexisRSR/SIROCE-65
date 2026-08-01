// app.js
// ── Punto de Entrada — Bomberos API ──────────────────────────
// ACTUALIZADO: Fase 1 a 9 + Estadísticas + Módulo Mailer + CronJobs + Usuarios
'use strict';

require('dotenv').config();

const express    = require('express');
const cors       = require('cors');
const morgan     = require('morgan');
const { connectDB } = require('./src/config/database');

// Inicializar todos los modelos + asociaciones antes de recibir peticiones
require('./src/models');

// ── Importar rutas ────────────────────────────────────────────
const authRoutes         = require('./src/routes/authRoutes');      // Fase 1 — Pública
const bomberoRoutes      = require('./src/routes/bomberoRoutes');   // Fase 2 — Protegida
const vehiculoRoutes     = require('./src/routes/vehiculoRoutes');  // Fase 2 — Protegida
const servicioRoutes     = require('./src/routes/servicioRoutes');  // Fase 2 — Protegida
const insumoRoutes       = require('./src/routes/insumoRoutes');    // Fase 8 — Protegida
const estadisticasRoutes = require('./src/routes/estadisticasRoutes'); // Módulo Estadísticas
const mailerRoutes       = require('./src/routes/mailerRoutes');    // Módulo Mailer

// 🔥 NUEVO: IMPORTAR RUTAS DE USUARIOS (Gestión de Accesos)
const usuarioRoutes      = require('./src/routes/usuario.routes');

// 🔥 NUEVO: IMPORTAR EL SERVICIO DE TAREAS PROGRAMADAS
const { iniciarCronJobs } = require('./src/utils/cronService');

// ════════════════════════════════════════════════════════════
//  INICIALIZACIÓN DE EXPRESS
// ════════════════════════════════════════════════════════════
const app = express();

// ── Middlewares globales ──────────────────────────────────────
app.use(cors({
  origin       : process.env.FRONTEND_URL || '*',
  methods      : ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials  : true,
}));

app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: false }));

// ════════════════════════════════════════════════════════════
//  RUTAS
// ════════════════════════════════════════════════════════════

// ── [PÚBLICA] Autenticación — sin authMiddleware ──────────────
app.use('/api', authRoutes);      // POST  /api/login

// ── [PROTEGIDAS] Módulos de Operación ────────────────────────
app.use('/api', bomberoRoutes);
app.use('/api', vehiculoRoutes);
app.use('/api', servicioRoutes);
app.use('/api', insumoRoutes);

// ── [PROTEGIDAS] Módulo de Gestión de Usuarios ────────────────
// 🔥 NUEVA RUTA AGREGADA AQUÍ
app.use('/api/usuarios', usuarioRoutes);

// ── [PROTEGIDAS] Módulo Estadísticas ──────────────────────────
//   GET  /api/estadisticas/dashboard
app.use('/api/estadisticas', estadisticasRoutes); 

// ── [PROTEGIDAS] Módulo Mailer ────────────────────────────────
//   GET  /api/mailer/test
app.use('/api/mailer', mailerRoutes);

// ── Health-check (monitoreo) ──────────────────────────────────
app.get('/api/health', (req, res) => {
  res.status(200).json({
    ok     : true,
    service: 'Bomberos API',
    version: '2.0.0',
    env    : process.env.NODE_ENV || 'development',
    time   : new Date().toISOString(),
  });
});

// ════════════════════════════════════════════════════════════
//  MANEJADORES DE ERROR
// ════════════════════════════════════════════════════════════

// 404 — Ruta no encontrada
app.use((req, res) => {
  res.status(404).json({
    ok     : false,
    message: `Ruta no encontrada: [${req.method}] ${req.originalUrl}`,
  });
});

// 500 — Error global no controlado
// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  console.error('[Error Global]', err.stack || err.message);
  res.status(err.status || 500).json({
    ok     : false,
    message: err.message || 'Error interno del servidor.',
  });
});

// ════════════════════════════════════════════════════════════
//  ARRANQUE DEL SERVIDOR
// ════════════════════════════════════════════════════════════
const PORT = parseInt(process.env.PORT) || 3000;

const startServer = async () => {
  await connectDB(); // Conectar a MySQL primero
  app.listen(PORT, () => {
    console.log('');
    console.log('🚒  ==========================================');
    console.log(`🚒  Bomberos API v2.0 | Puerto ${PORT}`);
    console.log(`🚒  Entorno: ${process.env.NODE_ENV || 'development'}`);
    console.log('🚒  ── Rutas disponibles ──────────────────');
    console.log(`🚒  [PUBLIC]  POST   /api/login`);
    console.log(`🚒  [AUTH]    CRUD   /api/personas`);
    console.log(`🚒  [AUTH]    CRUD   /api/bomberos`);
    console.log(`🚒  [AUTH]    POST   /api/bomberos/completo`);
    console.log(`🚒  [AUTH]    CRUD   /api/vehiculos`);
    console.log(`🚒  [AUTH]    CRUD   /api/servicios`);
    console.log(`🚒  [AUTH]    CRUD   /api/insumos`); 
    console.log(`🚒  [AUTH]    CRUD   /api/usuarios`); // 🔥 NUEVA RUTA EN CONSOLA
    console.log(`🚒  [AUTH]    GET    /api/estadisticas/dashboard`);
    console.log(`🚒  [AUTH]    GET    /api/mailer/test`);
    console.log(`🚒  [AUTH]    GET    /api/grados`);
    console.log(`🚒  [AUTH]    GET    /api/estados-bombero`);
    console.log(`🚒  [AUTH]    GET    /api/tipos-vehiculo`);
    console.log(`🚒  [AUTH]    GET    /api/estados-vehiculo`);
    console.log(`🚒  [AUTH]    GET    /api/tipos-servicio`);
    console.log('🚒  ==========================================');
    console.log('');

    // 🔥 ENCENDER EL RELOJ AUTOMÁTICO AL FINALIZAR EL ARRANQUE
    iniciarCronJobs();
  });
};

startServer();

module.exports = app;