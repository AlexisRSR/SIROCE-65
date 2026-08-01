// src/app/core/services/bomberos.service.ts
// ══════════════════════════════════════════════════════════════
//  BomberosService — SIROCE-65
// ──────────────────────────────────────────────────────────────
//  Gestiona todas las peticiones HTTP del módulo de Bomberos:
//    · getAll()               → GET  /api/bomberos
//    · getById()              → GET  /api/bomberos/:id
//    · createCompleto()       → POST /api/bomberos/completo
//    · updateBomberoCompleto()→ PUT  /api/personas/:id
//                               PUT  /api/bomberos/:id   (forkJoin)
//    · delete()               → DELETE /api/bomberos/:id
//    · getGrados()            → GET  /api/grados
//    · getEstados()           → GET  /api/estados-bombero
//
//  Todas las respuestas del backend Node.js tienen el formato:
//    { ok: boolean, data: T | T[] | { message: string } }
// ══════════════════════════════════════════════════════════════
import { Injectable }              from '@angular/core';
import { HttpClient }              from '@angular/common/http';
import { Observable }              from 'rxjs';
import { forkJoin }                from 'rxjs';
import { environment }             from '../../../environments/environment';

// ════════════════════════════════════════════════════════════
//  INTERFACES DE DOMINIO
// ════════════════════════════════════════════════════════════

/** Persona vinculada al bombero (tabla TB_PERSONAS) */
export interface Persona {
  ID_PERSONA?      : number;
  ID_USUARIO?      : number;
  NOMBRE           : string;
  APELLIDO         : string;
  DPI?             : string;
  FECHA_NACIMIENTO?: string;
  TELEFONO?        : string;
  DIRECCION?       : string;
  CORREO?          : string; // 🔥 NUEVO CAMPO AÑADIDO
}

/** Catálogo de grados/rangos (TB_GRADO_BOMBERO) */
export interface GradoBombero {
  ID_GRADO: number;
  GRADO   : string;
}

/** Catálogo de estados operativos (TB_ESTADO_BOMBERO) */
export interface EstadoBombero {
  ID_ESTADO_B: number;
  ESTADO     : string;
}

/**
 * Entidad principal del módulo.
 * El backend devuelve los objetos relacionados (persona, grado, estado)
 * embebidos en el mismo objeto gracias al include de Sequelize.
 */
export interface Bombero {
  ID_BOMBERO?   : number;
  ID_PERSONA?   : number;
  ID_GRADO?     : number;
  CARGO?        : string; //
  ID_ESTADO_B?  : number;
  FECHA_INGRESO?: string;
  TURNO?        : string; // 🔥 NUEVO CAMPO AÑADIDO

  // Relaciones incluidas en la respuesta del GET
  persona?: Persona;
  grado?  : GradoBombero;
  estado? : EstadoBombero;
}

/** Payload para el endpoint POST /api/bomberos/completo */
export interface CreateBomberoPayload {
  persona: Omit<Persona, 'ID_PERSONA' | 'ID_USUARIO'>;
  bombero: {
    ID_GRADO     : number;
    CARGO?       : string; //
    ID_ESTADO_B  : number;
    FECHA_INGRESO: string;
    TURNO        : string; // 🔥 NUEVO CAMPO AÑADIDO
  };
}

/**
 * Datos del formulario de alta/edición (estructura plana).
 * El servicio se encarga de transformarlos al formato de la API.
 */
export interface BomberoFormData {
  NOMBRE       : string;
  APELLIDO     : string;
  DPI          : string; //
  TELEFONO?    : string;
  CORREO       : string; // 🔥 NUEVO CAMPO AÑADIDO
  FECHA_INGRESO: string;
  ID_GRADO     : number;
  CARGO        : string; //
  ID_ESTADO_B  : number;
  TURNO        : string; // 🔥 NUEVO CAMPO AÑADIDO
}

/** Respuesta estándar del backend Node.js */
export interface ApiResponse<T> {
  ok     : boolean;
  data   : T;
  message?: string;
}

// ════════════════════════════════════════════════════════════
//  SERVICIO
// ════════════════════════════════════════════════════════════
@Injectable({ providedIn: 'root' })
export class BomberosService {

  private readonly API = environment.apiUrl;

  constructor(private http: HttpClient) {}

  // ── Bomberos ─────────────────────────────────────────────

  /** Obtiene todos los bomberos con persona, grado y estado incluidos */
  getAll(): Observable<ApiResponse<Bombero[]>> {
    return this.http.get<ApiResponse<Bombero[]>>(`${this.API}/bomberos`);
  }

  /** Obtiene un bombero por su ID_BOMBERO */
  getById(id: number): Observable<ApiResponse<Bombero>> {
    return this.http.get<ApiResponse<Bombero>>(`${this.API}/bomberos/${id}`);
  }

  /**
   * Crea una Persona + Bombero en una sola transacción atómica.
   * Endpoint: POST /api/bomberos/completo
   */
  createCompleto(payload: CreateBomberoPayload): Observable<ApiResponse<{ persona: Persona; bombero: Bombero }>> {
    return this.http.post<ApiResponse<{ persona: Persona; bombero: Bombero }>>(
      `${this.API}/bomberos/completo`,
      payload,
    );
  }

  /**
   * Actualiza los datos de un bombero (grado, estado, fecha).
   * Envía DOS peticiones en paralelo con forkJoin:
   * 1. PUT /api/personas/:idPersona → actualiza NOMBRE, APELLIDO, TELEFONO y CORREO
   * 2. PUT /api/bomberos/:idBombero → actualiza grado, estado, fecha y turno
   */
  updateBomberoCompleto(
    idPersona: number,
    idBombero: number,
    formData : BomberoFormData,
  ): Observable<[ApiResponse<Persona>, ApiResponse<Bombero>]> {

    const personaUpdate$ = this.http.put<ApiResponse<Persona>>(
      `${this.API}/personas/${idPersona}`,
      {
        NOMBRE  : formData.NOMBRE,
        APELLIDO: formData.APELLIDO,
        DPI     : formData.DPI, //
        TELEFONO: formData.TELEFONO ?? '',
        CORREO  : formData.CORREO, // 🔥 AHORA SÍ ENVIAMOS EL CORREO AL BACKEND
      },
    );

    const bomberoUpdate$ = this.http.put<ApiResponse<Bombero>>(
      `${this.API}/bomberos/${idBombero}`,
      {
        ID_GRADO     : formData.ID_GRADO,
        CARGO        : formData.CARGO, //
        ID_ESTADO_B  : formData.ID_ESTADO_B,
        FECHA_INGRESO: formData.FECHA_INGRESO,
        TURNO        : formData.TURNO, // 🔥 AHORA SÍ ENVIAMOS EL TURNO AL BACKEND
      },
    );

    return forkJoin([personaUpdate$, bomberoUpdate$]);
  }

  /** Elimina un bombero por su ID_BOMBERO */
  delete(id: number): Observable<ApiResponse<{ message: string }>> {
    return this.http.delete<ApiResponse<{ message: string }>>(`${this.API}/bomberos/${id}`);
  }

  // ── Catálogos ─────────────────────────────────────────────

  /** Lista los grados/rangos disponibles (para el Select del formulario) */
  getGrados(): Observable<ApiResponse<GradoBombero[]>> {
    return this.http.get<ApiResponse<GradoBombero[]>>(`${this.API}/grados`);
  }

  /** Lista los estados operativos (para el Select del formulario) */
  getEstados(): Observable<ApiResponse<EstadoBombero[]>> {
    return this.http.get<ApiResponse<EstadoBombero[]>>(`${this.API}/estados-bombero`);
  }
}