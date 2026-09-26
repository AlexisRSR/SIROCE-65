// controllers/bomberoController.js
// ── Controlador del Módulo de Personal / Bomberos ────────────
// Gestiona las entidades TB_PERSONAS y TB_BOMBERO.
// Incluye un método especial `createBomberoCompleto` que registra
// a una Persona y su perfil de Bombero en una sola transacción.
'use strict';

const { Op, fn, col, where } = require('sequelize');
const { sequelize }   = require('../config/database.js');
const {
  Bombero,
  Persona,
  GradoBombero,
  EstadoBombero,
  CargoBombero,
  Usuario,
  DetalleBombero,
} = require('../models');
const { registrarBitacora } = require('../helpers/bitacoraHelper');

// ════════════════════════════════════════════════════════════
//  Helpers de respuesta estandarizados
// ════════════════════════════════════════════════════════════
const ok   = (res, data, status = 200)  => res.status(status).json({ ok: true,  data });
const fail = (res, message, status = 500) => res.status(status).json({ ok: false, message });

// 🔥 Restricción de unicidad lógica del DPI (columna TRIM-eada para no dejar
// pasar espacios en los extremos). excludeId permite que una persona se guarde
// a sí misma sin auto-bloquearse al actualizar.
const buscarDuplicadoPorDPI = async (dpi, excludeId = null) => {
  if (!dpi || !String(dpi).trim()) return null;
  const dpiNormalizado = String(dpi).trim();
  const condicionDpi = where(fn('TRIM', col('DPI')), dpiNormalizado);
  const condiciones = excludeId
    ? { [Op.and]: [condicionDpi, { ID_PERSONA: { [Op.ne]: excludeId } }] }
    : condicionDpi;
  return Persona.findOne({ where: condiciones });
};

// ── Include reutilizable para Bombero completo ────────────────
// Trae: datos personales → datos de usuario → grado → estado operativo → cargo
const INCLUDE_BOMBERO_COMPLETO = [
  {
    model  : Persona,
    as     : 'persona',
    include: [
      {
        model     : Usuario,
        as        : 'usuario',
        attributes: ['id_usuario', 'nombre_usuario', 'id_rol'], // solo lo necesario
      },
    ],
  },
  { model: GradoBombero,  as: 'grado'  },
  { model: EstadoBombero, as: 'estado' },
  { model: CargoBombero,  as: 'cargo'  }, // 🔥 3NF: reemplaza el antiguo CARGO de texto libre
];


// ════════════════════════════════════════════════════════════
//  MÓDULO PERSONA — CRUD (TB_PERSONAS)
// ════════════════════════════════════════════════════════════

/**
 * GET /api/personas
 * Retorna todas las personas con su usuario vinculado.
 */
const getAllPersonas = async (req, res) => {
  try {
    const personas = await Persona.findAll({
      include: [
        {
          model     : Usuario,
          as        : 'usuario',
          attributes: ['id_usuario', 'nombre_usuario'],
        },
      ],
      order: [['APELLIDO', 'ASC'], ['NOMBRE', 'ASC']],
    });
    return ok(res, personas);
  } catch (error) {
    console.error('[BomberoCtrl.getAllPersonas]', error.message);
    return fail(res, 'Error al obtener personas.');
  }
};

/**
 * GET /api/personas/:id
 * Retorna una persona por su ID_PERSONA con usuario vinculado.
 */
const getPersonaById = async (req, res) => {
  try {
    const persona = await Persona.findByPk(req.params.id, {
      include: [
        {
          model     : Usuario,
          as        : 'usuario',
          attributes: ['id_usuario', 'nombre_usuario'],
        },
      ],
    });
    if (!persona) return fail(res, `Persona con ID ${req.params.id} no encontrada.`, 404);
    return ok(res, persona);
  } catch (error) {
    console.error('[BomberoCtrl.getPersonaById]', error.message);
    return fail(res, 'Error al obtener la persona.');
  }
};

/**
 * POST /api/personas
 * Crea una nueva persona.
 * Body: { ID_USUARIO?, NOMBRE, APELLIDO, DPI, FECHA_NACIMIENTO, TELEFONO, DIRECCION }
 */
const createPersona = async (req, res) => {
  try {
    const { ID_USUARIO, NOMBRE, APELLIDO, DPI, FECHA_NACIMIENTO, TELEFONO, DIRECCION } = req.body;

    if (!NOMBRE || !APELLIDO) {
      return fail(res, 'Los campos NOMBRE y APELLIDO son obligatorios.', 400);
    }

    const duplicadoDPI = await buscarDuplicadoPorDPI(DPI);
    if (duplicadoDPI) {
      return fail(res, 'Ya existe un bombero registrado con este número de DPI.', 400);
    }

    const nuevaPersona = await Persona.create({
      ID_USUARIO, NOMBRE, APELLIDO, DPI, FECHA_NACIMIENTO, TELEFONO, DIRECCION,
    });

    return ok(res, nuevaPersona, 201);
  } catch (error) {
    console.error('[BomberoCtrl.createPersona]', error.message);
    return fail(res, 'Error al crear la persona.');
  }
};

