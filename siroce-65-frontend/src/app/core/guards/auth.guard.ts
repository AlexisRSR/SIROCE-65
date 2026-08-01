// src/app/core/guards/auth.guard.ts
import { Injectable } from '@angular/core';
import {
  CanActivate,
  ActivatedRouteSnapshot,
  RouterStateSnapshot,
  Router,
  UrlTree,
} from '@angular/router';
import { Observable } from 'rxjs';
import { AuthService } from '../services/auth.service';

@Injectable({ providedIn: 'root' })
export class AuthGuard implements CanActivate {

  constructor(
    private auth  : AuthService,
    private router: Router,
  ) {}

  canActivate(
    route: ActivatedRouteSnapshot,
    state : RouterStateSnapshot,
  ): Observable<boolean | UrlTree> | Promise<boolean | UrlTree> | boolean | UrlTree {

    if (this.auth.isLoggedIn()) {
      // 1. Verificamos si la ruta exige un rol específico (candado de seguridad)
      const rolesPermitidos = route.data['roles'] as Array<string>;
      
      if (rolesPermitidos) {
        // 🔥 SOLUCIÓN DIRECTA: Leemos el rol desde el localStorage aquí mismo
        // Así evitamos el error de "getUserRole does not exist" en el AuthService
        const usuarioGuardado = JSON.parse(localStorage.getItem('usuario') || '{}');
        const rolUsuario = usuarioGuardado.rol || localStorage.getItem('rol') || 'OPERADOR';
        
        // Si el usuario no tiene el rol necesario, lo regresamos al home
        if (!rolesPermitidos.includes(rolUsuario)) {
          console.warn(`[AuthGuard] Acceso denegado a "${state.url}". Rol "${rolUsuario}" no tiene permisos.`);
          return this.router.createUrlTree(['/home']);
        }
      }

      // ✅ Usuario autenticado y con permisos: acceso concedido
      return true;
    }

    // ❌ Sin token: redirigir al login
    console.warn(`[AuthGuard] Acceso denegado a "${state.url}". Redirigiendo a /login.`);
    return this.router.createUrlTree(['/login']);
  }
}