import { Component, OnInit, OnDestroy, ViewChild, AfterViewInit, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { MatTableModule, MatTableDataSource } from '@angular/material/table'; 
import { MatPaginatorModule, MatPaginator } from '@angular/material/paginator';
import { MatSortModule, MatSort } from '@angular/material/sort';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatCardModule } from '@angular/material/card';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { Subscription } from 'rxjs';

import { UsuariosService } from '../../../core/services/usuarios.service';
import { UsuariosFormComponent } from '../usuarios-form/usuarios-form.component';

@Component({
  selector: 'app-gestion-usuarios',
  templateUrl: './gestion-usuarios.component.html',
  styleUrls: ['./gestion-usuarios.component.scss'],
  standalone: true,
  // Importación de submódulos de Angular Material para un Standalone Component
  imports: [
    CommonModule, MatIconModule, MatButtonModule, MatDialogModule, 
    MatFormFieldModule, MatInputModule, MatTooltipModule, MatCardModule, 
    MatProgressBarModule, 
    MatTableModule,       // Soporte para tablas de datos (mat-table)
    MatPaginatorModule,   // Controles de paginación
    MatSortModule         // Directivas de ordenamiento de columnas
  ],
  // Optimización de rendimiento: La vista solo se renderiza cuando cambian los datos o se solicita explícitamente
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class GestionUsuariosComponent implements OnInit, AfterViewInit, OnDestroy {

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  dataSource = new MatTableDataSource<any>([]);
  displayedColumns: string[] = ['num', 'nombre', 'usuario', 'rol', 'estado', 'acciones'];

  isLoading = false;
  togglingId: number | null = null; 
  filterValue = '';                    

  stats = { total: 0, activos: 0, inactivos: 0 };

  private subs = new Subscription();

  constructor(
    private usuariosService: UsuariosService,
    public dialog: MatDialog,
    private snackBar: MatSnackBar,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.configureDataSource();
    this.loadUsuarios();
  }

  ngAfterViewInit(): void {
    this.dataSource.paginator = this.paginator;
    this.dataSource.sort = this.sort;
  }

  ngOnDestroy(): void {
    this.subs.unsubscribe();
  }

  // Configuración de los algoritmos personalizados de búsqueda y ordenamiento
  private configureDataSource(): void {
    // Sobrescribe el ordenamiento por defecto para manejar propiedades anidadas
    this.dataSource.sortingDataAccessor = (item: any, property: string): string | number => {
      switch (property) {
        case 'nombre': return item.nombreCompleto?.toLowerCase() || '';
        case 'usuario': return item.usuario?.toLowerCase() || '';
        case 'rol': return item.rol?.toLowerCase() || '';
        case 'estado': return item.activo ? 'activo' : 'inactivo';
        default: return '';
      }
    };

    // Filtro global multidimensional (busca en múltiples columnas simultáneamente)
    this.dataSource.filterPredicate = (data: any, filter: string): boolean => {
      const haystack = [
        data.nombreCompleto,
        data.dpi,
        data.usuario,
        data.rol,
        data.activo ? 'activo' : 'inactivo'
      ].join(' ').toLowerCase();
      return haystack.includes(filter.trim().toLowerCase());
    };
  }

  loadUsuarios(): void {
    this.isLoading = true;
    this.cdr.markForCheck(); // Notifica al ChangeDetector en estrategia OnPush

    const sub = this.usuariosService.obtenerUsuarios().subscribe({
      next: (data: any) => {
        // Normalización y mapeo de datos provenientes del backend
        const listaNormalizada = data.map((u: any) => ({
          id_usuario: u.id_usuario,
          nombrePersona: u.nombre_persona,
          apellidoPersona: u.apellido_persona,
          nombreCompleto: u.nombreCompleto || u.nombre_usuario, 
          dpi: u.dpi,
          usuario: u.usuario_sistema || u.usuario || u.nombre_usuario,
          rol: u.rol?.nombre || u.rol || 'Desconocido',
          activo: u.activo
        }));

        this.dataSource.data = listaNormalizada;
        this.calcularEstadisticas(listaNormalizada);
        this.isLoading = false;
        this.cdr.markForCheck();
      },
      error: () => {
        this.isLoading = false;
        this.cdr.markForCheck();
        this.snackBar.open('Error al cargar la lista de usuarios.', 'OK', { duration: 5000 });
      }
    });
    this.subs.add(sub);
  }

  private calcularEstadisticas(lista: any[]): void {
    this.stats = {
      total: lista.length,
      activos: lista.filter(u => u.activo).length,
      inactivos: lista.filter(u => !u.activo).length
    };
  }

  applyFilter(event: Event): void {
    this.filterValue = (event.target as HTMLInputElement).value;
    this.dataSource.filter = this.filterValue.trim().toLowerCase();
    this.dataSource.paginator?.firstPage();
  }

  clearFilter(inputEl: HTMLInputElement): void {
    inputEl.value = '';
    this.filterValue = '';
    this.dataSource.filter = '';
  }

  openForm(usuario: any = null): void {
    const dialogRef = this.dialog.open(UsuariosFormComponent, {
      width: '560px',
      maxWidth: '95vw',
      panelClass: 'dark-dialog',
      data: usuario, // Inyección de datos para el modo edición        
      disableClose: true,        
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result?.saved) {
        const msg = result.action === 'edit' 
          ? 'Operador actualizado correctamente en el sistema.' 
          : 'Operador registrado correctamente en el sistema.';
        this.snackBar.open(msg, 'OK', { duration: 3500 });
        this.loadUsuarios();
      }
    });
  }

  onEdit(usuario: any): void {
    this.openForm(usuario);
  }

  // Lógica de cambio de estado (Soft Delete o Suspensión)
  toggleEstado(usuario: any): void {
    const accion = usuario.activo ? 'Desactivar' : 'Activar';
    const esBloqueo = usuario.activo; 

    const snackRef = this.snackBar.open(
      `¿Desea ${accion.toLowerCase()} la cuenta de ${usuario.nombreCompleto}?`,
      'CONFIRMAR',
      {
        duration: 6000,
        panelClass: esBloqueo ? ['snack-danger'] : ['bg-green-600', 'text-white'],
      }
    );

    snackRef.onAction().subscribe(() => {
      this.togglingId = usuario.id_usuario;
      this.cdr.markForCheck();

      this.usuariosService.cambiarEstado(usuario.id_usuario).subscribe({
        next: (res: any) => {
          this.togglingId = null;
          this.snackBar.open(res.mensaje || `Cuenta ${accion.toLowerCase()}da correctamente.`, 'OK', { duration: 3000 });
          this.loadUsuarios();
        },
        error: (err: any) => {
          this.togglingId = null;
          this.cdr.markForCheck();
          this.snackBar.open('Error de comunicación al intentar cambiar el estado.', 'OK', { duration: 5000 });
        }
      });
    });
  }

  getInitials(nombreCompleto: string): string {
    if (!nombreCompleto) return '?';
    const partes = nombreCompleto.trim().split(' ');
    const n = partes[0]?.[0] || '';
    const a = partes.length > 1 ? partes[1]?.[0] : '';
    return `${n}${a}`.toUpperCase();
  }
}