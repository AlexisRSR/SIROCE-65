import { Component, OnInit, Inject, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { FormBuilder, FormGroup, Validators, AbstractControl, FormArray } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { ServiciosService, ServicioPayload, TipoServicioItem, VehiculoDisponible, BomberoDisponible } from '../../../core/services/servicios.service';

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

  constructor(
    private fb         : FormBuilder,
    private service    : ServiciosService,
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

    this.buildForm();
    this.setupDynamicValidators(); 
    
    this.loadTipos();      
    this.loadVehiculos();
    this.loadBomberos();

    if (this.isEditMode && this.data) {
      this.patchForm(this.data);
      this.verificarAsignacionesPrevias(); 
    }
  }

  get esCancelado(): boolean {
    const estado = this.form?.get('estado')?.value;
    return estado === 'Cancelada (Error de cabina)' || estado === 'Falsa Alarma';
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
      nombreSolicitante  : ['',   [Validators.maxLength(100), Validators.pattern(/^[a-zA-ZáéíóúÁÉÍÓÚñÑüÜ\s]+$/)]],
      telefonoSolicitante: ['',   [Validators.minLength(8), Validators.maxLength(8), Validators.pattern(/^[0-9+\-\s()]*$/)]], 
      
      clasificacionPacientes: ['UNICO', Validators.required],
      detalleMultiples   : [''], 
      
      pacientes          : this.fb.array([this.crearGrupoPaciente()]),
      
      acompanante        : ['', [Validators.maxLength(150)]],
      lugarTraslado      : ['', [Validators.maxLength(150)]],
      unidadDestacada    : [''],
      piloto             : [''],
      personalDestacado  : [[]],
      jefeTurno          : [''], 
      observacionesFinales: ['']
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

    const personalString = s.personalDestacado || s.PERSONAL_DESTACADO || '';
    const personalArray = personalString ? personalString.split(', ') : [];
    const unidadString = s.unidadDestacada === 'No asignada' ? '' : (s.unidadDestacada || s.UNIDAD_DESTACADA || '');
    const unidadArray = unidadString ? unidadString.split(', ') : [];
    const pilotoRaw = s.piloto === 'No asignado' ? '' : (s.piloto || s.PILOTO || '');
    const pilotoArray = pilotoRaw ? pilotoRaw.split(', ').map((p: string) => p.trim()) : [];

    let valAcompanante = s.acompanante || s.ACOMPANANTE || '';
    let valTraslado = s.lugarTraslado || s.LUGAR_TRASLADO || '';
    let valPaciente = s.nombrePaciente || s.NOMBRE_PACIENTE || '';
    let valEdad = (s.edadPaciente === 0 || !s.edadPaciente) ? null : s.edadPaciente;
    let valFallecido = s.fallecido || s.FALLECIDO || 'NO';
    let obsDb = s.observacionesFinales || s.OBSERVACIONES_FINALES || '';
    let jefeTurnoGuardado = '';
    
    if (obsDb.includes('[FIRMA VOBO]:')) {
       const partsJefe = obsDb.split('[FIRMA VOBO]:');
       obsDb = partsJefe[0].trim();
       jefeTurnoGuardado = partsJefe[1] ? partsJefe[1].trim() : '';
    } else if (obsDb.includes('[JEFE DE TURNO]:')) {
       const partsJefe = obsDb.split('[JEFE DE TURNO]:');
       obsDb = partsJefe[0].trim();
       jefeTurnoGuardado = partsJefe[1] ? partsJefe[1].trim() + ' | Jefe de Turno' : '';
    }

    let motivoGuardado = '';
    let justificacionGuardada = '';
    
    if (obsDb.includes('[CANCELADO / FALSA ALARMA]:')) {
      const regex = /\[CANCELADO \/ FALSA ALARMA\]: (.*?)( \- (.*))?(\n\n|$)/;
      const match = obsDb.match(regex);
      if (match) {
        motivoGuardado = match[1]?.trim() || '';
        justificacionGuardada = match[3]?.trim() || '';
        obsDb = obsDb.replace(match[0], '').trim();
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

    if (valPaciente === 'No registrado' || valPaciente === 'Múltiples víctimas') valPaciente = '';

    this.pacientesArray.clear();

    const marcador = '[VÍCTIMAS ADICIONALES ATENDIDAS]:\n';
    if (obsDb.includes(marcador)) {
      const parts = obsDb.split(marcador);
      const extraTexto = parts[1].split('\n\n')[0]; 
      obsDb = parts[0].trim() + '\n\n' + (parts[1].split('\n\n').slice(1).join('\n\n') || '');

      this.pacientesArray.push(this.crearGrupoPaciente(valPaciente, valEdad, valFallecido));

      const lineas = extraTexto.split('\n');
      for (const linea of lineas) {
        if (linea.trim() === '') continue;
        let pNombre = ''; let pEdad = null; let pFallecido = 'NO';
        
        const matchNombre = linea.match(/\d+\.\s(.*?)\s\|/);
        if (matchNombre) pNombre = matchNombre[1].trim();
        if (pNombre === 'Desconocido') pNombre = '';

        const matchEdad = linea.match(/\|\s(\d+)\saños/);
        if (matchEdad) pEdad = Number(matchEdad[1]);
        if (linea.includes('(FALLECIDO)')) pFallecido = 'SI';

        this.pacientesArray.push(this.crearGrupoPaciente(pNombre, pEdad, pFallecido));
      }
    } else {
      this.pacientesArray.push(this.crearGrupoPaciente(valPaciente, valEdad, valFallecido));
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
      nombreSolicitante  : s.nombreSolicitante || s.NOMBRE_SOLICITANTE || '', 
      telefonoSolicitante: s.telefonoSolicitante || s.TELEFONO_SOLICITANTE || '',
      acompanante        : valAcompanante === 'N/A' ? '' : valAcompanante,
      lugarTraslado      : valTraslado === 'N/A' ? '' : valTraslado,
      unidadDestacada    : unidadArray,
      piloto             : pilotoArray,
      personalDestacado  : personalArray,
      jefeTurno          : s.jefeTurno || jefeTurnoGuardado, 
      observacionesFinales: obsDb.trim()
    });

    if (s.idTipoServicio || s.ID_TIPO_SERVICIO) {
      setTimeout(() => this.onTipoServicioChange(s.idTipoServicio || s.ID_TIPO_SERVICIO), 200);
    }
  }

  get f(): { [k: string]: AbstractControl } { return this.form.controls; }

  bloquearCaracteres(event: KeyboardEvent): void { if (['-', 'e', 'E', '+', '.'].includes(event.key)) event.preventDefault(); }
  validarTelefono(event: KeyboardEvent): void { if (!/[0-9+\-\s()]/.test(event.key) && event.key.length === 1) event.preventDefault(); }
  validarLetras(event: KeyboardEvent): void { 
    if (!/^[a-zA-ZáéíóúÁÉÍÓÚñÑüÜ\s]+$/.test(event.key)) event.preventDefault(); 
  }
  
  verificarAsignacionesPrevias(): void {
    const tieneUnidadGuardada = !!this.data.unidadDestacada && this.data.unidadDestacada !== 'No asignada';
    const tienePersonalGuardado = !!this.data.personalDestacado && this.data.personalDestacado !== 'Personal de turno' && this.data.personalDestacado.length > 0;

    if (!tieneUnidadGuardada || !tienePersonalGuardado) {
      const idServicio = this.data.id || this.data.ID_SERVICIO;
      this.service.getAsignaciones(idServicio).subscribe(res => {
        if (res.ok) {
          const asig = res.data;
          setTimeout(() => {
            const patchData: any = {};
            
            if (!tieneUnidadGuardada && asig.vehiculos?.length > 0) {
              const unidadesNombres = asig.vehiculos.map((vId: number) => {
                const vObj: any = this.vehiculos.find((v: any) => (v.ID_VEHICULO || (v as any).id_vehiculo) === vId);
                return vObj ? vObj.PLACA + ' - ' + vObj.MARCA : null;
              }).filter((n: any) => n !== null);
              if (unidadesNombres.length > 0) patchData.unidadDestacada = unidadesNombres;
            }

            if (!tienePersonalGuardado && asig.bomberos?.length > 0) {
              let pilotosDetectados: string[] = []; 
              const personalNombres = asig.bomberos.map((bId: number) => {
                const bObj: any = this.bomberos.find((b: any) => (b.ID_BOMBERO || (b as any).id_bombero) === bId);
                if (bObj) {
                  const nombreCompleto = bObj.persona?.NOMBRE + ' ' + bObj.persona?.APELLIDO;
                  const cargo = String(bObj.CARGO || bObj.cargo || bObj.cargoFuncional || '').toLowerCase();
                  if (cargo.includes('piloto') || cargo.includes('conductor')) {
                    pilotosDetectados.push(nombreCompleto);
                    return null; 
                  }
                  return nombreCompleto;
                }
                return null;
              }).filter((n: any) => n !== null);

              if (pilotosDetectados.length > 0) patchData.piloto = pilotosDetectados;
              if (personalNombres.length > 0) patchData.personalDestacado = personalNombres;
            }

            if (Object.keys(patchData).length > 0) {
              this.form.patchValue(patchData);
              this.cdr.markForCheck();
            }
          }, 600);
        }
      });
    }
  }

  loadTipos(): void { 
    this.service.getTipos().subscribe(res => { 
      this.tipos = res.ok ? res.data : []; 
      if (this.f['idTipoServicio'].value) this.onTipoServicioChange(this.f['idTipoServicio'].value);
      this.cdr.markForCheck(); 
    }); 
  }
  loadVehiculos(): void { this.service.getVehiculosDisponibles().subscribe(res => { this.vehiculos = res.ok ? res.data : []; this.cdr.markForCheck(); }); }
  
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

      this.jefesDisponibles = this.bomberos.filter((b: any) => {
        const cargo = String(b.CARGO || b.cargo || b.cargoFuncional || '').toLowerCase();
        return cargo.includes('jefe'); 
      });

      const jefeGuardado = this.form.get('jefeTurno')?.value;
      
      if (!jefeGuardado && this.jefesDisponibles.length > 0) {
        let jefeSeleccionado = this.jefesDisponibles.find((j: any) => {
          const cargo = String(j.CARGO || j.cargo || j.cargoFuncional || '').toLowerCase();
          return cargo.includes('jefe de turno');
        });
        if (!jefeSeleccionado) jefeSeleccionado = this.jefesDisponibles[0];

        const cargoF = jefeSeleccionado.CARGO || jefeSeleccionado.cargo || jefeSeleccionado.cargoFuncional || 'Jefe';
        this.form.patchValue({
          jefeTurno: jefeSeleccionado.persona?.NOMBRE + ' ' + jefeSeleccionado.persona?.APELLIDO + ' | ' + cargoF
        });
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
      const formValues = this.form.value;

      let finalDateString = formValues.fechaServicio;
      if (finalDateString instanceof Date) {
        const y = finalDateString.getFullYear();
        const m = String(finalDateString.getMonth() + 1).padStart(2, '0');
        const d = String(finalDateString.getDate()).padStart(2, '0');
        finalDateString = `${y}-${m}-${d}`;
      }

      const personalArr = formValues.personalDestacado;
      const personalFinal = (Array.isArray(personalArr) && personalArr.length > 0) ? personalArr.join(', ') : null;
      const unidadArr = formValues.unidadDestacada;
      const unidadFinal = (Array.isArray(unidadArr) && unidadArr.length > 0) ? unidadArr.join(', ') : null;
      const pilotoArr = formValues.piloto;
      const pilotoFinal = (Array.isArray(pilotoArr) && pilotoArr.length > 0) ? pilotoArr.join(', ') : null;

      let mainPaciente = null; let mainEdad = null; let mainFallecido = 'NO';
      let obsFinales = formValues.observacionesFinales?.trim() || '';

      if (this.esCancelado) {
        const motivo = formValues.motivoCancelacion;
        let textoCancelacion = `[CANCELADO / FALSA ALARMA]: ${motivo}`;
        if (motivo === 'Otros (Especificar)') {
           textoCancelacion += ` - ${formValues.justificacionCancelacion}`;
        }
        obsFinales = `${textoCancelacion}\n\n${obsFinales}`.trim();
      } 
      else if (!this.esServicioBase && this.permitirCierre) {
        const pacs = formValues.pacientes;
        if (pacs.length > 0) {
          mainPaciente = pacs[0].nombrePaciente?.trim() || null;
          mainEdad = pacs[0].edadPaciente || null;
          mainFallecido = pacs[0].fallecido || 'NO';

          if (pacs.length > 1) {
            const extraPacientes = pacs.slice(1).map((p: any, index: number) => {
              const nombre = p.nombrePaciente?.trim() || 'Desconocido';
              const edad = p.edadPaciente ? `${p.edadPaciente} años` : 'Edad N/A';
              const fallecido = p.fallecido === 'SI' ? '(FALLECIDO)' : '';
              return `  ${index + 2}. ${nombre} | ${edad} ${fallecido}`;
            }).join('\n');
            obsFinales = `[VÍCTIMAS ADICIONALES ATENDIDAS]:\n${extraPacientes}\n\n${obsFinales}`;
          }
        }
      }

      const jefeTurnoSeleccionado = formValues.jefeTurno?.trim();
      if (jefeTurnoSeleccionado) {
          obsFinales = `${obsFinales}\n\n[FIRMA VOBO]: ${jefeTurnoSeleccionado}`.trim();
      }
      
      const dirBase = formValues.direccionServicio?.trim() || '';
      const refBase = formValues.referenciaLugar?.trim() || '';
      const direccionFinal = refBase ? `${dirBase}, Referencia: ${refBase}` : dirBase;

      const payload: any = {
        ESTADO              : formValues.estado, 
        ID_TIPO_SERVICIO    : formValues.idTipoServicio,
        DESCRIPCION         : formValues.descripcion?.trim() || '',
        FECHA_SERVICIO      : finalDateString,
        DIRECCION_SERVICIO  : direccionFinal,
        ID_SOLICITANTE      : 0,
        NOMBRE_SOLICITANTE  : formValues.nombreSolicitante?.trim() || '',
        TELEFONO_SOLICITANTE: formValues.telefonoSolicitante?.trim() || '',
        
        NOMBRE_PACIENTE     : (this.esCancelado || this.esServicioBase || !this.permitirCierre) ? null : mainPaciente,
        EDAD_PACIENTE       : (this.esCancelado || this.esServicioBase || !this.permitirCierre) ? null : mainEdad,
        FALLECIDO           : (this.esCancelado || this.esServicioBase || !this.permitirCierre) ? 'NO' : mainFallecido,
        ACOMPANANTE         : (this.esCancelado || this.esServicioBase || !this.permitirCierre) ? null : (formValues.acompanante?.trim() || null),
        LUGAR_TRASLADO      : (this.esCancelado || this.esServicioBase || !this.permitirCierre) ? null : (formValues.lugarTraslado?.trim() || null),
        
        UNIDAD_DESTACADA    : this.permitirCierre ? unidadFinal : null,
        PILOTO              : this.permitirCierre ? pilotoFinal : null,
        PERSONAL_DESTACADO  : this.permitirCierre ? personalFinal : null,
        OBSERVACIONES_FINALES: (this.permitirCierre || this.esCancelado) ? obsFinales : '',
      };

      const idRegistro = this.isEditMode ? (this.data.id || this.data.ID_SERVICIO) : null;
      const request$ = this.isEditMode ? this.service.update(idRegistro, payload as ServicioPayload) : this.service.create(payload as ServicioPayload);

      request$.subscribe({
        next : () => {
          this.isSaving = false;
          this.dialogRef.close({ saved: true, action: this.isEditMode ? 'edit' : 'create' });
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