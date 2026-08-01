// src/app/core/services/theme.service.ts
// ── Theme Switcher (Modo Claro / Oscuro) ──────────────────────
// Único punto de verdad para el tema activo. Persiste en
// localStorage y estampa data-theme en <html> (ver styles.scss).
// Usado por MainLayoutComponent y PublicHeaderComponent.
import { Injectable, signal } from '@angular/core';

const THEME_STORAGE_KEY = 'siroce65_theme';

@Injectable({ providedIn: 'root' })
export class ThemeService {
  readonly isLight = signal<boolean>(localStorage.getItem(THEME_STORAGE_KEY) === 'light');

  constructor() {
    this.applyToDocument();
  }

  toggle(): void {
    this.isLight.update(value => !value);
    localStorage.setItem(THEME_STORAGE_KEY, this.isLight() ? 'light' : 'dark');
    this.applyToDocument();
  }

  private applyToDocument(): void {
    document.documentElement.setAttribute('data-theme', this.isLight() ? 'light' : 'dark');
  }
}
