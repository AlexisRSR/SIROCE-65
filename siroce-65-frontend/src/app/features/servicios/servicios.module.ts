// src/app/features/servicios/servicios.module.ts
import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';

import { ServiciosRoutingModule } from './servicios-routing.module';
import { ServiciosListComponent } from './servicios-list/servicios-list.component';
import { ServiciosFormComponent } from './servicios-form/servicios-form.component';
// 🔥 EL NUEVO COMPONENTE DE CLAUDE
import { ServiciosAsignacionComponent } from './servicios-asignacion/servicios-asignacion.component'; 

// Angular Material
import { MatCardModule } from '@angular/material/card';
import { MatTableModule } from '@angular/material/table';
import { MatPaginatorModule } from '@angular/material/paginator';
import { MatSortModule } from '@angular/material/sort';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatDialogModule } from '@angular/material/dialog';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { MatProgressBarModule } from '@angular/material/progress-bar';

// 🔥 EL MÓDULO PARA EL ACORDEÓN DESPLEGABLE (Guía Rápida)
import { MatExpansionModule } from '@angular/material/expansion';

// 🔥 LOS MÓDULOS DEL CALENDARIO (Que se habían borrado)
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';

// 🔥 LOS MÓDULOS NUEVOS PARA EL DESPACHO TÁCTICO
import { MatTabsModule } from '@angular/material/tabs';
import { MatListModule } from '@angular/material/list';

@NgModule({
  declarations: [
    ServiciosListComponent,
    ServiciosFormComponent,
    ServiciosAsignacionComponent
  ],
  imports: [
    CommonModule,
    ReactiveFormsModule,
    ServiciosRoutingModule,
    
    MatCardModule,
    MatTableModule,
    MatPaginatorModule,
    MatSortModule,
    MatIconModule,
    MatButtonModule,
    MatTooltipModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatDialogModule,
    MatSnackBarModule,
    MatProgressBarModule,
    
    MatExpansionModule, // 🔥 AQUÍ LO INYECTAMOS
    
    MatDatepickerModule,
    MatNativeDateModule,

    MatTabsModule,
    MatListModule
  ]
})
export class ServiciosModule { }