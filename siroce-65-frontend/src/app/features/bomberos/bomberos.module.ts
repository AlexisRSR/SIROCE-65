// src/app/features/bomberos/bomberos.module.ts
// ══════════════════════════════════════════════════════════════
//  BomberosModule — Módulo de gestión de personal (LAZY)
// ──────────────────────────────────────────════════════════════
//  Se carga solo al navegar a /bomberos, reduciendo el bundle
//  inicial de la aplicación.
//
//  Declara:
//    · BomberosListComponent  ← pantalla principal (tabla)
//    · BomberosFormComponent  ← modal de alta/edición
//
//  Importa todos los módulos de Angular Material necesarios
//  para las vistas de lista y formulario.
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
import { MatChipsModule }       from '@angular/material/chips';
import { MatDividerModule }     from '@angular/material/divider';
import { MatDatepickerModule }  from '@angular/material/datepicker';
import { MatNativeDateModule }  from '@angular/material/core';

// ── Routing y componentes ─────────────────────────────────────
import { BomberosRoutingModule }   from './bomberos-routing.module';
import { BomberosListComponent }   from './bomberos-list/bomberos-list.component';
import { BomberosFormComponent }   from './bomberos-form/bomberos-form.component';
import { MatExpansionModule } from '@angular/material/expansion';

// ── Array de módulos Material para legibilidad ────────────────
const BOMBEROS_MATERIAL = [
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
  MatChipsModule,
  MatDividerModule,
  MatDatepickerModule,
  MatNativeDateModule,
];

@NgModule({
  declarations: [
    // ⚠ standalone: false declarado en el @Component de cada uno
    BomberosListComponent,
    BomberosFormComponent,
  ],
  imports: [
    CommonModule,          // *ngIf, *ngFor, DatePipe, AsyncPipe
    ReactiveFormsModule,   // FormBuilder, FormGroup, Validators
    BomberosRoutingModule,
    MatExpansionModule,
    ...BOMBEROS_MATERIAL,
  ],
})
export class BomberosModule {}
