// src/app/features/bomberos/bomberos-list/bomberos-list.component.ts
import {
  Component,
  OnInit,
  OnDestroy,
  ViewChild,
  AfterViewInit,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
} from '@angular/core';
import { MatTableDataSource } from '@angular/material/table';
import { MatPaginator }       from '@angular/material/paginator';
import { MatSort }            from '@angular/material/sort';
import { MatDialog }          from '@angular/material/dialog';
import { MatSnackBar }        from '@angular/material/snack-bar';
import { Subscription }       from 'rxjs';

import {
  BomberosService,
  Bombero,
}  from '../../../core/services/bomberos.service';
import { BomberosFormComponent } from '../bomberos-form/bomberos-form.component';

// 🔥 1. IMPORTAMOS EL SERVICIO DE SEGURIDAD
import { AuthService } from '../../../core/services/auth.service';

@Component({
  standalone   : false,           
  selector     : 'app-bomberos-list',
  templateUrl  : './bomberos-list.component.html',
  styleUrls    : ['./bomberos-list.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BomberosListComponent implements OnInit, AfterViewInit, OnDestroy {

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort)      sort!: MatSort;

  dataSource      = new MatTableDataSource<any>([]);
  
  // 🔥 2. CAMBIAMOS 'fechaIngreso' POR 'turno' EN LAS COLUMNAS VISIBLES
  displayedColumns: string[] = ['num', 'nombre', 'grado', 'cargo', 'estado', 'turno', 'acciones'];

  isLoading  = false;
  deletingId : number | null = null;   
  filterValue = '';                    
  
  userRole = ''; // 🔥 Variable para guardar el rol

  stats = { total: 0, activos: 0, suspendidos: 0, bajas: 0 }; 

  private subs = new Subscription();

  constructor(
    private service : BomberosService,
    private dialog  : MatDialog,
    private snackBar: MatSnackBar,
    private cdr     : ChangeDetectorRef,
    private auth    : AuthService // 🔥 3. INYECTAMOS EL SERVICIO
  ) {}

  ngOnInit(): void {
    // 🔥 4. OBTENEMOS EL ROL DEL USUARIO
    this.userRole = this.auth.getRole();

    // 🔥 5. BLOQUEO DE SEGURIDAD: Si no es ADMIN, quitamos las acciones
    if (this.userRole !== 'ADMIN') {
      this.displayedColumns = this.displayedColumns.filter(col => col !== 'acciones');
    }

    this.configureDataSource();
    this.loadBomberos();
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
        case 'nombre':
          return `${item.persona?.NOMBRE ?? ''} ${item.persona?.APELLIDO ?? ''}`.toLowerCase();
        case 'grado':
          return item.grado?.GRADO?.toLowerCase() ?? '';
        case 'estado':
          return item.estado?.ESTADO?.toLowerCase() ?? '';
        case 'turno': // 🔥 Agregamos el turno al filtro de ordenamiento
          return item.TURNO?.toLowerCase() ?? '';
        default:
          return '';
      }
    };

    this.dataSource.filterPredicate = (data: any, filter: string): boolean => {
      const haystack = [
        data.persona?.NOMBRE,
        data.persona?.APELLIDO,
        data.persona?.TELEFONO, // 🔥 Agregamos el teléfono al buscador
        data.grado?.GRADO,
        data.estado?.ESTADO,
        data.TURNO,             // 🔥 Agregamos el turno al buscador
      ].join(' ').toLowerCase();

      return haystack.includes(filter.trim().toLowerCase());
    };
  }

  loadBomberos(): void {
    this.isLoading = true;
    this.cdr.markForCheck();

    const sub = this.service.getAll().subscribe({
      next: (res) => {
        const listaBruta = res.ok ? (res.data as any[]) : [];
        
        const listaNormalizada = listaBruta.map(b => {
          const keys = Object.keys(b);
          
          let estadoFinal = 'Activo'; 
          const keyEstadoObj = keys.find(k => ['estado', 'estadobombero', 'tb_estado_bombero'].includes(k.toLowerCase()));
          
          if (keyEstadoObj && b[keyEstadoObj] && typeof b[keyEstadoObj] === 'object') {
            const subKeys = Object.keys(b[keyEstadoObj]);
            const subKeyEstado = subKeys.find(sk => ['estado', 'nombre', 'nombre_estado'].includes(sk.toLowerCase()));
            if (subKeyEstado) estadoFinal = b[keyEstadoObj][subKeyEstado];
          } else {
            const idEstado = b.ID_ESTADO_B || b.id_estado_b;
            if (idEstado == 1) estadoFinal = 'Activo';
            else if (idEstado == 2) estadoFinal = 'Suspendido';
            else if (idEstado == 3) estadoFinal = 'Baja';
          }

          let gradoFinal = 'Caballero';
          const keyGradoObj = keys.find(k => ['grado', 'gradobombero', 'tb_grado_bombero'].includes(k.toLowerCase()));
          
          if (keyGradoObj && b[keyGradoObj] && typeof b[keyGradoObj] === 'object') {
            const subKeys = Object.keys(b[keyGradoObj]);
            const subKeyGrado = subKeys.find(sk => ['grado', 'nombre', 'nombre_grado'].includes(sk.toLowerCase()));
            if (subKeyGrado) gradoFinal = b[keyGradoObj][subKeyGrado];
          } else {
            const keyGradoFlat = keys.find(k => ['grado', 'nombre_grado', 'grado_bombero'].includes(k.toLowerCase()));
            if (keyGradoFlat && typeof b[keyGradoFlat] === 'string') gradoFinal = b[keyGradoFlat];
          }

          return {
            ...b,
            estado: { ESTADO: estadoFinal },
            grado: { GRADO: gradoFinal }
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
        this.snackBar.open('Error al cargar el listado.', 'OK', { duration: 5000 });
      },
    });

    this.subs.add(sub);
  }

  private calcularEstadisticas(lista: any[]): void {
    this.stats = {
      total      : lista.length,
      activos    : lista.filter(b => b.estado?.ESTADO?.toLowerCase() === 'activo').length,
      suspendidos: lista.filter(b => b.estado?.ESTADO?.toLowerCase() === 'suspendido').length,
      bajas      : lista.filter(b => b.estado?.ESTADO?.toLowerCase() === 'baja').length,
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

  openForm(bombero: any = null): void {
    const dialogRef = this.dialog.open(BomberosFormComponent, {
      width    : '560px',
      maxWidth : '95vw',
      maxHeight: '90vh',
      panelClass: 'dark-dialog',
      data     : bombero,        
      disableClose: true,        
    });

    dialogRef.afterClosed().subscribe((result: { saved: boolean; action: 'create' | 'edit' } | undefined) => {
      if (result?.saved) {
        const msg = result.action === 'create'
          ? '✅ Bombero registrado correctamente.'
          : '✅ Bombero actualizado correctamente.';
        this.snackBar.open(msg, 'OK', { duration: 3500 });
        this.loadBomberos();   
      }
    });
  }

  onEdit(bombero: any): void {
    this.openForm(bombero);
  }

  onDelete(bombero: any): void {
    const nombre = `${bombero.persona?.NOMBRE ?? ''} ${bombero.persona?.APELLIDO ?? ''}`.trim();
    const idToDelete = bombero.ID_BOMBERO || bombero.id_bombero || bombero.id;

    const snackRef = this.snackBar.open(
      `¿Eliminar a ${nombre || `bombero #${idToDelete}`}?`,
      'CONFIRMAR',
      {
        duration  : 6000,
        panelClass: ['snack-danger'],
      },
    );

    snackRef.onAction().subscribe(() => {
      this.deletingId = idToDelete ?? null;
      this.cdr.markForCheck();

      this.service.delete(idToDelete!).subscribe({
        next: () => {
          this.deletingId = null;
          this.snackBar.open('Bombero eliminado.', 'OK', { duration: 3000 });
          this.loadBomberos();
        },
        error: (err) => {
          this.deletingId = null;
          this.cdr.markForCheck();
          const msg = err.status === 409
            ? 'No se puede eliminar: el bombero tiene registros asociados.'
            : 'Error al eliminar. Intente nuevamente.';
          this.snackBar.open(msg, 'OK', { duration: 5000 });
        },
      });
    });
  }

  getInitials(bombero: any): string {
    const n = bombero.persona?.NOMBRE?.[0]  ?? '';
    const a = bombero.persona?.APELLIDO?.[0] ?? '';
    return `${n}${a}`.toUpperCase() || '?';
  }

  getEstadoClass(estado?: string): string {
    if (!estado) return 'badge-default';
    const map: Record<string, string> = {
      'activo'    : 'badge-activo',
      'suspendido': 'badge-suspendido',
      'baja'      : 'badge-baja',
    };
    return map[estado.toLowerCase()] ?? 'badge-default';
  }
}