import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface DashboardData {
  kpis: { 
    total: number; 
    enAtencion: number; 
    finalizadas: number;
    canceladas: number; // 🔥 NUEVO KPI (Falsas Alarmas)
    tiempoPromedioMinutos: number; 
  };
  graficoTipos: { tipo: string; cantidad: number }[];
  graficoFechasApilado: { fecha: string; detalle: any }[]; 
  graficoHoras: { hora: string; cantidad: number }[]; 
  graficoZonas?: { zona: string; cantidad: number }[]; // 🔥 PREPARADO PARA TOP ZONAS
}

export interface ApiResponse<T> {
  ok: boolean;
  data: T;
  message?: string;
}

@Injectable({ providedIn: 'root' })
export class EstadisticasService {
  private readonly API = environment.apiUrl;

  constructor(private http: HttpClient) {}

  getDashboard(fechaInicio?: string, fechaFin?: string): Observable<ApiResponse<DashboardData>> {
    let params = new HttpParams();
    if (fechaInicio) params = params.set('fechaInicio', fechaInicio);
    if (fechaFin) params = params.set('fechaFin', fechaFin);

    return this.http.get<ApiResponse<DashboardData>>(`${this.API}/estadisticas/dashboard`, { params });
  }
}