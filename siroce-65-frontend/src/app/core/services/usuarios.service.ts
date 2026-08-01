import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class UsuariosService {
  private apiUrl = 'http://localhost:3000/api/usuarios'; // o tu URL base

  constructor(private http: HttpClient) {}

  obtenerUsuarios(): Observable<any> {
    return this.http.get(this.apiUrl);
  }

  registrarUsuario(usuario: any): Observable<any> {
    return this.http.post(this.apiUrl, usuario);
  }

  // 🔥 ASEGÚRATE DE QUE ESTA FUNCIÓN ESTÉ AQUÍ ADENTRO
  cambiarEstado(idUsuario: number): Observable<any> {
    return this.http.put(`${this.apiUrl}/${idUsuario}/estado`, {});
  }

  // Agrégalo debajo de tus otras funciones
  actualizarUsuario(idUsuario: number, datos: any): Observable<any> {
    return this.http.put(`${this.apiUrl}/${idUsuario}`, datos);
  }
  
}