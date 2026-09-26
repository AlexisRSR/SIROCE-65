// src/app/features/insumos/insumos-list/insumos-list.component.ts
import { Component, OnInit, OnDestroy, AfterViewInit, ViewChild, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { MatTableDataSource } from '@angular/material/table';
import { MatPaginator }       from '@angular/material/paginator';
import { MatSort }            from '@angular/material/sort';
import { MatDialog }          from '@angular/material/dialog';
import { MatSnackBar }        from '@angular/material/snack-bar';
import { Subscription }       from 'rxjs';

import { InsumosService, Insumo, InsumoRaw } from '../../../core/services/insumos.service';
import { InsumosFormComponent } from '../insumos-form/insumos-form.component';
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
  displayedColumns = ['num', 'nombre', 'tipo', 'proposito', 'marca', 'stock', 'estado', 'acciones'];

  isLoading  = false;
  deletingId : number | null = null;
  filterValue = '';
  
  userRole = ''; 

  stats = { total: 0, herramientas: 0, medicos: 0, epp: 0, bajoStock: 0 };
  private subs = new Subscription();

  constructor(
    private service : InsumosService,
    private dialog  : MatDialog,
    private snackBar: MatSnackBar,
    private cdr     : ChangeDetectorRef,
    private auth    : AuthService 
  ) {}

  ngOnInit(): void {
    this.userRole = this.auth.getRole();
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
        case 'tipo'      : return this.getTipoLabel(item.tipoInsumo).toLowerCase();
        case 'proposito' : return item.proposito?.toLowerCase() ?? '';
        case 'marca'     : return item.marca?.toLowerCase() ?? '';
        case 'stock'     : return item.stock                    ?? 0;
        case 'estado'    : return item.estado?.toLowerCase()    ?? '';
        default          : return '';
      }
    };

    this.dataSource.filterPredicate = (data: Insumo, filter: string): boolean => {
      const haystack = [data.nombre, this.getTipoLabel(data.tipoInsumo), data.estado, data.proposito, data.marca, data.modelo]
        .join(' ').toLowerCase();
      return haystack.includes(filter.trim().toLowerCase());
    };
  }

  loadInsumos(): void {
    this.isLoading = true;
    this.cdr.markForCheck();

    const sub = this.service.getAll().subscribe({
      next: (res) => {
        const lista: Insumo[] = res.ok
          ? res.data.map((raw: InsumoRaw): Insumo => ({
              id         : raw.ID_INSUMO,
              nombre     : raw.NOMBRE      ?? '',
              descripcion: raw.DESCRIPCION ?? '',
              tipoInsumo : raw.id_tipo_insumo ?? null,
              stock      : raw.STOCK       ?? 0,
              estado     : raw.ESTADO      ?? 'Activo',
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

  // 🔥 Umbral de "Bajo Stock" según clasificación — mismos IDs y valores que
  // insumoHelper.js en el backend (única fuente de verdad):
  //   1 = Insumo Médico/Consumible -> 10 · 4 = Herramienta / 2 = EPP -> 3
  private umbralBajoStockPorTipo(tipoInsumo: number | null): number {
    if (tipoInsumo === 4 || tipoInsumo === 2) return 3;
    return 10;
  }

  esStockBajo(insumo: Insumo): boolean {
    return insumo.stock > 0 && insumo.stock < this.umbralBajoStockPorTipo(insumo.tipoInsumo);
  }

  private calcularEstadisticas(lista: Insumo[]): void {
    this.stats = {
      total       : lista.length,
      herramientas: lista.filter(i => i.tipoInsumo === 4).length,
      medicos     : lista.filter(i => i.tipoInsumo === 1).length,
      epp         : lista.filter(i => i.tipoInsumo === 2).length,
      // 🔥 Se cuenta por la regla matemática combinada (umbral dinámico por
      // clasificación), no por el texto de ESTADO — así el KPI nunca cuenta
      // falsos positivos (p. ej. 5 motosierras ya no son "alerta").
      bajoStock   : lista.filter(i => this.esStockBajo(i)).length,
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
    this.openForm(insumo);
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
          // 🔥 Prioriza el mensaje real del backend (p. ej. "Cámbielo a estado De Baja")
          const msg = err?.error?.message || 'Error al eliminar el registro.';
          this.snackBar.open(msg, 'OK', { duration: 5000 });
        },
      });
    });
  }

  // 🔥 TRADUCTORES VISUALES: id_tipo_insumo (FK numérica) → ícono/etiqueta/clase
  getTipoIcon(tipo?: number | null): string {
    if (tipo === 4) return 'construction';
    if (tipo === 1) return 'local_hospital';
    if (tipo === 2) return 'security';
    return 'inventory_2';
  }

  getTipoLabel(tipo?: number | null): string {
    if (tipo === 2) return 'Protección (EPP)';
    if (tipo === 1) return 'Insumo Médico';
    if (tipo === 4) return 'Herramienta';
    return '—';
  }

  getTipoClass(tipo?: number | null): string {
    if (tipo === 4) return 'badge-herramienta';
    if (tipo === 1) return 'badge-medico';
    if (tipo === 2) return 'badge-rescate';
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

  getStockClass(stock: number, tipoInsumo?: number | null): string {
    if (stock <= 0) return 'stock-cero';
    if (stock < this.umbralBajoStockPorTipo(tipoInsumo ?? null)) return 'stock-bajo';
    if (stock < 50) return 'stock-medio';
    return 'stock-ok';
  }

  getRowNumber(indexInPage: number): number {
    if (!this.paginator) return indexInPage + 1;
    return this.paginator.pageIndex * this.paginator.pageSize + indexInPage + 1;
  }
}