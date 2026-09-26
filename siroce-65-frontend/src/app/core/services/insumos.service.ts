// src/app/core/services/insumos.service.ts
// ══════════════════════════════════════════════════════════════
//  InsumosService — SIROCE-65
// ──────────────────────────────────────────────────────────────
//  Gestiona todas las peticiones HTTP del módulo de Insumos.
//
//  ARQUITECTURA DE DATOS (clave para Cero 404):
//  ┌─────────────────────┬─────────────────────────────────┐
//  │  Backend (Node.js)  │  Frontend Angular (componente)  │
//  │  MAYÚSCULAS         │  minúsculas camelCase           │
//  ├─────────────────────┼─────────────────────────────────┤
//  │  InsumoRaw          │  Insumo                         │
//  │  ID_INSUMO          │  id                             │
//  │  NOMBRE             │  nombre                         │
//  │  DESCRIPCION        │  descripcion                    │
//  │  id_tipo_insumo     │  tipoInsumo                     │
//  │  STOCK              │  stock                          │
//  │  ESTADO             │  estado                         │
//  └─────────────────────┴─────────────────────────────────┘
//  🔥 id_tipo_insumo es la FK numérica real de TB_INSUMOS (1=Insumo
//  Médico, 2=EPP, 4=Herramienta — ver TIPOS en insumos-form.component.ts).
//  No existe una columna TIPO_INSUMO de texto en la tabla.
//  El mapeo se realiza en el componente (subscribe de load()).
//  El payload de escritura (POST/PUT) usa InsumoPayload (MAYÚSC).
// ══════════════════════════════════════════════════════════════
import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

// ════════════════════════════════════════════════════════════
//  INTERFACES DE DOMINIO
// ════════════════════════════════════════════════════════════

/**
 * Estructura RAW que devuelve el backend (MAYÚSCULAS).
 * Coincide 1:1 con las columnas reales de TB_INSUMOS (ver models/Insumo.js).
 */
export interface InsumoRaw {
  ID_INSUMO     : number;
  NOMBRE        : string;
  DESCRIPCION   : string;
  id_tipo_insumo: number | null;   // FK: 1=Insumo Médico, 2=EPP, 4=Herramienta
  MARCA         : string | null;
  MODELO        : string | null;
  NUMERO_SERIE  : string | null;
  PROPOSITO     : string | null;
  STOCK         : number;
  ESTADO        : string;   // 'Activo' | 'Bajo Stock' | 'En Reparación' | 'Prestado' | 'De Baja' | 'Inactivo'
}

/**
 * Modelo de dominio del frontend (camelCase).
 * Se genera mediante mapeo estricto desde InsumoRaw en el componente.
 * Las propiedades en minúsculas evitan colisiones y mejoran la legibilidad.
 */
export interface Insumo {
  id         : number;
  nombre     : string;
  descripcion: string;
  tipoInsumo : number | null;
  stock      : number;
  estado     : string;
  marca?       : string | null;
  modelo?      : string | null;
  numeroSerie? : string | null;
  proposito?   : string | null;
}

/**
 * Payload para POST y PUT.
 * El backend Node.js espera los campos en MAYÚSCULAS, salvo id_tipo_insumo
 * (la FK numérica se manda tal cual, en minúsculas — ver insumoController.js).
 */
export interface InsumoPayload {
  NOMBRE        : string;
  DESCRIPCION   : string;
  id_tipo_insumo: number;
  STOCK         : number;
  ESTADO        : string;
  MARCA?        : string | null;
  MODELO?       : string | null;
  NUMERO_SERIE? : string | null;
  PROPOSITO?    : string | null;
}

/** Respuesta genérica del backend */
export interface ApiResponse<T> {
  ok      : boolean;
  data    : T;
  message?: string;
}

/**
 * Fila del Historial de Consumo (GET /insumos/historial-consumo).
 * Coincide 1:1 con el agregado que arma insumoController.getHistorialConsumo.
 */
export interface HistorialConsumoRaw {
  id_insumo     : number;
  nombre        : string;
  id_tipo_insumo: number | null;
  estado        : string;
  cantidad_total: number;
}

// ════════════════════════════════════════════════════════════
//  SERVICIO
// ════════════════════════════════════════════════════════════
@Injectable({ providedIn: 'root' })
export class InsumosService {

  private readonly API = environment.apiUrl;

  constructor(private http: HttpClient) {}

  // ── GET todos ─────────────────────────────────────────────

  /** El componente recibe InsumoRaw[] y hace el mapeo estricto */
  getAll(): Observable<ApiResponse<InsumoRaw[]>> {
    return this.http.get<ApiResponse<InsumoRaw[]>>(`${this.API}/insumos`);
  }

  // ── GET por id ────────────────────────────────────────────

  getById(id: number): Observable<ApiResponse<InsumoRaw>> {
    return this.http.get<ApiResponse<InsumoRaw>>(`${this.API}/insumos/${id}`);
  }

  // ── POST crear ────────────────────────────────────────────

  /**
   * Envía InsumoPayload (MAYÚSCULAS) al backend.
   * El formulario construye este objeto antes de llamar al servicio.
   */
  create(payload: InsumoPayload): Observable<ApiResponse<InsumoRaw>> {
    return this.http.post<ApiResponse<InsumoRaw>>(
      `${this.API}/insumos`,
      payload,
    );
  }

  // ── PUT actualizar ────────────────────────────────────────

  update(id: number, payload: InsumoPayload): Observable<ApiResponse<InsumoRaw>> {
    return this.http.put<ApiResponse<InsumoRaw>>(
      `${this.API}/insumos/${id}`,
      payload,
    );
  }

  // ── DELETE eliminar ───────────────────────────────────────

  delete(id: number): Observable<ApiResponse<{ message: string }>> {
    return this.http.delete<ApiResponse<{ message: string }>>(
      `${this.API}/insumos/${id}`,
    );
  }

  // ── GET historial de consumo ──────────────────────────────

  /** Cantidad total consumida por insumo entre fechaInicio y fechaFin ('YYYY-MM-DD'). */
  getHistorialConsumo(fechaInicio: string, fechaFin: string): Observable<ApiResponse<HistorialConsumoRaw[]>> {
    const params = new HttpParams()
      .set('fechaInicio', fechaInicio)
      .set('fechaFin', fechaFin);

    return this.http.get<ApiResponse<HistorialConsumoRaw[]>>(
      `${this.API}/insumos/historial-consumo`,
      { params },
    );
  }
}
