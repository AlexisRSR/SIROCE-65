// src/app/features/bitacora/bitacora-list/bitacora-list.component.ts
import { Component, OnInit, AfterViewInit, ViewChild, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { MatTableDataSource } from '@angular/material/table';
import { MatPaginator }       from '@angular/material/paginator';
import { MatSnackBar }        from '@angular/material/snack-bar';

import { BitacoraService, BitacoraRaw } from '../../../core/services/bitacora.service';

export interface BitacoraRow {
  id         : number;
  fechaHora  : string; // ISO combinado "YYYY-MM-DDTHH:mm:ss" — ver loadBitacora()
  usuario    : string;
  descripcion: string;
}

export interface ModuloInfo {
  nombre    : string;
  claseColor: string;
}

@Component({
  standalone     : false,
  selector       : 'app-bitacora-list',
  templateUrl    : './bitacora-list.component.html',
  styleUrls      : ['./bitacora-list.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BitacoraListComponent implements OnInit, AfterViewInit {

  @ViewChild(MatPaginator) paginator!: MatPaginator;

  dataSource       = new MatTableDataSource<BitacoraRow>([]);
  displayedColumns = ['id', 'fechaHora', 'usuario', 'modulo', 'accion'];

  isLoading   = false;
  filterValue = '';

  // 🔥 Filtros reactivos: rango de fechas (start/end) + módulo — un solo
  // FormGroup para que un único valueChanges dispare aplicarFiltros() con los tres.
  dateForm: FormGroup;

  // Copia completa sin filtrar — el filtrado combinado (texto + rango + módulo)
  // se recalcula sobre este arreglo cada vez que cambia cualquiera de los tres.
  private allRows: BitacoraRow[] = [];

  // 🔒 Mapea el value del <mat-select> al .nombre EXACTO que devuelve
  // extraerModulo(). Antes se buscaba con .includes() sobre palabras clave
  // (p.ej. 'emergencia'), lo que hacía que "[TIPOS DE EMERGENCIA]" calzara
  // también como "Emergencias" por contener esa subcadena — falso positivo.
  // Comparando por igualdad exacta (===) contra .nombre no tiene ese problema.
  private readonly MODULO_NOMBRES: Record<string, string> = {
    emergencias: 'EMERGENCIAS',
    usuarios   : 'USUARIOS',
    bomberos   : 'BOMBEROS',
    unidades   : 'UNIDADES',
    insumos    : 'INSUMOS',
    tipos      : 'TIPOS DE EMERGENCIA',
  };

  // 🎨 Mapea el nombre entre corchetes (tal cual lo manda el backend) a la
  // clase de color del badge visual de la columna "Módulo".
  private readonly MODULO_CLASES: Record<string, string> = {
    'EMERGENCIAS'         : 'badge-modulo-emergencias',
    'USUARIOS'            : 'badge-modulo-usuarios',
    'INSUMOS'             : 'badge-modulo-insumos',
    'BOMBEROS'            : 'badge-modulo-bomberos',
    'UNIDADES'            : 'badge-modulo-unidades',
    'TIPOS DE EMERGENCIA' : 'badge-modulo-tipos',
  };

  constructor(
    private service : BitacoraService,
    private fb       : FormBuilder,
    private snackBar : MatSnackBar,
    private cdr      : ChangeDetectorRef,
  ) {
    this.dateForm = this.fb.group({ start: [null], end: [null], modulo: ['todos'] });
  }

  ngOnInit(): void {
    this.loadBitacora();
    this.dateForm.valueChanges.subscribe(() => this.aplicarFiltros());
  }

  ngAfterViewInit(): void {
    this.dataSource.paginator = this.paginator;
  }

  loadBitacora(): void {
    this.isLoading = true;
    this.cdr.markForCheck();

    this.service.getAll().subscribe({
      next: (res) => {
        this.allRows = res.ok
          ? res.data.map((raw: BitacoraRaw): BitacoraRow => ({
              id         : raw.id_bitacora,
              fechaHora  : `${raw.fecha}T${raw.hora}`,
              usuario    : raw.usuario?.nombre_usuario ?? 'Sistema',
              descripcion: raw.descripcion,
            }))
          : [];

        this.aplicarFiltros();
        this.isLoading = false;
        this.cdr.markForCheck();
      },
      error: () => {
        this.isLoading = false;
        this.cdr.markForCheck();
        this.snackBar.open('Error al cargar la bitácora de auditoría.', 'OK', { duration: 5000 });
      },
    });
  }

  // ── Filtro de texto (usuario o acción) ─────────────────────────
  applyFilter(event: Event): void {
    this.filterValue = (event.target as HTMLInputElement).value;
    this.aplicarFiltros();
  }

  clearFilter(inputEl: HTMLInputElement): void {
    inputEl.value = '';
    this.filterValue = '';
    this.aplicarFiltros();
  }

  // ── Filtros de rango de fechas + módulo ─────────────────────────
  limpiarFiltrosAvanzados(): void {
    this.dateForm.reset({ start: null, end: null, modulo: 'todos' });
  }

  get tieneFiltrosActivos(): boolean {
    const { start, end, modulo } = this.dateForm.value;
    return !!this.filterValue || !!start || !!end || (!!modulo && modulo !== 'todos');
  }

  // ── Combina texto + rango + módulo sobre la copia completa (allRows) ──
  private aplicarFiltros(): void {
    const texto  = this.filterValue.trim().toLowerCase();
    const desde  = this.formatDateLocal(this.dateForm.value.start);
    const hasta  = this.formatDateLocal(this.dateForm.value.end);
    const modulo = this.dateForm.value.modulo || 'todos';
    const nombreModuloEsperado = modulo !== 'todos' ? this.MODULO_NOMBRES[modulo] : null;

    this.dataSource.data = this.allRows.filter(row => {
      const fechaSolo  = row.fechaHora.slice(0, 10);
      const coincideTexto  = !texto || `${row.usuario} ${row.descripcion}`.toLowerCase().includes(texto);
      const coincideDesde  = !desde || fechaSolo >= desde;
      const coincideHasta  = !hasta || fechaSolo <= hasta;
      const coincideModulo = !nombreModuloEsperado || this.extraerModulo(row.descripcion).nombre === nombreModuloEsperado;
      return coincideTexto && coincideDesde && coincideHasta && coincideModulo;
    });

    this.dataSource.paginator?.firstPage();
    this.cdr.markForCheck();
  }

  private formatDateLocal(dateVal: any): string {
    if (!dateVal) return '';
    const d = new Date(dateVal);
    const year  = d.getFullYear();
    const month = ('0' + (d.getMonth() + 1)).slice(-2);
    const day   = ('0' + d.getDate()).slice(-2);
    return `${year}-${month}-${day}`;
  }

  // ── Columna "Módulo": extrae "[MODULO]" de la descripción y arma el chip ──
  extraerModulo(accion: string): ModuloInfo {
    const match = accion?.match(/^\[([^\]]+)\]/);
    const nombre = match ? match[1].trim().toUpperCase() : 'EMERGENCIAS';
    const claseColor = this.MODULO_CLASES[nombre] || 'badge-modulo-default';
    return { nombre, claseColor };
  }

  // ── Columna "Acción": texto sin el prefijo "[MODULO] - " ──────────────
  obtenerAccionLimpia(accion: string): string {
    return (accion ?? '').replace(/^\[[^\]]+\]\s*-\s*/, '').trim();
  }

  // ── Resalta visualmente las eliminaciones dentro de la columna "Acción" ──
  esEliminacion(accionLimpia: string): boolean {
    return accionLimpia.includes('Eliminación') || accionLimpia.includes('Eliminó');
  }
}
