// src/app/layout/main-layout/main-layout.component.ts
// ── Componente Layout Principal (Shell) ───────────────────────
// Contiene: Toolbar superior rojo + Sidenav oscuro colapsable
//           + Router Outlet central + Footer de estación.
// Gestiona: responsividad mobile/desktop y datos de sesión.
import {
  Component,
  OnInit,
  OnDestroy,
  ViewChild,
  ChangeDetectionStrategy,
  TemplateRef,
  ChangeDetectorRef
} from '@angular/core';
import { Router, NavigationEnd } from '@angular/router';
import { MatSidenav }           from '@angular/material/sidenav';
import { BreakpointObserver, Breakpoints } from '@angular/cdk/layout';
import { Subscription, filter }  from 'rxjs';
import { AuthService }           from '../../core/services/auth.service';
import { ThemeService }          from '../../core/services/theme.service';
import { MatDialog }             from '@angular/material/dialog';
import { MatSnackBar }           from '@angular/material/snack-bar';

// ── Tipo: ítem de menú ────────────────────────────────────────
export interface NavChild {
  label : string;
  icon  : string;
  route : string;
}

export interface NavGroup {
  label    : string;
  icon     : string;
  route?   : string;        // si no tiene hijos, navega directo
  children?: NavChild[];
  expanded : boolean;
  roles?: string[];
}

