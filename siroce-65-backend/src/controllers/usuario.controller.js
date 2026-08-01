// src/controllers/usuario.controller.js
'use strict';

const bcrypt = require('bcryptjs');
// Importamos los modelos y la conexión a la base de datos para la transacción
const { Usuario, Persona, Rol } = require('../models');
const { sequelize } = require('../config/database');

// ── Obtener todos los usuarios para llenar la tabla ─────────────────────────
const obtenerUsuarios = async (req, res) => {
  try {
    const usuarios = await Usuario.findAll({
      include: [
        { 
          model: Rol, 
          as: 'rol', 
          attributes: ['nombre'] 
        },
        // Intentamos traer los datos de la persona asociada
        {
          model: Persona,
          as: 'persona', // Asegúrate de que este alias coincida con tu models/index.js
          attributes: ['NOMBRE', 'APELLIDO'],
          required: false // LEFT JOIN por si hay usuarios sin persona asociada
        }
      ],
      attributes: { exclude: ['password'] } // NUNCA enviamos contraseñas al frontend
    });
    
    // Mapeamos los datos para que el frontend los reciba bonitos y estructurados
    const usuariosFormateados = usuarios.map(u => ({
      id_usuario: u.id_usuario,
      
      // Mandamos el nombre y apellido exactos por separado
      nombre_persona: u.persona ? u.persona.NOMBRE : '',
      apellido_persona: u.persona ? u.persona.APELLIDO : '',
      
      nombreCompleto: u.persona ? `${u.persona.NOMBRE} ${u.persona.APELLIDO}` : u.nombre_usuario,
      usuario_sistema: u.nombre_usuario,
      dpi: u.dpi,
      rol: u.rol,
      activo: u.activo
    }));

    res.json(usuariosFormateados);
  } catch (error) {
    console.error('Error al obtener usuarios:', error);
    res.status(500).json({ error: 'Error interno del servidor al cargar el personal' });
  }
};

