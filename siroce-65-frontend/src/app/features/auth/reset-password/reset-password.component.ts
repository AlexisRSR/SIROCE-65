// src/app/features/auth/reset-password/reset-password.component.ts
// ══════════════════════════════════════════════════════════════
//  ResetPasswordComponent — Reseteo de contraseña por bloqueo de cuenta
// ──────────────────────────────────────────────────────────────
//  Se llega aquí desde el enlace enviado por correo tras un bloqueo
//  de cuenta (3 intentos fallidos): /reset-password?token=...
//  Componente standalone (no requiere AuthModule / AuthRoutingModule).
// ══════════════════════════════════════════════════════════════
import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  AbstractControl,
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  ValidationErrors,
  Validators,
} from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';

import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressBarModule } from '@angular/material/progress-bar';

import { AuthService } from '../../../core/services/auth.service';
import { SharedModule } from '../../../shared/shared.module';

// Misma política de contraseñas exigida por el backend (authController.js):
// 12 a 15 caracteres, al menos 1 mayúscula, 1 minúscula, 1 número y 1 especial.
const PASSWORD_PATTERN = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{12,15}$/;

// Validador a nivel de FormGroup: exige que ambos campos coincidan
function passwordsMatchValidator(group: AbstractControl): ValidationErrors | null {
  const newPassword = group.get('newPassword')?.value;
  const confirmPassword = group.get('confirmPassword')?.value;
  return newPassword && confirmPassword && newPassword !== confirmPassword
    ? { passwordsMismatch: true }
    : null;
}

@Component({
  selector: 'app-reset-password',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterLink,
    SharedModule, // <app-public-header>
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatProgressBarModule,
  ],
  templateUrl: './reset-password.component.html',
  styleUrl: './reset-password.component.scss',
})
export class ResetPasswordComponent implements OnInit {

  form!: FormGroup;

  token: string | null = null;
  tokenMissing = false;

  hideNewPassword = true;
  hideConfirmPassword = true;

  isSubmitting = false;
  errorMessage = '';
  successMessage = '';

  // Requisitos de la nueva contraseña, evaluados en tiempo real (mismo patrón que login.component)
  passwordRequirements = {
    hasLength : false,
    hasUpper  : false,
    hasLower  : false,
    hasNumber : false,
    hasSpecial: false,
  };

  constructor(
    private fb    : FormBuilder,
    private route : ActivatedRoute,
    private router: Router,
    private auth  : AuthService,
    private cdr   : ChangeDetectorRef,
  ) {}

  ngOnInit(): void {
    this.token = this.route.snapshot.queryParamMap.get('token');
    this.tokenMissing = !this.token;

    this.form = this.fb.group(
      {
        newPassword    : ['', [Validators.required, Validators.pattern(PASSWORD_PATTERN)]],
        confirmPassword: ['', [Validators.required]],
      },
      { validators: passwordsMatchValidator },
    );

    this.form.get('newPassword')!.valueChanges.subscribe((value: string) => {
      this.passwordRequirements = {
        hasLength : value.length >= 12 && value.length <= 15,
        hasUpper  : /[A-Z]/.test(value),
        hasLower  : /[a-z]/.test(value),
        hasNumber : /[0-9]/.test(value),
        hasSpecial: /[^A-Za-z0-9]/.test(value),
      };
    });
  }

  get f(): { [key: string]: AbstractControl } {
    return this.form.controls;
  }

  onSubmit(): void {
    this.errorMessage = '';
    this.form.markAllAsTouched();

    if (this.tokenMissing || !this.token) {
      this.errorMessage = 'El enlace de recuperación no es válido. Solicita uno nuevo iniciando sesión.';
      return;
    }

    if (this.form.invalid || this.isSubmitting) return;

    this.isSubmitting = true;
    this.cdr.detectChanges();

    this.auth.resetPassword(this.token, this.f['newPassword'].value).subscribe({
      next: () => {
        this.isSubmitting = false;
        this.successMessage = 'Contraseña actualizada correctamente. Redirigiendo al inicio de sesión…';
        this.cdr.detectChanges();

        setTimeout(() => this.router.navigate(['/login']), 2500);
      },
      error: (err) => {
        this.isSubmitting = false;
        this.errorMessage = err.error?.message || 'No se pudo restablecer la contraseña. El enlace pudo haber expirado.';
        this.cdr.detectChanges();
      },
    });
  }
}
