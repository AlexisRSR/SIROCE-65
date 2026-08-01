// src/app/features/auth/auth-routing.module.ts
// ══════════════════════════════════════════════════════════════
//  AuthRoutingModule — Rutas internas del módulo Auth
// ──────────────────────────────────────────────────────────────
//  Este módulo se carga de forma LAZY desde app-routing.module.ts.
//  La ruta '' (vacía) dentro del módulo corresponde a /login
//  en la aplicación principal.
//
//  Esquema de rutas:
//    /login  →  LoginComponent  (ruta vacía del módulo)
// ══════════════════════════════════════════════════════════════
import { NgModule }             from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { LoginComponent }       from './login/login.component';

const routes: Routes = [
  {
    // '' → corresponde a /login (el prefijo lo define app-routing)
    path     : '',
    component: LoginComponent,
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class AuthRoutingModule {}
