// src/app/pages/landing-page/landing-page.component.ts
// ── Landing Page pública de SIROCE-65 ─────────────────────────
// Página de acceso público en la ruta raíz ('/'). Independiente
// del MainLayoutComponent: sin sidenav, sin AuthGuard.
import { Component } from '@angular/core';

@Component({
  selector: 'app-landing-page',
  standalone: false,
  templateUrl: './landing-page.component.html',
  styleUrls: ['./landing-page.component.scss'],
})
export class LandingPageComponent {
  readonly telefonoEmergencias    = '7770 7077';
  readonly telefonoEmergenciasTel = 'tel:77707077';
  readonly whatsappUrl            = 'https://wa.me/50251682146';
  readonly direccionEstacion      = 'Cantón Santa Isabel, San Rafael Pie de la Cuesta';
  readonly direccionMapsUrl       =
    'https://www.google.com/maps/place/Bomberos+Voluntarios,+65+C%C3%ADa.,+CVB/@14.9298347,-91.9134965,17z/data=!4m14!1m7!3m6!1s0x858e797756f0e4d3:0xff454f73daeb36ac!2sBomberos+Voluntarios,+65+C%C3%ADa.,+CVB!8m2!3d14.9298347!4d-91.9134965!16s%2Fg%2F11j8tpvzhv!3m5!1s0x858e797756f0e4d3:0xff454f73daeb36ac!8m2!3d14.9298347!4d-91.9134965!16s%2Fg%2F11j8tpvzhv?entry=ttu&g_ep=EgoyMDI2MDcxNS4wIKXMDSoASAFQAw%3D%3D';
}
