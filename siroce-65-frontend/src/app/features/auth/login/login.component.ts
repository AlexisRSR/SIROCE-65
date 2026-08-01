import { Component, OnInit, OnDestroy, ViewChild, TemplateRef, ChangeDetectorRef } from '@angular/core';
import { FormBuilder, FormGroup, Validators, AbstractControl } from '@angular/forms';
import { Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { AuthService } from '../../../core/services/auth.service';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';

@Component({
  standalone   : false,
  selector     : 'app-login',
  templateUrl  : './login.component.html',
  styleUrls    : ['./login.component.scss'],
})
export class LoginComponent implements OnInit, OnDestroy {

  loginForm!  : FormGroup;
  isLoading    = false;
  hidePassword = true;
  errorMessage = '';
  // 🔥 true cuando el 403 corresponde a un bloqueo temporal por fuerza bruta (OWASP)
  isAccountLocked = false;

  // 🔥 NUEVO: Estado para el flujo de cambio de contraseña obligatorio (REQ-2.3)
  isPasswordChangeMode = false;
  tempUserId: number | null = null;
  newPassword = '';
  confirmPassword = '';
  isChangingPassword = false;

  // 🔥 NUEVO: Requisitos de la nueva contraseña, evaluados en tiempo real
  passwordRequirements = {
    hasLength : false, // 12 a 15 caracteres
    hasUpper  : false, // Al menos una mayúscula
    hasLower  : false, // Al menos una minúscula
    hasNumber : false, // Al menos un número
    hasSpecial: false, // Al menos un carácter especial (@, #, $, etc.)
  };

  @ViewChild('recoveryDialog') recoveryDialog!: TemplateRef<any>;
  identificadorRecuperacion = '';
  isRecovering = false;

  private loginSub?: Subscription;

  constructor(
    private fb       : FormBuilder,
    private auth     : AuthService,
    private router   : Router,
    private dialog   : MatDialog,        
    private snackBar : MatSnackBar,      
    private cdr      : ChangeDetectorRef 
  ) {}

  ngOnInit(): void {
    if (this.auth.isLoggedIn()) {
      this.router.navigate(['/home']);
      return;
    }

    this.loginForm = this.fb.group({
      nombre_usuario: ['', [Validators.required, Validators.minLength(3)]],
      password: ['', [Validators.required, Validators.minLength(4)]],
    });
  }

  ngOnDestroy(): void {
    this.loginSub?.unsubscribe();
  }

  get f(): { [key: string]: AbstractControl } {
    return this.loginForm.controls;
  }

  onSubmit(): void {
    this.loginForm.markAllAsTouched();
    if (this.loginForm.invalid || this.isLoading) return;

    this.isLoading      = true;
    this.errorMessage   = '';
    this.isAccountLocked = false;
    this.cdr.detectChanges();

    const credentials = {
      nombre_usuario: this.f['nombre_usuario'].value.trim(),
      password       : this.f['password'].value,
    };

    this.loginSub = this.auth.login(credentials).subscribe({
      next: (res) => {
        this.isLoading = false;

        // 🔥 NUEVO: El backend exige cambio de contraseña obligatorio (no hay token que guardar)
        if (res && res.requirePasswordChange) {
          this.isPasswordChangeMode = true;
          this.tempUserId = res.id_usuario ?? null;
          this.cdr.detectChanges();
          return;
        }

        if (res && res.access_token) {
          this.router.navigate(['/home']);
        } else {
          this.errorMessage = 'Respuesta de autenticación no válida.';
        }
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.isLoading = false;
        // El backend (OWASP) ya entrega el mensaje exacto a mostrar en err.error.message
        const backendMessage: string | undefined = err.error?.message;

        switch (err.status) {
          case 401:
            this.errorMessage = backendMessage || 'Usuario y/o contraseña incorrecta.';
            break;
          case 403:
            this.errorMessage = backendMessage || 'Acceso denegado. Contacte al administrador.';
            // Solo el bloqueo temporal por fuerza bruta debe verse como alerta crítica
            this.isAccountLocked = !!backendMessage && backendMessage.toLowerCase().includes('bloqueada');
            break;
          case 400: this.errorMessage = backendMessage || 'Estructura de datos inválida en la petición.'; break;
          case 0:   this.errorMessage = 'No se puede establecer conexión con el servidor Node.js en el puerto 3000.'; break;
          default:  this.errorMessage = backendMessage || `Error de comunicación (${err.status}).`;
        }
        this.cdr.detectChanges();
      },
    });
  }

  // 🔥 NUEVO: Evalúa en tiempo real los 5 requisitos de la nueva contraseña
  onPasswordInput(password: string): void {
    this.passwordRequirements = {
      hasLength : password.length >= 12 && password.length <= 15,
      hasUpper  : /[A-Z]/.test(password),
      hasLower  : /[a-z]/.test(password),
      hasNumber : /[0-9]/.test(password),
      hasSpecial: /[^A-Za-z0-9]/.test(password),
    };
  }

  // 🔥 NUEVO: true solo cuando las 5 reglas de complejidad se cumplen
  get isPasswordValid(): boolean {
    const r = this.passwordRequirements;
    return r.hasLength && r.hasUpper && r.hasLower && r.hasNumber && r.hasSpecial;
  }

  // 🔥 NUEVO: Envío del formulario de cambio de contraseña obligatorio (REQ-2.3)
  onSubmitNewPassword(): void {
    if (!this.newPassword.trim() || !this.confirmPassword.trim()) {
      this.errorMessage = 'Debe completar ambos campos de contraseña.';
      return;
    }

    if (!this.isPasswordValid) {
      this.errorMessage = 'La nueva contraseña no cumple los requisitos obligatorios.';
      return;
    }

    if (this.newPassword !== this.confirmPassword) {
      this.errorMessage = 'Las contraseñas no coinciden.';
      return;
    }

    if (this.tempUserId === null) {
      this.errorMessage = 'No se pudo identificar al usuario. Intente iniciar sesión nuevamente.';
      return;
    }

    this.isChangingPassword = true;
    this.errorMessage = '';
    this.cdr.detectChanges();

    this.auth.updateMandatoryPassword(this.tempUserId, this.newPassword).subscribe({
      next: () => {
        this.isChangingPassword = false;
        this.cancelPasswordChange();
        this.snackBar.open('✅ Contraseña actualizada. Inicie sesión con sus nuevas credenciales.', 'OK', {
          duration: 6000,
          panelClass: ['success-snackbar']
        });
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.isChangingPassword = false;
        this.errorMessage = err.error?.message || 'Error al actualizar la contraseña.';
        this.cdr.detectChanges();
      }
    });
  }

  // 🔥 NUEVO: Regresa al formulario de login normal y limpia el estado del cambio obligatorio
  cancelPasswordChange(): void {
    this.isPasswordChangeMode = false;
    this.tempUserId = null;
    this.newPassword = '';
    this.confirmPassword = '';
    this.errorMessage = '';
    this.passwordRequirements = {
      hasLength : false,
      hasUpper  : false,
      hasLower  : false,
      hasNumber : false,
      hasSpecial: false,
    };
    this.loginForm.reset();
  }

  abrirModalRecuperacion(): void {
    this.identificadorRecuperacion = ''; 
    this.dialog.open(this.recoveryDialog, {
      width: '420px',
      panelClass: 'recovery-dialog',
      disableClose: this.isRecovering
    });
  }

  enviarRecuperacion(): void {
    if (!this.identificadorRecuperacion.trim()) return;
    
    this.isRecovering = true;
    this.cdr.detectChanges(); 

    this.auth.recuperarPassword(this.identificadorRecuperacion.trim()).subscribe({
      next: () => {
        this.isRecovering = false;
        this.dialog.closeAll(); 
        this.cdr.detectChanges(); 
        
        this.snackBar.open('✅ Solicitud de recuperación procesada correctamente.', 'OK', { 
          duration: 6000,
          panelClass: ['success-snackbar'] 
        });
      },
      error: (err) => {
        this.isRecovering = false;
        this.cdr.detectChanges(); 
        const msg = err.error?.message || 'Error al procesar la solicitud.';
        this.snackBar.open(`⚠️ ${msg}`, 'Cerrar', { duration: 5000 });
      }
    });
  }
}