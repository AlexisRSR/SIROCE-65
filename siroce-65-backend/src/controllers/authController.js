// src/controllers/authController.js
'use strict';

const bcrypt = require('bcryptjs');
const jwt    = require('jsonwebtoken');
const transporter = require('../config/mailer');

const { Usuario, Rol, Persona } = require('../models');

// ────────────────────────────────────────────────────────────
//  Configuración anti fuerza bruta (OWASP)
// ────────────────────────────────────────────────────────────
const MAX_INTENTOS_FALLIDOS = 3;
const BLOQUEO_DURACION_MS   = 5 * 60 * 1000; // 5 minutos
const MENSAJE_CREDENCIALES_INVALIDAS = 'Usuario y/o contraseña incorrecta.';

// ────────────────────────────────────────────────────────────
//  Política de contraseñas (validación de doble capa: frontend + backend)
//  12 a 15 caracteres, mínimo 1 mayúscula, 1 minúscula, 1 número y 1 especial
// ────────────────────────────────────────────────────────────
const PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{12,15}$/;

// Genera una contraseña temporal que siempre cumple PASSWORD_REGEX (12 caracteres)
function generarPasswordTemporal() {
  const UPPER   = 'ABCDEFGHJKLMNPQRSTUVWXYZ';
  const LOWER   = 'abcdefghijkmnopqrstuvwxyz';
  const NUMBERS = '23456789';
  const SPECIAL = '@#$%&*';
  const ALL     = UPPER + LOWER + NUMBERS + SPECIAL;

  const pick = (chars) => chars[Math.floor(Math.random() * chars.length)];

  // Garantiza al menos un carácter de cada categoría exigida por PASSWORD_REGEX
  const obligatorios = [pick(UPPER), pick(LOWER), pick(NUMBERS), pick(SPECIAL)];
  const resto = Array.from({ length: 12 - obligatorios.length }, () => pick(ALL));

  const caracteres = [...obligatorios, ...resto];

  // Fisher-Yates shuffle para no dejar el patrón de posiciones fijas
  for (let i = caracteres.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [caracteres[i], caracteres[j]] = [caracteres[j], caracteres[i]];
  }

  return caracteres.join('');
}

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
      // 🔥 CAMBIO: Agregamos 'requiere_cambio' a los atributos que consultamos de la base de datos
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
    if (!usuario.rol || !usuario.rol.activo) {
      return res.status(403).json({ ok: false, message: 'Tu rol de acceso está deshabilitado. Contacta al administrador.' });
    }

    // 5. Comprobar la contraseña encriptada
    const passwordValida = await bcrypt.compare(password, usuario.password);

    if (!passwordValida) {
      // Incrementa el contador de intentos fallidos
      const intentosActualizados = (usuario.intentos_fallidos || 0) + 1;
      const camposActualizar = { intentos_fallidos: intentosActualizados };

      // Al llegar al límite, bloquea la cuenta por BLOQUEO_DURACION_MS
      if (intentosActualizados >= MAX_INTENTOS_FALLIDOS) {
        camposActualizar.bloqueado_hasta = new Date(Date.now() + BLOQUEO_DURACION_MS);

        // Alerta de seguridad (fire-and-forget): no bloquea la respuesta al cliente
        transporter.sendMail({
          from: `"Estación SIROCE-65" <${process.env.EMAIL_USER}>`,
          to: process.env.EMAIL_USER,
          subject: "🔴 Alerta de Seguridad - Bloqueo de Cuenta SIROCE-65",
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
              </div>
              <div style="background-color: #f5f5f5; color: #777; text-align: center; padding: 15px; font-size: 12px;">
                Este es un aviso automático generado por el sistema SIROCE-65 de la estación.
              </div>
            </div>
          `,
        }).catch((error) => console.error('[AuthController.login] Error al enviar alerta de bloqueo:', error));
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

    const expiresIn  = parseInt(process.env.JWT_EXPIRES_IN) || 28800;
    const access_token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn });

    return res.status(200).json({
      ok            : true,
      access_token,
      expires_in    : expiresIn,
      rol           : usuario.rol.nombre,
      nombre_usuario: usuario.nombre_usuario,
      // 🔥 CAMBIO: Enviamos al frontend la instrucción de si debe o no cambiar la clave
      requiere_cambio: Boolean(usuario.requiere_cambio)
    });

  } catch (error) {
    console.error('[AuthController.login] Error:', error.message);
    return res.status(500).json({ ok: false, message: 'Error interno del servidor. Intente más tarde.' });
  }
};

// ────────────────────────────────────────────────────────────
//  POST /api/recuperar-password
// ────────────────────────────────────────────────────────────
const recuperarPassword = async (req, res) => {
  try {
    const { identificador } = req.body;

    if (!identificador) {
      return res.status(400).json({ ok: false, message: 'Proporcione un DPI o correo.' });
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

    // Genera 12 caracteres garantizando mayúscula, minúscula, número y especial (PASSWORD_REGEX)
    const passwordTemporal = generarPasswordTemporal();
    
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(passwordTemporal, salt);
    
    // 🔥 CAMBIO: Guardamos la nueva clave y encendemos la bandera de requerir cambio (1)
    await usuario.update({ password: passwordHash, requiere_cambio: 1 }); 

    await transporter.sendMail({
      from: `"Soporte SIROCE-65" <${process.env.EMAIL_USER}>`,
      to: process.env.EMAIL_USER, 
      subject: "🔐 Recuperación de Contraseña - SIROCE-65", 
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
              <p style="font-size: 16px; margin-top: 0; color: #1a1a1a;">Hola <strong>${usuario.nombre_usuario}</strong>,</p>
              <p style="font-size: 14px; line-height: 1.6; color: #555555;">Se ha solicitado un restablecimiento de contraseña para tu cuenta en el Sistema de Registro Operativo y Control de Emergencias.</p>
              <div style="background-color: #fafafa; border-left: 4px solid #c62828; border-radius: 0 4px 4px 0; padding: 20px; margin: 25px 0; text-align: center;">
                <p style="margin: 0; font-size: 12px; color: #777777; text-transform: uppercase; letter-spacing: 1.5px;">Tu contraseña temporal es</p>
                <p style="margin: 10px 0 0; font-size: 28px; font-weight: bold; color: #c62828; letter-spacing: 4px; font-family: monospace;">
                  ${passwordTemporal}
                </p>
              </div>
              <p style="font-size: 14px; line-height: 1.6; color: #555555; margin-bottom: 0;">Por motivos de seguridad, el sistema te solicitará cambiar esta clave temporal de forma obligatoria al iniciar sesión.</p>
            </div>
            <div style="background-color: #f8f9fa; padding: 20px; border-top: 1px solid #eeeeee; font-size: 12px; color: #999999; line-height: 1.5;">
              Este es un mensaje generado automáticamente por el servidor.<br>
              Si no solicitaste este cambio, comunícate con la comandancia de inmediato.
            </div>
          </div>
        </div>
      `,
    });

    return res.status(200).json({ ok: true, message: 'Instrucciones enviadas al correo registrado.' });

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
    
    // 🔥 CAMBIO: Guardamos la nueva clave definitiva y apagamos la bandera (0)
    await usuario.update({ password: passwordHash, requiere_cambio: 0 });

    return res.status(200).json({ ok: true, message: 'Contraseña actualizada correctamente.' });

  } catch (error) {
    console.error('[AuthCtrl.cambiarPassword]', error);
    return res.status(500).json({ ok: false, message: 'Error interno al cambiar la contraseña.' });
  }
};

module.exports = {
  login,
  recuperarPassword,
  cambiarPassword,
  updateMandatoryPassword
};