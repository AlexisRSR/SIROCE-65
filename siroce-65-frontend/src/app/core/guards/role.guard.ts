import { Injectable } from '@angular/core';
import { CanActivate, ActivatedRouteSnapshot, RouterStateSnapshot, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

@Injectable({
  providedIn: 'root'
})
export class RoleGuard implements CanActivate {

  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  canActivate(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): boolean {
    // 1. Obtenemos los roles permitidos desde tu app-routing.module.ts
    const expectedRoles = route.data['roles'] as Array<string>;

    // 2. Usamos el método limpio que ya tienes en tu AuthService
    const currentRole = this.authService.getRole();

    // 3. Validamos si el rol actual está dentro de la lista de roles permitidos
    if (expectedRoles && expectedRoles.includes(currentRole)) {
      return true; // Tiene permiso, renderizamos el componente
    }

    // 4. ALERTA INTRUSO: No tiene permiso. Lo bloqueamos y lo regresamos a /home
    this.router.navigate(['/home']);
    return false;
  }
}