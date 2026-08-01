// src/app/features/tipos-emergencias/tipos-emergencias.module.ts
// ══════════════════════════════════════════════════════════════
//  TiposEmergenciasModule — Catálogo de tipos de emergencia (LAZY)
// ──────────────────────────────────────────────────────────────
//  Carga solo al navegar a /tipos-emergencias.
//  Declara:
//    · TiposEmergenciasListComponent  ← tabla principal
//    · TiposEmergenciasFormComponent  ← modal de alta/edición
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

// ── Feature ───────────────────────────────────────────────────
import { TiposEmergenciasRoutingModule }   from './tipos-emergencias-routing.module';
import { TiposEmergenciasListComponent }   from './tipos-emergencias-list/tipos-emergencias-list.component';
import { TiposEmergenciasFormComponent }   from './tipos-emergencias-form/tipos-emergencias-form.component';

const TE_MATERIAL = [
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
    TiposEmergenciasListComponent,
    TiposEmergenciasFormComponent,
  ],
  imports: [
    CommonModule,
    ReactiveFormsModule,
    TiposEmergenciasRoutingModule,
    ...TE_MATERIAL,
  ],
})
export class TiposEmergenciasModule {}
