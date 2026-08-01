// src/app/app.module.ts
// ── Módulo Raíz de SIROCE-65 ──────────────────────────────────
import { NgModule }              from '@angular/core';
import { BrowserModule }         from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { HttpClientModule, HTTP_INTERCEPTORS } from '@angular/common/http';
import { CommonModule }          from '@angular/common';
import { RouterModule }          from '@angular/router';

// ── Angular Material ──────────────────────────────────────────
import { MatSidenavModule }   from '@angular/material/sidenav';
import { MatToolbarModule }   from '@angular/material/toolbar';
import { MatIconModule }      from '@angular/material/icon';
import { MatButtonModule }    from '@angular/material/button';
import { MatListModule }      from '@angular/material/list';
import { MatMenuModule }      from '@angular/material/menu';
import { MatCardModule }      from '@angular/material/card';
import { MatDividerModule }   from '@angular/material/divider';
import { MatTooltipModule }   from '@angular/material/tooltip';
import { MatRippleModule }    from '@angular/material/core';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatSnackBarModule }  from '@angular/material/snack-bar';
import { MatTableModule }     from '@angular/material/table';
import { MatPaginatorModule, MatPaginatorIntl } from '@angular/material/paginator';
import { MatSortModule }      from '@angular/material/sort';
import { MatInputModule }     from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule }    from '@angular/material/select';
import { MatChipsModule }     from '@angular/material/chips';
import { MatBadgeModule }     from '@angular/material/badge';
import { MatDialogModule }    from '@angular/material/dialog';

// 🔥 AÑADIMOS ReactiveFormsModule AQUÍ JUNTO A FormsModule
import { FormsModule, ReactiveFormsModule } from '@angular/forms'; 

// ── CDK ───────────────────────────────────────────────────────
import { LayoutModule } from '@angular/cdk/layout';

// ── Módulos de la aplicación ──────────────────────────────────
import { AppRoutingModule }           from './app-routing.module';
import { AppComponent }               from './app.component';
import { SharedModule }               from './shared/shared.module';

// Layout shell
import { MainLayoutComponent }        from './layout/main-layout/main-layout.component';

// Páginas
import { HomeComponent }              from './pages/home/home.component';
import { BomberosComponent }          from './pages/bomberos/bomberos.component';
import { VehiculosComponent }         from './pages/vehiculos/vehiculos.component';
import { ServiciosComponent }         from './pages/servicios/servicios.component';
import { LandingPageComponent }       from './pages/landing-page/landing-page.component';

// 🔥 IMPORTAMOS TU NUEVO COMPONENTE AQUÍ
import { GestionUsuariosComponent }   from './features/usuarios/gestion-usuarios/gestion-usuarios.component';

// Core
import { AuthInterceptor }            from './core/interceptors/auth.interceptor';

// ── Declaración de Material para reutilizar en templates ──────
const MATERIAL_MODULES = [
  MatSidenavModule,
  MatToolbarModule,
  MatIconModule,
  MatButtonModule,
  MatListModule,
  MatMenuModule,
  MatCardModule,
  MatDividerModule,
  MatTooltipModule,
  MatRippleModule,
  MatProgressBarModule,
  MatSnackBarModule,
  MatTableModule,
  MatPaginatorModule,
  MatSortModule,
  MatInputModule,
  MatFormFieldModule,
  MatSelectModule,
  MatChipsModule,
  MatBadgeModule,
  MatDialogModule,
  LayoutModule,
];

// 🔥 FUNCIÓN PARA TRADUCIR EL PAGINADOR AL ESPAÑOL
export function getSpanishPaginatorIntl() {
  const paginatorIntl = new MatPaginatorIntl();
  
  paginatorIntl.itemsPerPageLabel = 'Registros por página:';
  paginatorIntl.nextPageLabel = 'Siguiente página';
  paginatorIntl.previousPageLabel = 'Página anterior';
  paginatorIntl.firstPageLabel = 'Primera página';
  paginatorIntl.lastPageLabel = 'Última página';
  
  paginatorIntl.getRangeLabel = (page: number, pageSize: number, length: number) => {
    if (length === 0 || pageSize === 0) {
      return `0 de ${length}`;
    }
    length = Math.max(length, 0);
    const startIndex = page * pageSize;
    const endIndex = startIndex < length ? Math.min(startIndex + pageSize, length) : startIndex + pageSize;
    return `${startIndex + 1} - ${endIndex} de ${length}`;
  };
  
  return paginatorIntl;
}

@NgModule({
  declarations: [
    AppComponent,
    MainLayoutComponent,
    HomeComponent,
    BomberosComponent,
    VehiculosComponent,
    ServiciosComponent,
    LandingPageComponent,
    // ❌ QUEDÓ ELIMINADO DE AQUÍ
  ],
  imports: [
    BrowserModule,
    BrowserAnimationsModule,
    HttpClientModule,
    CommonModule,
    RouterModule,
    FormsModule,
    ReactiveFormsModule, 
    GestionUsuariosComponent, // ✅ AHORA ESTÁ AQUÍ EN LOS IMPORTS
    AppRoutingModule,
    SharedModule,
    ...MATERIAL_MODULES,
  ],
  providers: [
    {
      provide : HTTP_INTERCEPTORS,
      useClass: AuthInterceptor,
      multi   : true,
    },
    { 
      provide: MatPaginatorIntl, 
      useValue: getSpanishPaginatorIntl() 
    }
  ],
  bootstrap: [AppComponent],
})
export class AppModule {}