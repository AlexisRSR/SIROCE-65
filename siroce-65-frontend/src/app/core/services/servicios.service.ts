// src/app/core/services/servicios.service.ts
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface TipoServicioItem {
  ID_TIPO_S    : number;
  TIPO_SERVICIO: string;
}

export interface ServicioRaw {
  ID_SERVICIO        : number;
  ID_TIPO_SERVICIO   : number;
  DESCRIPCION        : string;
  FECHA_SERVICIO     : string;
  DIRECCION_SERVICIO : string;
  ID_SOLICITANTE     : number;
  NOMBRE_SOLICITANTE : string;   
  TELEFONO_SOLICITANTE: string;  
  HORA_SALIDA?       : string; 
  HORA_ENTRADA?      : string; 
  // 🔥 Aceptamos explícitamente null en los campos de cierre
  NOMBRE_PACIENTE?       : string | null;
  EDAD_PACIENTE?         : number | null;
  FALLECIDO?             : string | null;
  ACOMPANANTE?           : string | null;
  LUGAR_TRASLADO?        : string | null;
  UNIDAD_DESTACADA?      : string | null;
  PILOTO?                : string | null;
  PERSONAL_DESTACADO?    : string | null;
  OBSERVACIONES_FINALES? : string | null;
  tipoServicio?      : {
    ID_TIPO_S    : number;
    TIPO_SERVICIO: string;
  };
}

export interface Servicio {
  id                : number;
  idTipoServicio    : number;
  descripcion       : string;
  fechaServicio     : string;
  direccionServicio : string;
  idSolicitante     : number;
  nombreSolicitante : string;     
  telefonoSolicitante: string;    
  tipoServicioNombre: string;
  estado            : 'Pendiente' | 'En Atención' | 'Finalizada'; 
  horaSalida?       : string; 
  horaEntrada?      : string; 
  // 🔥 Campos mapeados para Angular con soporte a null
  nombrePaciente?       : string | null;
  edadPaciente?         : number | null;
  fallecido?            : string | null;
  acompanante?          : string | null;
  lugarTraslado?        : string | null;
  unidadDestacada?      : string | null;
  piloto?               : string | null;
  personalDestacado?    : string | null;
  observacionesFinales? : string | null;
}

export interface ServicioPayload {
  ID_TIPO_SERVICIO  : number;
  DESCRIPCION       : string;
  FECHA_SERVICIO    : string;
  DIRECCION_SERVICIO: string;
  ID_SOLICITANTE    : number;
  NOMBRE_SOLICITANTE: string;    
  TELEFONO_SOLICITANTE: string;  
  // 🔥 Soporte a null en el Payload (lo que enviamos al backend)
  NOMBRE_PACIENTE?       : string | null;
  EDAD_PACIENTE?         : number | null;
  FALLECIDO?             : string | null;
  ACOMPANANTE?           : string | null;
  LUGAR_TRASLADO?        : string | null;
  UNIDAD_DESTACADA?      : string | null;
  PILOTO?                : string | null;
  PERSONAL_DESTACADO?    : string | null;
  OBSERVACIONES_FINALES? : string | null;
}

export interface VehiculoDisponible {
  ID_VEHICULO    : number;
  PLACA          : string;
  MARCA          : string;
  MODELO         : string;
  KILOMETRAJE_ACTUAL?: number;
  tipoVehiculo?  : { ID_TIPO_V: number; TIPO : string };
  estadoVehiculo?: { ID_ESTADO_V: number; ESTADO: string };
}

export interface BomberoDisponible {
  ID_BOMBERO : number;
  FECHA_INGRESO?: string;
  persona?   : { NOMBRE: string; APELLIDO: string };
  grado?     : { GRADO : string };
  estado?    : { ESTADO: string };
}

export interface AsignacionPayload {
  vehiculos: number[];
  bomberos : number[];
}

export interface ApiResponse<T> {
  ok      : boolean;
  data    : T;
  message?: string;
}

@Injectable({ providedIn: 'root' })
export class ServiciosService {

  private readonly API = environment.apiUrl;

  constructor(private http: HttpClient) {}

  getAll(): Observable<ApiResponse<ServicioRaw[]>> {
    return this.http.get<ApiResponse<ServicioRaw[]>>(`${this.API}/servicios`);
  }

  getById(id: number): Observable<ApiResponse<ServicioRaw>> {
    return this.http.get<ApiResponse<ServicioRaw>>(`${this.API}/servicios/${id}`);
  }

  create(payload: ServicioPayload): Observable<ApiResponse<ServicioRaw>> {
    return this.http.post<ApiResponse<ServicioRaw>>(`${this.API}/servicios`, payload);
  }

  update(id: number, payload: ServicioPayload): Observable<ApiResponse<ServicioRaw>> {
    return this.http.put<ApiResponse<ServicioRaw>>(`${this.API}/servicios/${id}`, payload);
  }

  delete(id: number): Observable<ApiResponse<{ message: string }>> {
    return this.http.delete<ApiResponse<{ message: string }>>(`${this.API}/servicios/${id}`);
  }

  getTipos(): Observable<ApiResponse<TipoServicioItem[]>> {
    return this.http.get<ApiResponse<TipoServicioItem[]>>(`${this.API}/tipos-servicio`);
  }
  // 🔥 FIX: Volvemos a las rutas maestras que sabemos que SÍ traen los datos completos
  getVehiculosDisponibles() {
    return this.http.get<any>(`${this.API}/vehiculos`);
  }

  getBomberosActivos() {
    return this.http.get<any>(`${this.API}/bomberos`);
  }
  
  asignarRecursos(idServicio: number, payload: AsignacionPayload): Observable<ApiResponse<any>> {
    return this.http.post<ApiResponse<any>>(`${this.API}/servicios/${idServicio}/asignaciones`, payload);
  }

  getAsignaciones(idServicio: number): Observable<ApiResponse<AsignacionPayload>> {
    return this.http.get<ApiResponse<AsignacionPayload>>(`${this.API}/servicios/${idServicio}/asignaciones`);
  }

  cambiarEstadoOperativo(idServicio: number, accion: 'SALIDA' | 'ENTRADA'): Observable<ApiResponse<any>> {
    return this.http.put<ApiResponse<any>>(`${this.API}/servicios/${idServicio}/estado`, { accion });
  }
}