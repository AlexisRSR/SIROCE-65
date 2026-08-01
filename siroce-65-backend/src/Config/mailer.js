// config/mailer.js
const nodemailer = require('nodemailer');

// Configuramos el "Transportador" con las credenciales de Gmail
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

// Verificamos que la conexión sea exitosa al arrancar el servidor
transporter.verify().then(() => {
  console.log('📧 Servidor de correos SIROCE-65 listo y conectado');
}).catch((error) => {
  console.error('🔥 Error al conectar con el servidor de correos:', error);
});

module.exports = transporter;