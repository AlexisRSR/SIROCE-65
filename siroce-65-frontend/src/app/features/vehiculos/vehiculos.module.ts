// src/app/features/vehiculos/vehiculos.module.ts
// ══════════════════════════════════════════════════════════════
//  VehiculosModule — Módulo de gestión de flotilla (LAZY)
// ──────────────────────────────────────────────────────────────
//  Carga solo cuando el usuario navega a /vehiculos.
//
//  Declara:
//    · VehiculosListComponent   ← tabla principal de unidades
//    · VehiculosFormComponent   ← modal de alta/edición
//
//  Nota: no requiere MatDatepickerModule (vehículos no tienen
//  campos de fecha en el formulario de esta fase).
// ══════════════════════════════════════════════════════════════
import { NgModule }            from '@angular/core';
import { CommonModule }        from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';

// ── Angular Material ──────────────────────────────────────────
import { MatTableModule }       from '@angular/material/table';
import { MatPaginatorModule }   from '@angular/material/paginator';
import { MatSortModule }        from '@angular/material/sort';
import { MatDialogModule }      from '@angular/material/dialog';
import { MatFormFieldModule }   from '@angular/material/form-field';
import { MatInputModule }       from '@angular/material/input';
import { MatSelectModule }      from '@angular/material/select';
import { MatButtonModule }      from '@angular/material/button';
import { MatIconModule }        from '@angular/material/icon';
import { MatCardModule }        from '@angular/material/card';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatSnackBarModule }    from '@angular/material/snack-bar';
import { MatTooltipModule }     from '@angular/material/tooltip';
import { MatDividerModule }     from '@angular/material/divider';

// ── Módulos del feature ───────────────────────────────────────
import { VehiculosRoutingModule }   from './vehiculos-routing.module';
import { VehiculosListComponent }   from './vehiculos-list/vehiculos-list.component';
import { VehiculosFormComponent }   from './vehiculos-form/vehiculos-form.component';

import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';

const VEHICULOS_MATERIAL = [
  MatTableModule,
  MatPaginatorModule,
  MatSortModule,
  MatDialogModule,
  MatFormFieldModule,
  MatInputModule,
  MatSelectModule,
  MatButtonModule,
  MatIconModule,
  MatCardModule,
  MatProgressBarModule,
  MatSnackBarModule,
  MatTooltipModule,
  MatDividerModule,
];

@NgModule({
  declarations: [
    // ⚠ standalone: false declarado en cada @Component
    VehiculosListComponent,
    VehiculosFormComponent,
  ],
  imports: [
    CommonModule,          // *ngIf, *ngFor, DecimalPipe, DatePipe
    ReactiveFormsModule,   // FormBuilder, Validators
    VehiculosRoutingModule,
    MatDatepickerModule, // 🔥 AGREGAR ESTO
    MatNativeDateModule,  //
    ...VEHICULOS_MATERIAL,
  ],
})
export class VehiculosModule {}
