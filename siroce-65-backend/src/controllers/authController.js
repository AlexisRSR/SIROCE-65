// src/controllers/authController.js
'use strict';

const bcrypt = require('bcryptjs');
const jwt    = require('jsonwebtoken');
const { enviarCorreo } = require('../config/mailer');

const { Usuario, Rol, Persona } = require('../models');

// ────────────────────────────────────────────────────────────
//  Configuración anti fuerza bruta (OWASP)
// ────────────────────────────────────────────────────────────
const MAX_INTENTOS_FALLIDOS = 3;
const BLOQUEO_DURACION_MS   = 5 * 60 * 1000; // 5 minutos
const MENSAJE_CREDENCIALES_INVALIDAS = 'Usuario y/o contraseña incorrecta.';

// ────────────────────────────────────────────────────────────
//  Sesión operativa: 12h cubre un turno completo de la estación
// ────────────────────────────────────────────────────────────
const SESSION_TOKEN_EXPIRES_IN         = '12h';
const SESSION_TOKEN_EXPIRES_IN_SECONDS = 12 * 60 * 60;

// ────────────────────────────────────────────────────────────
//  Reseteo de contraseña por bloqueo de cuenta (link enviado por correo)
// ────────────────────────────────────────────────────────────
const RESET_TOKEN_EXPIRES_IN = '15m';
const RESET_TOKEN_PURPOSE    = 'password_reset';
const FRONTEND_URL           = process.env.FRONTEND_URL || 'http://localhost:4200';

// 🔥 CAMBIO: El enlace de recuperación ya NO se envía al operador — llega
// exclusivamente al administrador, que es quien asigna la nueva contraseña.
const ADMIN_ALERT_EMAIL = process.env.CORREO_ADMINISTRADOR;

// ────────────────────────────────────────────────────────────
//  Política de contraseñas (validación de doble capa: frontend + backend)
//  12 a 15 caracteres, mínimo 1 mayúscula, 1 minúscula, 1 número y 1 especial
// ────────────────────────────────────────────────────────────
const PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{12,15}$/;

