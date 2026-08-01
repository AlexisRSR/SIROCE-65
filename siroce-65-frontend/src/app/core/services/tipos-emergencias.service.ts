// src/app/core/services/tipos-emergencias.service.ts
// ══════════════════════════════════════════════════════════════
//  TiposEmergenciasService — SIROCE-65
// ──────────────────────────────────────────────────────────────
//  Gestiona todas las peticiones HTTP conectando con el 
//  endpoint real del backend Node.js: /api/tipos-servicio
// ══════════════════════════════════════════════════════════════
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export type Prioridad = 'Alta' | 'Media' | 'Baja';

export interface TipoEmergencia {
  id_tipo_emergencia?: number;
  nombre             : string;
  descripcion?       : string;
  prioridad?         : Prioridad;
  activo?            : boolean;
}

export interface TipoEmergencyFormData {
  nombre     : string;
  descripcion: string;
  prioridad  : Prioridad;
}

export interface ApiResponse<T> {
  ok       : boolean;
  data     : T;
  message?: string;
}

@Injectable({ providedIn: 'root' })
export class TiposEmergenciasService {

  private readonly API = environment.apiUrl;

  constructor(private http: HttpClient) {}

  /** Obtiene todos los tipos de emergencia apuntando a tipos-servicio */
  getAll(): Observable<ApiResponse<TipoEmergencia[]>> {
    return this.http.get<ApiResponse<TipoEmergencia[]>>(
      `${this.API}/tipos-servicio`,
    );
  }

  /** Obtiene un tipo por su ID */
  getById(id: number): Observable<ApiResponse<TipoEmergencia>> {
    return this.http.get<ApiResponse<TipoEmergencia>>(
      `${this.API}/tipos-servicio/${id}`,
    );
  }

  /** Registra un nuevo tipo de emergencia */
  create(formData: any): Observable<ApiResponse<TipoEmergencia>> {
    return this.http.post<ApiResponse<TipoEmergencia>>(
      `${this.API}/tipos-servicio`,
      formData,
    );
  }

  /** Actualiza un tipo existente */
  update(id: number, formData: any): Observable<ApiResponse<TipoEmergencia>> {
    return this.http.put<ApiResponse<TipoEmergencia>>(
      `${this.API}/tipos-servicio/${id}`,
      formData,
    );
  }

  /** Elimina un tipo de emergencia */
  delete(id: number): Observable<ApiResponse<{ message: string }>> {
    return this.http.delete<ApiResponse<{ message: string }>>(
      `${this.API}/tipos-servicio/${id}`,
    );
  }
}