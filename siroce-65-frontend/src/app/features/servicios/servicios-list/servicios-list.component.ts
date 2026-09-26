// src/app/features/servicios/servicios-list/servicios-list.component.ts
import { Component, OnInit, OnDestroy, AfterViewInit, ViewChild, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { FormGroup, FormControl } from '@angular/forms';
import { MatTableDataSource } from '@angular/material/table';
import { MatPaginator }       from '@angular/material/paginator';
import { MatSort }            from '@angular/material/sort';
import { MatDialog }          from '@angular/material/dialog';
import { MatSnackBar }        from '@angular/material/snack-bar';
import { Subscription }       from 'rxjs';

import { ServiciosAsignacionComponent } from '../servicios-asignacion/servicios-asignacion.component';
import { ServiciosFormComponent }       from '../servicios-form/servicios-form.component';
import { ServiciosService, Servicio, ServicioRaw }  from '../../../core/services/servicios.service';
import { ReportePdfService } from '../../../core/services/reporte-pdf.service';

@Component({
  standalone    : false,
  selector      : 'app-servicios-list',
  templateUrl   : './servicios-list.component.html',
  styleUrls     : ['./servicios-list.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ServiciosListComponent implements OnInit, AfterViewInit, OnDestroy {

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort)      sort!: MatSort;

  dataSource       = new MatTableDataSource<any>([]);
  displayedColumns = ['num', 'emergencia', 'direccion', 'solicitante', 'unidad', 'estado', 'fecha', 'acciones'];

  isLoading   = false;
  deletingId  : number | null = null;
  filterValue  = '';

  // 🔥 Filtro por rango de fechas, en tiempo real junto con el buscador de texto
  rangoFechas = new FormGroup({
    inicio: new FormControl<Date | null>(null),
    fin   : new FormControl<Date | null>(null),
  });
  maxDate = new Date();

  get isAdmin(): boolean {
    const rolGuardado = localStorage.getItem('siroce65_rol');
    return rolGuardado === 'ADMIN'; 
  }

  stats = { total: 0, hoy: 0, estaSemana: 0, esteMes: 0, anonimas: 0 };
  private subs = new Subscription();

  constructor(
    private service : ServiciosService,
    private dialog  : MatDialog,
    private snackBar: MatSnackBar,
    private cdr     : ChangeDetectorRef,
    private reportePdf: ReportePdfService
  ) {}

  ngOnInit(): void {
    this.configurarDataSource();
    this.loadServicios();

    // 🔥 Cada cambio en el rango de fechas re-filtra en tiempo real (sin botón "Aplicar")
    const subFechas = this.rangoFechas.valueChanges.subscribe(() => this.aplicarFiltrosCombinados());
    this.subs.add(subFechas);
  }

  ngAfterViewInit(): void {
    this.dataSource.paginator = this.paginator;
    this.dataSource.sort      = this.sort;
  }

  ngOnDestroy(): void {
    this.subs.unsubscribe();
  }

  private configurarDataSource(): void {
    this.dataSource.sortingDataAccessor = (item: any, property: string): string => {
      switch (property) {
        case 'emergencia': return item.tipoServicioNombre?.toLowerCase() ?? '';
        case 'direccion' : return item.direccionServicio?.toLowerCase()  ?? '';
        case 'solicitante': return item.nombreSolicitante?.toLowerCase() ?? '';
        case 'estado'    : return item.estado.toLowerCase();
        case 'fecha'     : return item.fechaServicio                     ?? '';
        default          : return '';
      }
    };

    // 🔥 Filtro multi-criterio: el filter de MatTableDataSource es un solo string,
    // así que viajan texto + fechas empaquetados como JSON y se desempaquetan aquí.
    this.dataSource.filterPredicate = (data: any, filter: string): boolean => {
      const criterios = JSON.parse(filter);

      const haystack = [
        data.descripcion, data.tipoServicioNombre, data.direccionServicio,
        data.fechaServicio, data.nombreSolicitante, data.telefonoSolicitante, data.estado,
        data.motivoCancelado
      ].join(' ').toLowerCase();
      const matchTexto = haystack.includes(criterios.texto || '');

      // 🔥 Rango de fechas: comparación numérica de objetos Date, no de strings.
      // Solo se aplica si ambos extremos del rango están seleccionados.
      let matchFecha = true;
      if (criterios.inicio && criterios.fin && data.fechaServicio) {
        const fechaRegistro = this.parseFechaLocal(data.fechaServicio);
        fechaRegistro.setHours(0, 0, 0, 0);

        // criterios.inicio/fin llegaron como ISO string (JSON.stringify serializa
        // Date con .toJSON()); new Date(iso) reconstruye el mismo instante exacto.
        const desde = new Date(criterios.inicio);
        desde.setHours(0, 0, 0, 0);
        const hasta = new Date(criterios.fin);
        hasta.setHours(0, 0, 0, 0);

        matchFecha = fechaRegistro.getTime() >= desde.getTime() && fechaRegistro.getTime() <= hasta.getTime();
      }

      return matchTexto && matchFecha;
    };

    // 🔥 MatTableDataSource arranca con filter='' por defecto. Si `dataSource.data`
    // se asigna (en loadServicios) antes de que aplicarFiltrosCombinados() corra por
    // primera vez, el predicate recibiría ese '' y JSON.parse('') lanzaría un error.
    this.dataSource.filter = JSON.stringify({ texto: '', inicio: null, fin: null });
  }

  /**
   * Parsea 'YYYY-MM-DD' como fecha LOCAL a medianoche. `new Date('YYYY-MM-DD')`
   * lo interpreta como UTC medianoche, lo que en husos horarios negativos
   * (p. ej. Guatemala, UTC-6) retrocede un día al aplicar luego setHours(0,0,0,0).
   */
  private parseFechaLocal(fechaStr: string): Date {
    const [year, month, day] = fechaStr.split('-').map(Number);
    return new Date(year, month - 1, day);
  }

  /** Único punto de entrada para (re)aplicar texto + fechas y sincronizar KPIs con lo visible en la tabla. */
  private aplicarFiltrosCombinados(): void {
    const filtroObj = {
      texto : this.filterValue.trim().toLowerCase(),
      inicio: this.rangoFechas.value.inicio,
      fin   : this.rangoFechas.value.fin,
    };
    this.dataSource.filter = JSON.stringify(filtroObj);
    this.dataSource.paginator?.firstPage();
    this.calcularEstadisticas(this.dataSource.filteredData);
    this.cdr.markForCheck();
  }

  clearRangoFechas(): void {
    this.rangoFechas.reset({ inicio: null, fin: null });
  }

  loadServicios(): void {
    this.isLoading = true;
    this.cdr.markForCheck();

    const sub = this.service.getAll().subscribe({
      next: (res) => {
        const lista = res.ok
          ? (res.data as any[]).map((raw: any) => {

              // 🔥 3NF: unidad/piloto/personal ya no son texto en TB_SERVICIOS —
              // se derivan del JOIN con detalle_vehiculo/detalle_bombero.
              const vehiculosAsignados = raw.vehiculosAsignados || [];
              const bomberosAsignados  = raw.bomberosAsignados || [];
              const bomberoPiloto      = bomberosAsignados.find((b: any) => b.DetalleBombero?.es_piloto);
              const personalSinPiloto  = bomberosAsignados.filter((b: any) => !b.DetalleBombero?.es_piloto);

              const unidadDestacadaTexto = vehiculosAsignados.length > 0
                ? vehiculosAsignados.map((v: any) => `${v.PLACA} - ${v.MARCA}`).join(', ')
                : 'No asignada';
              const pilotoTexto = bomberoPiloto
                ? `${bomberoPiloto.persona?.NOMBRE} ${bomberoPiloto.persona?.APELLIDO}`
                : 'No asignado';
              const personalDestacadoTexto = personalSinPiloto.length > 0
                ? personalSinPiloto.map((b: any) => `${b.persona?.NOMBRE} ${b.persona?.APELLIDO}`).join(', ')
                : 'Personal de turno';

              // 🔥 3NF: el(los) paciente(s) ahora vienen del JOIN con tb_pacientes
              const pacientes = raw.pacientes || [];
              const pacientePrincipal = pacientes[0] || null;

              const tieneUnidad = vehiculosAsignados.length > 0;
              const tieneInformeFinal = !!(raw.OBSERVACIONES_FINALES && String(raw.OBSERVACIONES_FINALES).trim() !== '');
              const obsFinales = raw.OBSERVACIONES_FINALES || '';

              // 🔥 3NF: la firma de Vo.Bo. ya viene como asociación (firmaVobo → persona/cargo),
              // ya no se extrae de un marcador [FIRMA VOBO]:/[JEFE DE TURNO]: en el texto.
              const firmaVobo = raw.firmaVobo || null;
              const jefeTurnoStr = firmaVobo?.persona
                ? `${firmaVobo.persona.NOMBRE} ${firmaVobo.persona.APELLIDO}${firmaVobo.cargo?.CARGO ? ' | ' + firmaVobo.cargo.CARGO : ''}`
                : '';

              // 🔥 3NF: ES_FALSA_ALARMA/MOTIVO_CANCELACION son columnas propias — ya no se
              // detecta la cancelación buscando [CANCELADO / FALSA ALARMA]: en el texto.
              let estadoActivo = raw.ESTADO || raw.estado || 'Pendiente';
              const motivoCancelado = raw.MOTIVO_CANCELACION || '';

              if (raw.ES_FALSA_ALARMA) {
                estadoActivo = 'Cancelada';
              } else {
                if (!raw.HORA_SALIDA && !raw.HORA_ENTRADA) {
                    estadoActivo = 'Pendiente';
                } else if (raw.HORA_SALIDA && !raw.HORA_ENTRADA) {
                    estadoActivo = 'En Atención';
                } else if (raw.HORA_SALIDA && raw.HORA_ENTRADA) {
                    estadoActivo = tieneInformeFinal ? 'Finalizada' : 'Redactando Informe';
                }
              }

              return {
                id                 : raw.ID_SERVICIO,
                idTipoServicio     : raw.ID_TIPO_SERVICIO  ?? 0,
                descripcion        : raw.DESCRIPCION       ?? '',
                fechaServicio      : raw.FECHA_SERVICIO    ?? '',
                direccionServicio  : raw.DIRECCION_SERVICIO ?? '',
                nombreSolicitante  : raw.NOMBRE_SOLICITANTE ?? '',
                telefonoSolicitante: raw.TELEFONO_SOLICITANTE ?? '', 
                tipoServicioNombre : raw.tipoServicio?.TIPO_SERVICIO ?? '—',
                
                estado             : estadoActivo, 
                motivoCancelado    : motivoCancelado, 
                
                tieneCierre        : tieneUnidad,
                horaSalida         : raw.HORA_SALIDA,
                horaEntrada        : raw.HORA_ENTRADA,
                pacientes          : pacientes,
                nombrePaciente     : pacientePrincipal?.NOMBRE_PACIENTE || 'No registrado',
                edadPaciente       : pacientePrincipal?.EDAD_PACIENTE || 0,
                fallecido          : pacientePrincipal?.FALLECIDO || 'NO',
                acompanante        : pacientePrincipal?.ACOMPANANTE || 'N/A',
                lugarTraslado      : pacientePrincipal?.LUGAR_TRASLADO || 'N/A',
                unidadDestacada    : unidadDestacadaTexto,
                piloto             : pilotoTexto,
                personalDestacado  : personalDestacadoTexto,
                vehiculosAsignados : vehiculosAsignados,
                bomberosAsignados  : bomberosAsignados,
                observacionesFinales: obsFinales,
                jefeTurno          : jefeTurnoStr,
                idFirmaVobo        : raw.ID_FIRMA_VOBO ?? firmaVobo?.ID_BOMBERO ?? null,
                // 🔥 raw.insumosUtilizados es el alias real de la asociación N:M
                // (Servicio.belongsToMany(Insumo, {as:'insumosUtilizados'})); cada
                // ítem trae la cantidad anidada en DetalleInsumoServicio (through).
                insumos            : (raw.insumosUtilizados || []).map((i: any) => ({
                  id_insumo: i.ID_INSUMO,
                  nombre   : i.NOMBRE,
                  cantidad : i.DetalleInsumoServicio?.cantidad_utilizada ?? 0,
                })),
              };
            })
          : [];

        lista.sort((a: any, b: any) => b.id - a.id);

        this.dataSource.data = lista;
        this.aplicarFiltrosCombinados();
        this.isLoading = false;
        this.cdr.markForCheck();
      },
      error: () => {
        this.isLoading = false;
        this.cdr.markForCheck();
        this.snackBar.open('Error al cargar los registros.', 'OK', { duration: 5000 });
      },
    });
    this.subs.add(sub);
  }

  private calcularEstadisticas(lista: any[]): void {
    const hoy = new Date();
    const offset = hoy.getTimezoneOffset();
    const hoyLocal = new Date(hoy.getTime() - (offset*60*1000));
    const hoyISO = hoyLocal.toISOString().split('T')[0]; 
    const mesActual = hoyISO.substring(0, 7); 

    const diaSemana = hoyLocal.getDay() === 0 ? 6 : hoyLocal.getDay() - 1;
    const lunes    = new Date(hoyLocal);
    lunes.setDate(hoyLocal.getDate() - diaSemana);
    const lunesISO = lunes.toISOString().split('T')[0];

    // 🔥 "Anónima": sin nombre de solicitante registrado, o registrado literalmente como "Anónimo"
    const esAnonima = (s: any): boolean => {
      const nombre = String(s.nombreSolicitante || '').trim();
      return nombre === '' || nombre.toLowerCase() === 'anónimo';
    };

    this.stats = {
      total      : lista.length,
      hoy        : lista.filter(s => s.fechaServicio.startsWith(hoyISO)).length,
      estaSemana : lista.filter(s => s.fechaServicio >= lunesISO).length,
      esteMes    : lista.filter(s => s.fechaServicio.startsWith(mesActual)).length,
      anonimas   : lista.filter(esAnonima).length,
    };
  }

  applyFilter(event: Event): void {
    this.filterValue = (event.target as HTMLInputElement).value;
    this.aplicarFiltrosCombinados();
  }

  clearFilter(inputEl: HTMLInputElement): void {
    inputEl.value = '';
    this.filterValue = '';
    this.aplicarFiltrosCombinados();
  }

  openForm(servicio: any | null = null): void {
    const ref = this.dialog.open(ServiciosFormComponent, {
      width: '600px', maxWidth: '95vw', maxHeight: '90vh',
      panelClass: 'dark-dialog', data: servicio, disableClose: true,
    });
    ref.afterClosed().subscribe((result?: { saved: boolean; action: 'create' | 'edit'; estadoFinal?: string }) => {
      if (result?.saved) {
        const msg = result.action === 'create'
          ? '✅ Emergencia registrada.'
          : (result.estadoFinal === 'Finalizada'
            ? '✅ Informe guardado. Emergencia finalizada exitosamente.'
            : '✅ Actualización guardada.');
        this.snackBar.open(msg, 'OK', { duration: 3500 });
        this.loadServicios();
      }
    });
  }

  onEdit(servicio: any): void {
    this.openForm(servicio);
  }

  onAsignar(servicio: any): void {
    const ref = this.dialog.open(ServiciosAsignacionComponent, {
      width: '680px', maxWidth: '95vw', maxHeight: '85vh',
      panelClass: 'dark-dialog', data: servicio, disableClose: true,
    });
    ref.afterClosed().subscribe(r => {
      if (r?.dispatched) {
        this.snackBar.open('🚀 Recursos despachados correctamente.', 'OK', { duration: 4000 });
        this.loadServicios();
      }
    });
  }

  onCambiarEstado(servicio: any, accion: 'SALIDA' | 'ENTRADA'): void {
    if (accion === 'SALIDA') {
      this.service.getAsignaciones(servicio.id).subscribe({
        next: (res) => {
          const tieneVehiculos = res.ok && res.data.vehiculos && res.data.vehiculos.length > 0;
          const tieneBomberos = res.ok && res.data.bomberos && res.data.bomberos.length > 0;

          if (!tieneVehiculos || !tieneBomberos) {
            this.snackBar.open('⚠️ Debe despachar (asignar) al menos 1 unidad y personal antes de dar Salida.', 'ENTENDIDO', { duration: 5000, panelClass: ['snack-danger'] });
            return;
          }

          this.ejecutarCambioEstado(servicio, accion);
        },
        error: () => this.snackBar.open('Error al verificar asignaciones.', 'OK', { duration: 3000 })
      });
    } else {
      this.ejecutarCambioEstado(servicio, accion);
    }
  }

  private ejecutarCambioEstado(servicio: any, accion: 'SALIDA' | 'ENTRADA'): void {
    const msjExito = accion === 'SALIDA'
      ? `▶️ Unidad en camino para emergencia #${servicio.id}`
      : `✅ Unidad de regreso. Pendiente de informe.`;

    this.service.cambiarEstadoOperativo(servicio.id, accion).subscribe({
      next: () => {
        this.snackBar.open(msjExito, 'OK', { duration: 4000 });
        this.loadServicios();
      },
      error: () => {
        this.snackBar.open(`Error al registrar la ${accion.toLowerCase()}.`, 'OK', { duration: 4000 });
      }
    });
  }

  imprimirInforme(servicio: any): void {
    try {
      let minutos = 'N/A';
      if (servicio.horaSalida && servicio.horaEntrada) {
        const tSalida = new Date(servicio.horaSalida).getTime();
        const tEntrada = new Date(servicio.horaEntrada).getTime();
        const diffMin = (tEntrada - tSalida) / 60000; 
        if (diffMin > 0) minutos = diffMin.toFixed(2);
      }

      let obsLimpia = servicio.observacionesFinales || servicio.descripcion || 'Sin observaciones registradas.';
      obsLimpia = obsLimpia.replace('[VÍCTIMAS ADICIONALES ATENDIDAS]:', 'Detalle de víctimas adicionales atendidas:');

      const esServicioGeneral = (servicio.nombrePaciente === 'No registrado' || !servicio.nombrePaciente) &&
                                (servicio.lugarTraslado === 'N/A' || !servicio.lugarTraslado);

      // 🔥 3NF: si hay varias víctimas (tb_pacientes), se listan todas con su etiqueta (FALLECIDO)
      const pacientesLista = Array.isArray(servicio.pacientes) ? servicio.pacientes : [];
      let nombrePacienteImpresion = 'No registrado';
      if (pacientesLista.length > 0) {
        nombrePacienteImpresion = pacientesLista
          .map((p: any) => {
            const nombre = p.NOMBRE_PACIENTE?.trim() || 'Desconocido';
            const fallecido = String(p.FALLECIDO || '').toUpperCase();
            return (fallecido === 'SI' || fallecido === 'SÍ') ? `${nombre} (FALLECIDO)` : nombre;
          })
          .join(', ');
      } else if (servicio.nombrePaciente && servicio.nombrePaciente !== 'No registrado') {
        const esFallecido = servicio.fallecido && (servicio.fallecido.toUpperCase() === 'SI' || servicio.fallecido.toUpperCase() === 'SÍ');
        nombrePacienteImpresion = esFallecido ? `${servicio.nombrePaciente} (FALLECIDO)` : servicio.nombrePaciente;
      }

      const datosParaPdf = {
        id: servicio.id || 'S/N',
        fecha: servicio.fechaServicio ? new Date(servicio.fechaServicio + 'T12:00:00Z').toLocaleDateString() : 'N/A',
        solicitante: servicio.nombreSolicitante || 'No registrado',
        direccion: servicio.direccionServicio || 'Sin dirección registrada',
        tipo: servicio.tipoServicioNombre || 'EMERGENCIA',
        horaSalida: servicio.horaSalida ? new Date(servicio.horaSalida).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit', second:'2-digit'}) : '--:--',
        horaEntrada: servicio.horaEntrada ? new Date(servicio.horaEntrada).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit', second:'2-digit'}) : '--:--',
        minutos: minutos, 
        
        unidad: servicio.unidadDestacada || 'No asignada',
        piloto: servicio.piloto || 'No asignado',

        // 🔥 APLICAMOS LA NUEVA VARIABLE AQUÍ
        paciente: nombrePacienteImpresion,
        traslado: servicio.lugarTraslado || 'N/A',
        personal: servicio.personalDestacado || 'Personal de turno',
        jefeTurno: servicio.jefeTurno || '',
        observaciones: obsLimpia,

        // 🔥 3NF: viene de ES_FALSA_ALARMA / MOTIVO_CANCELACION (columnas propias)
        esFalsaAlarma: servicio.estado === 'Cancelada',
        motivoCancelacion: servicio.motivoCancelado || '',
        insumos: servicio.insumos,

        esServicioGeneral: esServicioGeneral
      };

      this.reportePdf.generarInformeLlamada(datosParaPdf);
      
    } catch (error) {
      console.error('🔥 ERROR CRÍTICO AL GENERAR PDF:', error);
      this.snackBar.open('Error al compilar los datos para el PDF.', 'OK', { duration: 4000 });
    }
  }

  /**
   * 🔥 Regla de auditoría: una emergencia ya despachada (con hora de salida) o
   * cancelada es irreversible — solo se puede eliminar recién creada o con
   * recursos asignados pero aún sin marcar la salida.
   */
  puedeEliminar(servicio: any): boolean {
    return !servicio.horaSalida && servicio.estado !== 'Cancelada';
  }

  onDelete(servicio: any): void {
    const ref = this.snackBar.open(`¿Eliminar el registro #${servicio.id}?`, 'CONFIRMAR', { duration: 6000, panelClass: ['snack-danger'] });
    ref.onAction().subscribe(() => {
      this.deletingId = servicio.id;
      this.cdr.markForCheck();
      this.service.delete(servicio.id).subscribe({
        next: () => {
          this.deletingId = null;
          this.snackBar.open('Registro eliminado.', 'OK', { duration: 3000 });
          this.loadServicios();
        },
        error: () => {
          this.deletingId = null;
          this.cdr.markForCheck();
          this.snackBar.open('Error al eliminar.', 'OK', { duration: 4000 });
        },
      });
    });
  }

  getTipoIcon(tipo: string): string {
    const t = tipo?.toLowerCase() ?? '';
    if (t.includes('incendio') || t.includes('fuego'))    return 'local_fire_department';
    if (t.includes('accidente') || t.includes('tráns'))   return 'directions_car';
    if (t.includes('médic') || t.includes('salud'))       return 'local_hospital';
    if (t.includes('rescate') || t.includes('derrumbe'))  return 'emergency';
    if (t.includes('gas') || t.includes('fuga'))          return 'warning';
    if (t.includes('agua') || t.includes('inundaci'))     return 'water';
    if (t.includes('árbol') || t.includes('arbol'))       return 'park';
    return 'warning_amber';
  }

  getTipoClass(tipo: string): string {
    const t = tipo?.toLowerCase() ?? '';
    if (t.includes('incendio') || t.includes('fuego'))   return 'badge-incendio';
    if (t.includes('accidente'))                          return 'badge-accidente';
    if (t.includes('médic') || t.includes('salud'))      return 'badge-medico';
    if (t.includes('rescate'))                            return 'badge-rescate';
    return 'badge-default';
  }

  getEstadoClass(estado: string): string {
    if (estado === 'Finalizada') return 'estado-finalizada'; 
    if (estado === 'En Atención') return 'estado-atencion'; 
    if (estado === 'Pendiente Cierre' || estado === 'Redactando Informe') return 'estado-taller';
    if (estado === 'Cancelada' || estado === 'Falsa Alarma') return 'estado-cancelada'; // 🔥 LA LÍNEA MÁGICA
    return 'estado-pendiente'; 
  }

  getEstadoIcon(estado: string): string {
    if (estado === 'Finalizada') return 'task_alt';
    if (estado === 'En Atención') return 'sensors';
    if (estado === 'Pendiente Cierre' || estado === 'Redactando Informe') return 'history_edu'; 
    if (estado === 'Cancelada') return 'cancel'; 
    return 'pending_actions';
  }
}