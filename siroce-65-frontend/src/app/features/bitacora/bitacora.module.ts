// src/app/features/bitacora/bitacora.module.ts
// ══════════════════════════════════════════════════════════════
//  BitacoraModule — Log de Auditoría, exclusivo ADMIN (LAZY)
//  ✅ standalone: false declarado en el @Component
// ══════════════════════════════════════════════════════════════
import { NgModule, LOCALE_ID }         from '@angular/core';
import { CommonModule, registerLocaleData } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';

// 🔥 DatePipe en español (formato "dd MMM yyyy" → "11 ago. 2026") — se
// registra y se provee LOCALE_ID solo aquí, sin afectar el resto de la app
// (que sigue en el locale por defecto), ya que este es un módulo lazy.
import localeEs from '@angular/common/locales/es';
registerLocaleData(localeEs, 'es');

import { MatTableModule }       from '@angular/material/table';
import { MatPaginatorModule }   from '@angular/material/paginator';
import { MatFormFieldModule }   from '@angular/material/form-field';
import { MatInputModule }       from '@angular/material/input';
import { MatButtonModule }      from '@angular/material/button';
import { MatIconModule }        from '@angular/material/icon';
import { MatCardModule }        from '@angular/material/card';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatSnackBarModule }    from '@angular/material/snack-bar';
import { MatDatepickerModule }  from '@angular/material/datepicker';
import { MatNativeDateModule }  from '@angular/material/core';
import { MatSelectModule }      from '@angular/material/select';

import { BitacoraRoutingModule }  from './bitacora-routing.module';
import { BitacoraListComponent }  from './bitacora-list/bitacora-list.component';

@NgModule({
  declarations: [
    BitacoraListComponent, // standalone: false ✅
  ],
  imports: [
    CommonModule,
    ReactiveFormsModule,
    BitacoraRoutingModule,
    MatTableModule, MatPaginatorModule,
    MatFormFieldModule, MatInputModule,
    MatButtonModule, MatIconModule,
    MatCardModule, MatProgressBarModule, MatSnackBarModule,
    MatDatepickerModule, MatNativeDateModule,
    MatSelectModule,
  ],
  providers: [
    { provide: LOCALE_ID, useValue: 'es' },
  ],
})
export class BitacoraModule {}
