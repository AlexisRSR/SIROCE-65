// src/app/features/servicios/servicios-routing.module.ts
import { NgModule }             from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { ServiciosListComponent } from './servicios-list/servicios-list.component';

const routes: Routes = [{ path: '', component: ServiciosListComponent }];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class ServiciosRoutingModule {}