@Component({
  selector       : 'app-main-layout',
  standalone     : false, 
  templateUrl    : './main-layout.component.html',
  styleUrls      : ['./main-layout.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MainLayoutComponent implements OnInit, OnDestroy {

  @ViewChild('sidenav') sidenav!: MatSidenav;
  @ViewChild('changePasswordDialog') changePasswordDialog!: TemplateRef<any>;

  isMobile = false;
  username = '';
  userRole = '';

  // ── Variables para Cambiar Contraseña ─────────────────────
  pwdData = { actual: '', nueva: '', confirmar: '' };
  isChangingPwd = false;
  hidePwd1 = true;
  hidePwd2 = true;
  hidePwd3 = true;
  
  // Bandera: Controla si el modal es obligatorio y bloquea la salida
  esForzadoModal = false; 

  // ── Estructura del menú lateral ──────────────────────────
  readonly menuGroups: NavGroup[] = [
    {
      label   : 'OPERACIONES',
      icon    : 'emergency',
      expanded: true, 
      children: [
        { label: 'Emergencias', icon: 'local_fire_department', route: '/servicios' },
      ],
    },
    {
      label   : 'ESTADÍSTICAS',
      icon    : 'bar_chart',
      route   : '/estadisticas',
      expanded: false,
      roles   : ['ADMIN', 'JEFE'], 
    },
    {
      label   : 'REPORTES',
      icon    : 'summarize',
      route   : '/reportes',
      expanded: false,
    },
    {
      label   : 'CATÁLOGOS',
      icon    : 'folder_open',
      expanded: false, 
      children: [
        { label: 'Bomberos',              icon: 'people',                  route: '/bomberos'          },
        { label: 'Unidades',              icon: 'directions_car',          route: '/vehiculos'         },
        { label: 'Tipos de Emergencias',  icon: 'warning_amber',           route: '/tipos-emergencias' },
        { label: 'Insumos',               icon: 'inventory_2',             route: '/insumos'           },
      ],
    },
    {
      label   : 'ADMINISTRACIÓN',
      icon    : 'admin_panel_settings',
      expanded: false,
      roles   : ['ADMIN'],
      children: [
        { label: 'Usuarios', icon: 'manage_accounts', route: '/gestion-usuarios' },
      ],
    }
  ];

  filteredMenuGroups: NavGroup[] = [];
  private subs = new Subscription();

  constructor(
    private auth               : AuthService,
    public  theme               : ThemeService,
    private router             : Router,
    private breakpointObserver : BreakpointObserver,
    private dialog             : MatDialog,
    private snackBar           : MatSnackBar,
    private cdr                : ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.username = this.auth.getUsername();
    this.userRole  = this.auth.getRole();

    this.filteredMenuGroups = this.menuGroups.filter(group => {
      if (!group.roles || group.roles.length === 0) return true;
      return group.roles.includes(this.userRole);
    });

    this.subs.add(
      this.breakpointObserver
        .observe([Breakpoints.XSmall, Breakpoints.Small])
        .subscribe(state => { 
          this.isMobile = state.matches; 
          this.cdr.markForCheck();
        })
    );

    this.subs.add(
      this.router.events
        .pipe(filter(e => e instanceof NavigationEnd))
        .subscribe(() => {
          if (this.isMobile && this.sidenav?.opened) {
            this.sidenav.close();
            this.cdr.markForCheck();
          }
        })
    );

    // Lanzar modal obligatorio si la clave es temporal
    if (this.auth.debeCambiarPassword()) {
      setTimeout(() => {
        this.abrirModalCambioPassword(true);
      }, 100);
    }
  }

  ngOnDestroy(): void {
    this.subs.unsubscribe();
  }

  // ════════════════════════════════════════════════════════════
  //  THEME SWITCHER — Modo Claro / Modo Oscuro (delega en ThemeService)
  // ════════════════════════════════════════════════════════════
  toggleTheme(): void {
    this.theme.toggle();
    this.cdr.markForCheck();
  }

  toggleGroup(group: NavGroup): void {
    if (group.children) {
      group.expanded = !group.expanded;
    } else if (group.route) {
      this.router.navigate([group.route]);
    }
  }

  logout(): void {
    this.dialog.closeAll(); // 🔥 CAMBIO: Destruye el modal flotante antes de navegar
    this.auth.logout();
  }

  // ════════════════════════════════════════════════════════════
  //  LÓGICA DE CAMBIO DE CONTRASEÑA (Alta Seguridad + UX)
  // ════════════════════════════════════════════════════════════
  
  formValido = false; 
  errorBackend = ''; 
  mismaPassword = false; 

  pwdRequisitos = {
    longitud: false,
    mayuscula: false,
    minuscula: false,
    numero: false,
    especial: false
  };

  actualizarFormulario(actual: string, nueva: string, confirmar: string): void {
    this.errorBackend = ''; 
    this.pwdData = { actual, nueva, confirmar };
    
    // 🔥 CAMBIO: Validación de rango (mínimo 12, máximo 15)
    this.pwdRequisitos.longitud = nueva.length >= 12 && nueva.length <= 15;
    
    this.pwdRequisitos.mayuscula = /[A-Z]/.test(nueva);
    this.pwdRequisitos.minuscula = /[a-z]/.test(nueva);
    this.pwdRequisitos.numero = /[0-9]/.test(nueva);
    this.pwdRequisitos.especial = /[^A-Za-z0-9]/.test(nueva);

    const cumpleTodos = Object.values(this.pwdRequisitos).every(v => v === true);
    const coinciden = (nueva === confirmar) && nueva.length > 0;
    
    this.mismaPassword = (actual === nueva) && nueva.length > 0;
    this.formValido = !!(actual && cumpleTodos && coinciden && !this.mismaPassword);
    this.cdr.detectChanges(); 
  }
  
  abrirModalCambioPassword(esForzado: boolean = false): void {
    this.esForzadoModal = esForzado;
    
    // 🔥 NUEVO: Si es forzado, inyectamos silenciosamente la contraseña temporal del servicio
    this.pwdData = { 
      actual: esForzado ? this.auth.getTempPassword() : '', 
      nueva: '', 
      confirmar: '' 
    };

    this.pwdRequisitos = { longitud: false, mayuscula: false, minuscula: false, numero: false, especial: false };
    
    this.formValido = false;
    this.mismaPassword = false; 
    this.errorBackend = ''; 
    this.hidePwd1 = true;
    this.hidePwd2 = true;
    this.hidePwd3 = true;
    this.isChangingPwd = false;

    this.dialog.open(this.changePasswordDialog, {
      width: '450px',
      panelClass: 'dark-password-dialog',
      disableClose: this.esForzadoModal || this.isChangingPwd
    });
  }

  guardarNuevaPassword(): void {
    if (!this.formValido) return;

    this.isChangingPwd = true;
    this.errorBackend = '';
    this.cdr.detectChanges(); 

    const payload = {
      nombre_usuario: this.username,
      password_actual: this.pwdData.actual,
      nueva_password: this.pwdData.nueva
    };

    this.subs.add(
      this.auth.cambiarPassword(payload).subscribe({
        next: (res) => {
          this.isChangingPwd = false;
          
          localStorage.setItem('siroce65_requiere_cambio', 'false');
          this.esForzadoModal = false;
          
          // 🔥 NUEVO: Borramos la contraseña temporal de la memoria por seguridad
          this.auth.clearTempPassword();

          this.dialog.closeAll();
          this.cdr.markForCheck(); 
          this.cdr.detectChanges();
          
          this.snackBar.open('✅ ' + res.message, 'OK', { 
            duration: 5000,
            panelClass: ['success-snackbar']
          });
        },
        error: (err) => {
          this.isChangingPwd = false;
          this.errorBackend = err.error?.message || 'Error al actualizar la contraseña.';
          this.cdr.markForCheck(); 
          this.cdr.detectChanges();
        }
      })
    );
  }
}