// ── Registrar un nuevo usuario y su perfil de persona (Transacción) ────────
const crearUsuario = async (req, res) => {
  // ESTO NOS DIRÁ EN LA TERMINAL EXACTAMENTE QUÉ DATOS LLEGAN
  console.log('DATOS RECIBIDOS EN BACKEND:', req.body);
  
  const t = await sequelize.transaction();

  try {
    const { nombre, apellido, dpi, rol, password, usuario } = req.body;

    // VALIDACIÓN: Si el rol es undefined, no podemos continuar
    if (!rol) {
      await t.rollback();
      return res.status(400).json({ error: 'El campo rol no fue enviado correctamente' });
    }

    // BUSCAR EL ROL
    const rolDB = await Rol.findOne({ where: { nombre: rol } });
    
    if (!rolDB) {
      await t.rollback();
      return res.status(400).json({ error: `No se encontró el rol: ${rol}` });
    }

    const salt = await bcrypt.genSalt(10);
    const passwordSegura = await bcrypt.hash(password, salt);

    const nuevoUsuario = await Usuario.create({
      nombre_usuario: usuario,
      password: passwordSegura,
      dpi: dpi,
      id_rol: rolDB.id_rol,
      activo: true,
      // 🔥 REQ-2.3: Toda contraseña insertada desde el panel de administración
      // fuerza el cambio obligatorio en el primer inicio de sesión.
      requiere_cambio: 1
    }, { transaction: t });

    await Persona.create({
      ID_USUARIO: nuevoUsuario.id_usuario,
      NOMBRE: nombre,
      APELLIDO: apellido,
      DPI: dpi
    }, { transaction: t });

    await t.commit();
    res.status(201).json({ mensaje: 'Operador registrado' });

  } catch (error) {
    await t.rollback(); // Siempre deshacemos la transacción primero
    
    // 🔥 SOLUCIÓN: Mensaje exacto para el DPI
    if (error.name === 'SequelizeUniqueConstraintError') {
      return res.status(400).json({ 
        error: 'El DPI ingresado ya existe en el sistema.' 
      });
    }

    // Si es otro tipo de error, mantenemos el 500
    console.error('Error al crear usuario:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

// ── Cambiar el estado del usuario (Activo / Inactivo) ────────
const cambiarEstado = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Buscamos al usuario por su ID (Primary Key)
    const usuario = await Usuario.findByPk(id);
    
    if (!usuario) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    // Invertimos el valor actual (Si es true pasa a false, si es false pasa a true)
    usuario.activo = !usuario.activo;
    await usuario.save();

    const estadoTexto = usuario.activo ? 'activado' : 'desactivado';
    res.json({ mensaje: `El usuario ha sido ${estadoTexto} exitosamente`, activo: usuario.activo });

  } catch (error) {
    console.error('Error al cambiar estado del usuario:', error);
    res.status(500).json({ error: 'Ocurrió un error al actualizar el estado del operador' });
  }
};

// ── Actualizar un usuario existente y su perfil (Transacción) ────────
const actualizarUsuario = async (req, res) => {
  const { id } = req.params;
  const t = await sequelize.transaction();

  try {
    const { nombre, apellido, dpi, rol, password, usuario } = req.body;

    // 1. Verificar si el usuario existe
    const usuarioDB = await Usuario.findByPk(id);
    if (!usuarioDB) {
      await t.rollback();
      return res.status(404).json({ error: 'Operador no encontrado en el sistema' });
    }

    // 2. Validar y buscar el Rol
    if (!rol) {
      await t.rollback();
      return res.status(400).json({ error: 'El campo rol es obligatorio' });
    }
    
    const rolDB = await Rol.findOne({ where: { nombre: rol } });
    if (!rolDB) {
      await t.rollback();
      return res.status(400).json({ error: `No se encontró el rol: ${rol}` });
    }

    // 3. Preparar datos para actualizar la tabla Usuario
    const datosUsuario = {
      nombre_usuario: usuario,
      dpi: dpi,
      id_rol: rolDB.id_rol
    };

    // 4. Si el administrador escribió una contraseña nueva, la encriptamos
    //    y forzamos el cambio obligatorio (REQ-2.3). Si la deja en blanco
    //    (conserva la actual), requiere_cambio no se toca.
    if (password && password.trim() !== '') {
      const salt = await bcrypt.genSalt(10);
      datosUsuario.password = await bcrypt.hash(password, salt);
      datosUsuario.requiere_cambio = 1;
    }

    // Actualizamos el usuario
    await usuarioDB.update(datosUsuario, { transaction: t });

    // 5. Actualizar la tabla Persona asociada
    const personaDB = await Persona.findOne({ where: { ID_USUARIO: id } });
    if (personaDB) {
      await personaDB.update({
        NOMBRE: nombre,
        APELLIDO: apellido,
        DPI: dpi
      }, { transaction: t });
    } else {
      // Salvavidas: Por si editaran al "admin" viejo que no tiene Persona asociada
      await Persona.create({
        ID_USUARIO: id,
        NOMBRE: nombre,
        APELLIDO: apellido,
        DPI: dpi
      }, { transaction: t });
    }

    await t.commit();
    res.status(200).json({ mensaje: 'Operador actualizado correctamente' });

  } catch (error) {
    await t.rollback(); // Deshacer transacción
    
    // 🔥 SOLUCIÓN: Mensaje exacto para el DPI
    if (error.name === 'SequelizeUniqueConstraintError') {
      return res.status(400).json({ 
        error: 'El DPI ingresado ya existe en el sistema.' 
      });
    }

    console.error('Error al actualizar usuario:', error);
    res.status(500).json({ error: 'Error interno del servidor al actualizar' });
  }
};

module.exports = {
  obtenerUsuarios,
  crearUsuario,
  cambiarEstado,
  actualizarUsuario
};