// src/app/features/servicios/servicios-list/servicios-list.component.ts
import { Component, OnInit, OnDestroy, AfterViewInit, ViewChild, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
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

  get isAdmin(): boolean {
    const rolGuardado = localStorage.getItem('siroce65_rol');
    return rolGuardado === 'ADMIN'; 
  }

  stats = { total: 0, hoy: 0, estaSemana: 0, esteMes: 0 };
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

    this.dataSource.filterPredicate = (data: any, filter: string): boolean => {
      const haystack = [
        data.descripcion, data.tipoServicioNombre, data.direccionServicio,
        data.fechaServicio, data.nombreSolicitante, data.telefonoSolicitante, data.estado,
        data.motivoCancelado 
      ].join(' ').toLowerCase();
      return haystack.includes(filter.trim().toLowerCase());
    };
  }

  loadServicios(): void {
    this.isLoading = true;
    this.cdr.markForCheck();

    const sub = this.service.getAll().subscribe({
      next: (res) => {
        const lista = res.ok
          ? (res.data as any[]).map((raw: any) => {
              
              const tieneUnidad = !!(raw.UNIDAD_DESTACADA && raw.UNIDAD_DESTACADA !== 'No asignada');
              const tieneInformeFinal = !!(raw.OBSERVACIONES_FINALES && String(raw.OBSERVACIONES_FINALES).trim() !== '');
              
              let obsFinales = raw.OBSERVACIONES_FINALES || '';
              let jefeTurnoStr = '';
              
              if (obsFinales.includes('[FIRMA VOBO]:')) {
                 const parts = obsFinales.split('[FIRMA VOBO]:');
                 obsFinales = parts[0].trim();
                 jefeTurnoStr = parts[1] ? parts[1].trim() : '';
              } else if (obsFinales.includes('[JEFE DE TURNO]:')) {
                 const parts = obsFinales.split('[JEFE DE TURNO]:');
                 obsFinales = parts[0].trim();
                 jefeTurnoStr = parts[1] ? parts[1].trim() + ' | Jefe de Turno' : '';
              }

              let estadoActivo = raw.ESTADO || raw.estado || 'Pendiente'; 
              let motivoCancelado = '';

              // 🔥 AHORA SE LLAMA SOLO "Cancelada" Y EXTRAE TODO EL TEXTO PARA LA BURBUJA
              if (obsFinales.includes('[CANCELADO / FALSA ALARMA]:')) {
                estadoActivo = 'Cancelada'; 
                const regex = /\[CANCELADO \/ FALSA ALARMA\]: (.*?)( \- (.*))?(\n\n|$)/;
                const match = obsFinales.match(regex);
                if (match) {
                  motivoCancelado = match[1]?.trim() || '';
                  if (match[3]) {
                    motivoCancelado += ` - ${match[3].trim()}`; // Añade la justificación escrita por el despachador
                  }
                }
              } 
              else {
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
                idSolicitante      : raw.ID_SOLICITANTE    ?? 0,
                nombreSolicitante  : raw.NOMBRE_SOLICITANTE ?? '', 
                telefonoSolicitante: raw.TELEFONO_SOLICITANTE ?? '', 
                tipoServicioNombre : raw.tipoServicio?.TIPO_SERVICIO ?? '—',
                
                estado             : estadoActivo, 
                motivoCancelado    : motivoCancelado, 
                
                tieneCierre        : tieneUnidad, 
                horaSalida         : raw.HORA_SALIDA,
                horaEntrada        : raw.HORA_ENTRADA,
                nombrePaciente     : raw.NOMBRE_PACIENTE || 'No registrado',
                edadPaciente       : raw.EDAD_PACIENTE || 0,
                fallecido          : raw.FALLECIDO || 'NO',
                acompanante        : raw.ACOMPANANTE || 'N/A',
                lugarTraslado      : raw.LUGAR_TRASLADO || 'N/A',
                unidadDestacada    : raw.UNIDAD_DESTACADA || 'No asignada',
                piloto             : raw.PILOTO || 'No asignado',
                personalDestacado  : raw.PERSONAL_DESTACADO || 'Personal de turno',
                observacionesFinales: obsFinales, 
                jefeTurno          : jefeTurnoStr
              };
            })
          : [];

        lista.sort((a: any, b: any) => b.id - a.id);

        this.dataSource.data = lista;
        this.calcularEstadisticas(lista);
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

    this.stats = {
      total      : lista.length,
      hoy        : lista.filter(s => s.fechaServicio.startsWith(hoyISO)).length,
      estaSemana : lista.filter(s => s.fechaServicio >= lunesISO).length,
      esteMes    : lista.filter(s => s.fechaServicio.startsWith(mesActual)).length, 
    };
  }

  applyFilter(event: Event): void {
    this.filterValue       = (event.target as HTMLInputElement).value;
    this.dataSource.filter = this.filterValue.trim().toLowerCase();
    this.dataSource.paginator?.firstPage();
  }

  clearFilter(inputEl: HTMLInputElement): void {
    inputEl.value = ''; this.filterValue = ''; this.dataSource.filter = '';
  }

  openForm(servicio: any | null = null): void {
    const ref = this.dialog.open(ServiciosFormComponent, {
      width: '600px', maxWidth: '95vw', maxHeight: '90vh',
      panelClass: 'dark-dialog', data: servicio, disableClose: true,
    });
    ref.afterClosed().subscribe((result?: { saved: boolean; action: 'create' | 'edit' }) => {
      if (result?.saved) {
        const msg = result.action === 'create' ? '✅ Emergencia registrada.' : '✅ Informe guardado. Puede dar entrada.';
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
      : `✅ Unidad de regreso. Emergencia FINALIZADA.`;

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

      // 🔥 NUEVO: Lógica para estampar la etiqueta (FALLECIDO) en el paciente principal
      let nombrePacienteImpresion = servicio.nombrePaciente || 'No registrado';
      const esFallecido = servicio.fallecido && (servicio.fallecido.toUpperCase() === 'SI' || servicio.fallecido.toUpperCase() === 'SÍ');
      
      if (esFallecido && nombrePacienteImpresion !== 'No registrado') {
        nombrePacienteImpresion += ' (FALLECIDO)';
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
        
        esServicioGeneral: esServicioGeneral 
      };

      this.reportePdf.generarInformeLlamada(datosParaPdf);
      
    } catch (error) {
      console.error('🔥 ERROR CRÍTICO AL GENERAR PDF:', error);
      this.snackBar.open('Error al compilar los datos para el PDF.', 'OK', { duration: 4000 });
    }
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