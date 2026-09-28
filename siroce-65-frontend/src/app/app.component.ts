import { Component, OnDestroy, OnInit } from '@angular/core';
import { Router, NavigationEnd } from '@angular/router';
import { Subscription } from 'rxjs';
import { filter } from 'rxjs/operators';
import { AuthService } from './core/services/auth.service';
import { InactividadService } from './core/services/inactividad.service';

@Component({
  selector: 'app-root',
  standalone: false,
  template: `
    @if (!auth.isAuthInitializing()) {
      <router-outlet></router-outlet>
    } @else {
      <div class="app-boot-screen">
        <div class="app-boot-spinner"></div>
      </div>
    }
  `,
  styles: [`
    :host { display: block; height: 100vh; width: 100vw; }

    .app-boot-screen {
      display: flex;
      align-items: center;
      justify-content: center;
      height: 100%;
      width: 100%;
      background: var(--bg-page);
    }

    .app-boot-spinner {
      width: 40px;
      height: 40px;
      border: 4px solid var(--bg-hover);
      border-top-color: var(--accent-danger);
      border-radius: 50%;
      animation: app-boot-spin 0.8s linear infinite;
    }

    @keyframes app-boot-spin {
      to { transform: rotate(360deg); }
    }
  `]
})
export class AppComponent implements OnInit, OnDestroy {
  title = 'siroce-65-frontend';

  private routerSub?: Subscription;

  constructor(
    public auth: AuthService,
    private router: Router,
    private inactividad: InactividadService,
  ) {}

  ngOnInit(): void {
    // Inicia/detiene la vigilancia de inactividad según el estado real de
    // autenticación en cada navegación (cubre login, logout y recarga de página).
    this.routerSub = this.router.events
      .pipe(filter((event): event is NavigationEnd => event instanceof NavigationEnd))
      .subscribe(() => {
        if (this.auth.isLoggedIn()) {
          this.inactividad.iniciar();
        } else {
          this.inactividad.detener();
        }
      });
  }

  ngOnDestroy(): void {
    this.routerSub?.unsubscribe();
    this.inactividad.detener();
  }
}