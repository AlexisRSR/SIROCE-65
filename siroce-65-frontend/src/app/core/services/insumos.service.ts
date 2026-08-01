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
//  │  TIPO_INSUMO        │  tipoInsumo                     │
//  │  STOCK              │  stock                          │
//  │  ESTADO             │  estado                         │
//  └─────────────────────┴─────────────────────────────────┘
//  El mapeo se realiza en el componente (subscribe de load()).
//  El payload de escritura (POST/PUT) usa InsumoPayload (MAYÚSC).
// ══════════════════════════════════════════════════════════════
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

// ════════════════════════════════════════════════════════════
//  INTERFACES DE DOMINIO
// ════════════════════════════════════════════════════════════

/**
 * Estructura RAW que devuelve el backend (MAYÚSCULAS).
 * Coincide 1:1 con las columnas de TB_INSUMOS.
 */
export interface InsumoRaw {
  ID_INSUMO  : number;
  NOMBRE     : string;
  DESCRIPCION: string;
  TIPO_INSUMO: string;   // 'Herramienta' | 'Médico' | 'Rescate'
  STOCK      : number;
  ESTADO     : string;   // 'Activo' | 'Bajo Stock' | 'Inactivo'
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
  tipoInsumo : string;
  stock      : number;
  estado     : string;
  marca?       : string;
  modelo?      : string;
  numeroSerie? : string;
  proposito?   : string;
}

/**
 * Payload para POST y PUT.
 * El backend Node.js espera los campos en MAYÚSCULAS.
 */
export interface InsumoPayload {
  NOMBRE     : string;
  DESCRIPCION: string;
  TIPO_INSUMO: string;
  STOCK      : number;
  ESTADO     : string;
  MARCA?       : string | null;
  MODELO?      : string | null;
  NUMERO_SERIE?: string | null;
  PROPOSITO?   : string | null;
}

/** Respuesta genérica del backend */
export interface ApiResponse<T> {
  ok      : boolean;
  data    : T;
  message?: string;
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
}
