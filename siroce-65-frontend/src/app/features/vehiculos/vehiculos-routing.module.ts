// src/app/features/vehiculos/vehiculos-routing.module.ts
// ══════════════════════════════════════════════════════════════
//  VehiculosRoutingModule — Rutas internas del módulo Vehículos
// ──────────────────────────────────────────────────────────────
//  Ruta ''  →  VehiculosListComponent
//  (El prefijo '/vehiculos' lo define app-routing.module.ts)
// ══════════════════════════════════════════════════════════════
import { NgModule }             from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { VehiculosListComponent } from './vehiculos-list/vehiculos-list.component';

const routes: Routes = [
  { path: '', component: VehiculosListComponent },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class VehiculosRoutingModule {}
