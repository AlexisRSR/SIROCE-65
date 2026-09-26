import { Injectable } from '@angular/core';
import {
  CanActivate,
  ActivatedRouteSnapshot,
  RouterStateSnapshot,
  Router,
  UrlTree,
} from '@angular/router';
import { Observable } from 'rxjs';
import { filter, map, take } from 'rxjs/operators';
import { toObservable } from '@angular/core/rxjs-interop';
import { AuthService } from '../services/auth.service';

@Injectable({ providedIn: 'root' })
export class AuthGuard implements CanActivate {

  // Derivación reactiva de la señal de inicialización de autenticación
  private readonly authReady$: Observable<boolean>;

  constructor(
    private auth  : AuthService,
    private router: Router,
  ) {
    this.authReady$ = toObservable(this.auth.isAuthInitializing).pipe(
      filter(initializing => !initializing),
      take(1),
    );
  }

  canActivate(
    route: ActivatedRouteSnapshot,
    state : RouterStateSnapshot,
  ): boolean | UrlTree | Observable<boolean | UrlTree> {

    // Resolución síncrona: optimiza el tiempo de renderizado si el estado ya está inicializado
    if (!this.auth.isAuthInitializing()) {
      return this.evaluateAccess(route, state);
    }

    // Resolución asíncrona: encola la validación hasta que la aplicación esté lista
    return this.authReady$.pipe(
      map(() => this.evaluateAccess(route, state)),
    );
  }

  private evaluateAccess(
    route: ActivatedRouteSnapshot,
    state : RouterStateSnapshot,
  ): boolean | UrlTree {

    if (this.auth.isLoggedIn()) {
      // Validación de Control de Acceso Basado en Roles (RBAC) a nivel de enrutamiento
      const rolesPermitidos = route.data['roles'] as Array<string>;

      if (rolesPermitidos) {
        const usuarioGuardado = JSON.parse(localStorage.getItem('usuario') || '{}');
        const rolUsuario = usuarioGuardado.rol || localStorage.getItem('siroce65_rol') || 'OPERADOR';

        // Bloqueo de acceso por insuficiencia de privilegios
        if (!rolesPermitidos.includes(rolUsuario)) {
          console.warn(`[AuthGuard] Acceso denegado a "${state.url}". Rol "${rolUsuario}" carece de privilegios.`);
          return this.router.createUrlTree(['/home']);
        }
      }

      return true;
    }

    // Redirección por ausencia de sesión activa
    console.warn(`[AuthGuard] Acceso denegado a "${state.url}". Sesión no detectada.`);
    return this.router.createUrlTree(['/login']);
  }
}