/**
 * PUT /api/personas/:id
 * Actualiza los datos de una persona existente.
 * Body: campos a modificar (parcial o total).
 */
const updatePersona = async (req, res) => {
  try {
    const persona = await Persona.findByPk(req.params.id);
    if (!persona) return fail(res, `Persona con ID ${req.params.id} no encontrada.`, 404);

    if (req.body.DPI !== undefined) {
      const duplicadoDPI = await buscarDuplicadoPorDPI(req.body.DPI, persona.ID_PERSONA);
      if (duplicadoDPI) {
        return fail(res, 'Ya existe un bombero registrado con este número de DPI.', 400);
      }
    }

    await persona.update(req.body);
    return ok(res, persona);
  } catch (error) {
    console.error('[BomberoCtrl.updatePersona]', error.message);
    return fail(res, 'Error al actualizar la persona.');
  }
};

/**
 * DELETE /api/personas/:id
 * Elimina una persona (solo si no tiene un Bombero asociado).
 */
const deletePersona = async (req, res) => {
  try {
    const persona = await Persona.findByPk(req.params.id);
    if (!persona) return fail(res, `Persona con ID ${req.params.id} no encontrada.`, 404);

    await persona.destroy();
    return ok(res, { message: `Persona ID ${req.params.id} eliminada correctamente.` });
  } catch (error) {
    // FK constraint activo → la BD protege el historial
    if (error.name === 'SequelizeForeignKeyConstraintError') {
      return fail(res, 'No se puede eliminar: la persona tiene un perfil de Bombero asociado.', 409);
    }
    console.error('[BomberoCtrl.deletePersona]', error.message);
    return fail(res, 'Error al eliminar la persona.');
  }
};


// ════════════════════════════════════════════════════════════
//  MÓDULO BOMBERO — CRUD (TB_BOMBERO)
// ════════════════════════════════════════════════════════════

/**
 * GET /api/bomberos
 * Retorna todos los bomberos con persona, usuario, grado y estado.
 */
const getAllBomberos = async (req, res) => {
  try {
    const bomberos = await Bombero.findAll({
      include: INCLUDE_BOMBERO_COMPLETO,
      order  : [[ { model: Persona, as: 'persona' }, 'APELLIDO', 'ASC' ]],
    });
    return ok(res, bomberos);
  } catch (error) {
    console.error('[BomberoCtrl.getAllBomberos]', error.message);
    return fail(res, 'Error al obtener el listado de bomberos.');
  }
};

/**
 * GET /api/bomberos/activos
 * Retorna SOLO los bomberos operativos para el módulo de despacho.
 */
const getBomberosActivos = async (req, res) => {
  try {
    const bomberos = await Bombero.findAll({
      include: INCLUDE_BOMBERO_COMPLETO,
      where: {
        '$estado.ESTADO$': ['Activo', 'En Turno'] // Filtro directo en BD
      },
      order  : [[ { model: Persona, as: 'persona' }, 'APELLIDO', 'ASC' ]],
    });
    return ok(res, bomberos);
  } catch (error) {
    console.error('[BomberoCtrl.getBomberosActivos]', error.message);
    // Tolerancia a fallos
    const todos = await Bombero.findAll({ include: INCLUDE_BOMBERO_COMPLETO });
    return ok(res, todos);
  }
};

/**
 * GET /api/bomberos/:id
 * Retorna un bombero específico con todos sus datos relacionados.
 */
const getBomberoById = async (req, res) => {
  try {
    const bombero = await Bombero.findByPk(req.params.id, {
      include: INCLUDE_BOMBERO_COMPLETO,
    });
    if (!bombero) return fail(res, `Bombero con ID ${req.params.id} no encontrado.`, 404);
    return ok(res, bombero);
  } catch (error) {
    console.error('[BomberoCtrl.getBomberoById]', error.message);
    return fail(res, 'Error al obtener el bombero.');
  }
};

/**
 * POST /api/bomberos
 * Crea un nuevo perfil de Bombero vinculando una Persona ya existente.
 * Body: { ID_PERSONA, ID_GRADO, ID_ESTADO_B, FECHA_INGRESO }
 */
