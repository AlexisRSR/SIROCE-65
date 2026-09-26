// src/app/core/services/servicios.service.ts
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface TipoServicioItem {
  ID_TIPO_S    : number;
  TIPO_SERVICIO: string;
}

// 🔥 3NF: una fila real por víctima atendida (tabla tb_pacientes)
export interface PacienteRaw {
  ID_PACIENTE?    : number;
  ID_SERVICIO?    : number;
  NOMBRE_PACIENTE : string | null;
  EDAD_PACIENTE   : number | null;
  FALLECIDO       : string | null;
  ACOMPANANTE?    : string | null;
  LUGAR_TRASLADO? : string | null;
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
  CARGO?     : string;
  TURNO?     : string;
  persona?   : { NOMBRE: string; APELLIDO: string };
  grado?     : { GRADO : string };
  estado?    : { ESTADO: string };
}

// 🔥 3NF: unidad/personal destacado ya no son texto libre — vienen del JOIN
// con detalle_vehiculo / detalle_bombero. El bombero incluye la bandera `es_piloto`
// anidada bajo el nombre del modelo pivote (DetalleBombero), tal como la serializa Sequelize.
export interface VehiculoAsignadoRaw extends VehiculoDisponible {}
export interface BomberoAsignadoRaw extends BomberoDisponible {
  DetalleBombero?: { es_piloto: boolean };
}

// 🔥 3NF: bombero que firma el Vo.Bo. del informe (reemplaza al marcador de texto [FIRMA VOBO])
export interface FirmaVoboRaw {
  ID_BOMBERO: number;
  persona?  : { NOMBRE: string; APELLIDO: string };
  cargo?    : { ID_CARGO: number; CARGO: string };
}

export interface ServicioRaw {
  ID_SERVICIO        : number;
  ID_TIPO_SERVICIO   : number;
  DESCRIPCION        : string;
  FECHA_SERVICIO     : string;
  ESTADO?            : string;
  DIRECCION_SERVICIO : string;
  NOMBRE_SOLICITANTE : string;
  TELEFONO_SOLICITANTE: string;
  HORA_SALIDA?       : string;
  HORA_ENTRADA?      : string;
  OBSERVACIONES_FINALES? : string | null;
  // 🔥 3NF: reemplazan a los marcadores de texto [CANCELADO...]/[FIRMA VOBO...]
  ES_FALSA_ALARMA?    : boolean;
  MOTIVO_CANCELACION? : string | null;
  ID_FIRMA_VOBO?      : number | null;
  firmaVobo?          : FirmaVoboRaw | null;
  // 🔥 3NF: nuevo JSON anidado que trae el backend
  pacientes?         : PacienteRaw[];
  vehiculosAsignados?: VehiculoAsignadoRaw[];
  bomberosAsignados? : BomberoAsignadoRaw[];
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
  nombreSolicitante : string;
  telefonoSolicitante: string;
  tipoServicioNombre: string;
  estado            : 'Pendiente' | 'En Atención' | 'Finalizada';
  horaSalida?       : string;
  horaEntrada?      : string;
  // 🔥 Campos mapeados para Angular, derivados del JSON anidado (pacientes/vehiculosAsignados/bomberosAsignados)
  pacientes?            : PacienteRaw[];
  nombrePaciente?       : string | null;
  edadPaciente?         : number | null;
  fallecido?            : string | null;
  acompanante?          : string | null;
  lugarTraslado?        : string | null;
  unidadDestacada?      : string | null;
  piloto?               : string | null;
  personalDestacado?    : string | null;
  vehiculosAsignados?   : VehiculoAsignadoRaw[];
  bomberosAsignados?    : BomberoAsignadoRaw[];
  observacionesFinales? : string | null;
  // 🔥 3NF: reemplazan a los marcadores de texto [CANCELADO...]/[FIRMA VOBO...]
  motivoCancelado?      : string | null;
  jefeTurno?            : string;
  idFirmaVobo?          : number | null;
}

// 🔥 3NF: paciente tal como lo arma el formulario, listo para enviar al backend
export interface PacientePayload {
  NOMBRE_PACIENTE : string | null;
  EDAD_PACIENTE   : number | null;
  FALLECIDO       : string;
  ACOMPANANTE?    : string | null;
  LUGAR_TRASLADO? : string | null;
}

export interface ServicioPayload {
  ID_TIPO_SERVICIO  : number;
  DESCRIPCION       : string;
  FECHA_SERVICIO    : string;
  DIRECCION_SERVICIO: string;
  NOMBRE_SOLICITANTE: string;
  TELEFONO_SOLICITANTE: string;
  ESTADO?               : string;
  // 🔥 3NF: los pacientes viajan como arreglo anidado, ya no como columnas planas
  PACIENTES?             : PacientePayload[];
  OBSERVACIONES_FINALES? : string | null;
  // 🔥 3NF: reemplazan a los marcadores de texto [CANCELADO...]/[FIRMA VOBO...]
  ES_FALSA_ALARMA?       : boolean;
  MOTIVO_CANCELACION?    : string | null;
  ID_FIRMA_VOBO?         : number | null;
}

// 🔥 El bombero destacado ahora puede marcarse como piloto de la unidad
export interface BomberoAsignado {
  id_bombero: number;
  es_piloto : boolean;
}

export interface AsignacionPayload {
  vehiculos: number[];
  bomberos : BomberoAsignado[];
}

export interface AsignacionResponse {
  vehiculos: number[];
  bomberos : number[];
  pilotoId : number | null;
  ocupados : { vehiculos: number[]; bomberos: number[] };
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

  getAsignaciones(idServicio: number): Observable<ApiResponse<AsignacionResponse>> {
    return this.http.get<ApiResponse<AsignacionResponse>>(`${this.API}/servicios/${idServicio}/asignaciones`);
  }

  cambiarEstadoOperativo(idServicio: number, accion: 'SALIDA' | 'ENTRADA'): Observable<ApiResponse<any>> {
    return this.http.put<ApiResponse<any>>(`${this.API}/servicios/${idServicio}/estado`, { accion });
  }
}