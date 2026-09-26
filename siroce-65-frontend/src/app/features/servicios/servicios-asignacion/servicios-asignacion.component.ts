import { Component, OnInit, ViewChild, Inject, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { MatSelectionList } from '@angular/material/list';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ServiciosService, Servicio, VehiculoDisponible, BomberoDisponible, AsignacionPayload } from '../../../core/services/servicios.service';

@Component({
  standalone    : false,
  selector      : 'app-servicios-asignacion',
  templateUrl   : './servicios-asignacion.component.html',
  styleUrls     : ['./servicios-asignacion.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ServiciosAsignacionComponent implements OnInit {

  private readonly MAPEO_ESTADOS_VEHICULO: Record<number, string> = {
    1: 'Operativo', 2: 'En Taller', 3: 'Fuera de Servicio', 4: 'En Servicio'        
  };

  private readonly MAPEO_TIPOS_VEHICULO: Record<number, string> = {
    1: 'Ambulancia', 2: 'Sedán', 3: 'Autobomba', 4: 'Rescate', 5: 'Cisterna', 6: 'Pickup', 7: 'Mando'
  };

  @ViewChild('vehiculosList') vehiculosList!: MatSelectionList;
  @ViewChild('bomberosList')  bomberosList!: MatSelectionList;

  vehiculos: VehiculoDisponible[] = [];
  bomberos : BomberoDisponible[]  = [];

  assignedVehiculoIds: number[] = [];
  assignedBomberoIds: number[]  = [];

  // 🔥 Bombero marcado como piloto de la unidad (debe estar entre los asignados)
  selectedPilotoId: number | null = null;

  // 🔥 Arreglos para la lista negra de ocupados
  ocupadosVehiculoIds: number[] = [];
  ocupadosBomberoIds: number[]  = [];

  isLoadingVehiculos   = false;
  isLoadingBomberos    = false;
  isDespachanando      = false;
  errorMsg             = '';

  selectedVehiculoCount = 0;
  selectedBomberoCount  = 0;

  constructor(
    private service  : ServiciosService,
    private snackBar : MatSnackBar,
    private cdr      : ChangeDetectorRef,
    public  dialogRef: MatDialogRef<ServiciosAsignacionComponent>,
    @Inject(MAT_DIALOG_DATA) public servicio: Servicio,
  ) {}

  ngOnInit(): void {
    this.isLoadingVehiculos = true;
    this.isLoadingBomberos = true;

    this.service.getAsignaciones(this.servicio.id).subscribe({
      next: (res: any) => {
        if (res && res.ok !== false) {
          const data = res.data || res;
          this.assignedVehiculoIds = (data.vehiculos || []).map((id: any) => Number(id));
          this.assignedBomberoIds  = (data.bomberos || []).map((id: any) => Number(id));

          // 🔥 Restauramos quién era el piloto en un despacho ya existente
          this.selectedPilotoId = data.pilotoId != null ? Number(data.pilotoId) : null;

          // 🔥 Capturamos a los ocupados
          this.ocupadosVehiculoIds = (data.ocupados?.vehiculos || []).map((id: any) => Number(id));
          this.ocupadosBomberoIds  = (data.ocupados?.bomberos || []).map((id: any) => Number(id));
          
          this.selectedVehiculoCount = this.assignedVehiculoIds.length;
          this.selectedBomberoCount = this.assignedBomberoIds.length;
        }
        this.loadVehiculos();
        this.loadBomberos();
      },
      error: () => {
        this.loadVehiculos();
        this.loadBomberos();
      }
    });
  }

  // 🔥 Métodos validadores para el HTML
  isVehiculoOcupado(v: any): boolean {
    return this.ocupadosVehiculoIds.includes(v.ID_VEHICULO);
  }

  isBomberoOcupado(b: any): boolean {
    return this.ocupadosBomberoIds.includes(b.ID_BOMBERO);
  }

  getTurnosDelDia(): string[] {
    const diaActual = new Date().getDay();
    const turnosPermitidos = ['permanente'];
    if (diaActual === 1 || diaActual === 4) turnosPermitidos.push('turno 1');
    if (diaActual === 2 || diaActual === 5) turnosPermitidos.push('turno 2');
    if (diaActual === 3 || diaActual === 6) turnosPermitidos.push('turno 3');
    if (diaActual === 0 || diaActual === 6) turnosPermitidos.push('voluntario fin de semana', 'voluntario fs');
    return turnosPermitidos;
  }

  getTurnoBombero(b: any): string { return String(b?.TURNO || b?.turno || '').toLowerCase().trim(); }

  private extractArray(res: any): any[] {
    if (!res) return [];
    if (Array.isArray(res)) return res;
    if (res.data && Array.isArray(res.data)) return res.data;
    if (res.data?.rows && Array.isArray(res.data.rows)) return res.data.rows;
    return [];
  }

  getEstadoVehiculo(v: any): string {
    if (!v) return 'Desconocido';
    const wrapper = v.estadoVehiculo || v.EstadoVehiculo || v.estado_vehiculo || v.estado || {};
    const texto = String(wrapper.nombre || wrapper.NOMBRE || wrapper.estado || wrapper.ESTADO || v.estado || v.ESTADO || '').toLowerCase();
    if (texto.includes('fuera')) return 'Fuera de Servicio';
    if (texto.includes('taller') || texto.includes('mantenimiento')) return 'En Taller';
    if (texto.includes('operativ') || texto.includes('disponib')) return 'Operativo';
    if (texto.includes('servicio')) return 'En Servicio';
    const id = v.ID_ESTADO_V || (v as any).id_estado_vehiculo || (v as any).id_estado_v;
    if (id && this.MAPEO_ESTADOS_VEHICULO[id]) return this.MAPEO_ESTADOS_VEHICULO[id];
    return 'Desconocido';
  }

  getTipoUnidad(v: any): string {
    if (!v) return 'Unidad';
    const wrapper = v.tipoVehiculo || v.TipoVehiculo || v.tipo_vehiculo || v.tipo || {};
    const texto = String(wrapper.nombre || wrapper.NOMBRE || wrapper.tipo || wrapper.TIPO || v.tipo || v.TIPO || '').toLowerCase();
    if (texto.includes('ambulan')) return 'Ambulancia';
    if (texto.includes('bomba')) return 'Autobomba';
    if (texto.includes('rescate')) return 'Rescate';
    if (texto.includes('cistern')) return 'Cisterna';
    if (texto.includes('sedán') || texto.includes('sedan')) return 'Sedán';
    if (texto.includes('pick')) return 'Pickup';
    if (texto.includes('mando')) return 'Mando';
    const id = v.ID_TIPO_V || (v as any).id_tipo_vehiculo || (v as any).id_tipo_v;
    if (id && this.MAPEO_TIPOS_VEHICULO[id]) return this.MAPEO_TIPOS_VEHICULO[id];
    return 'Unidad';
  }

  getEstadoBombero(b: any): string {
    if (!b) return 'Desconocido';
    const wrapper = b.estado || b.EstadoBombero || b.estado_bombero || b;
    let str = wrapper.ESTADO || wrapper.estado || wrapper.nombre || wrapper.NOMBRE || '';
    if (!str) {
      const id = b.ID_ESTADO_B || b.id_estado_b;
      if (id === 1) str = 'Activo';
      if (id === 2) str = 'Baja';
      if (id === 3) str = 'Suspendido';
    }
    const lower = String(str).toLowerCase();
    if (lower.includes('activo')) return 'Activo';
    if (lower.includes('baja')) return 'Baja';
    if (lower.includes('suspendid')) return 'Suspendido';
    return 'Desconocido';
  }

  // 🔥 3NF: b.cargo ahora es un objeto { ID_CARGO, CARGO } (antes era texto plano)
  getCargoBombero(b: any): string { return b?.cargo?.CARGO || b?.CARGO || b?.cargoFuncional || 'Bombero de Línea'; }

  loadVehiculos(): void {
    this.service.getVehiculosDisponibles().subscribe({
      next: (res: any) => {
        try {
          const arrayDatos = this.extractArray(res).map(v => ({
            ...v, ID_VEHICULO: Number(v.ID_VEHICULO || (v as any).id_vehiculo || v.id || v.ID)
          }));
          this.vehiculos = arrayDatos.filter(v => {
            const idVehiculo = v.ID_VEHICULO;
            const estado = this.getEstadoVehiculo(v);
            if (this.assignedVehiculoIds.includes(idVehiculo)) return true;
            return estado === 'Operativo' || estado === 'Disponible' || estado === 'En Servicio';
          });
        } catch (e) {
          this.vehiculos = [];
        } finally {
          this.isLoadingVehiculos = false;
          this.cdr.markForCheck();
        }
      },
      error: () => { this.vehiculos = []; this.isLoadingVehiculos = false; this.cdr.markForCheck(); },
    });
  }

  loadBomberos(): void {
    const turnosHoy = this.getTurnosDelDia();
    this.service.getBomberosActivos().subscribe({
      next: (res: any) => {
        try {
          const arrayDatos = this.extractArray(res).map(b => ({
            ...b, ID_BOMBERO: Number(b.ID_BOMBERO || (b as any).id_bombero || b.id || b.ID)
          }));
          this.bomberos = arrayDatos.filter(b => {
            const idBombero = b.ID_BOMBERO;
            const estado = this.getEstadoBombero(b);
            const turnoBombero = this.getTurnoBombero(b);
            if (this.assignedBomberoIds.includes(idBombero)) return true;
            if (estado !== 'Activo') return false;
            return turnosHoy.includes(turnoBombero);
          });
        } catch (e) {
          this.bomberos = [];
        } finally {
          this.isLoadingBomberos = false;
          this.cdr.markForCheck();
        }
      },
      error: () => { this.bomberos = []; this.isLoadingBomberos = false; this.cdr.markForCheck(); },
    });
  }

  onVehiculoSelChange(): void {
    if (this.vehiculosList) {
      this.assignedVehiculoIds = this.vehiculosList.selectedOptions.selected.map(o => Number(o.value));
      this.selectedVehiculoCount = this.assignedVehiculoIds.length;
    }
    this.errorMsg = '';
    this.cdr.markForCheck();
  }

  onBomberoSelChange(): void {
    if (!this.bomberosList) return;

    const idsAnteriores = this.assignedBomberoIds;
    this.assignedBomberoIds = this.bomberosList.selectedOptions.selected.map(o => Number(o.value));
    this.selectedBomberoCount = this.assignedBomberoIds.length;

    // 🔥 IDs recién marcados en ESTE evento (altas), para no reasignar piloto
    // cada vez que cambia cualquier otra casilla ya seleccionada previamente.
    const idsRecienMarcados = this.assignedBomberoIds.filter(id => !idsAnteriores.includes(id));

    if (this.selectedPilotoId === null) {
      // 1) Auto-asigna como piloto al primer recién marcado con especialidad Piloto/Conductor,
      //    solo si el select todavía está vacío (no pisa una elección manual previa).
      const nuevoPiloto = idsRecienMarcados.find(id => this.esPilotoOConductor(id));
      if (nuevoPiloto !== undefined) this.selectedPilotoId = nuevoPiloto;
    } else if (!this.assignedBomberoIds.includes(this.selectedPilotoId)) {
      // 3) Si se desmarcó al piloto vigente, cae automáticamente al siguiente candidato
      //    disponible entre los ya seleccionados; si no queda ninguno, se limpia el select.
      this.selectedPilotoId = this.bomberosAsignadosParaPiloto[0]?.ID_BOMBERO ?? null;
    }
    // 2) Si ya hay piloto asignado y se marca a otro también apto, se mantiene el actual
    //    (no entra a ninguna de las dos ramas anteriores) — el usuario lo cambia manualmente
    //    desde el <mat-select>, que ya lista a todos los candidatos asignados.

    this.errorMsg = '';
    this.cdr.markForCheck();
  }

  // 🔥 Especialidad del bombero por ID, usada para la auto-asignación de piloto
  private esPilotoOConductor(idBombero: number): boolean {
    const bombero = this.bomberos.find(b => b.ID_BOMBERO === idBombero);
    if (!bombero) return false;
    const cargo = this.getCargoBombero(bombero).toLowerCase();
    return cargo.includes('piloto') || cargo.includes('conductor');
  }

  // 🔥 Regla de negocio: solo puede figurar como candidato a Piloto quien (a) ya
  // esté marcado en la lista superior de personal destacado Y (b) tenga la
  // especialidad de Piloto/Conductor. Un Paramédico o Bombero de Línea, aunque
  // esté asignado al servicio, NUNCA aparece aquí — no está capacitado para conducir.
  get bomberosAsignadosParaPiloto(): BomberoDisponible[] {
    return this.bomberos.filter(b => {
      if (!this.assignedBomberoIds.includes(b.ID_BOMBERO)) return false;
      const cargo = this.getCargoBombero(b).toLowerCase();
      return cargo.includes('piloto') || cargo.includes('conductor');
    });
  }

  // 🔥 Del personal ya destacado, ¿hay al menos uno con la especialidad correcta?
  get hayCandidatoAPiloto(): boolean {
    return this.bomberosAsignadosParaPiloto.length > 0;
  }

  // 🔥 Se dispara desde el <mat-select> "Seleccione al Piloto", fuera del
  // mat-list-option — evita por completo el conflicto de clics con Angular Material.
  onPilotoSelectChange(idBombero: number | null): void {
    this.selectedPilotoId = idBombero;
    this.cdr.markForCheck();
  }

  isPiloto(idBombero: number): boolean {
    return this.selectedPilotoId === idBombero;
  }

  get totalSeleccionados(): number { return this.selectedVehiculoCount + this.selectedBomberoCount; }

  onDespachar(): void {
    const idVehiculos = this.assignedVehiculoIds || [];
    const idBomberos  = this.assignedBomberoIds || [];

    if (idVehiculos.length === 0 || idBomberos.length === 0) {
      this.errorMsg = '⚠️ Debes seleccionar obligatoriamente al menos UNA unidad Y UN bombero.';
      this.cdr.markForCheck();
      return;
    }

    // 🔥 Regla de negocio: no se puede despachar una unidad sin conductor
    if (!this.selectedPilotoId) {
      this.errorMsg = '⚠️ Debes seleccionar al Piloto de la unidad antes de despachar.';
      this.cdr.markForCheck();
      return;
    }

    this.isDespachanando = true;
    this.errorMsg        = '';
    this.cdr.markForCheck();

    // 🔥 3NF: la unidad y el personal destacado ya no se guardan como texto en
    // TB_SERVICIOS — se derivan del JOIN con detalle_vehiculo/detalle_bombero,
    // que es justamente lo que inserta este endpoint. `es_piloto` marca al
    // bombero que conduce la unidad.
    const bomberosPayload = idBomberos.map(id => ({ id_bombero: id, es_piloto: id === this.selectedPilotoId }));
    const payload: AsignacionPayload = { vehiculos: idVehiculos, bomberos: bomberosPayload };

    this.service.asignarRecursos(this.servicio.id, payload).subscribe({
      next: () => {
        this.isDespachanando = false;
        this.dialogRef.close({ dispatched: true, payload });
      },
      error: (err) => {
        this.isDespachanando = false;
        this.errorMsg = 'Error al despachar. Intente nuevamente.';
        this.cdr.markForCheck();
      },
    });
  }
  
  onCancelar(): void { this.dialogRef.close(); }

  getVehiculoIcon(tipo?: string): string {
    const t = String(tipo || '').toLowerCase();
    if (t.includes('autobomba') || t.includes('bomba'))  return 'local_fire_department';
    if (t.includes('ambulan'))   return 'local_hospital';
    if (t.includes('rescate'))   return 'emergency';
    if (t.includes('cistern'))   return 'water_drop';
    if (t.includes('pick') || t.includes('pickup')) return 'local_shipping';
    return 'directions_car';
  }

  getEstadoVehiculoClass(estado?: string): string {
    const e = String(estado || '').toLowerCase();
    if (e.includes('disponible') || e.includes('operativ') || e.includes('servicio')) return 'estado-ok';
    if (e.includes('fuera') || e.includes('baja')) return 'estado-fuera';
    if (e.includes('taller') || e.includes('mantenimiento')) return 'estado-taller';
    return 'estado-default';
  }

  getInitiales(b: BomberoDisponible): string {
    const n = b?.persona?.NOMBRE?.[0]   ?? '';
    const a = b?.persona?.APELLIDO?.[0] ?? '';
    return `${n}${a}`.toUpperCase() || '?';
  }

  getEstadoBomberoClass(estado?: string): string {
    const e = String(estado || '').toLowerCase();
    if (e.includes('activo')) return 'estado-ok';
    if (e.includes('baja') || e.includes('fuera')) return 'estado-fuera';
    if (e.includes('suspendido') || e.includes('taller')) return 'estado-taller';
    return 'estado-default';
  }

  getTipoVehiculoIconClass(tipo?: string): string {
    const t = String(tipo || '').toLowerCase();
    if (t.includes('autobomba') || t.includes('bomba')) return 'v-icon-bomba';
    if (t.includes('ambulan'))  return 'v-icon-ambulan';
    if (t.includes('rescate'))  return 'v-icon-rescate';
    if (t.includes('pick'))     return 'v-icon-pickup';
    return 'v-icon-default';
  }
}