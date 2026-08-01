// src/utils/alertaService.js
// ══════════════════════════════════════════════════════════════
//  Servicio Proactivo de Alertas Críticas — SIROCE-65
// ══════════════════════════════════════════════════════════════
'use strict';

const nodemailer = require('nodemailer');

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
 * Envía una alerta urgente cuando una unidad cambia a un estado inoperativo.
 */
const enviarAlertaVehiculo = async (vehiculo) => {
  try {
    const estadoCritico = vehiculo.estadoVehiculo?.ESTADO || 'Inoperativo';
    const tipoUnidad = vehiculo.tipoVehiculo?.TIPO || 'Unidad';
    
    const htmlBody = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e0e0e0; border-radius: 8px; overflow: hidden;">
        <div style="background-color: #d32f2f; color: white; padding: 20px; text-align: center;">
          <h2 style="margin: 0; font-size: 24px;">⚠️ ATENCIÓN REQUERIDA</h2>
          <p style="margin: 5px 0 0 0; font-size: 14px;">Una unidad reporta problemas para cubrir servicios</p>
        </div>
        <div style="padding: 30px; background-color: #ffffff; color: #333333;">
          <p>Hola,</p>
          <p>Le informamos que la siguiente unidad acaba de reportar un problema y actualmente <strong>no está disponible</strong> para salir a cubrir emergencias:</p>
          <table style="width: 100%; border-collapse: collapse; margin: 20px 0; background-color: #f9f9f9;">
            <tr>
              <td style="padding: 10px; border: 1px solid #e0e0e0; font-weight: bold; width: 40%;">Unidad Afectada:</td>
              <td style="padding: 10px; border: 1px solid #e0e0e0; color: #d32f2f; font-weight: bold;">${tipoUnidad} ${vehiculo.MARCA}</td>
            </tr>
            <tr>
              <td style="padding: 10px; border: 1px solid #e0e0e0; font-weight: bold;">Placa:</td>
              <td style="padding: 10px; border: 1px solid #e0e0e0;">${vehiculo.PLACA}</td>
            </tr>
            <tr>
              <td style="padding: 10px; border: 1px solid #e0e0e0; font-weight: bold;">Situación Actual:</td>
              <td style="padding: 10px; border: 1px solid #e0e0e0; background-color: #ffebee; color: #c62828; font-weight: bold;">${estadoCritico}</td>
            </tr>
          </table>
          <p style="font-size: 14px; color: #555555;">Se solicita tomar las medidas necesarias para que la unidad vuelva a estar activa lo más pronto posible.</p>
        </div>
        <div style="background-color: #f5f5f5; padding: 15px; text-align: center; border-top: 1px solid #e0e0e0; font-size: 12px; color: #999999;">
          Este es un aviso automático generado por el sistema SIROCE-65 de la estación.
        </div>
      </div>
    `;

    const mailOptions = {
      from: `"SIROCE-65 Operaciones" <${transporter.options.auth.user}>`,
      to: correoOficial,
      subject: `⚠️ AVISO: ${tipoUnidad} ${vehiculo.MARCA} no disponible (${estadoCritico})`,
      html: htmlBody
    };

    await transporter.sendMail(mailOptions);
    console.log(`[AlertaService] ✅ Alerta vehicular enviada con éxito.`);
  } catch (error) {
    console.error(`[AlertaService] ❌ Error al enviar la alerta:`, error.message);
  }
};

/**
 * Envía una alerta cuando el inventario de un producto está por agotarse.
 */
const enviarAlertaInsumo = async (insumo) => {
  try {
    const htmlBody = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e0e0e0; border-radius: 8px; overflow: hidden;">
        <div style="background-color: #f57c00; color: white; padding: 20px; text-align: center;">
          <h2 style="margin: 0; font-size: 24px;">📦 ALERTA DE INVENTARIO</h2>
          <p style="margin: 5px 0 0 0; font-size: 14px;">Insumo cercano al desabastecimiento</p>
        </div>
        <div style="padding: 30px; background-color: #ffffff; color: #333333;">
          <p>Hola,</p>
          <p>El sistema ha detectado que el siguiente recurso ha caído por debajo del nivel mínimo aceptable (10 unidades) y requiere ser reabastecido pronto:</p>
          <table style="width: 100%; border-collapse: collapse; margin: 20px 0; background-color: #f9f9f9;">
            <tr>
              <td style="padding: 10px; border: 1px solid #e0e0e0; font-weight: bold; width: 40%;">Recurso / Insumo:</td>
              <td style="padding: 10px; border: 1px solid #e0e0e0; color: #f57c00; font-weight: bold;">${insumo.NOMBRE}</td>
            </tr>
            <tr>
              <td style="padding: 10px; border: 1px solid #e0e0e0; font-weight: bold;">Categoría:</td>
              <td style="padding: 10px; border: 1px solid #e0e0e0;">${insumo.TIPO_INSUMO}</td>
            </tr>
            <tr>
              <td style="padding: 10px; border: 1px solid #e0e0e0; font-weight: bold;">Unidades Restantes:</td>
              <td style="padding: 10px; border: 1px solid #e0e0e0; background-color: #fff3e0; color: #e65100; font-weight: bold; font-size: 18px;">${insumo.STOCK}</td>
            </tr>
          </table>
          <p style="font-size: 14px; color: #555555;">Se sugiere gestionar la compra o reposición de este material para evitar falta de suministros durante las emergencias.</p>
        </div>
        <div style="background-color: #f5f5f5; padding: 15px; text-align: center; border-top: 1px solid #e0e0e0; font-size: 12px; color: #999999;">
          Este es un aviso automático generado por el sistema SIROCE-65 de la estación.
        </div>
      </div>
    `;

    const mailOptions = {
      from: `"SIROCE-65 Almacén" <${transporter.options.auth.user}>`,
      to: correoOficial,
      subject: `📦 STOCK BAJO: Solo quedan ${insumo.STOCK} unidades de ${insumo.NOMBRE}`,
      html: htmlBody
    };

    await transporter.sendMail(mailOptions);
    console.log(`[AlertaService] ✅ Alerta de insumo enviada con éxito.`);
  } catch (error) {
    console.error(`[AlertaService] ❌ Error al enviar la alerta de insumo:`, error.message);
  }
};

module.exports = {
  enviarAlertaVehiculo,
  enviarAlertaInsumo
};