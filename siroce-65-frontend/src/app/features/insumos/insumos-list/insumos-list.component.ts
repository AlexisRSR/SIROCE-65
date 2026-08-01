// src/app/features/insumos/insumos-list/insumos-list.component.ts
import { Component, OnInit, OnDestroy, AfterViewInit, ViewChild, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { MatTableDataSource } from '@angular/material/table';
import { MatPaginator }       from '@angular/material/paginator';
import { MatSort }            from '@angular/material/sort';
import { MatDialog }          from '@angular/material/dialog';
import { MatSnackBar }        from '@angular/material/snack-bar';
import { Subscription }       from 'rxjs';

import { InsumosService, Insumo } from '../../../core/services/insumos.service';
import { InsumosFormComponent } from '../insumos-form/insumos-form.component';
// 🔥 1. IMPORTAMOS EL SERVICIO DE SEGURIDAD
import { AuthService } from '../../../core/services/auth.service';

@Component({
  standalone     : false,
  selector       : 'app-insumos-list',
  templateUrl    : './insumos-list.component.html',
  styleUrls      : ['./insumos-list.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class InsumosListComponent implements OnInit, AfterViewInit, OnDestroy {

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort)      sort!: MatSort;

  dataSource      = new MatTableDataSource<Insumo>([]);
  // 🔥 TESIS: Agregamos Propósito y Marca a las columnas visibles
  displayedColumns = ['num', 'nombre', 'tipo', 'proposito', 'marca', 'stock', 'estado', 'acciones'];

  isLoading  = false;
  deletingId : number | null = null;
  filterValue = '';
  
  userRole = ''; // 🔥 Variable para guardar el rol y usarla en el HTML

  // 🔥 TESIS: Estadísticas adaptadas al Catálogo Unificado
  stats = { total: 0, herramientas: 0, medicos: 0, epp: 0, bajoStock: 0 };
  private subs = new Subscription();

  constructor(
    private service : InsumosService,
    private dialog  : MatDialog,
    private snackBar: MatSnackBar,
    private cdr     : ChangeDetectorRef,
    private auth    : AuthService // 🔥 2. LO INYECTAMOS AQUÍ EN EL CONSTRUCTOR
  ) {}

  ngOnInit(): void {
    // Obtenemos el rol del usuario
    this.userRole = this.auth.getRole();

    // 🔥 BORRAMOS el if que ocultaba la columna entera de 'acciones'. 
    // Ahora todos ven la columna.

    this.configurarDataSource();
    this.loadInsumos();
  }

  ngAfterViewInit(): void {
    this.dataSource.paginator = this.paginator;
    this.dataSource.sort      = this.sort;
  }

  ngOnDestroy(): void {
    this.subs.unsubscribe();
  }

  private configurarDataSource(): void {
    this.dataSource.sortingDataAccessor = (item: Insumo, property: string): string | number => {
      switch (property) {
        case 'nombre'    : return item.nombre?.toLowerCase()    ?? '';
        case 'tipo'      : return item.tipoInsumo?.toLowerCase() ?? '';
        case 'proposito' : return item.proposito?.toLowerCase() ?? '';
        case 'marca'     : return item.marca?.toLowerCase() ?? '';
        case 'stock'     : return item.stock                    ?? 0;
        case 'estado'    : return item.estado?.toLowerCase()    ?? '';
        default          : return '';
      }
    };

    this.dataSource.filterPredicate = (data: Insumo, filter: string): boolean => {
      const haystack = [data.nombre, data.tipoInsumo, data.estado, data.proposito, data.marca, data.modelo]
        .join(' ').toLowerCase();
      return haystack.includes(filter.trim().toLowerCase());
    };
  }

  // ════════════════════════════════════════════════════════════
  //  CARGA DE DATOS — MAPEO ESTRICTO (RADAR DE VARIABLES)
  //  Captura TODOS los campos nuevos para que no se borren al editar
  // ════════════════════════════════════════════════════════════
  loadInsumos(): void {
    this.isLoading = true;
    this.cdr.markForCheck();

    const sub = this.service.getAll().subscribe({
      next: (res) => {
        const lista: Insumo[] = res.ok
          ? (res.data as any[]).map((raw: any) => ({
              id         : raw.ID_INSUMO,
              nombre     : raw.NOMBRE      ?? '',
              descripcion: raw.DESCRIPCION ?? '',
              tipoInsumo : raw.TIPO_INSUMO ?? '',
              stock      : raw.STOCK       ?? 0,
              estado     : raw.ESTADO      ?? 'Activo',
              // 🔥 Captura de Trazabilidad y Propósito
              marca      : raw.MARCA       ?? '',
              modelo     : raw.MODELO      ?? '',
              numeroSerie: raw.NUMERO_SERIE ?? '',
              proposito  : raw.PROPOSITO   ?? ''
            }))
          : [];

        this.dataSource.data = lista;
        this.calcularEstadisticas(lista);
        this.isLoading = false;
        this.cdr.markForCheck();
      },
      error: () => {
        this.isLoading = false;
        this.cdr.markForCheck();
        this.snackBar.open('Error al cargar los recursos.', 'OK', { duration: 5000 });
      },
    });
    this.subs.add(sub);
  }

  private calcularEstadisticas(lista: Insumo[]): void {
    this.stats = {
      total       : lista.length,
      herramientas: lista.filter(i => i.tipoInsumo === 'Herramienta').length,
      medicos     : lista.filter(i => i.tipoInsumo === 'Insumo Médico').length,
      epp         : lista.filter(i => i.tipoInsumo === 'EPP').length,
      bajoStock   : lista.filter(i => i.estado     === 'Bajo Stock').length,
    };
  }

  applyFilter(event: Event): void {
    this.filterValue        = (event.target as HTMLInputElement).value;
    this.dataSource.filter  = this.filterValue.trim().toLowerCase();
    this.dataSource.paginator?.firstPage();
  }

  clearFilter(inputEl: HTMLInputElement): void {
    inputEl.value = ''; this.filterValue = ''; this.dataSource.filter = '';
  }

  openForm(insumo: Insumo | null = null): void {
    const ref = this.dialog.open(InsumosFormComponent, {
      width: '560px', maxWidth: '95vw', maxHeight: '95vh',
      panelClass: 'dark-dialog', data: insumo, disableClose: true,
    });

    ref.afterClosed().subscribe((result?: { saved: boolean; action: 'create' | 'edit' }) => {
      if (result?.saved) {
        const msg = result.action === 'create' ? '✅ Recurso registrado.' : '✅ Recurso actualizado.';
        this.snackBar.open(msg, 'OK', { duration: 3500 });
        this.loadInsumos();
      }
    });
  }

  onEdit(insumo: Insumo): void {
    this.openForm(insumo); // El insumo ya lleva la marca y modelo ocultos
  }

  onDelete(insumo: Insumo): void {
    const ref = this.snackBar.open(
      `¿Eliminar "${insumo.nombre}"?`, 'CONFIRMAR',
      { duration: 6000, panelClass: ['snack-danger'] },
    );

    ref.onAction().subscribe(() => {
      this.deletingId = insumo.id || null;
      this.cdr.markForCheck();

      this.service.delete(insumo.id!).subscribe({
        next: () => {
          this.deletingId = null;
          this.snackBar.open('Recurso eliminado.', 'OK', { duration: 3000 });
          this.loadInsumos();
        },
        error: (err) => {
          this.deletingId = null;
          this.cdr.markForCheck();
          this.snackBar.open(
            err.status === 409 ? 'No se puede eliminar: tiene registros asociados.' : 'Error al eliminar.',
            'OK', { duration: 5000 },
          );
        },
      });
    });
  }

  // ════════════════════════════════════════════════════════════
  //  HELPERS DE PRESENTACIÓN (Actualizados para Herramienta, Médico y EPP)
  // ════════════════════════════════════════════════════════════
  getTipoIcon(tipo?: string): string {
    if (tipo === 'Herramienta') return 'construction';
    if (tipo === 'Insumo Médico' || tipo === 'Médico') return 'local_hospital';
    if (tipo === 'EPP') return 'security';
    return 'inventory_2';
  }

  // 🔥 TRADUCTOR VISUAL: Expande el acrónimo EPP para mejorar la usabilidad en la interfaz
  getTipoLabel(tipo?: string): string {
    if (tipo === 'EPP') return 'Protección (EPP)';
    if (tipo === 'Médico') return 'Insumo Médico'; // Mapeo por compatibilidad de registros antiguos
    return tipo || '—';
  }

  getTipoClass(tipo?: string): string {
    if (tipo === 'Herramienta') return 'badge-herramienta';
    if (tipo === 'Insumo Médico' || tipo === 'Médico') return 'badge-medico';
    if (tipo === 'EPP') return 'badge-rescate'; // Reusamos el color naranja del antiguo rescate
    return 'badge-default';
  }

  getEstadoClass(estado?: string): string {
    const map: Record<string, string> = {
      'Activo'       : 'badge-activo',
      'Disponible'   : 'badge-activo',
      'Bajo Stock'   : 'badge-bajo',
      'En Reparación': 'badge-reparacion',
      'Prestado'     : 'badge-prestado',
      'De Baja'      : 'badge-inactivo',
      'Inactivo'     : 'badge-inactivo',
    };
    return map[estado ?? ''] ?? 'badge-default';
  }

  getStockClass(stock: number): string {
    if (stock === 0)  return 'stock-cero';
    if (stock < 10)   return 'stock-bajo';
    if (stock < 50)   return 'stock-medio';
    return 'stock-ok';
  }

  // Fix NG8107 para el HTML
  getRowNumber(indexInPage: number): number {
    if (!this.paginator) return indexInPage + 1;
    return this.paginator.pageIndex * this.paginator.pageSize + indexInPage + 1;
  }
}