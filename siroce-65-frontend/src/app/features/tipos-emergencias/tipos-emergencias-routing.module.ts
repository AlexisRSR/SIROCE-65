// src/app/features/tipos-emergencias/tipos-emergencias-routing.module.ts
// ══════════════════════════════════════════════════════════════
//  TiposEmergenciasRoutingModule
// ──────────────────────────────────────────────────────────────
//  Ruta ''  →  TiposEmergenciasListComponent
//  (El prefijo '/tipos-emergencias' lo define app-routing.module.ts)
// ══════════════════════════════════════════════════════════════
import { NgModule }             from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { TiposEmergenciasListComponent } from './tipos-emergencias-list/tipos-emergencias-list.component';

const routes: Routes = [
  { path: '', component: TiposEmergenciasListComponent },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class TiposEmergenciasRoutingModule {}
