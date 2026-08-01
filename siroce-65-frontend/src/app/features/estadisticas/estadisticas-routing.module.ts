import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { EstadisticasDashboardComponent } from './estadisticas-dashboard/estadisticas-dashboard.component';

const routes: Routes = [
  {
    path: '',
    component: EstadisticasDashboardComponent
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class EstadisticasRoutingModule { }