const createBombero = async (req, res) => {
  try {
    const { ID_PERSONA, ID_GRADO, ID_ESTADO_B, FECHA_INGRESO } = req.body;

    if (!ID_PERSONA) {
      return fail(res, 'El campo ID_PERSONA es obligatorio.', 400);
    }

    // Verificar que la persona existe antes de asignarla
    const personaExiste = await Persona.findByPk(ID_PERSONA);
    if (!personaExiste) {
      return fail(res, `No existe una Persona con ID ${ID_PERSONA}.`, 404);
    }

    const nuevoBombero = await Bombero.create({
      ID_PERSONA, ID_GRADO, ID_ESTADO_B, FECHA_INGRESO,
    });

    // Recargar con todos los datos relacionados para la respuesta
    const bomberoCompleto = await Bombero.findByPk(nuevoBombero.ID_BOMBERO, {
      include: INCLUDE_BOMBERO_COMPLETO,
    });

    // 📝 REGISTRO EN BITÁCORA
    const idUsuarioToken = req.usuario?.id_usuario || req.user?.id_usuario || null;
    await registrarBitacora(idUsuarioToken, `[BOMBEROS] - Creó el perfil de bombero para ${personaExiste.NOMBRE} ${personaExiste.APELLIDO}`);

    return ok(res, bomberoCompleto, 201);
  } catch (error) {
    console.error('[BomberoCtrl.createBombero]', error.message);
    return fail(res, 'Error al crear el perfil de bombero.');
  }
};

/**
 * POST /api/bomberos/completo
 * Crea una Persona Y su perfil de Bombero en una sola operación atómica.
 * Usa transacción para garantizar consistencia (si una falla, ambas revierten).
 *
 * Body:
 * {
 *   "persona"  : { NOMBRE, APELLIDO, DPI, FECHA_NACIMIENTO, TELEFONO, DIRECCION, ID_USUARIO? },
 *   "bombero"  : { ID_GRADO, ID_ESTADO_B, FECHA_INGRESO }
 * }
 */
const createBomberoCompleto = async (req, res) => {
  const t = await sequelize.transaction();
  try {
    const { persona, bombero } = req.body;

    if (!persona || !bombero) {
      await t.rollback();
      return fail(res, 'Se requieren los objetos "persona" y "bombero" en el cuerpo.', 400);
    }
    if (!persona.NOMBRE || !persona.APELLIDO) {
      await t.rollback();
      return fail(res, 'La persona debe tener NOMBRE y APELLIDO.', 400);
    }

    const duplicadoDPI = await buscarDuplicadoPorDPI(persona.DPI);
    if (duplicadoDPI) {
      await t.rollback();
      return fail(res, 'Ya existe un bombero registrado con este número de DPI.', 400);
    }

    // 1. Crear la Persona dentro de la transacción
    const nuevaPersona = await Persona.create(persona, { transaction: t });

    // 2. Crear el Bombero usando el ID_PERSONA recién generado
    const nuevoBombero = await Bombero.create(
      { ...bombero, ID_PERSONA: nuevaPersona.ID_PERSONA },
      { transaction: t }
    );

    // 3. Confirmar la transacción
    await t.commit();

    // 📝 REGISTRO EN BITÁCORA
    const idUsuarioToken = req.usuario?.id_usuario || req.user?.id_usuario || null;
    await registrarBitacora(idUsuarioToken, `[BOMBEROS] - Creó el bombero ${nuevaPersona.NOMBRE} ${nuevaPersona.APELLIDO}`);

    return ok(res, { persona: nuevaPersona, bombero: nuevoBombero }, 201);
  } catch (error) {
    await t.rollback(); // Revertir todo si algo falla
    console.error('[BomberoCtrl.createBomberoCompleto]', error.message);
    return fail(res, 'Error al registrar el bombero. Operación revertida.');
  }
};

/**
 * PUT /api/bomberos/:id
 * Actualiza el grado, estado o fecha de ingreso de un bombero.
 * Body: { ID_GRADO?, ID_ESTADO_B?, FECHA_INGRESO? }
 */
