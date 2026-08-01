// src/app/layout/public-header/public-header.component.ts
// ── Header oscuro compartido (páginas públicas) ───────────────
// Usado por LandingPageComponent y LoginComponent: logo a la
// izquierda, Theme Switcher + Home + Facebook (+ Login opcional)
// a la derecha. Fondo oscuro fijo, independiente del tema activo.
import { Component, Input } from '@angular/core';
import { ThemeService } from '../../core/services/theme.service';

@Component({
  selector: 'app-public-header',
  standalone: false,
  templateUrl: './public-header.component.html',
  styleUrls: ['./public-header.component.scss'],
})
export class PublicHeaderComponent {
  @Input() showLoginButton = true;

  readonly facebookUrl =
    'https://www.facebook.com/people/Bomberos-Voluntarios-San-Rafael-PC/100064574956445/';

  constructor(public theme: ThemeService) {}

  scrollToTop(): void {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }
}
