// src/app/features/estadisticas/estadisticas.module.ts
import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormsModule } from '@angular/forms';

import { EstadisticasRoutingModule } from './estadisticas-routing.module';
import { EstadisticasDashboardComponent } from './estadisticas-dashboard/estadisticas-dashboard.component';

// 🔥 IMPORTANTE: La librería de Gráficos
import { NgApexchartsModule } from 'ng-apexcharts';

// Angular Material (Para las tarjetas y el filtro de fechas)
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatProgressBarModule } from '@angular/material/progress-bar';

@NgModule({
  declarations: [
    EstadisticasDashboardComponent
  ],
  imports: [
    CommonModule,
    EstadisticasRoutingModule,
    ReactiveFormsModule,
    FormsModule,
    NgApexchartsModule, // ← ¡La magia de los gráficos!
    MatCardModule,
    MatIconModule,
    MatButtonModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatFormFieldModule,
    MatInputModule,
    MatProgressBarModule
  ]
})
export class EstadisticasModule { }