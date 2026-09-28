import { Injectable, NgZone, OnDestroy } from '@angular/core';
import { AuthService } from './auth.service';

const TIEMPO_INACTIVIDAD_MS = 10 * 1000; // 30 minutos
const EVENTOS = ['mousemove', 'keydown', 'click', 'scroll'] as const;

@Injectable({ providedIn: 'root' })
export class InactividadService implements OnDestroy {

  private timeoutId: ReturnType<typeof setTimeout> | null = null;
  private listenersActivos = false;
  private readonly onActividad = () => this.reiniciarTemporizador();

  constructor(
    private ngZone: NgZone,
    private auth  : AuthService,
  ) {}

  iniciar(): void {
    if (this.listenersActivos) {
      return;
    }
    this.listenersActivos = true;

    this.ngZone.runOutsideAngular(() => {
      EVENTOS.forEach(evento => window.addEventListener(evento, this.onActividad, { passive: true }));
      this.reiniciarTemporizador();
    });
  }

  detener(): void {
    if (!this.listenersActivos) {
      return;
    }
    this.listenersActivos = false;

    EVENTOS.forEach(evento => window.removeEventListener(evento, this.onActividad));
    if (this.timeoutId) {
      clearTimeout(this.timeoutId);
      this.timeoutId = null;
    }
  }

  private reiniciarTemporizador(): void {
    if (this.timeoutId) {
      clearTimeout(this.timeoutId);
    }
    this.timeoutId = setTimeout(() => this.onInactividadExpirada(), TIEMPO_INACTIVIDAD_MS);
  }

  private onInactividadExpirada(): void {
    this.detener();

    this.ngZone.run(() => {
      alert('Su sesión ha expirado por inactividad.');
      this.auth.logout();
    });
  }

  ngOnDestroy(): void {
    this.detener();
  }
}
