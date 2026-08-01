// src/app/pages/home/home.component.ts
// ── Página de Inicio (Dashboard de bienvenida) ────────────────
// Muestra: saludo al usuario + tarjetas de acceso rápido a cada módulo.
import { Component, OnInit } from '@angular/core';
import { Router }            from '@angular/router';
import { AuthService }       from '../../core/services/auth.service';

interface DashCard {
  title   : string;
  subtitle: string;
  icon    : string;
  color   : string;
  route   : string;
  roles?  : string[]; // 🔥 Agregamos la propiedad opcional de roles
}

@Component({
  selector: 'app-home',
  standalone: false,
  template: `
    <div class="home-container page-enter">

      <div class="welcome-banner">
        <mat-icon class="welcome-icon">local_fire_department</mat-icon>
        <div class="welcome-text">
          <h1 class="welcome-title">Bienvenido, <span class="accent">{{ username }}</span></h1>
          <p class="welcome-sub">Sistema de Administración de Servicios y Emergencias</p>
        </div>
      </div>

      <div class="cards-grid">
        <!-- 🔥 Cambiamos dashCards por filteredCards en el *ngFor -->
        <mat-card
          *ngFor="let card of filteredCards"
          class="dash-card"
          (click)="navigate(card.route)"
          matRipple>

          <div class="dash-card-header" [style.background]="card.color">
            <mat-icon class="dash-card-icon">{{ card.icon }}</mat-icon>
          </div>

          <mat-card-content class="dash-card-body">
            <p class="dash-card-title">{{ card.title }}</p>
            <p class="dash-card-sub">{{ card.subtitle }}</p>
          </mat-card-content>

        </mat-card>
      </div>

    </div>
  `,
  styles: [`
    .home-container  { padding: 8px 0; }

    .welcome-banner  {
      display: flex; align-items: center; gap: 18px;
      padding: 24px 4px 28px;
    }
    .welcome-icon    {
      font-size: 52px; width: 52px; height: 52px;
      color: #c62828;
    }
    .welcome-title   { margin: 0; font-size: 26px; font-weight: 300; color: var(--text-primary); }
    .accent          { color: #c62828; font-weight: 700; }
    .welcome-sub     { margin: 4px 0 0; color: var(--text-dim); font-size: 13px; }

    .cards-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
      gap: 18px;
    }

    .dash-card {
      background-color: var(--bg-card) !important;
      cursor: pointer;
      transition: transform 0.15s ease, box-shadow 0.15s ease;
      overflow: hidden;

      &:hover { transform: translateY(-3px); box-shadow: 0 8px 24px var(--shadow-color) !important; }
    }

    .dash-card-header {
      display: flex; align-items: center; justify-content: center;
      height: 70px;
      .dash-card-icon { font-size: 34px; width: 34px; height: 34px; color: #fff; }
    }

    .dash-card-body   { padding: 14px 16px 18px; }
    .dash-card-title  { margin: 0 0 4px; font-size: 14px; font-weight: 600; color: var(--text-primary); }
    .dash-card-sub    { margin: 0; font-size: 12px; color: var(--text-dim); }

    @media (max-width: 600px) {
      .welcome-icon   { font-size: 36px; width: 36px; height: 36px; }
      .welcome-title  { font-size: 20px; }
    }
  `],
})
export class HomeComponent implements OnInit {

  username = '';
  userRole = ''; // 🔥 Variable para guardar el rol
  filteredCards: DashCard[] = []; // 🔥 Arreglo para guardar las tarjetas permitidas

  readonly dashCards: DashCard[] = [
    { title: 'Bomberos',         subtitle: 'Gestión de personal',    icon: 'people',                color: '#c62828', route: '/bomberos'          },
    { title: 'Unidades',         subtitle: 'Flotilla vehicular',     icon: 'directions_car',        color: '#b71c1c', route: '/vehiculos'         },
    { title: 'Emergencias',      subtitle: 'Registro de servicios',  icon: 'local_fire_department', color: '#d84315', route: '/servicios'         },
    { title: 'Tipos Emergencia', subtitle: 'Catálogo de incidentes', icon: 'warning_amber',         color: '#e65100', route: '/tipos-emergencias' },
    { title: 'Insumos',          subtitle: 'Inventario de almacén',  icon: 'inventory_2',           color: '#2e7d32', route: '/insumos'           },
    // 🔥 Le agregamos el candado de seguridad a Estadísticas
    { title: 'Estadísticas',     subtitle: 'Gráficos y análisis',    icon: 'bar_chart',             color: '#6a1540', route: '/estadisticas', roles: ['ADMIN', 'JEFE'] },
    { title: 'Reportes',         subtitle: 'Consolidados y PDFs',    icon: 'picture_as_pdf',        color: '#37474f', route: '/reportes'          }
  ];

  constructor(
    private auth  : AuthService,
    private router: Router,
  ) {}

  ngOnInit(): void {
    // 1. Obtenemos datos de sesión
    this.username = this.auth.getUsername();
    this.userRole = this.auth.getRole();

    // 2. 🔥 Filtramos las tarjetas. Si no tiene 'roles' pasa directo, si tiene, verifica que el rol del usuario coincida.
    this.filteredCards = this.dashCards.filter(card => {
      if (!card.roles || card.roles.length === 0) return true;
      return card.roles.includes(this.userRole);
    });
  }

  navigate(route: string): void {
    this.router.navigate([route]);
  }
}