import { Component, OnInit, Inject, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { FormBuilder, FormGroup, Validators, AbstractControl, FormArray } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { ServiciosService, ServicioPayload, TipoServicioItem, VehiculoDisponible, BomberoDisponible } from '../../../core/services/servicios.service';
import { InsumosService, InsumoRaw } from '../../../core/services/insumos.service';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  standalone    : false,
  selector      : 'app-servicios-form',
  templateUrl   : './servicios-form.component.html',
  styleUrls     : ['./servicios-form.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ServiciosFormComponent implements OnInit {

  form   !: FormGroup;
  isEditMode = false;
  isSaving   = false;
  errorMsg   = '';
  
  tipos: TipoServicioItem[] = [];
  vehiculos: VehiculoDisponible[] = [];
  bomberos: BomberoDisponible[] = [];
  jefesDisponibles: any[] = [];

  esServicioBase = false;
  permitirCierre = false;

  // 🔥 Máquina de estados del select "Estado Operativo": qué opciones se
  // muestran depende del estado CON EL QUE SE ABRIÓ el registro (no del que
  // el usuario vaya seleccionando después). Ver calcularOpcionesEstado().
  opcionesEstadoDisponibles: string[] = [];
  estadoInicial: string = 'Pendiente';

  // 🔒 true cuando solo hay UNA opción disponible (hoy: únicamente el caso
  // "En Atención" en edición) — el select se deshabilita porque ese avance
  // de estado ya no depende del despachador, sino de que se marque la hora
  // de ENTRADA en el tablero principal (servicios-list).
  estadoBloqueado = false;

  // 🔒 Permisos: si el registro se abrió en "En Atención" y el usuario NO es
  // ADMIN, la unidad ya está en la calle — nada del formulario debe poder
  // tocarse desde aquí (el avance real lo marca la hora de ENTRADA en el
  // tablero principal). ADMIN sí puede editar, para correcciones/auditoría.
  formularioBloqueado = false;

  // 🔥 Bloquea fechas futuras en el datepicker de "Fecha del evento"
  readonly maxDate: Date = new Date();

  // 🔥 Catálogo real de insumos consumibles (Material/Insumo Médico), cargado desde el backend
  insumosCatalogo: InsumoRaw[] = [];

  // 🔥 3NF: mismas opciones canónicas del select de motivo (ver .html) — se usan para
  // separar de vuelta MOTIVO_CANCELACION en "motivo conocido" vs. "Otros (Especificar)".
  readonly OPCIONES_MOTIVO_CANCELACION = [
    'Llamada de broma / Falsa alarma malintencionada',
    'Incidente duplicado (Ya reportado)',
    'Atendido por otra institución (PNC, Cruz Roja, etc.)',
    'Cancelado por el reportante',
    'Situación controlada por civiles',
    'Dirección inexistente / No se encontró el incidente',
    'Falsa alarma de buena fe (Confusión)',
    'Error de digitación en cabina',
  ];

  constructor(
    private fb         : FormBuilder,
    private service    : ServiciosService,
    private insumosService: InsumosService,
    private auth       : AuthService,
    private cdr        : ChangeDetectorRef,
    public  dialogRef  : MatDialogRef<ServiciosFormComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any,
  ) {}

  ngOnInit(): void {
    this.isEditMode = !!this.data;
    
    if (this.isEditMode && this.data) {
      const valEntrada = this.data.horaEntrada || this.data.HORA_ENTRADA;
      const tieneHoraEntrada = !!valEntrada && valEntrada !== '' && valEntrada !== '00:00:00';
      this.permitirCierre = this.data.estado === 'Finalizada' || tieneHoraEntrada;
    } else {
      this.permitirCierre = false;
    }

    this.estadoInicial = this.isEditMode ? (this.data.estado || this.data.ESTADO || 'Pendiente') : 'Pendiente';
    this.opcionesEstadoDisponibles = this.calcularOpcionesEstado(this.estadoInicial);
    this.estadoBloqueado = this.opcionesEstadoDisponibles.length === 1;

    this.formularioBloqueado = this.isEditMode
      && this.estadoInicial === 'En Atención'
      && this.auth.getRole() !== 'ADMIN';

    this.buildForm();
    this.setupDynamicValidators();

    if (this.formularioBloqueado) {
      // 🔒 Bloqueo total: nada se edita hasta que la unidad marque su ENTRADA.
      this.form.disable({ emitEvent: false });
    } else {
      if (this.estadoBloqueado) {
        this.form.get('estado')?.disable({ emitEvent: false });
      }

      // 🔒 Permisos: en edición, la Fecha del evento es inmutable para el
      // despachador (evita alterar el registro horario de una emergencia ya
      // reportada). Solo ADMIN puede corregirla (auditoría/errores de captura).
      if (this.isEditMode && this.auth.getRole() !== 'ADMIN') {
        this.form.get('fechaServicio')?.disable({ emitEvent: false });
      }
    }

    this.loadTipos();
    this.loadVehiculos();
    this.loadBomberos();
    this.loadInsumos();

    if (this.isEditMode && this.data) {
      this.patchForm(this.data);
    }
  }

  // 🔥 3NF: unidad/piloto/personal ya no se completan a mano aquí — se muestran
  // de solo lectura a partir de lo que ya despachó `servicios-asignacion` (detalle_vehiculo/detalle_bombero).
  get unidadesTexto(): string {
    const lista = this.data?.vehiculosAsignados || [];
    if (!lista.length) return 'Sin unidades despachadas';
    return lista.map((v: any) => `${v.PLACA} (${v.MARCA})`).join(', ');
  }

  get pilotoTexto(): string {
    const lista = this.data?.bomberosAsignados || [];
    const piloto = lista.find((b: any) => b.DetalleBombero?.es_piloto);
    return piloto ? `${piloto.persona?.NOMBRE} ${piloto.persona?.APELLIDO}` : 'No asignado';
  }

  get personalTexto(): string {
    const lista = this.data?.bomberosAsignados || [];
    const resto = lista.filter((b: any) => !b.DetalleBombero?.es_piloto);
    if (!resto.length) return 'Sin personal destacado';
    return resto.map((b: any) => `${b.persona?.NOMBRE} ${b.persona?.APELLIDO}`).join(', ');
  }

  get esCancelado(): boolean {
    const estado = this.form?.get('estado')?.value;
    return estado === 'Cancelada (Error de cabina)' || estado === 'Falsa Alarma';
  }

  // 🔥 Automatización "Anónimo": limpia el campo al enfocar si trae el valor
  // por defecto, y lo restaura si el usuario lo deja completamente vacío.
  onFocusNombreSolicitante(): void {
    const ctrl = this.form.get('nombreSolicitante');
    if (!ctrl) return;
    if (ctrl.value === 'Anónimo') ctrl.setValue('');
  }

  onBlurNombreSolicitante(): void {
    const ctrl = this.form.get('nombreSolicitante');
    if (!ctrl) return;
    if (!ctrl.value || !ctrl.value.trim()) ctrl.setValue('Anónimo');
  }

  // 🔥 Máquina de estados: qué valores del "Estado Operativo" puede elegir el
  // despachador, según el estado con el que se abrió el registro.
  private calcularOpcionesEstado(estadoInicial: string): string[] {
    if (!this.isEditMode) {
      return ['Pendiente', 'Cancelada (Error de cabina)'];
    }

    switch (estadoInicial) {
      case 'Pendiente':
        return ['Pendiente', 'En Atención', 'Cancelada (Error de cabina)', 'Falsa Alarma'];

      case 'En Atención':
        // 🔒 Bloqueado: el avance de este estado depende de que se marque la
        // hora de ENTRADA en el tablero principal, no de este formulario.
        return ['En Atención'];

      case 'Redactando Informe':
        return ['Redactando Informe', 'Finalizada', 'Cancelada (Error de cabina)', 'Falsa Alarma'];

      default:
        // Estados terminales (Finalizada, Cancelada, Falsa Alarma): no tiene
        // sentido operativo reabrirlos desde aquí, se muestran bloqueados.
        return [estadoInicial];
    }
  }

  soloNumeros(event: any): boolean {
    const charCode = (event.which) ? event.which : event.keyCode;
    if (charCode > 31 && (charCode < 48 || charCode > 57)) return false;
    return true;
  }

  private buildForm(): void {
    const fechaHoy = new Date();

    this.form = this.fb.group({
      estado             : ['Pendiente', Validators.required],
      motivoCancelacion  : [''],
      justificacionCancelacion: [''],

      idTipoServicio     : [null, Validators.required],
      descripcion        : ['',   [Validators.maxLength(150)]],
      fechaServicio      : [fechaHoy, Validators.required],
      direccionServicio  : ['',   [Validators.required, Validators.minLength(5), Validators.maxLength(150)]],
      referenciaLugar     : [''], 
      nombreSolicitante  : ['Anónimo', [Validators.required, Validators.maxLength(40), Validators.pattern(/^[a-zA-ZáéíóúÁÉÍÓÚñÑüÜ\s]+$/)]],
      telefonoSolicitante: ['',   [Validators.required, Validators.minLength(8), Validators.maxLength(8), Validators.pattern('^[0-9]{8}$')]],
      
      clasificacionPacientes: ['UNICO', Validators.required],
      detalleMultiples   : [''], 
      
      pacientes          : this.fb.array([this.crearGrupoPaciente()]),

      acompanante        : ['', [Validators.maxLength(150)]],
      lugarTraslado      : ['', [Validators.maxLength(150)]],
      idFirmaVobo        : [null],
      observacionesFinales: [''],

      insumos            : this.fb.array([]),
    });
  }

  private setupDynamicValidators(): void {
    this.form.get('estado')?.valueChanges.subscribe(estadoVal => {
      const motivoCtrl = this.form.get('motivoCancelacion');
      const justificacionCtrl = this.form.get('justificacionCancelacion');

      if (estadoVal === 'Cancelada (Error de cabina)' || estadoVal === 'Falsa Alarma') {
        motivoCtrl?.setValidators([Validators.required]);
      } else {
        motivoCtrl?.clearValidators();
        motivoCtrl?.setValue('');
        justificacionCtrl?.clearValidators();
        justificacionCtrl?.setValue('');
      }
      motivoCtrl?.updateValueAndValidity();

      // 🔥 Validación de cierre: si se marca "Finalizada" hace falta saber
      // quién la cerró (Vo.Bo.) antes de dejar guardar. En cualquier otro
      // estado, el campo vuelve a ser opcional.
      const firmaVoboCtrl = this.form.get('idFirmaVobo');
      if (estadoVal === 'Finalizada') {
        firmaVoboCtrl?.setValidators([Validators.required]);
      } else {
        firmaVoboCtrl?.clearValidators();
      }
      firmaVoboCtrl?.updateValueAndValidity();

      this.cdr.markForCheck();
    });

    this.form.get('motivoCancelacion')?.valueChanges.subscribe(motivoVal => {
      const justificacionCtrl = this.form.get('justificacionCancelacion');
      if (motivoVal === 'Otros (Especificar)') {
        justificacionCtrl?.setValidators([Validators.required, Validators.minLength(5)]);
      } else {
        justificacionCtrl?.clearValidators();
        justificacionCtrl?.setValue('');
      }
      justificacionCtrl?.updateValueAndValidity();
      this.cdr.markForCheck();
    });
  }

  get pacientesArray(): FormArray { return this.form.get('pacientes') as FormArray; }

  crearGrupoPaciente(nombre: string = '', edad: number | null = null, fallecido: string = 'NO'): FormGroup {
    return this.fb.group({
      nombrePaciente: [nombre, [Validators.maxLength(150)]],
      edadPaciente  : [edad, [Validators.min(0), Validators.max(120)]],
      fallecido     : [fallecido]
    });
  }

  agregarPaciente(): void { this.pacientesArray.push(this.crearGrupoPaciente()); this.cdr.markForCheck(); }
  quitarPaciente(index: number): void { if (this.pacientesArray.length > 1) { this.pacientesArray.removeAt(index); this.cdr.markForCheck(); } }

  // 🔥 NUEVO: Registro dinámico de insumos gastados (Fase 4: Cierre Operativo)
  get insumosArray(): FormArray { return this.form.get('insumos') as FormArray; }

  crearGrupoInsumo(idInsumo: number | string = '', cantidad: number = 1): FormGroup {
    return this.fb.group({
      id_insumo: [idInsumo, Validators.required],
      cantidad : [cantidad, [Validators.required, Validators.min(1)]]
    });
  }

  agregarInsumo(): void { this.insumosArray.push(this.crearGrupoInsumo()); this.cdr.markForCheck(); }
  quitarInsumo(index: number): void { this.insumosArray.removeAt(index); this.cdr.markForCheck(); }

  onTipoServicioChange(idTipo: number): void {
    const tipoSeleccionado = this.tipos.find(t => t.ID_TIPO_S === idTipo);
    if (tipoSeleccionado) {
      this.esServicioBase = (tipoSeleccionado as any).CATEGORIA === 'Servicio';
    } else {
      this.esServicioBase = false;
    }
    this.cdr.markForCheck();
  }

  private patchForm(s: any): void {
    let fechaLocal: any = new Date();
    if (s.fechaServicio || s.FECHA_SERVICIO) {
      const f = s.fechaServicio || s.FECHA_SERVICIO;
      const parts = f.split('-'); 
      if (parts.length === 3) fechaLocal = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
      else fechaLocal = new Date(f);
    }

    // 🔥 3NF: la lista real de víctimas viene en `s.pacientes` (tb_pacientes vía JOIN).
    // acompanante/lugarTraslado se toman del primer paciente, ya que el formulario
    // maneja un solo valor compartido para todo el cierre.
    const pacientesGuardados: any[] = Array.isArray(s.pacientes) ? s.pacientes : [];
    const primerPaciente = pacientesGuardados[0] || null;

    let valAcompanante = primerPaciente?.ACOMPANANTE || s.acompanante || '';
    let valTraslado = primerPaciente?.LUGAR_TRASLADO || s.lugarTraslado || '';
    const obsDb = s.observacionesFinales || s.OBSERVACIONES_FINALES || '';

    // 🔥 3NF: ID_FIRMA_VOBO y MOTIVO_CANCELACION ya son columnas propias — no más
    // parsing de marcadores [FIRMA VOBO]:/[JEFE DE TURNO]:/[CANCELADO...]: en el texto.
    const idFirmaVoboGuardado = s.idFirmaVobo ?? s.ID_FIRMA_VOBO ?? s.firmaVobo?.ID_BOMBERO ?? null;
    const motivoDb = s.motivoCancelado || s.MOTIVO_CANCELACION || '';

    // MOTIVO_CANCELACION se guarda como un solo string ("Otros (Especificar) - texto"
    // cuando el motivo es libre); aquí se separa de vuelta para prellenar el select y
    // el textarea de justificación.
    let motivoGuardado = '';
    let justificacionGuardada = '';
    if (motivoDb) {
      const prefijoOtros = 'Otros (Especificar) - ';
      if (this.OPCIONES_MOTIVO_CANCELACION.includes(motivoDb)) {
        motivoGuardado = motivoDb;
      } else if (motivoDb.startsWith(prefijoOtros)) {
        motivoGuardado = 'Otros (Especificar)';
        justificacionGuardada = motivoDb.slice(prefijoOtros.length);
      } else {
        motivoGuardado = 'Otros (Especificar)';
        justificacionGuardada = motivoDb;
      }
    }

    let dirCompleta = s.direccionServicio || s.DIRECCION_SERVICIO || '';
    let dirSola = dirCompleta;
    let refSola = '';

    if (dirCompleta.includes(', Referencia: ')) {
      const partes = dirCompleta.split(', Referencia: ');
      dirSola = partes[0];
      refSola = partes[1] || '';
    }

    // 🔥 3NF: cada víctima ya es una fila real en tb_pacientes — se puebla directo,
    // sin decodificar marcadores de texto de OBSERVACIONES_FINALES.
    this.pacientesArray.clear();
    if (pacientesGuardados.length > 0) {
      for (const p of pacientesGuardados) {
        const nombre = p.NOMBRE_PACIENTE || p.nombrePaciente || '';
        const edad = (p.EDAD_PACIENTE ?? p.edadPaciente ?? null);
        const fallecido = p.FALLECIDO || p.fallecido || 'NO';
        this.pacientesArray.push(this.crearGrupoPaciente(nombre, edad, fallecido));
      }
    } else {
      this.pacientesArray.push(this.crearGrupoPaciente());
    }

    // 🔥 NUEVO: Poblar el FormArray de insumos con lo ya guardado en el cierre (si aplica)
    this.insumosArray.clear();
    const insumosGuardados = s.insumos || s.INSUMOS_UTILIZADOS || s.insumosUtilizados || [];
    if (Array.isArray(insumosGuardados) && insumosGuardados.length > 0) {
      for (const item of insumosGuardados) {
        const idInsumo = item.id_insumo ?? item.ID_INSUMO ?? item.id ?? '';
        const cantidad = item.cantidad ?? item.cantidad_utilizada ?? item.DetalleInsumoServicio?.cantidad_utilizada ?? 1;
        this.insumosArray.push(this.crearGrupoInsumo(idInsumo, cantidad));
      }
    }

    this.form.patchValue({
      estado             : s.estado || s.ESTADO || 'Pendiente', 
      motivoCancelacion  : motivoGuardado || '',
      justificacionCancelacion: justificacionGuardada || '',
      idTipoServicio     : s.idTipoServicio || s.ID_TIPO_SERVICIO,      
      descripcion        : s.descripcion || s.DESCRIPCION,
      fechaServicio      : fechaLocal,
      direccionServicio  : dirSola,
      referenciaLugar    : refSola,
      nombreSolicitante  : s.nombreSolicitante || s.NOMBRE_SOLICITANTE || 'Anónimo',
      telefonoSolicitante: s.telefonoSolicitante || s.TELEFONO_SOLICITANTE || '',
      acompanante        : valAcompanante === 'N/A' ? '' : valAcompanante,
      lugarTraslado      : valTraslado === 'N/A' ? '' : valTraslado,
      idFirmaVobo        : idFirmaVoboGuardado,
      observacionesFinales: obsDb.trim()
    });

    if (s.idTipoServicio || s.ID_TIPO_SERVICIO) {
      setTimeout(() => this.onTipoServicioChange(s.idTipoServicio || s.ID_TIPO_SERVICIO), 200);
    }
  }

  get f(): { [k: string]: AbstractControl } { return this.form.controls; }

  bloquearCaracteres(event: KeyboardEvent): void { if (['-', 'e', 'E', '+', '.'].includes(event.key)) event.preventDefault(); }

  // 🔥 La edad no debe superar 3 dígitos (input type="number" no respeta maxlength).
  // Validators.max(120) ya la invalida en el TS, pero esto evita que el usuario
  // llegue siquiera a teclear un valor absurdo como 577.
  bloquearEdadExcesiva(event: KeyboardEvent): void {
    this.bloquearCaracteres(event);
    if (event.defaultPrevented) return;

    const teclasPermitidas = ['Backspace', 'Delete', 'ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Tab', 'Home', 'End'];
    if (teclasPermitidas.includes(event.key) || event.ctrlKey || event.metaKey) return;

    const input = event.target as HTMLInputElement;
    const haySeleccion = input.selectionStart !== input.selectionEnd;
    if (!haySeleccion && input.value.length >= 3) {
      event.preventDefault();
    }
  }
  validarTelefono(event: KeyboardEvent): void { if (!/[0-9+\-\s()]/.test(event.key) && event.key.length === 1) event.preventDefault(); }
  validarLetras(event: KeyboardEvent): void { 
    if (!/^[a-zA-ZáéíóúÁÉÍÓÚñÑüÜ\s]+$/.test(event.key)) event.preventDefault(); 
  }
  
  loadTipos(): void {
    this.service.getTipos().subscribe(res => { 
      this.tipos = res.ok ? res.data : []; 
      if (this.f['idTipoServicio'].value) this.onTipoServicioChange(this.f['idTipoServicio'].value);
      this.cdr.markForCheck(); 
    }); 
  }
  loadVehiculos(): void { this.service.getVehiculosDisponibles().subscribe(res => { this.vehiculos = res.ok ? res.data : []; this.cdr.markForCheck(); }); }

  // 🔥 NUEVO: Catálogo Unificado de Recursos, filtrado a solo consumibles médicos
  // (id_tipo_insumo = 1 → "Insumo Médico"). Excluye Herramientas (4) y EPP (2).
  loadInsumos(): void {
    this.insumosService.getAll().subscribe(res => {
      const todos = res.ok ? res.data : [];
      this.insumosCatalogo = todos.filter((raw: InsumoRaw) => raw.id_tipo_insumo === 1);
      this.cdr.markForCheck();
    });
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

  getTurnoBombero(b: any): string {
    return String(b?.TURNO || b?.turno || '').toLowerCase().trim();
  }

  loadBomberos(): void { 
    const turnosHoy = this.getTurnosDelDia();

    this.service.getBomberosActivos().subscribe(res => { 
      const todosLosBomberos = res.ok ? res.data : []; 
      
      this.bomberos = todosLosBomberos.filter((b: any) => {
        const turnoBombero = this.getTurnoBombero(b);
        return turnosHoy.includes(turnoBombero);
      });

      // 🔥 3NF: b.cargo ahora es un objeto { ID_CARGO, CARGO } (antes era texto plano)
      this.jefesDisponibles = this.bomberos.filter((b: any) => {
        const cargo = String(b.cargo?.CARGO || b.CARGO || b.cargoFuncional || '').toLowerCase();
        return cargo.includes('jefe');
      });

      const jefeGuardado = this.form.get('idFirmaVobo')?.value;

      if (!jefeGuardado && this.jefesDisponibles.length > 0) {
        let jefeSeleccionado = this.jefesDisponibles.find((j: any) => {
          const cargo = String(j.cargo?.CARGO || j.CARGO || j.cargoFuncional || '').toLowerCase();
          return cargo.includes('jefe de turno');
        });
        if (!jefeSeleccionado) jefeSeleccionado = this.jefesDisponibles[0];

        this.form.patchValue({ idFirmaVobo: jefeSeleccionado.ID_BOMBERO });
      }
      this.cdr.markForCheck();
    }); 
  }

  onSubmit(): void {
    this.form.markAllAsTouched();
    if (this.form.invalid) {
      this.errorMsg = 'Hay campos inválidos o incompletos. Revise las alertas en rojo.';
      this.cdr.markForCheck();
      return;
    }
    if (this.isSaving) return;

    this.isSaving = true;
    this.errorMsg = '';
    this.cdr.markForCheck();

    try {
      // 🔥 getRawValue() en vez de .value: cuando "estado" está bloqueado
      // (estadoBloqueado) el control queda disabled, y .value lo omitiría
      // del objeto, mandando ESTADO como undefined al backend.
      const formValues = this.form.getRawValue();

      let finalDateString = formValues.fechaServicio;
      if (finalDateString instanceof Date) {
        const y = finalDateString.getFullYear();
        const m = String(finalDateString.getMonth() + 1).padStart(2, '0');
        const d = String(finalDateString.getDate()).padStart(2, '0');
        finalDateString = `${y}-${m}-${d}`;
      }

      const obsFinales = formValues.observacionesFinales?.trim() || '';

      // 🔥 3NF: ES_FALSA_ALARMA/MOTIVO_CANCELACION son columnas propias — ya no se
      // concatena un marcador de texto dentro de OBSERVACIONES_FINALES.
      const esFalsaAlarma = this.esCancelado;
      let motivoCancelacionFinal: string | null = null;
      if (esFalsaAlarma) {
        motivoCancelacionFinal = formValues.motivoCancelacion;
        if (formValues.motivoCancelacion === 'Otros (Especificar)') {
          motivoCancelacionFinal = `${formValues.motivoCancelacion} - ${formValues.justificacionCancelacion}`;
        }
      }

      // 🔥 3NF: cada víctima se manda como su propia fila en tb_pacientes (arreglo PACIENTES),
      // ya no se codifica texto extra en observaciones.
      let pacientesFinal: any[] = [];
      if (!this.esCancelado && !this.esServicioBase && this.permitirCierre) {
        const acompananteComun = formValues.acompanante?.trim() || null;
        const trasladoComun = formValues.lugarTraslado?.trim() || null;
        pacientesFinal = (formValues.pacientes || [])
          .filter((p: any) => p.nombrePaciente?.trim() || p.edadPaciente)
          .map((p: any) => ({
            NOMBRE_PACIENTE: p.nombrePaciente?.trim() || null,
            EDAD_PACIENTE  : p.edadPaciente || null,
            FALLECIDO      : p.fallecido || 'NO',
            ACOMPANANTE    : acompananteComun,
            LUGAR_TRASLADO : trasladoComun,
          }));
      }

      const dirBase = formValues.direccionServicio?.trim() || '';
      const refBase = formValues.referenciaLugar?.trim() || '';
      const direccionFinal = refBase ? `${dirBase}, Referencia: ${refBase}` : dirBase;

      // 🔥 NUEVO: Insumos gastados (Fase 4: Cierre Operativo)
      const insumosArr = formValues.insumos;

      const payload: any = {
        ESTADO              : formValues.estado, 
        ID_TIPO_SERVICIO    : formValues.idTipoServicio,
        DESCRIPCION         : formValues.descripcion?.trim() || '',
        FECHA_SERVICIO      : finalDateString,
        DIRECCION_SERVICIO  : direccionFinal,
        NOMBRE_SOLICITANTE  : formValues.nombreSolicitante?.trim() || '',
        TELEFONO_SOLICITANTE: formValues.telefonoSolicitante?.trim() || '',

        PACIENTES           : pacientesFinal,
        OBSERVACIONES_FINALES: (this.permitirCierre || this.esCancelado) ? obsFinales : '',
        ES_FALSA_ALARMA     : esFalsaAlarma,
        MOTIVO_CANCELACION  : motivoCancelacionFinal,
        ID_FIRMA_VOBO       : formValues.idFirmaVobo || null,

        INSUMOS_UTILIZADOS  : Array.isArray(insumosArr) ? insumosArr : [],
      };

      const idRegistro = this.isEditMode ? (this.data.id || this.data.ID_SERVICIO) : null;
      const request$ = this.isEditMode ? this.service.update(idRegistro, payload as ServicioPayload) : this.service.create(payload as ServicioPayload);

      request$.subscribe({
        next : () => {
          this.isSaving = false;
          // 🔥 estadoFinal viaja para que el listado (servicios-list) sepa
          // qué snackbar mostrar (p. ej. distinguir un cierre "Finalizada"
          // de una edición intermedia) sin tener que volver a consultarlo.
          this.dialogRef.close({ saved: true, action: this.isEditMode ? 'edit' : 'create', estadoFinal: formValues.estado });
        },
        error: (err) => {
          this.isSaving = false;
          this.errorMsg = err.status === 400 ? (err.error?.message ?? 'Datos inválidos.') : 'Error al guardar el registro.';
          this.cdr.markForCheck();
        }
      });

    } catch (error) {
      console.error('🔥 Error en onSubmit:', error);
      this.isSaving = false;
      this.errorMsg = 'Error crítico al procesar los datos.';
      this.cdr.markForCheck();
    }
  }

  onCancel(): void { this.dialogRef.close(); }
  getTipoIconActivo(): string { const id = this.form.get('idTipoServicio')?.value; const tipo = this.tipos.find(t => t.ID_TIPO_S === id); return tipo ? this.getTipoIcon(tipo.TIPO_SERVICIO) : 'warning_amber'; }
  getTipoLabelActivo(): string { const id = this.form.get('idTipoServicio')?.value; return this.tipos.find(t => t.ID_TIPO_S === id)?.TIPO_SERVICIO ?? ''; }

  getTipoIcon(tipo: string): string {
    const t = tipo?.toLowerCase() ?? '';
    if (t.includes('incendio') || t.includes('fuego'))   return 'local_fire_department';
    if (t.includes('accidente') || t.includes('tráns'))  return 'directions_car';
    if (t.includes('médic') || t.includes('salud'))      return 'local_hospital';
    if (t.includes('rescate') || t.includes('derrumbe')) return 'emergency';
    if (t.includes('gas') || t.includes('fuga'))         return 'warning';
    if (t.includes('agua') || t.includes('inundaci'))    return 'water';
    if (t.includes('árbol') || t.includes('arbol'))      return 'park';
    return 'warning_amber';
  }
}