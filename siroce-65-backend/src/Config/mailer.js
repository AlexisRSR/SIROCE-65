// config/mailer.js
'use strict';

const { EmailClient } = require('@azure/communication-email');

// 🔥 Fuente única de configuración de correo para todo el backend — ahora
// sobre Azure Communication Services (Nodemailer/SMTP quedó bloqueado por
// políticas de Azure para autenticación saliente).
const hayServicioCorreo = Boolean(process.env.ACS_CONNECTION_STRING && process.env.ACS_REMITENTE);

const emailClient = hayServicioCorreo
  ? new EmailClient(process.env.ACS_CONNECTION_STRING)
  : null;

if (hayServicioCorreo) {
  console.log('📧 Cliente de Azure Communication Services (Email) inicializado.');
} else {
  console.warn('⚠️  ACS no configurado (faltan ACS_CONNECTION_STRING/ACS_REMITENTE en .env) — los correos se simularán en consola.');
}

/**
 * Función genérica para enviar correos desde cualquier parte del backend.
 * Si no hay credenciales ACS configuradas, simula el envío en consola.
 */
async function enviarCorreo({ para, asunto, texto, html, adjuntos }) {
  if (!hayServicioCorreo) {
    console.log('\n--- Correo simulado (no hay ACS configurado en .env) ---');
    console.log('Para:   ', para);
    console.log('Asunto: ', asunto);
    console.log(texto || html);
    console.log('--------------------------------------------------------\n');
    return { simulado: true };
  }

  // 🔥 A diferencia de Nodemailer, ACS exige senderAddress como dirección
  // plana — NO acepta el formato "Nombre" <correo>. El SDK devuelve 400
  // (Request body validation error) si se interpola un display name aquí.
  // El nombre visible del remitente se configura a nivel del dominio/MailFrom
  // en el recurso de Azure Communication Services, no por mensaje.
  const senderAddress = process.env.ACS_REMITENTE;

  const mensaje = {
    senderAddress,
    content: {
      subject: asunto,
      plainText: texto,
      html,
    },
    recipients: {
      to: [{ address: para }],
    },
    // 🔥 Si algún día se usan adjuntos, deben venir en el formato de ACS:
    // [{ name, contentType, contentInBase64 }] — no el formato de Nodemailer.
    attachments: adjuntos,
  };

  const poller = await emailClient.beginSend(mensaje);
  const resultado = await poller.pollUntilDone();

  if (resultado.status !== 'Succeeded') {
    throw new Error(`Azure Communication Services no pudo enviar el correo (status: ${resultado.status}).`);
  }

  // 🔥 Se normaliza a "messageId" para no romper a quienes ya loguean info.messageId
  return { ...resultado, messageId: resultado.id };
}

module.exports = { emailClient, enviarCorreo };
