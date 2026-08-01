// src/app/pages/servicios/servicios.component.ts
import { Component } from '@angular/core';

@Component({
  selector: 'app-servicios',
  standalone: false, // <--- AQUÍ ESTÁ LA LÍNEA AGREGADA
  template: `
    <div class="page-enter">
      <mat-card class="placeholder-card">
        <mat-card-header>
          <mat-icon mat-card-avatar style="color:#c62828;font-size:32px;width:32px;height:32px">local_fire_department</mat-icon>
          <mat-card-title>Módulo Emergencias / Servicios</mat-card-title>
          <mat-card-subtitle>Registro y despacho operativo</mat-card-subtitle>
        </mat-card-header>
        <mat-card-content>
          <p class="placeholder-msg">
            Este módulo implementará el registro de llamadas, asignación de unidades
            y seguimiento de emergencias activas.
            Consume el endpoint <code>GET /api/servicios</code> del backend.
          </p>
        </mat-card-content>
      </mat-card>
    </div>
  `,
  styles: [`
    .placeholder-card { background-color: var(--bg-card) !important; max-width: 560px; margin-top: 8px; }
    .placeholder-msg  { color: var(--text-dim); font-size: 14px; line-height: 1.6; margin-top: 12px; }
    code { color: var(--accent-warn); background: rgba(255,167,38,0.12); padding: 2px 6px; border-radius: 4px; font-size: 13px; }
  `],
})
export class ServiciosComponent {}