const updateBombero = async (req, res) => {
  try {
    const bombero = await Bombero.findByPk(req.params.id);
    if (!bombero) return fail(res, `Bombero con ID ${req.params.id} no encontrado.`, 404);

    // 🔥 ACTUALIZACIÓN EXPLÍCITA Y SEGURA
    // Le decimos exactamente qué campos queremos que sobreescriba en la BD.
    bombero.ID_GRADO = req.body.ID_GRADO !== undefined ? req.body.ID_GRADO : bombero.ID_GRADO;
    // 🔥 3NF: ID_CARGO reemplaza al antiguo CARGO de texto libre
    bombero.ID_CARGO = req.body.ID_CARGO !== undefined ? req.body.ID_CARGO : bombero.ID_CARGO;
    bombero.ID_ESTADO_B = req.body.ID_ESTADO_B !== undefined ? req.body.ID_ESTADO_B : bombero.ID_ESTADO_B;
    bombero.FECHA_INGRESO = req.body.FECHA_INGRESO !== undefined ? req.body.FECHA_INGRESO : bombero.FECHA_INGRESO;
    bombero.TURNO = req.body.TURNO !== undefined ? req.body.TURNO : bombero.TURNO;

    // Guardamos los cambios físicamente
    await bombero.save();

    // Devolver con todos los datos relacionados actualizados
    const bomberoActualizado = await Bombero.findByPk(bombero.ID_BOMBERO, {
      include: INCLUDE_BOMBERO_COMPLETO,
    });

    // 📝 REGISTRO EN BITÁCORA
    const idUsuarioToken = req.usuario?.id_usuario || req.user?.id_usuario || null;
    const nombreBombero = bomberoActualizado.persona
      ? `${bomberoActualizado.persona.NOMBRE} ${bomberoActualizado.persona.APELLIDO}`
      : `#${bomberoActualizado.ID_BOMBERO}`;
    await registrarBitacora(idUsuarioToken, `[BOMBEROS] - Actualizó datos del bombero ${nombreBombero}`);

    return ok(res, bomberoActualizado);
  } catch (error) {
    console.error('[BomberoCtrl.updateBombero]', error.message);
    return fail(res, 'Error al actualizar el bombero.');
  }
};

/**
 * DELETE /api/bomberos/:id
 * Elimina el perfil de Bombero (la Persona asociada se conserva).
 */
const deleteBombero = async (req, res) => {
  try {
    const bombero = await Bombero.findByPk(req.params.id, {
      include: [{ model: Persona, as: 'persona' }],
    });
    if (!bombero) return fail(res, `Bombero con ID ${req.params.id} no encontrado.`, 404);

    const nombreBombero = bombero.persona
      ? `${bombero.persona.NOMBRE} ${bombero.persona.APELLIDO}`
      : `#${bombero.ID_BOMBERO}`;

    // 🔥 Integridad referencial: no se borra un bombero con historial operativo
    // (participación en emergencias vía detalle_bombero) — se debe dar de baja, no eliminar.
    const tieneHistorial = await DetalleBombero.count({ where: { id_bombero: bombero.ID_BOMBERO } });
    if (tieneHistorial > 0) {
      return fail(res, 'No se puede eliminar: tiene historial operativo. Cámbielo a estado De Baja.', 400);
    }

    await bombero.destroy();

    // 📝 REGISTRO EN BITÁCORA
    const idUsuarioToken = req.usuario?.id_usuario || req.user?.id_usuario || null;
    await registrarBitacora(idUsuarioToken, `[BOMBEROS] - Eliminó el bombero ${nombreBombero}`);

    return ok(res, { message: `Bombero ID ${req.params.id} eliminado correctamente.` });
  } catch (error) {
    console.error('[BomberoCtrl.deleteBombero]', error.message);
    return fail(res, 'Error al eliminar el bombero.');
  }
};


// ════════════════════════════════════════════════════════════
//  CATÁLOGOS — Solo lectura (para poblar selects del frontend)
// ════════════════════════════════════════════════════════════

/** GET /api/grados — Lista todos los grados disponibles */
const getGrados = async (req, res) => {
  try {
    const grados = await GradoBombero.findAll({ order: [['GRADO', 'ASC']] });
    return ok(res, grados);
  } catch (error) {
    return fail(res, 'Error al obtener los grados.');
  }
};

/** GET /api/estados-bombero — Lista todos los estados de bombero */
const getEstadosBombero = async (req, res) => {
  try {
    const estados = await EstadoBombero.findAll({ order: [['ESTADO', 'ASC']] });
    return ok(res, estados);
  } catch (error) {
    return fail(res, 'Error al obtener los estados de bombero.');
  }
};

/** GET /api/cargos-bombero — Lista todos los cargos/funciones disponibles (🔥 3NF) */
const getCargosBombero = async (req, res) => {
  try {
    const cargos = await CargoBombero.findAll({ order: [['CARGO', 'ASC']] });
    return ok(res, cargos);
  } catch (error) {
    return fail(res, 'Error al obtener los cargos de bombero.');
  }
};


// ════════════════════════════════════════════════════════════
//  EXPORTS
// ════════════════════════════════════════════════════════════
module.exports = {
  // Persona
  getAllPersonas,
  getPersonaById,
  createPersona,
  updatePersona,
  deletePersona,
  // Bombero
  getAllBomberos,          // <--- ESTA ES LA QUE FALTABA
  getBomberosActivos,      // <--- LA NUEVA QUE AGREGAMOS
  getBomberoById,
  createBombero,
  createBomberoCompleto,
  updateBombero,
  deleteBombero,
  // Catálogos
  getGrados,
  getEstadosBombero,
  getCargosBombero,
};