// ────────────────────────────────────────────────────────────
//  POST /api/login
// ────────────────────────────────────────────────────────────
const login = async (req, res) => {
  const { nombre_usuario, password } = req.body;

  if (!nombre_usuario || !password) {
    return res.status(400).json({ ok: false, message: 'Los campos nombre_usuario y password son obligatorios.' });
  }

  if (typeof nombre_usuario !== 'string' || typeof password !== 'string') {
    return res.status(400).json({ ok: false, message: 'Formato de credenciales inválido.' });
  }

  try {
    const usuario = await Usuario.findOne({
      where: { nombre_usuario: nombre_usuario.trim() },
      // 'requiere_cambio' a los atributos que consultamos de la base de datos
      attributes: [
        'id_usuario', 'nombre_usuario', 'password', 'id_rol', 'activo', 'requiere_cambio',
        'intentos_fallidos', 'bloqueado_hasta',
      ],
      include: [
        { model: Rol, as: 'rol', attributes: ['id_rol', 'nombre', 'activo'] },
      ],
    });

    // 1. OWASP: Si no existe físicamente en la BD → mensaje genérico, sin dar pistas
    if (!usuario) {
      return res.status(401).json({ ok: false, message: MENSAJE_CREDENCIALES_INVALIDAS });
    }

    // 2. Bloqueo temporal por múltiples intentos fallidos (se valida ANTES de bcrypt)
    if (usuario.bloqueado_hasta && new Date(usuario.bloqueado_hasta) > new Date()) {
      return res.status(403).json({
        ok: false,
        message: 'Cuenta temporalmente bloqueada por múltiples intentos fallidos. Intente de nuevo más tarde.',
      });
    }

    // 3. VALIDACIÓN: Si existe pero fue desactivado por un Admin
    if (!usuario.activo) {
      return res.status(403).json({
        ok: false,
        message: 'Tu acceso ha sido desactivado. Contacta al administrador de la estación.'
      });
    }

    // 4. Validar que el rol global no esté apagado
    if (!usuario.rol?.activo) {
      return res.status(403).json({ ok: false, message: 'Tu rol de acceso está deshabilitado. Contacta al administrador.' });
    }

    // 5. Comprobar la contraseña encriptada
    const passwordValida = await bcrypt.compare(password, usuario.password);

    if (!passwordValida) {
      // Incrementa el contador de intentos fallidos
      const intentosActualizados = (usuario.intentos_fallidos || 0) + 1;
      const camposActualizar = { intentos_fallidos: intentosActualizados };

      // Al llegar al límite: se bloquea la cuenta y se fuerza el reseteo por correo
      if (intentosActualizados >= MAX_INTENTOS_FALLIDOS) {
        camposActualizar.intentos_fallidos = MAX_INTENTOS_FALLIDOS;
        camposActualizar.requiere_cambio   = 1;
        camposActualizar.bloqueado_hasta   = new Date(Date.now() + BLOQUEO_DURACION_MS);

        await usuario.update(camposActualizar);

        //  JWT temporal de recuperación (15 min) — solo sirve para /reset-password
        const resetToken = jwt.sign(
          { id_usuario: usuario.id_usuario, purpose: RESET_TOKEN_PURPOSE },
          process.env.JWT_SECRET,
          { expiresIn: RESET_TOKEN_EXPIRES_IN },
        );
        const resetLink = `${FRONTEND_URL}/reset-password?token=${resetToken}`;

        // Alerta de seguridad + enlace de recuperación, ambos al administrador
        // (fire-and-forget: no bloquea la respuesta al cliente)
        enviarCorreo({
          para: ADMIN_ALERT_EMAIL,
          asunto: "🔴 Alerta de Seguridad - Bloqueo de Cuenta SIROCE-65",
          nombreRemitente: 'Seguridad SIROCE-65',
          html: `
            <div style="max-width: 600px; margin: 0 auto; border: 1px solid #ddd; border-radius: 8px; overflow: hidden; font-family: Arial, sans-serif;">
              <div style="background-color: #d32f2f; color: white; padding: 20px; text-align: center;">
                <h2 style="margin: 0;">⚠️ ATENCIÓN REQUERIDA</h2>
                <p style="margin: 5px 0 0;">Bloqueo preventivo de cuenta por seguridad</p>
              </div>
              <div style="padding: 20px;">
                <p>Hola,</p>
                <p>Le informamos que el sistema ha bloqueado temporalmente una cuenta tras detectar múltiples intentos de inicio de sesión fallidos:</p>
                <table style="width: 100%; border-collapse: collapse; margin-top: 15px; text-align: left;">
                  <tr>
                    <td style="padding: 10px; border: 1px solid #ddd; font-weight: bold; width: 40%; background-color: #f9f9f9;">Usuario Afectado:</td>
                    <td style="padding: 10px; border: 1px solid #ddd; color: #d32f2f; font-weight: bold;">${usuario.nombre_usuario}</td>
                  </tr>
                  <tr>
                    <td style="padding: 10px; border: 1px solid #ddd; font-weight: bold; background-color: #f9f9f9;">Motivo:</td>
                    <td style="padding: 10px; border: 1px solid #ddd; color: #d32f2f;">Excedió el límite de intentos permitidos</td>
                  </tr>
                </table>
                <p style="margin-top: 20px;">Se solicita tomar las medidas necesarias o revisar los registros de acceso de la estación.</p>
                <div style="text-align: center; margin: 30px 0 10px;">
                  <a href="${resetLink}" style="background-color: #c62828; color: #ffffff; text-decoration: none; padding: 14px 28px; border-radius: 6px; font-weight: bold; display: inline-block;">
                    Asignar Nueva Contraseña
                  </a>
                </div>
                <p style="font-size: 12px; color: #999; text-align: center; margin: 0;">Este enlace es válido por 15 minutos.</p>
              </div>
              <div style="background-color: #f5f5f5; color: #777; text-align: center; padding: 15px; font-size: 12px;">
                Este es un aviso automático generado por el sistema SIROCE-65 de la estación.
              </div>
            </div>
          `,
        }).catch((error) => console.error('[AuthController.login] Error al enviar alerta de bloqueo:', error));

        // Cuenta bloqueada: se corta el flujo aquí, con 403 en vez del 401 genérico
        return res.status(403).json({
          ok: false,
          accountLocked: true,
          message: 'Cuenta bloqueada. Contacte al administrador.',
        });
      }

      await usuario.update(camposActualizar);

      // OWASP: mismo mensaje genérico que cuando el usuario no existe
      return res.status(401).json({ ok: false, message: MENSAJE_CREDENCIALES_INVALIDAS });
    }

    // 6. Login exitoso: reinicia el contador de intentos y el bloqueo
    await usuario.update({ intentos_fallidos: 0, bloqueado_hasta: null });

    // 7. REQ-2.3: Si la cuenta requiere cambio de contraseña obligatorio, no se emite el JWT
    if (usuario.requiere_cambio) {
      return res.status(200).json({
        ok: true,
        requirePasswordChange: true,
        id_usuario: usuario.id_usuario,
        message: 'Cambio de contraseña obligatorio requerido.',
      });
    }

    const payload = {
      id_usuario    : usuario.id_usuario,
      nombre_usuario: usuario.nombre_usuario,
      id_rol        : usuario.id_rol,
      rol           : usuario.rol.nombre,
    };

    const access_token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: SESSION_TOKEN_EXPIRES_IN });

    return res.status(200).json({
      ok            : true,
      access_token,
      expires_in    : SESSION_TOKEN_EXPIRES_IN_SECONDS,
      rol           : usuario.rol.nombre,
      nombre_usuario: usuario.nombre_usuario,
      // Enviar al frontend la instrucción de si debe o no cambiar la clave
      requiere_cambio: Boolean(usuario.requiere_cambio)
    });

  } catch (error) {
    console.error('[AuthController.login] Error:', error.message);
    return res.status(500).json({ ok: false, message: 'Error interno del servidor. Intente más tarde.' });
  }
};

