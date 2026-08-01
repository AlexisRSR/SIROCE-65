// src/utils/cronService.js
// ══════════════════════════════════════════════════════════════
//  Planificador de Tareas (Cron Jobs) — SIROCE-65
//  Corte Operativo Automatizado con KPIs Avanzados
// ══════════════════════════════════════════════════════════════
'use strict';

const cron = require('node-cron');
const { Op } = require('sequelize');
const nodemailer = require('nodemailer');
const { Servicio, TipoServicio } = require('../models');

// Configuración del transporte SMTP
const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST || 'smtp.gmail.com',
  port: parseInt(process.env.EMAIL_PORT || '465'),
  secure: true,
  auth: {
    user: process.env.EMAIL_USER || 'tu_correo_de_sistema@gmail.com',
    pass: process.env.EMAIL_PASS || 'tu_contrasena_de_aplicacion',
  },
});

const correoOficial = 'siroce65.notificaciones@gmail.com';

/**
 * Orquesta la recopilación de datos y envío del informe semanal
 */
const generarYEnviarCorteSemanal = async () => {
  try {
    console.log('[CronJob] Iniciando recopilación del Corte Operativo Semanal (BI)...');

    const hoy = new Date();
    const haceSieteDias = new Date();
    haceSieteDias.setDate(hoy.getDate() - 7);

    // Consultar las emergencias de los últimos 7 días
    const servicios = await Servicio.findAll({
      where: {
        FECHA_SERVICIO: {
          [Op.between]: [haceSieteDias.toISOString().split('T')[0], hoy.toISOString().split('T')[0]]
        }
      },
      include: [{ model: TipoServicio, as: 'tipoServicio' }]
    });

    // ── 1. CÁLCULO DE MÉTRICAS (KPIs) ──────────────────────────
    const totalEmergencias = servicios.length;
    let totalPacientes = 0;
    let totalTraslados = 0;
    let totalFallecidos = 0;
    const conteoPorTipo = {};

    servicios.forEach(s => {
      // Agrupación por tipo
      const tipo = s.tipoServicio?.TIPO_SERVICIO || 'Otros / No especificado';
      conteoPorTipo[tipo] = (conteoPorTipo[tipo] || 0) + 1;

      // Pacientes atendidos (si el campo tiene texto)
      if (s.NOMBRE_PACIENTE && s.NOMBRE_PACIENTE.trim() !== '') {
        totalPacientes++;
      }
      // Traslados clínicos (si el campo tiene texto y no dice "ninguno")
      if (s.LUGAR_TRASLADO && s.LUGAR_TRASLADO.trim() !== '' && s.LUGAR_TRASLADO.toLowerCase() !== 'ninguno') {
        totalTraslados++;
      }
      // Fallecidos (si el campo es SI)
      if (s.FALLECIDO && (s.FALLECIDO.toUpperCase() === 'SI' || s.FALLECIDO.toUpperCase() === 'SÍ')) {
        totalFallecidos++;
      }
    });

    // ── 2. CONSTRUCCIÓN DE TABLAS HTML ────────────────────────
    let filasEstadisticasHTML = '';
    for (const [tipo, total] of Object.entries(conteoPorTipo)) {
      filasEstadisticasHTML += `
        <tr>
          <td style="padding: 10px; border-bottom: 1px solid #e0e0e0; color: #333;">${tipo}</td>
          <td style="padding: 10px; border-bottom: 1px solid #e0e0e0; text-align: center; font-weight: bold; color: #d32f2f;">${total}</td>
        </tr>
      `;
    }

    if (filasEstadisticasHTML === '') {
      filasEstadisticasHTML = `<tr><td colspan="2" style="padding: 15px; text-align: center; color: #999999;">No se registraron emergencias en este período.</td></tr>`;
    }

    // ── 3. PLANTILLA DEL CORREO ──────────────────────────────
    const htmlBody = `
      <div style="font-family: Arial, sans-serif; max-width: 650px; margin: 0 auto; border: 1px solid #e0e0e0; border-radius: 8px; overflow: hidden;">
        
        <div style="background-color: #1a1a1a; color: #ffffff; padding: 25px; text-align: center; border-bottom: 4px solid #d32f2f;">
          <h2 style="margin: 0; font-size: 22px; letter-spacing: 1px;">RESUMEN OPERATIVO SEMANAL</h2>
          <p style="margin: 5px 0 0 0; font-size: 13px; color: #aaaaaa;">Métricas e impacto de la estación SIROCE-65</p>
        </div>
        
        <div style="padding: 30px; background-color: #ffffff; color: #333333;">
          <p style="margin-top: 0;">Estimados miembros de la Comandancia,</p>
          <p>Se presenta el consolidado automático de operaciones correspondientes a los últimos 7 días de servicio:</p>
          
          <div style="background-color: #f8f9fa; border-left: 4px solid #d32f2f; padding: 15px; margin: 20px 0; text-align: center;">
            <span style="font-size: 14px; text-transform: uppercase; color: #666666; font-weight: bold;">Total de Servicios Cubiertos</span>
            <h3 style="margin: 5px 0 0 0; font-size: 38px; color: #1a1a1a;">${totalEmergencias}</h3>
          </div>

          <p style="font-size: 14px; font-weight: bold; margin-bottom: 5px; color: #555;">Métricas de Atención Prehospitalaria:</p>
          <table style="width: 100%; border-collapse: separate; border-spacing: 8px 0; margin: 10px -8px 25px -8px;">
            <tr>
              <td style="width: 33%; background-color: #e3f2fd; padding: 15px; border-radius: 6px; text-align: center; border: 1px solid #bbdefb;">
                <span style="font-size: 11px; color: #1565c0; font-weight: bold; text-transform: uppercase; display: block; margin-bottom: 5px;">Pacientes<br>Atendidos</span>
                <h3 style="margin: 0; font-size: 26px; color: #0d47a1;">${totalPacientes}</h3>
              </td>
              <td style="width: 33%; background-color: #fff8e1; padding: 15px; border-radius: 6px; text-align: center; border: 1px solid #ffecb3;">
                <span style="font-size: 11px; color: #f57f17; font-weight: bold; text-transform: uppercase; display: block; margin-bottom: 5px;">Traslados<br>Clínicos</span>
                <h3 style="margin: 0; font-size: 26px; color: #e65100;">${totalTraslados}</h3>
              </td>
              <td style="width: 33%; background-color: #ffebee; padding: 15px; border-radius: 6px; text-align: center; border: 1px solid #ffcdd2;">
                <span style="font-size: 11px; color: #c62828; font-weight: bold; text-transform: uppercase; display: block; margin-bottom: 5px;">Fallecidos<br>en Escena</span>
                <h3 style="margin: 0; font-size: 26px; color: #b71c1c;">${totalFallecidos}</h3>
              </td>
            </tr>
          </table>
          
          <p style="font-size: 14px; font-weight: bold; margin-bottom: 10px; color: #555;">Desglose por Tipo de Emergencia:</p>
          <table style="width: 100%; border-collapse: collapse;">
            <thead>
              <tr style="background-color: #f5f5f5;">
                <th style="padding: 10px; border-bottom: 2px solid #ddd; text-align: left; font-size: 13px; color: #555;">Clasificación</th>
                <th style="padding: 10px; border-bottom: 2px solid #ddd; text-align: center; width: 30%; font-size: 13px; color: #555;">Cantidad</th>
              </tr>
            </thead>
            <tbody>
              ${filasEstadisticasHTML}
            </tbody>
          </table>
          
          <p style="font-size: 12px; color: #777777; margin-top: 30px; line-height: 1.5; padding: 10px; background-color: #f9f9f9; border-radius: 4px;">
            * Para revisar detalles clínicos, bitácoras de tiempos o unidades, ingrese al <strong>Centro de Reportes</strong> en el sistema web.
          </p>
        </div>
        
        <div style="background-color: #f5f5f5; padding: 15px; text-align: center; border-top: 1px solid #e0e0e0; font-size: 11px; color: #999999;">
          SIROCE-65 — Sistema Integrado de Control Operativo. Generado automáticamente.
        </div>
      </div>
    `;

    const mailOptions = {
      from: `"SIROCE-65 Inteligencia" <${transporter.options.auth.user}>`,
      to: correoOficial,
      subject: `📊 RESUMEN OPERATIVO: ${totalEmergencias} servicios cubiertos`,
      html: htmlBody
    };

    console.log(`[CronJob] Enviando consolidado (BI) por correo a: ${correoOficial}...`);
    await transporter.sendMail(mailOptions);
    console.log('[CronJob] ✅ Corte semanal enviado con éxito.');

  } catch (error) {
    console.error('[CronJob] ❌ Error crítico al generar el corte semanal:', error.message);
  }
};

// ── PROGRAMACIÓN DEL CRON ────────────────────────────────────
const iniciarCronJobs = () => {
  // ⚠️ TEMPORAL PARA PRUEBAS: '*/1 * * * *' (Cada minuto)
  // ⚠️ PRODUCCIÓN: '0 6 * * 1' (Lunes a las 6:00 AM)
  cron.schedule('0 6 * * 1', () => {
    generarYEnviarCorteSemanal();
  });
  console.log('[CronSystem] ⏰ Tarea programada iniciada.');
};

module.exports = {
  iniciarCronJobs
};