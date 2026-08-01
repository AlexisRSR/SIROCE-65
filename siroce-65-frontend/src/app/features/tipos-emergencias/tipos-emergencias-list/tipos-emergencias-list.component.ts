import { Component, OnInit, OnDestroy, AfterViewInit, ViewChild, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { MatTableDataSource } from '@angular/material/table';
import { MatPaginator }       from '@angular/material/paginator';
import { MatSort }            from '@angular/material/sort';
import { MatDialog }          from '@angular/material/dialog';
import { MatSnackBar }        from '@angular/material/snack-bar';
import { Subscription }       from 'rxjs';

import { TiposEmergenciasService, Prioridad } from '../../../core/services/tipos-emergencias.service';
import { TiposEmergenciasFormComponent } from '../tipos-emergencias-form/tipos-emergencias-form.component';
import { VehiculosService, TipoVehiculo } from '../../../core/services/vehiculos.service'; 

// 🔥 1. IMPORTAMOS EL SERVICIO DE SEGURIDAD
import { AuthService } from '../../../core/services/auth.service';

@Component({
  standalone     : false,
  selector       : 'app-tipos-emergencias-list',
  templateUrl    : './tipos-emergencias-list.component.html',
  styleUrls      : ['./tipos-emergencias-list.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TiposEmergenciasListComponent implements OnInit, AfterViewInit, OnDestroy {

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort)      sort!: MatSort;

  dataSource      = new MatTableDataSource<any>([]);
  displayedColumns = ['num', 'nombre', 'categoria', 'descripcion', 'prioridad', 'vehiculo', 'acciones'];

  isLoading  = false;
  deletingId : number | null = null;
  filterValue = '';

  stats = { total: 0, alta: 0, media: 0, baja: 0 };
  tiposVehiculos: TipoVehiculo[] = []; 
  
  userRole = ''; // 🔥 Variable para guardar el rol

  private readonly TIPOS_VEHICULOS_DEFAULT = [
    { ID_TIPO_V: 1, TIPO: 'Ambulancia' },
    { ID_TIPO_V: 2, TIPO: 'Panel acondicionada' },
    { ID_TIPO_V: 3, TIPO: 'Pickup' },
    { ID_TIPO_V: 4, TIPO: 'Motobomba' },
    { ID_TIPO_V: 5, TIPO: 'Cisterna' },
    { ID_TIPO_V: 6, TIPO: 'Camioneta' },
    { ID_TIPO_V: 7, TIPO: 'Sedán' },
    { ID_TIPO_V: 8, TIPO: 'Hatchback' },
    { ID_TIPO_V: 9, TIPO: 'Motocicleta' },
  ];
  
  private subs = new Subscription();

  constructor(
    private service     : TiposEmergenciasService,
    private vehiculoSvc : VehiculosService, 
    private dialog      : MatDialog,
    private snackBar    : MatSnackBar,
    private cdr         : ChangeDetectorRef,
    private auth        : AuthService // 🔥 2. INYECTAMOS EL SERVICIO
  ) {}

  ngOnInit(): void {
    // 🔥 3. OBTENEMOS EL ROL DEL USUARIO
    this.userRole = this.auth.getRole();

    // 🔥 4. BLOQUEO TOTAL: Si NO es ADMIN, quitamos la columna de acciones entera
    if (this.userRole !== 'ADMIN') {
      this.displayedColumns = this.displayedColumns.filter(col => col !== 'acciones');
    }

    this.configurarDataSource();
    this.cargarVehiculosYTareas(); 
  }

  ngAfterViewInit(): void {
    this.dataSource.paginator = this.paginator;
    this.dataSource.sort      = this.sort;
  }

  ngOnDestroy(): void {
    this.subs.unsubscribe();
  }

  private cargarVehiculosYTareas(): void {
    this.isLoading = true;
    this.vehiculoSvc.getTipos().subscribe({
      next: (res) => {
        this.tiposVehiculos = res.ok && res.data?.length ? res.data : this.TIPOS_VEHICULOS_DEFAULT;
        this.cargarTipos(); 
      },
      error: () => {
        this.tiposVehiculos = this.TIPOS_VEHICULOS_DEFAULT;
        this.cargarTipos(); 
      }
    });
  }

  private configurarDataSource(): void {
    this.dataSource.sortingDataAccessor = (item: any, property: string): string => {
      switch (property) {
        case 'nombre'     : return item.nombre?.toLowerCase()      ?? '';
        case 'categoria'  : return item.categoria?.toLowerCase()   ?? '';
        case 'descripcion': return item.descripcion?.toLowerCase() ?? '';
        case 'prioridad'  : return item.prioridad?.toLowerCase()   ?? '';
        default           : return '';
      }
    };

    this.dataSource.filterPredicate = (data: any, filter: string): boolean => {
      const haystack = [data.nombre, data.categoria, data.descripcion, data.prioridad].join(' ').toLowerCase();
      return haystack.includes(filter.trim().toLowerCase());
    };
  }

  cargarTipos(): void {
    this.isLoading = true;
    this.cdr.markForCheck();

    const sub = this.service.getAll().subscribe({
      next: (res) => {
        const listaBruta = res.ok ? (res.data as any[]) : [];
        
        const listaNormalizada = listaBruta.map(t => ({
          ...t,
          id_tipo_emergencia: t.ID_TIPO_S,
          nombre: t.TIPO_SERVICIO || '—',
          categoria: t.CATEGORIA || 'Emergencia',
          descripcion: t.DESCRIPCION || '—',
          prioridad: t.PRIORIDAD || 'Media',
          id_tipo_v: t.ID_TIPO_V || null
        }));

        this.dataSource.data = listaNormalizada;
        this.calcularEstadisticas(listaNormalizada);
        this.isLoading = false;
        this.cdr.markForCheck();
      },
      error: () => {
        this.isLoading = false;
        this.cdr.markForCheck();
        this.snackBar.open('Error al cargar los incidentes.', 'OK', { duration: 5000 });
      },
    });

    this.subs.add(sub);
  }

  private calcularEstadisticas(lista: any[]): void {
    this.stats = {
      total: lista.length,
      alta : lista.filter(t => t.prioridad === 'Alta').length,
      media: lista.filter(t => t.prioridad === 'Media').length,
      baja : lista.filter(t => t.prioridad === 'Baja').length,
    };
  }

  applyFilter(event: Event): void {
    this.filterValue        = (event.target as HTMLInputElement).value;
    this.dataSource.filter  = this.filterValue.trim().toLowerCase();
    this.dataSource.paginator?.firstPage();
  }

  clearFilter(inputEl: HTMLInputElement): void {
    inputEl.value          = '';
    this.filterValue       = '';
    this.dataSource.filter = '';
  }

  openForm(tipo: any = null): void {
    const dialogRef = this.dialog.open(TiposEmergenciasFormComponent, {
      width      : '550px',
      maxWidth   : '95vw',
      maxHeight  : '90vh',
      panelClass : 'dark-dialog',
      data       : tipo,
      disableClose: true,
    });

    dialogRef.afterClosed().subscribe(
      (result: { saved: boolean; action: 'create' | 'edit' } | undefined) => {
        if (result?.saved) {
          const msg = result.action === 'create'
            ? '✅ Incidente registrado correctamente.'
            : '✅ Incidente actualizado correctamente.';
          this.snackBar.open(msg, 'OK', { duration: 3500 });
          this.cargarTipos();
        }
      },
    );
  }

  onEdit(tipo: any): void {
    this.openForm(tipo);
  }

  onDelete(tipo: any): void {
    const idToDelete = tipo.id_tipo_emergencia; 
    const snackRef = this.snackBar.open(
      `¿Eliminar "${tipo.nombre}"?`,
      'CONFIRMAR',
      { duration: 6000, panelClass: ['snack-danger'] },
    );

    snackRef.onAction().subscribe(() => {
      this.deletingId = idToDelete;
      this.cdr.markForCheck();

      this.service.delete(idToDelete).subscribe({
        next: () => {
          this.deletingId = null;
          this.snackBar.open('Incidente eliminado.', 'OK', { duration: 3000 });
          this.cargarTipos();
        },
        error: (err) => {
          this.deletingId = null;
          this.cdr.markForCheck();
          const msg = err.status === 409
            ? 'No se puede eliminar: existen reportes vinculados a este incidente.'
            : 'Error al eliminar. Intente nuevamente.';
          this.snackBar.open(msg, 'OK', { duration: 5000 });
        },
      });
    });
  }

  getRowNumber(indexInPage: number): number {
    if (!this.paginator) return indexInPage + 1;
    return this.paginator.pageIndex * this.paginator.pageSize + indexInPage + 1;
  }

  getPrioridadClass(prioridad?: Prioridad): string {
    const map: Record<string, string> = {
      'Alta' : 'badge-alta', 'Media': 'badge-media', 'Baja' : 'badge-baja',
    };
    return map[prioridad ?? ''] ?? 'badge-default';
  }

  getPrioridadIcon(prioridad?: Prioridad): string {
    const map: Record<string, string> = {
      'Alta' : 'priority_high', 'Media': 'remove', 'Baja' : 'keyboard_arrow_down',
    };
    return map[prioridad ?? ''] ?? 'help_outline';
  }

  getNombreVehiculo(idTipoV: number | null): string {
    if (!idTipoV) return '—';
    const vehiculo = this.tiposVehiculos.find(v => v.ID_TIPO_V === idTipoV);
    return vehiculo ? vehiculo.TIPO : '—';
  }

  getIconoVehiculo(idTipoV: number | null): string {
    if (!idTipoV) return 'local_shipping';
    
    const vehiculo = this.tiposVehiculos.find(v => v.ID_TIPO_V === idTipoV);
    if (!vehiculo) return 'local_shipping';

    const nombre = vehiculo.TIPO.toLowerCase();
    
    if (nombre.includes('moto') && !nombre.includes('motobomba')) return 'two_wheeler'; 
    if (nombre.includes('ambulancia')) return 'airport_shuttle'; 
    if (nombre.includes('motobomba')) return 'fire_truck';
    if (nombre.includes('cisterna')) return 'water_drop'; 
    if (nombre.includes('sedán') || nombre.includes('hatchback') || nombre.includes('camioneta')) return 'directions_car';
    
    return 'local_shipping'; 
  }
}