// ────────────────────────────────────────────────────────────
//  POST /api/recuperar-password
//  Sistema de tickets cerrado: NO se le envía nada al operador.
//  Se notifica exclusivamente al administrador, con un enlace para
//  que sea él quien le asigne la nueva contraseña.
// ────────────────────────────────────────────────────────────
const recuperarPassword = async (req, res) => {
  try {
    const { identificador } = req.body;

    if (!identificador) {
      return res.status(400).json({ ok: false, message: 'Proporcione un nombre de usuario o DPI.' });
    }

    let usuario = await Usuario.findOne({
      where: { nombre_usuario: identificador.trim() }
    });

    if (!usuario) {
      const persona = await Persona.findOne({ where: { DPI: identificador.trim() } });
      if (persona) {
        const idUsr = persona.ID_USUARIO || persona.id_usuario;
        if (idUsr) {
          usuario = await Usuario.findByPk(idUsr);
        }
      }
    }

    if (!usuario) {
      return res.status(404).json({ ok: false, message: 'Usuario no encontrado en el sistema.' });
    }

    // JWT temporal de recuperación (15 min) — solo sirve para /reset-password
    const resetToken = jwt.sign(
      { id_usuario: usuario.id_usuario, purpose: RESET_TOKEN_PURPOSE },
      process.env.JWT_SECRET,
      { expiresIn: RESET_TOKEN_EXPIRES_IN },
    );
    const resetLink = `${FRONTEND_URL}/reset-password?token=${resetToken}`;

    await enviarCorreo({
      para: ADMIN_ALERT_EMAIL,
      asunto: "🔐 Solicitud de Recuperación de Contraseña - SIROCE-65",
      nombreRemitente: 'Soporte SIROCE-65',
      html: `
        <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f4f5f7; padding: 40px 20px; text-align: center;">
          <div style="max-width: 500px; margin: 0 auto; background-color: #ffffff; border-radius: 10px; overflow: hidden; box-shadow: 0 4px 15px rgba(0,0,0,0.05);">
            <div style="background-color: #c62828; padding: 25px 20px; color: #ffffff;">
              <h2 style="margin: 0; font-size: 26px; font-weight: 700; letter-spacing: 3px;">SIROCE-65</h2>
              <p style="margin: 8px 0 0; font-size: 11px; font-weight: 600; letter-spacing: 1px; color: #ffcdd2; text-transform: uppercase;">
                Bomberos Voluntarios - San Rafael Pie de la Cuesta
              </p>
            </div>
            <div style="padding: 35px 30px; color: #333333; text-align: left;">
              <p style="font-size: 16px; margin-top: 0; color: #1a1a1a;">Hola,</p>
              <p style="font-size: 14px; line-height: 1.6; color: #555555;">
                El usuario <strong>${usuario.nombre_usuario}</strong> ha olvidado su contraseña y solicita un restablecimiento.
                Haz clic en el siguiente enlace para asignarle una nueva contraseña:
              </p>
              <div style="text-align: center; margin: 30px 0 10px;">
                <a href="${resetLink}" style="background-color: #c62828; color: #ffffff; text-decoration: none; padding: 14px 28px; border-radius: 6px; font-weight: bold; display: inline-block;">
                  Asignar Nueva Contraseña
                </a>
              </div>
              <p style="font-size: 12px; color: #999; text-align: center; margin: 0;">Este enlace es válido por 15 minutos.</p>
            </div>
            <div style="background-color: #f8f9fa; padding: 20px; border-top: 1px solid #eeeeee; font-size: 12px; color: #999999; line-height: 1.5;">
              Este es un mensaje generado automáticamente por el servidor.
            </div>
          </div>
        </div>
      `,
    });

    return res.status(200).json({ ok: true, message: 'Solicitud enviada al administrador.' });

  } catch (error) {
    console.error('[AuthCtrl.recuperarPassword]', error);
    return res.status(500).json({ ok: false, message: 'Error al procesar la recuperación.' });
  }
};

