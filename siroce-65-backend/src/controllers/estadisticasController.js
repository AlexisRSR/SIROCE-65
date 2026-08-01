// src/controllers/estadisticasController.js
'use strict';

const { Op } = require('sequelize');
const { Servicio, TipoServicio, Insumo, Vehiculo, Bombero } = require('../models');

const ok = (res, data, status = 200) => res.status(status).json({ ok: true, data });
const fail = (res, message, status = 500) => res.status(status).json({ ok: false, message });

/** GET /api/estadisticas/dashboard */
const getDashboardData = async (req, res) => {
  try {
    const { fechaInicio, fechaFin } = req.query;
    let whereClause = {};

    // 🔥 FIX 1: Obligamos a la base de datos a leer hasta el último segundo del día
    if (fechaInicio && fechaFin) {
      whereClause.FECHA_SERVICIO = { 
        [Op.between]: [
          `${fechaInicio} 00:00:00`, 
          `${fechaFin} 23:59:59`
        ] 
      };
    }

    // 1. Extraemos TODOS los servicios
    const servicios = await Servicio.findAll({
      where: whereClause,
      include: [{
        model: TipoServicio,
        as: 'tipoServicio',
        // 🔥 IMPORTANTE: Agregamos el campo de tu base de datos.
        // Si tu columna se llama diferente (ej. CLASIFICACION), cámbialo aquí abajo.
        attributes: ['TIPO_SERVICIO', 'CATEGORIA'] 
      }],
      order: [
        ['FECHA_SERVICIO', 'ASC'],
        ['HORA_SALIDA', 'ASC'] 
      ]
    });

    // 2. KPIs Básicos y Falsas Alarmas
    let canceladas = 0;
    let enAtencion = 0;
    let finalizadas = 0;

    servicios.forEach(s => {
      const obs = s.OBSERVACIONES_FINALES || '';
      if (obs.includes('[CANCELADO / FALSA ALARMA]')) {
        canceladas++;
      } else if (s.HORA_SALIDA && !s.HORA_ENTRADA) {
        enAtencion++;
      } else if (s.HORA_ENTRADA) {
        finalizadas++;
      }
    });

    const total = servicios.length;

    // Función súper segura para extraer la hora exacta de la DB
    const extractTimeHHMM = (horaRaw) => {
      if (!horaRaw) return '--:--';
      const str = String(horaRaw);
      // Busca exactamente el patrón HH:MM (ej. 13:57 o 08:30)
      const match = str.match(/\b([01]\d|2[0-3]):([0-5]\d)\b/);
      if (match) return match[0];
      return '--:--';
    };

    const getHourSafe = (timeVal) => {
      const hm = extractTimeHHMM(timeVal);
      if (hm === '--:--') return null;
      return parseInt(hm.split(':')[0], 10);
    };

    const getTimeMsSafe = (fecha, hora) => {
      const hm = extractTimeHHMM(hora);
      if (hm === '--:--') return NaN;
      const fechaStr = fecha instanceof Date ? fecha.toISOString().split('T')[0] : String(fecha).substring(0,10);
      return new Date(`${fechaStr}T${hm}:00`).getTime();
    };

    // 3. KPI Tiempo Promedio
    let totalMinutos = 0;
    let countTiempos = 0;
    servicios.forEach(s => {
      if (s.FECHA_SERVICIO && s.HORA_SALIDA && s.HORA_ENTRADA) {
        const salidaMs = getTimeMsSafe(s.FECHA_SERVICIO, s.HORA_SALIDA);
        const entradaMs = getTimeMsSafe(s.FECHA_SERVICIO, s.HORA_ENTRADA);
        if (!isNaN(salidaMs) && !isNaN(entradaMs)) {
          const diffMins = (entradaMs - salidaMs) / 60000;
          if (diffMins > 0) {
            totalMinutos += diffMins;
            countTiempos++;
          }
        }
      }
    });
    const tiempoPromedioMinutos = countTiempos > 0 ? Math.round(totalMinutos / countTiempos) : 0;

    // 4. Dona de Tipos
    const conteoTipos = {};
    servicios.forEach(s => {
      const tipo = s.tipoServicio ? s.tipoServicio.TIPO_SERVICIO : 'Desconocido';
      conteoTipos[tipo] = (conteoTipos[tipo] || 0) + 1;
    });
    const graficoTipos = Object.keys(conteoTipos).map(key => ({ tipo: key, cantidad: conteoTipos[key] }));

    // 🔥 5. Barras Agrupadas (Leyendo la Categoría Real de la BD)
    const fechasMap = {};
    servicios.forEach(s => {
      const fecha = s.FECHA_SERVICIO instanceof Date ? s.FECHA_SERVICIO.toISOString().split('T')[0] : String(s.FECHA_SERVICIO).substring(0,10);
      
      // Leemos la categoría que viene de tu tabla TipoServicio
      let categoriaBd = 'Emergencia'; 
      if (s.tipoServicio && s.tipoServicio.CATEGORIA) { // <-- Cambia CATEGORIA si tu columna se llama distinto
         categoriaBd = s.tipoServicio.CATEGORIA;
      }
      
      // Inicializamos el día en 0
      if (!fechasMap[fecha]) fechasMap[fecha] = { Emergencias: 0, Servicios: 0 };
      
      // Sumamos donde corresponde según tu formulario
      if (categoriaBd.toUpperCase().includes('SERVICIO')) {
         fechasMap[fecha].Servicios += 1;
      } else {
         fechasMap[fecha].Emergencias += 1;
      }
    });
    const graficoFechasApilado = Object.keys(fechasMap).map(fecha => ({ fecha, detalle: fechasMap[fecha] }));

    // 6. Horas Pico
    const horasMap = {};
    for(let i=0; i<24; i++) horasMap[i] = 0; 
    servicios.forEach(s => {
      if (s.HORA_SALIDA) {
        const horaNum = getHourSafe(s.HORA_SALIDA);
        if (horaNum !== null && !isNaN(horaNum)) horasMap[horaNum]++;
      }
    });
    const graficoHoras = Object.keys(horasMap).map(h => ({ hora: `${h}:00`, cantidad: horasMap[h] }));

    // 🔥 FIX 2: TOP 5 ZONAS DE RIESGO MÁS INTELIGENTE
    const conteoZonas = {};
    servicios.forEach(s => {
       if(s.DIRECCION_SERVICIO) {
         let zonaLimpia = s.DIRECCION_SERVICIO.toUpperCase();
         
         // Limpiamos referencias largas o comas inconsistentes
         zonaLimpia = zonaLimpia.split(',')[0];
         zonaLimpia = zonaLimpia.split(' SAN RAFAEL')[0];
         zonaLimpia = zonaLimpia.split(' ZONA')[0];
         zonaLimpia = zonaLimpia.trim();

         if (zonaLimpia.length > 30) zonaLimpia = zonaLimpia.substring(0, 30) + '...';
         
         if (zonaLimpia) {
           conteoZonas[zonaLimpia] = (conteoZonas[zonaLimpia] || 0) + 1;
         }
       }
    });
    const graficoZonas = Object.keys(conteoZonas)
      .map(z => ({ zona: z, cantidad: conteoZonas[z] }))
      .sort((a, b) => b.cantidad - a.cantidad)
      .slice(0, 5);


    // =========================================================
    // 7. LECTURA EXACTA: PERSONAL, VEHÍCULOS E INSUMOS
    // =========================================================
    
    // 7.1 ESTADO DE FUERZA (Personal)
    let estadoFuerza = [];
    try {
      const bomberos = await Bombero.findAll();
      const estadosMap = {};
      bomberos.forEach(b => {
        const estadoStr = b.ID_ESTADO_B === 1 ? 'Activos' :
                          b.ID_ESTADO_B === 2 ? 'Suspendidos' :
                          b.ID_ESTADO_B === 3 ? 'De Baja' : 'Otros';
        estadosMap[estadoStr] = (estadosMap[estadoStr] || 0) + 1;
      });
      estadoFuerza = Object.keys(estadosMap).map(e => ({ estado: e, cantidad: estadosMap[e] }));
    } catch (err) {
      console.warn('Advertencia: No se pudo cargar Bombero:', err.message);
    }

    // 7.2 FLOTA VEHICULAR
    let estadoFlota = [];
    try {
      const vehiculos = await Vehiculo.findAll(); 
      estadoFlota = vehiculos.map(v => {
        const estadoStr = v.ID_ESTADO_V === 1 ? 'Disponible' :
                          v.ID_ESTADO_V === 2 ? 'En Servicio' :
                          v.ID_ESTADO_V === 3 ? 'En Mantenimiento' : 
                          v.ID_ESTADO_V === 4 ? 'Fuera de Servicio' : 'Desconocido';
        return {
          nombre: `${v.MARCA || ''} ${v.MODELO || ''}`.trim() || 'Unidad sin nombre',
          placa: v.PLACA || 'Sin Placa',
          estado: estadoStr,
          idEstado: v.ID_ESTADO_V || 0
        };
      });
    } catch (err) {
      console.warn('Advertencia: No se pudo cargar Vehiculo:', err.message);
    }

    // 7.3 INVENTARIO CRÍTICO
    let insumosCriticos = [];
    try {
      const insumos = await Insumo.findAll();
      insumosCriticos = insumos.map(i => ({
        nombre: i.NOMBRE || 'Insumo sin nombre', 
        cantidad: i.STOCK || 0
      }))
      .filter(i => i.cantidad <= 20)
      .sort((a, b) => a.cantidad - b.cantidad)
      .slice(0, 5);
    } catch (err) {
      console.warn('Advertencia: No se pudo cargar Insumo:', err.message);
    }

    // 🔥 FIX 3: ACTIVIDAD RECIENTE (Extrae hora limpia usando Regex)
    const actividadReciente = [...servicios].reverse().slice(0, 4).map(s => {
      const fechaStr = s.FECHA_SERVICIO instanceof Date ? s.FECHA_SERVICIO.toISOString().split('T')[0] : String(s.FECHA_SERVICIO).substring(0,10);
      
      let estadoStr = 'Pendiente';
      const obs = s.OBSERVACIONES_FINALES || '';
      
      if (obs.includes('[CANCELADO / FALSA ALARMA]')) {
         estadoStr = 'Cancelada';
      } else if (s.HORA_SALIDA && !s.HORA_ENTRADA) {
         estadoStr = 'En Atención';
      } else if (s.HORA_ENTRADA) {
         estadoStr = 'Finalizada';
      }

      return {
        tipo: s.tipoServicio ? s.tipoServicio.TIPO_SERVICIO : 'Emergencia',
        fecha: fechaStr,
        hora: extractTimeHHMM(s.HORA_SALIDA), // Usamos la nueva función ultra-segura
        direccion: s.DIRECCION_SERVICIO || 'Sin dirección',
        estado: estadoStr
      };
    });

    // 8. Respuesta Final
    return ok(res, {
      kpis: { total, enAtencion, finalizadas, canceladas, tiempoPromedioMinutos },
      graficoTipos,
      graficoFechasApilado,
      graficoHoras,
      graficoZonas, 
      estadoFuerza, 
      estadoFlota,
      insumosCriticos,
      actividadReciente 
    });

  } catch (error) {
    console.error('[EstadisticasCtrl.getDashboardData]', error);
    return fail(res, 'Error al generar la inteligencia de negocios.');
  }
};

module.exports = { getDashboardData };