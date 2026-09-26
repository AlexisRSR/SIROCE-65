// src/helpers/insumoHelper.js
// ── Regla de negocio: el ESTADO operativo de un insumo se deriva de su STOCK,
// con un umbral de "Bajo Stock" que depende de la clasificación (id_tipo_insumo)
// — 5 motosierras es inventario sano, 5 pares de guantes es alerta real.
// Única fuente de verdad, usada por insumoController.js (crear/editar) y
// servicioController.js (descuento/restauración de insumos por servicio).
'use strict';

// IDs de id_tipo_insumo, iguales a los que usa el frontend (TIPOS en
// insumos-form.component.ts) y alertaService.js (TIPO_INSUMO_LABELS):
//   1 = Insumo Médico / Consumible · 4 = Herramienta de Rescate · 2 = EPP
const UMBRAL_BAJO_STOCK_POR_TIPO = {
  1: 10, // Insumo Médico / Consumible
  4: 3,  // Herramienta de Rescate
  2: 3,  // Equipo de Protección (EPP)
};
const UMBRAL_BAJO_STOCK_DEFAULT = 10;

// 🔥 Estados que el operador asigna manualmente y que NUNCA se deben pisar
// con el cálculo automático por stock (una herramienta prestada o en
// reparación no deja de estarlo solo porque su stock cambió).
const ESTADOS_MANUALES = ['En Reparación', 'Prestado'];

const obtenerUmbralBajoStock = (idTipoInsumo) => {
  return UMBRAL_BAJO_STOCK_POR_TIPO[Number(idTipoInsumo)] ?? UMBRAL_BAJO_STOCK_DEFAULT;
};

const calcularEstadoPorStock = (stock, idTipoInsumo) => {
  const stockNum = Number(stock) || 0;
  const umbral = obtenerUmbralBajoStock(idTipoInsumo);
  if (stockNum >= umbral) return 'Activo';
  if (stockNum > 0) return 'Bajo Stock';
  return 'De Baja';
};

// Punto único de decisión: si el ESTADO recibido es uno manual explícito, se
// respeta tal cual; en cualquier otro caso (incluido vacío) se recalcula del stock.
const calcularEstadoFinal = (estadoRecibido, stock, idTipoInsumo) => {
  if (ESTADOS_MANUALES.includes(estadoRecibido)) return estadoRecibido;
  return calcularEstadoPorStock(stock, idTipoInsumo);
};

module.exports = { ESTADOS_MANUALES, obtenerUmbralBajoStock, calcularEstadoPorStock, calcularEstadoFinal };
