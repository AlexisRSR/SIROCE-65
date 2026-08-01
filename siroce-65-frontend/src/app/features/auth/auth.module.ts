// src/app/features/auth/auth.module.ts
// ══════════════════════════════════════════════════════════════
//  AuthModule — Módulo de autenticación (carga lazy)
// ──────────────────────────────────────────────────────────────
//  Se carga solo cuando el usuario navega a /login, lo que
//  reduce el bundle inicial de la aplicación.
//
//  Importa solo los módulos de Angular Material necesarios
//  para la pantalla de login (no duplicar los del AppModule).
// ══════════════════════════════════════════════════════════════
import { NgModule }          from '@angular/core';
import { CommonModule }      from '@angular/common';
import { ReactiveFormsModule, FormsModule } from '@angular/forms'; // 🔥 FormsModule agregado

// ── Angular Material: solo lo que el LoginComponent necesita ──
import { MatCardModule }        from '@angular/material/card';
import { MatFormFieldModule }   from '@angular/material/form-field';
import { MatInputModule }       from '@angular/material/input';
import { MatButtonModule }      from '@angular/material/button';
import { MatIconModule }        from '@angular/material/icon';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatDialogModule }      from '@angular/material/dialog';    // 🔥 NUEVO: Modal
import { MatSnackBarModule }    from '@angular/material/snack-bar'; // 🔥 NUEVO: Alertas

// ── Módulos internos ──────────────────────────────────────────
import { AuthRoutingModule }    from './auth-routing.module';
import { LoginComponent }       from './login/login.component';
import { SharedModule }         from '../../shared/shared.module';

// ── Material agrupado (legibilidad) ──────────────────────────
const AUTH_MATERIAL = [
  MatCardModule,
  MatFormFieldModule,
  MatInputModule,
  MatButtonModule,
  MatIconModule,
  MatProgressBarModule,
  MatDialogModule,    // 🔥 NUEVO
  MatSnackBarModule,  // 🔥 NUEVO
];

@NgModule({
  declarations: [
    // ⚠ standalone: false está declarado en el decorador @Component
    LoginComponent,
  ],
  imports: [
    CommonModule,        // *ngIf, *ngFor, async pipe
    ReactiveFormsModule, // FormBuilder, FormGroup, Validators
    FormsModule,         // 🔥 NUEVO: Necesario para [(ngModel)]
    AuthRoutingModule,   // Rutas internas (/login)
    SharedModule,        // <app-public-header>
    ...AUTH_MATERIAL,
  ],
})
export class AuthModule {}