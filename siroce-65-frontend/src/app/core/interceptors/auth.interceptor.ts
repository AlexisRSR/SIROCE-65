// src/app/core/interceptors/auth.interceptor.ts
// ── Interceptor HTTP de Autenticación ────────────────────────
// Añade automáticamente el header "Authorization: Bearer <token>"
// a TODAS las peticiones HTTP salvo la de login.
// Si la API responde 401 (token expirado/inválido), cierra la sesión.
import { Injectable } from '@angular/core';
import {
  HttpRequest,
  HttpHandler,
  HttpEvent,
  HttpInterceptor,
  HttpErrorResponse,
} from '@angular/common/http';
import { Observable, throwError, catchError } from 'rxjs';
import { AuthService } from '../services/auth.service';

@Injectable()
export class AuthInterceptor implements HttpInterceptor {

  constructor(private auth: AuthService) {}

  intercept(
    request: HttpRequest<unknown>,
    next: HttpHandler,
  ): Observable<HttpEvent<unknown>> {

    const token = this.auth.getToken();

    // Clonar la petición e inyectar el token si existe
    if (token) {
      request = request.clone({
        setHeaders: { Authorization: `Bearer ${token}` },
      });
    }

    return next.handle(request).pipe(
      catchError((error: HttpErrorResponse) => {
        // 401 → sesión expirada, redirigir a login
        if (error.status === 401) {
          this.auth.logout();
        }
        return throwError(() => error);
      })
    );
  }
}
