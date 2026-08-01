// middlewares/authMiddleware.js
// ── Interceptor de autenticación JWT ─────────────────────────
// Valida el token en TODAS las rutas protegidas.
// Uso: router.get('/ruta', authMiddleware, controlador)
//      O aplicado globalmente: app.use(authMiddleware)
'use strict';

const jwt = require('jsonwebtoken');

/**
 * Middleware que verifica el JWT enviado en el header:
 *   Authorization: Bearer <token>
 *
 * Si el token es válido, adjunta el payload decodificado
 * en `req.user` y llama a next().
 *
 * Si no, responde con HTTP 401 Unauthorized.
 */
const authMiddleware = (req, res, next) => {
  // 1. Extraer el header Authorization
  const authHeader = req.headers['authorization'];

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      ok     : false,
      message: 'Acceso denegado. Token no proporcionado o formato incorrecto.',
      hint   : 'Incluye el header: Authorization: Bearer <tu_token>',
    });
  }

  // 2. Separar "Bearer " del token real
  const token = authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({
      ok     : false,
      message: 'Acceso denegado. Token vacío.',
    });
  }

  try {
    // 3. Verificar firma y expiración
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // 4. Adjuntar payload al request para uso en controladores
    //    req.user = { id_usuario, nombre_usuario, id_rol, rol }
    req.user = decoded;

    next(); // ← Continúa al controlador
  } catch (error) {
    // Distinguir tipo de error JWT para mensajes más claros
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        ok     : false,
        message: 'Sesión expirada. Por favor, inicie sesión nuevamente.',
      });
    }

    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        ok     : false,
        message: 'Token inválido o manipulado.',
      });
    }

    // Cualquier otro error JWT
    return res.status(401).json({
      ok     : false,
      message: 'No autorizado.',
    });
  }
};

module.exports = authMiddleware;
