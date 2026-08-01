// src/app/core/services/vehiculos.service.ts
// ══════════════════════════════════════════════════════════════
//  VehiculosService — SIROCE-65
// ──────────────────────────────────────────────────────────────
//  Gestiona todas las peticiones HTTP del módulo de Vehículos.
//
//  Endpoints del backend Node.js/Sequelize:
//    getAll()    → GET    /api/vehiculos
//    getById()   → GET    /api/vehiculos/:id
//    create()    → POST   /api/vehiculos
//    update()    → PUT    /api/vehiculos/:id
//    delete()    → DELETE /api/vehiculos/:id
//    getTipos()  → GET    /api/tipos-vehiculo
//    getEstados()→ GET    /api/estados-vehiculo
//
//  A diferencia de Bomberos, Vehiculo es una entidad plana
//  (sin anidamiento en escritura) → no se necesita forkJoin.
//
//  Respuesta estándar del backend: { ok: boolean, data: T }
// ══════════════════════════════════════════════════════════════
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

// ════════════════════════════════════════════════════════════
//  INTERFACES DE DOMINIO
// ════════════════════════════════════════════════════════════

/** Catálogo de tipos de unidad (tabla TB_TIPO_VEHICULO) */
export interface TipoVehiculo {
  ID_TIPO_V: number;
  TIPO     : string;
}

/** Catálogo de estados operativos (tabla TB_ESTADO_VEHICULO) */
export interface EstadoVehiculo {
  ID_ESTADO_V: number;
  ESTADO     : string;
}

/**
 * Entidad Vehiculo / Unidad (tabla TB_VEHICULO).
 * El backend incluye los objetos relacionados como:
 * tipoVehiculo  → alias definido en Sequelize as: 'tipoVehiculo'
 * estadoVehiculo → alias definido en Sequelize as: 'estadoVehiculo'
 */
export interface Vehiculo {
  ID_VEHICULO?       : number;
  NUMERO_UNIDAD?     : string;
  MARCA              : string;
  MODELO             : string;
  ANIO?              : number | null; // 🔥 NUEVO CAMPO (Normalización 1NF)
  PLACA              : string;
  ID_TIPO_V?         : number;
  ID_ESTADO_V?       : number;
  KILOMETRAJE_ACTUAL?: number;
  FECHA_INGRESO?     : string; 
  OBSERVACIONES?     : string; 
  CHASIS?            : string | null; // 🔥 NUEVO CAMPO (Auditoría)
  MOTOR?             : string | null; // 🔥 NUEVO CAMPO (Auditoría)

  // Objetos relacionados incluidos por Sequelize (GET)
  tipoVehiculo?  : TipoVehiculo;
  estadoVehiculo?: EstadoVehiculo;
}

/**
 * Payload del formulario de alta/edición.
 * Estructura plana que el backend acepta en POST y PUT.
 */
export interface VehiculoFormData {
  NUMERO_UNIDAD      : string; 
  MARCA              : string;
  MODELO             : string;
  ANIO?              : number | null; // 🔥 NUEVO CAMPO
  PLACA              : string;
  KILOMETRAJE_ACTUAL : number;
  ID_TIPO_V          : number;
  ID_ESTADO_V        : number;
  FECHA_INGRESO?     : string | null; 
  OBSERVACIONES?     : string | null; 
  CHASIS?            : string | null; // 🔥 NUEVO CAMPO
  MOTOR?             : string | null; // 🔥 NUEVO CAMPO
}

/** Respuesta genérica del backend Node.js */
export interface ApiResponse<T> {
  ok      : boolean;
  data    : T;
  message?: string;
}

// ════════════════════════════════════════════════════════════
//  SERVICIO
// ════════════════════════════════════════════════════════════
@Injectable({ providedIn: 'root' })
export class VehiculosService {

  private readonly API = environment.apiUrl;

  constructor(private http: HttpClient) {}

  // ── CRUD principal ────────────────────────────────────────

  /** Lista todas las unidades con tipoVehiculo y estadoVehiculo incluidos */
  getAll(): Observable<ApiResponse<Vehiculo[]>> {
    return this.http.get<ApiResponse<Vehiculo[]>>(`${this.API}/vehiculos`);
  }

  /** Obtiene una unidad por su ID */
  getById(id: number): Observable<ApiResponse<Vehiculo>> {
    return this.http.get<ApiResponse<Vehiculo>>(`${this.API}/vehiculos/${id}`);
  }

  /**
   * Registra una nueva unidad.
   * Body: Incluye los campos base más ANIO, CHASIS y MOTOR.
   */
  create(formData: VehiculoFormData): Observable<ApiResponse<Vehiculo>> {
    return this.http.post<ApiResponse<Vehiculo>>(
      `${this.API}/vehiculos`,
      formData,
    );
  }

  /**
   * Actualiza una unidad existente.
   * Más simple que Bomberos: un solo PUT (sin forkJoin).
   */
  update(id: number, formData: VehiculoFormData): Observable<ApiResponse<Vehiculo>> {
    return this.http.put<ApiResponse<Vehiculo>>(
      `${this.API}/vehiculos/${id}`,
      formData,
    );
  }

  /** Elimina una unidad (la BD bloqueará si tiene servicios asociados) */
  delete(id: number): Observable<ApiResponse<{ message: string }>> {
    return this.http.delete<ApiResponse<{ message: string }>>(
      `${this.API}/vehiculos/${id}`,
    );
  }

  // ── Catálogos (para los selects del formulario) ───────────

  /** Lista los tipos de unidad disponibles */
  getTipos(): Observable<ApiResponse<TipoVehiculo[]>> {
    return this.http.get<ApiResponse<TipoVehiculo[]>>(`${this.API}/tipos-vehiculo`);
  }

  /** Lista los estados operativos disponibles */
  getEstados(): Observable<ApiResponse<EstadoVehiculo[]>> {
    return this.http.get<ApiResponse<EstadoVehiculo[]>>(`${this.API}/estados-vehiculo`);
  }
}