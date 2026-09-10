// src/app/core/guards/no-auth.guard.ts
// ── Guard inverso al AuthGuard ─────────────────────────────────
// Protege rutas públicas (Landing Page, Login) de usuarios que ya
// tienen sesión activa: en vez de dejarlos ver esas rutas, los
// redirige directo a su dashboard según su rol.
import { Injectable } from '@angular/core';
import {
  CanActivate,
  Router,
  UrlTree,
} from '@angular/router';
import { Observable } from 'rxjs';
import { filter, map, take } from 'rxjs/operators';
import { toObservable } from '@angular/core/rxjs-interop';
import { AuthService } from '../services/auth.service';

@Injectable({ providedIn: 'root' })
export class NoAuthGuard implements CanActivate {

  // 🔒 Igual que en AuthGuard: esperamos a que termine la inicialización
  // de sesión antes de decidir, para evitar el flicker inicial.
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

  canActivate(): boolean | UrlTree | Observable<boolean | UrlTree> {
    // ⚡ Camino síncrono: si la signal YA terminó de inicializar (caso normal
    // en cualquier navegación posterior a la primera), resolvemos de una vez
    // leyendo su valor actual. Evita depender de que toObservable() dispare
    // un ciclo de change detection para emitir, que es lo que causaba el
    // cuelgue de 20-30s en una recarga completa del navegador.
    if (!this.auth.isAuthInitializing()) {
      return this.evaluateAccess();
    }

    // 🔒 Solo caemos al observable si la app todavía está inicializando sesión.
    return this.authReady$.pipe(
      map(() => this.evaluateAccess()),
    );
  }

  private evaluateAccess(): boolean | UrlTree {
    if (!this.auth.isLoggedIn()) {
      // ✅ Sin sesión: puede ver la Landing Page / Login normalmente
      return true;
    }

    // 🔥 Ya está logueado: lo mandamos a su dashboard según su rol.
    // Hoy ADMIN y DESPACHO comparten la misma ruta ('/home'), que ya
    // internamente filtra las tarjetas visibles según el rol
    // (ver HomeComponent.filteredCards). Si en el futuro cada rol
    // tiene su propio dashboard, basta con mapear aquí la ruta destino.
    const rol = this.auth.getRole();
    const destino = this.dashboardPorRol(rol);

    console.warn(`[NoAuthGuard] Usuario ya autenticado (rol "${rol}"). Redirigiendo a "${destino}".`);
    return this.router.createUrlTree([destino]);
  }

  private dashboardPorRol(rol: string): string {
    switch (rol) {
      case 'ADMIN':
        return '/home';
      case 'DESPACHO':
        return '/home';
      default:
        return '/home';
    }
  }
}
