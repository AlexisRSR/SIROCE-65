import { Injectable, signal }      from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Router }                  from '@angular/router';
import { Observable, throwError }  from 'rxjs';
import { tap, catchError }         from 'rxjs/operators';
import { environment } from '../../../environments/environment'; 

export interface LoginCredentials {
  nombre_usuario: string;
  password      : string;
}

export interface LoginResponse {
  ok            : boolean;
  access_token? : string;
  expires_in?   : number;
  rol?          : string; 
  nombre_usuario?: string;
  requiere_cambio?: boolean;
  // Presente cuando el backend exige cambio de contraseña obligatorio (sin emitir JWT)
  requirePasswordChange?: boolean;
  id_usuario?   : number;
  message?      : string;
}

const LS = {
  TOKEN          : 'siroce65_token',
  ROL            : 'siroce65_rol',
  USERNAME       : 'siroce65_username',
  REQUIERE_CAMBIO: 'siroce65_requiere_cambio' 
} as const;

@Injectable({ providedIn: 'root' })
export class AuthService {

  private readonly API = environment.apiUrl;
  
  // Retención temporal de credenciales en memoria para flujos de validación
  private tempPassword = '';

  // Control de estado de inicialización de sesión utilizando Angular Signals.
  // Evita el parpadeo de rutas (flicker) al recargar la aplicación.
  readonly isAuthInitializing = signal<boolean>(true);

  constructor(
    private http  : HttpClient,
    private router: Router,
  ) {
    this.initAuthState();
  }

  // Inicialización del estado de autenticación. Preparado para validaciones
  // asíncronas futuras contra el backend sin alterar la arquitectura base.
  private initAuthState(): void {
    this.isAuthInitializing.set(false);
  }

  login(credentials: LoginCredentials): Observable<LoginResponse> {
    this.tempPassword = credentials.password; 

    return this.http
      .post<LoginResponse>(`${this.API}/login`, credentials)
      .pipe(
        tap((res: LoginResponse) => {
          if (res && res.access_token && res.rol && res.nombre_usuario) {
            localStorage.setItem(LS.TOKEN,    res.access_token);
            localStorage.setItem(LS.ROL,      res.rol.toUpperCase());
            localStorage.setItem(LS.USERNAME, res.nombre_usuario);
            localStorage.setItem(LS.REQUIERE_CAMBIO, res.requiere_cambio ? 'true' : 'false');
          }
        }),
        catchError((error: HttpErrorResponse) => {
          this.clearTempPassword();
          return throwError(() => error);
        })
      );
  }

  recuperarPassword(identificador: string): Observable<any> {
    return this.http
      .post<any>(`${this.API}/recuperar-password`, { identificador })
      .pipe(catchError((error: HttpErrorResponse) => throwError(() => error)));
  }

  cambiarPassword(datos: any): Observable<any> {
    return this.http
      .put<any>(`${this.API}/cambiar-password`, datos)
      .pipe(catchError((error: HttpErrorResponse) => throwError(() => error)));
  }

  // Transacción para actualización de contraseña requerida por política de seguridad
  updateMandatoryPassword(id_usuario: number, newPassword: string): Observable<any> {
    return this.http
      .post<any>(`${this.API}/auth/update-password`, { id_usuario, newPassword })
      .pipe(catchError((error: HttpErrorResponse) => throwError(() => error)));
  }

  // Restablecimiento de contraseña validado mediante token de un solo uso
  resetPassword(token: string, newPassword: string): Observable<any> {
    return this.http
      .post<any>(`${this.API}/reset-password`, { token, newPassword })
      .pipe(catchError((error: HttpErrorResponse) => throwError(() => error)));
  }

  logout(): void {
    localStorage.removeItem(LS.TOKEN);
    localStorage.removeItem(LS.ROL);
    localStorage.removeItem(LS.USERNAME);
    localStorage.removeItem(LS.REQUIERE_CAMBIO); 
    this.clearTempPassword();
    this.router.navigate(['/login']);
  }

  isLoggedIn(): boolean {
    const token = localStorage.getItem(LS.TOKEN);
    return !!token && token.length > 0;
  }

  getToken(): string | null {
    return localStorage.getItem(LS.TOKEN);
  }

  getUsername(): string {
    return localStorage.getItem(LS.USERNAME) ?? 'Operador';
  }

  getRole(): string {
    return localStorage.getItem(LS.ROL) ?? '';
  }

  debeCambiarPassword(): boolean {
    return localStorage.getItem(LS.REQUIERE_CAMBIO) === 'true';
  }

  getTempPassword(): string {
    return this.tempPassword;
  }

  clearTempPassword(): void {
    this.tempPassword = '';
  }
}