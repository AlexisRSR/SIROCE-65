// controllers/mailerController.js
const transporter = require('../config/mailer');

const enviarCorreoPrueba = async (req, res) => {
  try {
    // Configuramos el mensaje
    const info = await transporter.sendMail({
      from: `"Estación SIROCE-65" <${process.env.EMAIL_USER}>`, // Remitente oficial
      to: process.env.EMAIL_USER, // Nos lo enviamos a nosotros mismos para probar
      subject: "🚒 Prueba Exitosa - Sistema SIROCE-65", 
      html: `
        <div style="font-family: Arial, sans-serif; padding: 20px; border: 1px solid #ddd; border-radius: 8px;">
          <h2 style="color: #B71C1C;">LXV Compañía San Rafael Pie de la Cuesta</h2>
          <p><strong>¡Hola, Ingeniero!</strong></p>
          <p>Si estás leyendo esto, significa que el módulo de <b>Nodemailer</b> está funcionando a la perfección.</p>
          <p>El sistema ahora es capaz de enviar notificaciones, recuperar contraseñas y despachar reportes.</p>
          <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
          <p style="font-size: 12px; color: #888;">Generado automáticamente por el servidor Backend Node.js</p>
        </div>
      `,
    });

    console.log("Mensaje enviado: %s", info.messageId);
    return res.status(200).json({ ok: true, message: 'Correo de prueba enviado con éxito' });

  } catch (error) {
    console.error('[MailerCtrl.enviarCorreoPrueba]', error);
    return res.status(500).json({ ok: false, message: 'Error al enviar el correo' });
  }
};

module.exports = {
  enviarCorreoPrueba
};