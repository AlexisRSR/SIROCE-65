// src/app/features/insumos/insumos-routing.module.ts
'use strict';
import { NgModule }             from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { InsumosListComponent } from './insumos-list/insumos-list.component';

const routes: Routes = [
  { path: '', component: InsumosListComponent },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class InsumosRoutingModule {}
