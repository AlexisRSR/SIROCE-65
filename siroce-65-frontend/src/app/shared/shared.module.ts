// src/app/shared/shared.module.ts
// ── Módulo Compartido ─────────────────────────────────────────
// Componentes reutilizables entre módulos que no comparten
// jerarquía (ej. AppModule y módulos lazy como AuthModule).
import { NgModule }        from '@angular/core';
import { CommonModule }    from '@angular/common';
import { RouterModule }    from '@angular/router';
import { MatIconModule }   from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatTooltipModule } from '@angular/material/tooltip';

import { PublicHeaderComponent } from '../layout/public-header/public-header.component';

@NgModule({
  declarations: [
    PublicHeaderComponent,
  ],
  imports: [
    CommonModule,
    RouterModule,
    MatIconModule,
    MatButtonModule,
    MatTooltipModule,
  ],
  exports: [
    PublicHeaderComponent,
  ],
})
export class SharedModule {}