// ────────────────────────────────────────────────────────────
//  POST /api/auth/update-password
//  Cierra el flujo de cambio de contraseña obligatorio (REQ-2.3):
//  se invoca sin JWT porque el usuario aún no tiene sesión válida.
// ────────────────────────────────────────────────────────────
const updateMandatoryPassword = async (req, res) => {
  try {
    const { id_usuario, newPassword } = req.body;

    if (!id_usuario || !newPassword) {
      return res.status(400).json({ ok: false, message: 'Los campos id_usuario y newPassword son obligatorios.' });
    }

    // Validación de doble capa: el backend nunca confía en la validación del frontend
    if (!PASSWORD_REGEX.test(newPassword)) {
      return res.status(400).json({ ok: false, message: 'La contraseña no cumple con los requisitos de seguridad de la estación.' });
    }

    const usuario = await Usuario.findByPk(id_usuario);
    if (!usuario) {
      return res.status(404).json({ ok: false, message: 'Usuario no encontrado.' });
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(newPassword, salt);

    await usuario.update({
      password: passwordHash,
      requiere_cambio: 0,
      intentos_fallidos: 0,
      bloqueado_hasta: null,
    });

    return res.status(200).json({ ok: true, message: 'Contraseña actualizada correctamente.' });

  } catch (error) {
    console.error('[AuthCtrl.updateMandatoryPassword]', error);
    return res.status(500).json({ ok: false, message: 'Error interno al actualizar la contraseña.' });
  }
};

// ────────────────────────────────────────────────────────────
//  PUT /api/cambiar-password
// ────────────────────────────────────────────────────────────
const cambiarPassword = async (req, res) => {
  try {
    const { nombre_usuario, password_actual, nueva_password } = req.body;

    if (!nombre_usuario || !password_actual || !nueva_password) {
      return res.status(400).json({ ok: false, message: 'Todos los campos son obligatorios.' });
    }

    if (password_actual === nueva_password) {
      return res.status(400).json({ ok: false, message: 'Por seguridad, la nueva contraseña no puede ser igual a la actual.' });
    }

    const usuario = await Usuario.findOne({ where: { nombre_usuario: nombre_usuario.trim() } });
    if (!usuario) {
      return res.status(404).json({ ok: false, message: 'Usuario no encontrado.' });
    }

    const passwordValida = await bcrypt.compare(password_actual, usuario.password);
    if (!passwordValida) {
      return res.status(400).json({ ok: false, message: 'La contraseña actual es incorrecta.' });
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(nueva_password, salt);
    
    // Guardar la nueva clave definitiva y apagamos la bandera (0)
    await usuario.update({ password: passwordHash, requiere_cambio: 0 });

    return res.status(200).json({ ok: true, message: 'Contraseña actualizada correctamente.' });

  } catch (error) {
    console.error('[AuthCtrl.cambiarPassword]', error);
    return res.status(500).json({ ok: false, message: 'Error interno al cambiar la contraseña.' });
  }
};

// ────────────────────────────────────────────────────────────
//  POST /api/reset-password
//  Cierra el flujo de bloqueo de cuenta: recibe el JWT temporal
//  enviado por correo (15 min) y la nueva contraseña.
// ────────────────────────────────────────────────────────────
const resetPassword = async (req, res) => {
  try {
    const token       = req.body.token || req.params.token;
    const { newPassword } = req.body;

    if (!token || !newPassword) {
      return res.status(400).json({ ok: false, message: 'Los campos token y newPassword son obligatorios.' });
    }

    // Validación de doble capa: el backend nunca confía en la validación del frontend
    if (!PASSWORD_REGEX.test(newPassword)) {
      return res.status(400).json({ ok: false, message: 'La contraseña no cumple con los requisitos de seguridad de la estación.' });
    }

    let payload;
    try {
      payload = jwt.verify(token, process.env.JWT_SECRET);
    } catch (error) {
      return res.status(401).json({ ok: false, message: 'El enlace de recuperación es inválido o ha expirado.' });
    }

    // El token debe haber sido emitido específicamente para este flujo (no un access_token de sesión)
    if (payload.purpose !== RESET_TOKEN_PURPOSE || !payload.id_usuario) {
      return res.status(401).json({ ok: false, message: 'El enlace de recuperación es inválido.' });
    }

    const usuario = await Usuario.findByPk(payload.id_usuario);
    if (!usuario) {
      return res.status(404).json({ ok: false, message: 'Usuario no encontrado.' });
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(newPassword, salt);

    await usuario.update({
      password         : passwordHash,
      intentos_fallidos: 0,
      bloqueado_hasta  : null,
      requiere_cambio  : 0,
    });

    return res.status(200).json({ ok: true, message: 'Contraseña restablecida correctamente. Ya puedes iniciar sesión.' });

  } catch (error) {
    console.error('[AuthCtrl.resetPassword]', error);
    return res.status(500).json({ ok: false, message: 'Error interno al restablecer la contraseña.' });
  }
};

module.exports = {
  login,
  recuperarPassword,
  cambiarPassword,
  updateMandatoryPassword,
  resetPassword,
};
