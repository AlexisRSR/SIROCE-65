import { Component, OnInit, OnDestroy, AfterViewInit, ViewChild, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { MatTableDataSource } from '@angular/material/table';
import { MatPaginator }       from '@angular/material/paginator';
import { MatSort }            from '@angular/material/sort';
import { MatDialog }          from '@angular/material/dialog';
import { MatSnackBar }        from '@angular/material/snack-bar';
import { Subscription }       from 'rxjs';
import { VehiculosService, Vehiculo }  from '../../../core/services/vehiculos.service';
import { VehiculosFormComponent } from '../vehiculos-form/vehiculos-form.component';

// 🔥 1. IMPORTAMOS EL SERVICIO DE SEGURIDAD
import { AuthService } from '../../../core/services/auth.service';

@Component({
  standalone     : false,
  selector       : 'app-vehiculos-list',
  templateUrl    : './vehiculos-list.component.html',
  styleUrls      : ['./vehiculos-list.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class VehiculosListComponent implements OnInit, AfterViewInit, OnDestroy {
  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort)      sort!: MatSort;

  dataSource      = new MatTableDataSource<any>([]);
  displayedColumns = ['num', 'unidad', 'placa', 'tipo', 'estado', 'kilometraje', 'acciones'];
  isLoading  = false;
  deletingId : number | null = null;
  filterValue = '';
  stats = { total: 0, operativos: 0, enTaller: 0 };
  
  userRole = ''; // 🔥 Variable para guardar el rol

  private subs = new Subscription();

  constructor(
    private service : VehiculosService,
    private dialog  : MatDialog,
    private snackBar: MatSnackBar,
    private cdr     : ChangeDetectorRef,
    private auth    : AuthService // 🔥 2. INYECTAMOS EL SERVICIO
  ) {}

  ngOnInit(): void {
    // 🔥 3. OBTENEMOS EL ROL DEL USUARIO (Aquí NO borramos la columna de acciones)
    this.userRole = this.auth.getRole();
    
    this.configureDataSource();
    this.loadVehiculos();
  }

  ngAfterViewInit(): void {
    this.dataSource.paginator = this.paginator;
    this.dataSource.sort      = this.sort;
  }

  ngOnDestroy(): void {
    this.subs.unsubscribe();
  }

  private configureDataSource(): void {
    this.dataSource.sortingDataAccessor = (item: any, property: string): string | number => {
      switch (property) {
        case 'unidad'     : return `${item.NUMERO_UNIDAD} ${item.MARCA} ${item.MODELO}`.toLowerCase();
        case 'tipo'       : return item.tipoVehiculo?.TIPO?.toLowerCase() ?? '';
        case 'estado'     : return item.estadoVehiculo?.ESTADO?.toLowerCase() ?? '';
        case 'kilometraje': return item.KILOMETRAJE_ACTUAL ?? 0;
        default           : return '';
      }
    };
    this.dataSource.filterPredicate = (data: any, filter: string): boolean => {
      const haystack = [
        data.NUMERO_UNIDAD, 
        data.PLACA, 
        data.MARCA, 
        data.MODELO, 
        data.tipoVehiculo?.TIPO, 
        data.estadoVehiculo?.ESTADO
      ].join(' ').toLowerCase();
      return haystack.includes(filter.trim().toLowerCase());
    };
  }

  loadVehiculos(): void {
    this.isLoading = true;
    this.cdr.markForCheck();

    const sub = this.service.getAll().subscribe({
      next: (res) => {
        const listaBruta = res.ok ? (res.data as any[]) : [];
        
        const listaNormalizada = listaBruta.map(v => {
          const idTipo = v.ID_TIPO_V;
          const idEstado = v.ID_ESTADO_V;

          const tipos: any = { 
            1: 'Ambulancia', 2: 'Panel acondicionada', 3: 'Pickup', 4: 'Motobomba', 
            5: 'Cisterna', 6: 'Camioneta', 7: 'Sedán', 8: 'Hatchback', 9: 'Motocicleta' 
          };
          const estados: any = { 1: 'Operativo', 2: 'En Taller', 3: 'Fuera de Servicio' };

          const txtTipo = tipos[idTipo] || '—';
          const txtEstado = estados[idEstado] || '—';

          return {
            ...v,
            tipoVehiculo: { TIPO: txtTipo },
            estadoVehiculo: { ESTADO: txtEstado }
          };
        });

        this.dataSource.data = listaNormalizada;
        this.calcularEstadisticas(listaNormalizada);
        this.isLoading = false;
        this.cdr.markForCheck();
      },
      error: () => {
        this.isLoading = false;
        this.cdr.markForCheck();
        this.snackBar.open('Error al cargar unidades.', 'OK', { duration: 5000 });
      },
    });
    this.subs.add(sub);
  }

  private calcularEstadisticas(lista: any[]): void {
    this.stats = {
      total     : lista.length,
      operativos: lista.filter(v => {
        const e = (v.estadoVehiculo?.ESTADO || '').toLowerCase();
        return e.includes('operativ') || e.includes('disponible');
      }).length,
      enTaller  : lista.filter(v => {
        const e = (v.estadoVehiculo?.ESTADO || '').toLowerCase();
        return e.includes('taller') || e.includes('mantenimiento');
      }).length,
    };
  }

  getRowNumber(indexInPage: number): number {
    if (!this.paginator) return indexInPage + 1;
    return this.paginator.pageIndex * this.paginator.pageSize + indexInPage + 1;
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

  openForm(vehiculo: any = null): void {
    const dialogRef = this.dialog.open(VehiculosFormComponent, {
      width      : '540px', maxWidth   : '95vw', maxHeight  : '90vh', panelClass : 'dark-dialog',
      data       : vehiculo, disableClose: true,
    });
    
    dialogRef.afterClosed().subscribe((result: any) => {
      if (result?.saved) {
        const msg = result.action === 'create' ? '✅ Unidad registrada.' : '✅ Unidad actualizada.';
        this.snackBar.open(msg, 'OK', { duration: 3500 });
        this.loadVehiculos(); 
      }
    });
  }

  onEdit(vehiculo: any): void { this.openForm(vehiculo); }

  onDelete(vehiculo: any): void {
    const snackRef = this.snackBar.open(`¿Dar de baja la unidad ${vehiculo.NUMERO_UNIDAD || vehiculo.PLACA}?`, 'CONFIRMAR', { duration: 6000, panelClass: ['snack-danger'] });
    snackRef.onAction().subscribe(() => {
      this.deletingId = vehiculo.ID_VEHICULO ?? null;
      this.cdr.markForCheck();
      this.service.delete(vehiculo.ID_VEHICULO!).subscribe({
        next: () => {
          this.deletingId = null;
          this.snackBar.open('Unidad eliminada.', 'OK', { duration: 3000 });
          this.loadVehiculos();
        },
        error: () => {
          this.deletingId = null;
          this.cdr.markForCheck();
          this.snackBar.open('Error al eliminar.', 'OK', { duration: 5000 });
        },
      });
    });
  }

  getIconForTipo(tipo?: string): string {
    if (!tipo) return 'directions_car';
    const t = tipo.toLowerCase();
    if (t.includes('ambulan'))  return 'local_hospital';
    if (t.includes('bomba') || t.includes('cisterna'))    return 'local_fire_department';
    if (t.includes('rescate'))  return 'emergency';
    if (t.includes('pick') || t.includes('panel'))     return 'local_shipping';
    if (t.includes('moto')) return 'two_wheeler';
    return 'directions_car';
  }

  getTipoClass(tipo?: string): string {
    if (!tipo) return 'badge-default';
    const t = tipo.toLowerCase();
    if (t.includes('ambulan'))  return 'badge-ambulancia';
    if (t.includes('bomba') || t.includes('cisterna'))    return 'badge-motobomba';
    if (t.includes('rescate'))  return 'badge-rescate';
    if (t.includes('pick') || t.includes('panel'))     return 'badge-pickup';
    return 'badge-default';
  }

  getEstadoClass(estado?: string): string {
    if (!estado) return 'badge-default';
    const e = estado.toLowerCase();
    if (e.includes('operativ') || e.includes('disponible')) return 'badge-operativo';
    if (e.includes('taller')   || e.includes('mantenimiento')) return 'badge-taller';
    if (e.includes('fuera')    || e.includes('baja'))       return 'badge-fuera';
    return 'badge-default';
  }
}