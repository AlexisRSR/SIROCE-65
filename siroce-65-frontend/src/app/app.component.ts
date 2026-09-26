import { Component } from '@angular/core';
import { AuthService } from './core/services/auth.service';

@Component({
  selector: 'app-root',
  standalone: false,
  template: `
    @if (!auth.isAuthInitializing()) {
      <router-outlet></router-outlet>
    } @else {
      <div class="app-boot-screen">
        <div class="app-boot-spinner"></div>
      </div>
    }
  `,
  styles: [`
    :host { display: block; height: 100vh; width: 100vw; }

    .app-boot-screen {
      display: flex;
      align-items: center;
      justify-content: center;
      height: 100%;
      width: 100%;
      background: var(--bg-page);
    }

    .app-boot-spinner {
      width: 40px;
      height: 40px;
      border: 4px solid var(--bg-hover);
      border-top-color: var(--accent-danger);
      border-radius: 50%;
      animation: app-boot-spin 0.8s linear infinite;
    }

    @keyframes app-boot-spin {
      to { transform: rotate(360deg); }
    }
  `]
})
export class AppComponent {
  title = 'siroce-65-frontend';

  constructor(public auth: AuthService) {}
}