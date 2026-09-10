// src/app/core/services/bitacora.service.ts
// ══════════════════════════════════════════════════════════════
//  BitacoraService — SIROCE-65
// ──────────────────────────────────────────────────────────────
//  Consume el log de auditoría (solo lectura, exclusivo ADMIN).
// ══════════════════════════════════════════════════════════════
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

/** Estructura RAW que devuelve el backend (columnas reales de `bitacora`). */
export interface BitacoraRaw {
  id_bitacora: number;
  descripcion: string;
  fecha      : string;
  hora       : string;
  id_usuario : number;
  usuario?   : { id_usuario: number; nombre_usuario: string } | null;
}

/** Respuesta genérica del backend */
export interface ApiResponse<T> {
  ok      : boolean;
  data    : T;
  message?: string;
}

@Injectable({ providedIn: 'root' })
export class BitacoraService {

  private readonly API = environment.apiUrl;

  constructor(private http: HttpClient) {}

  getAll(): Observable<ApiResponse<BitacoraRaw[]>> {
    return this.http.get<ApiResponse<BitacoraRaw[]>>(`${this.API}/bitacora`);
  }
}
