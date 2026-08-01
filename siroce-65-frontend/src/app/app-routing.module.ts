// src/app/app-routing.module.ts
import { NgModule }             from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { MainLayoutComponent }  from './layout/main-layout/main-layout.component';
import { HomeComponent }        from './pages/home/home.component';
import { LandingPageComponent } from './pages/landing-page/landing-page.component';
import { AuthGuard }            from './core/guards/auth.guard';
import { RoleGuard }            from './core/guards/role.guard';

// 🔥 1. IMPORTAMOS TU NUEVO COMPONENTE AQUÍ
import { GestionUsuariosComponent } from './features/usuarios/gestion-usuarios/gestion-usuarios.component';

const routes: Routes = [
  // 🔥 Portal público (Landing Page) — ruta raíz, sin sidebar ni autenticación
  {
    path     : '',
    component: LandingPageComponent,
    pathMatch: 'full',
  },

  {
    path     : '',
    component: MainLayoutComponent,
    canActivate: [AuthGuard],
    children : [
      { path: 'home',       component: HomeComponent      },

      // 🔥 2. NUEVA RUTA: Módulo de Gestión de Usuarios (SOLO ADMIN)
      { 
        path: 'gestion-usuarios', 
        component: GestionUsuariosComponent,
        canActivate: [RoleGuard], // <-- ¡AQUÍ ESTÁ EL CANDADO DEL GUARD!
        data: { roles: ['ADMIN'] } // Define qué roles pueden entrar
      },
      
      // Módulo de Bomberos (Fase 5)
      { 
        path: 'bomberos', 
        loadChildren: () => import('./features/bomberos/bomberos.module').then(m => m.BomberosModule) 
      },

      // Módulo de Vehículos (Fase 6)
      { 
        path: 'vehiculos', 
        loadChildren: () => import('./features/vehiculos/vehiculos.module').then(m => m.VehiculosModule) 
      },

      // Módulo de Tipos de Emergencias (Fase 7)
      { 
        path: 'tipos-emergencias', 
        loadChildren: () => import('./features/tipos-emergencias/tipos-emergencias.module').then(m => m.TiposEmergenciasModule) 
      },
      
      // Módulo de Insumos (Fase 8)
      { 
        path: 'insumos', 
        loadChildren: () => import('./features/insumos/insumos.module').then(m => m.InsumosModule) 
      },

      // Módulo Operativo - Registro de Emergencias (Fase 9)
      { 
        path: 'servicios', 
        loadChildren: () => import('./features/servicios/servicios.module').then(m => m.ServiciosModule) 
      },

      // 📊 Módulo de Estadísticas y Analítica (SOLO ADMIN)
      { 
        path: 'estadisticas', 
        loadChildren: () => import('./features/estadisticas/estadisticas.module').then(m => m.EstadisticasModule),
        canActivate: [RoleGuard], // <-- Aplicamos el mismo Guard aquí
        data: { roles: ['ADMIN'] } // <-- Y le decimos que solo los ADMIN pasan
      },

      // 📋 NUEVO: Módulo de Reportes Administrativos y Consolidados (SIROCE-65)
      { 
        path: 'reportes', 
        loadChildren: () => import('./features/reportes/reportes.module').then(m => m.ReportesModule) 
      },
    ],
  },
  
  // Ruta de Login (Fase 4)
  { 
    path: 'login', 
    loadChildren: () => import('./features/auth/auth.module').then(m => m.AuthModule) 
  },
  
  { path: '**', redirectTo: '' },
];

@NgModule({
  imports: [RouterModule.forRoot(routes, {
    scrollPositionRestoration: 'top', 
  })],
  exports: [RouterModule],
})
export class AppRoutingModule {}