// src/app/features/insumos/insumos.module.ts
// ══════════════════════════════════════════════════════════════
//  InsumosModule — Herramientas, Médico y Rescate (LAZY)
//  ✅ standalone: false declarado en cada @Component
// ══════════════════════════════════════════════════════════════
import { NgModule }            from '@angular/core';
import { CommonModule }        from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';

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
import { MatChipsModule }       from '@angular/material/chips';

import { InsumosRoutingModule }  from './insumos-routing.module';
import { InsumosListComponent }  from './insumos-list/insumos-list.component';
import { InsumosFormComponent }  from './insumos-form/insumos-form.component';

@NgModule({
  declarations: [
    InsumosListComponent,   // standalone: false ✅
    InsumosFormComponent,   // standalone: false ✅
  ],
  imports: [
    CommonModule,
    ReactiveFormsModule,
    InsumosRoutingModule,
    MatTableModule, MatPaginatorModule, MatSortModule,
    MatDialogModule, MatFormFieldModule, MatInputModule,
    MatSelectModule, MatButtonModule, MatIconModule,
    MatCardModule, MatProgressBarModule, MatSnackBarModule,
    MatTooltipModule, MatDividerModule, MatChipsModule,
  ],
})
export class InsumosModule {}
