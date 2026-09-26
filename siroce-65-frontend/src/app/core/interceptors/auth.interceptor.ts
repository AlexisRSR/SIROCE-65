// src/app/core/interceptors/auth.interceptor.ts
// ── Interceptor HTTP de Autenticación ────────────────────────
// Añade automáticamente el header "Authorization: Bearer <token>"
// a TODAS las peticiones HTTP salvo la de login.
// Si la API responde 401 a una petición QUE SÍ llevaba token (sesión
// expirada/inválida), avisa al operador y cierra la sesión.
import { Injectable } from '@angular/core';
import {
  HttpRequest,
  HttpHandler,
  HttpEvent,
  HttpInterceptor,
  HttpErrorResponse,
} from '@angular/common/http';
import { EMPTY, Observable, throwError, catchError } from 'rxjs';
import { MatSnackBar } from '@angular/material/snack-bar';
import { AuthService } from '../services/auth.service';

@Injectable()
export class AuthInterceptor implements HttpInterceptor {

  constructor(
    private auth: AuthService,
    private snackBar: MatSnackBar,
  ) {}

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
        // 🔥 Solo se trata como "sesión expirada" si la petición llevaba un
        // token adjunto y fue rechazada. Un 401 sin token (ej. credenciales
        // inválidas en /login) es un fallo de login normal, no una sesión vencida.
        if (error.status === 401 && token) {
          this.snackBar.open(
            '⚠️ Tu sesión ha expirado por razones de seguridad. Por favor, inicia sesión nuevamente.',
            'Cerrar',
            { duration: 6000 },
          );
          this.auth.logout(); // logout() ya limpia el storage y redirige a /login

          // 🔥 Corta el flujo reactivo aquí: si propagáramos el error con
          // throwError, el componente que originó la petición también lo
          // atraparía y pisaría este mensaje con su propio snackbar genérico.
          return EMPTY;
        }
        return throwError(() => error);
      })
    );
  }
}
