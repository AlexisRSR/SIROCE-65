import { Component, Injectable, NgZone, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { AuthService } from './auth.service';

const TIEMPO_INACTIVIDAD_MS = 20 * 60 * 1000; // 20 minutos
const EVENTOS = ['mousemove', 'keydown', 'click', 'scroll'] as const;

@Component({
  selector: 'app-inactividad-dialog',
  standalone: true,
  imports: [CommonModule, MatDialogModule, MatButtonModule],
  template: `
    <h2 mat-dialog-title>Sesión expirada</h2>
    <mat-dialog-content>
      Su sesión ha expirado por inactividad. Por favor, inicie sesión nuevamente.
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-raised-button class="inactividad-accept-btn" [mat-dialog-close]="true">Aceptar</button>
    </mat-dialog-actions>
  `,
})
export class InactividadDialogComponent {}

@Injectable({ providedIn: 'root' })
export class InactividadService implements OnDestroy {

  private timeoutId: ReturnType<typeof setTimeout> | null = null;
  private listenersActivos = false;
  private readonly onActividad = () => this.reiniciarTemporizador();

  constructor(
    private ngZone: NgZone,
    private auth  : AuthService,
    private dialog: MatDialog,
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
      const dialogRef = this.dialog.open(InactividadDialogComponent, {
        disableClose: true,
        panelClass: 'inactividad-dialog-panel',
      });

      dialogRef.afterClosed().subscribe(() => {
        this.auth.logout();
      });
    });
  }

  ngOnDestroy(): void {
    this.detener();
  }
}
