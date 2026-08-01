// src/app/features/bomberos/bomberos-routing.module.ts
// ══════════════════════════════════════════════════════════════
//  BomberosRoutingModule — Rutas del módulo Bomberos
// ──────────────────────────────────────────────────────────────
//  Ruta ''  →  BomberosListComponent
//  (El prefijo '/bomberos' lo define app-routing.module.ts)
// ══════════════════════════════════════════════════════════════
import { NgModule }             from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { BomberosListComponent } from './bomberos-list/bomberos-list.component';

const routes: Routes = [
  {
    path     : '',
    component: BomberosListComponent,
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class BomberosRoutingModule {}
