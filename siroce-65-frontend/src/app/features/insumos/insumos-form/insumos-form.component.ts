// src/app/features/insumos/insumos-form/insumos-form.component.ts
import { Component, OnInit, Inject, ChangeDetectionStrategy, ChangeDetectorRef, ViewChild, ElementRef } from '@angular/core';
import { FormBuilder, FormGroup, Validators, AbstractControl } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { InsumosService, InsumoPayload } from '../../../core/services/insumos.service';

interface SelectOption { value: any; label: string; icon: string; color?: string; }

@Component({
  standalone     : false,
  selector       : 'app-insumos-form',
  templateUrl    : './insumos-form.component.html',
  styleUrls      : ['./insumos-form.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class InsumosFormComponent implements OnInit {

  // 🔥 Contenedor scrolleable del modal — se usa para llevar la vista al
  // mensaje de error cuando el usuario está desplazado hacia abajo.
  @ViewChild('scrollContainer') scrollContainer!: ElementRef<HTMLElement>;

  form     !: FormGroup;
  isEditMode = false;
  isSaving   = false;
  errorMsg   = '';
  
  nombresDisponibles: any[] = [];

  // 🔥 AHORA LOS VALORES SON LOS IDs NUMÉRICOS DE TU BASE DE DATOS
  readonly TIPOS: SelectOption[] = [
    { value: 1, label: 'Insumo Médico / Consumible', icon: 'local_hospital', color: '#69f0ae' }, 
    { value: 4, label: 'Herramienta de Rescate',     icon: 'construction',   color: '#ffb74d' }, 
    { value: 2, label: 'Equipo de Protección (EPP)', icon: 'security',       color: '#90caf9' }, 
  ];

  readonly ESTADOS: SelectOption[] = [
    { value: 'Activo',        label: 'Activo / Disponible',  icon: 'check_circle' },
    { value: 'Bajo Stock',    label: 'Bajo Stock',           icon: 'warning' },
    { value: 'En Reparación', label: 'En Reparación',        icon: 'build' },
    { value: 'Prestado',      label: 'Prestado',             icon: 'assignment_return' },
    { value: 'De Baja',       label: 'De Baja / Dañado',     icon: 'cancel' },
  ];

  readonly CATALOGO_RECURSOS: any = {
    1: [ // Insumo Médico
      { nombre: 'Gasa estéril', proposito: 'Cubrir/contener heridas' },
      { nombre: 'Venda elástica', proposito: 'Inmovilización/Compresión' },
      { nombre: 'Hilo de sutura', proposito: 'Sutura temporal' },
      { nombre: 'Desinfectante', proposito: 'Desinfección de heridas' },
      { nombre: 'Guantes de látex', proposito: 'Bioseguridad' },
      { nombre: 'Solución salina', proposito: 'Limpieza/Hidratación' }
    ],
    4: [ // Herramienta
      { nombre: 'Quijada de la vida', proposito: 'Extracción vehicular / Corte hidráulico' },
      { nombre: 'Hacha de bombero', proposito: 'Entrada forzada / Corte' },
      { nombre: 'Pala', proposito: 'Remoción de escombros' },
      { nombre: 'Cizalla', proposito: 'Corte de metales' },
      { nombre: 'Motosierra', proposito: 'Corte de madera / Árboles' }
    ],
    2: [ // EPP
      { nombre: 'Equipo Autocontenido (SCBA)', proposito: 'Respiración en atmósferas tóxicas' },
      { nombre: 'Casco de rescate', proposito: 'Protección craneal' },
      { nombre: 'Casaca contra incendios', proposito: 'Protección térmica superior' },
      { nombre: 'Pantalón contra incendios', proposito: 'Protección térmica inferior' },
      { nombre: 'Botas de bombero', proposito: 'Protección térmica y mecánica en pies' },
      { nombre: 'Guantes estructurales', proposito: 'Protección térmica en manos' }
    ]
  };

  constructor(
    private fb         : FormBuilder,
    private service    : InsumosService,
    private cdr        : ChangeDetectorRef,
    public  dialogRef  : MatDialogRef<InsumosFormComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any | null,
  ) {}

  ngOnInit(): void {
    this.isEditMode = !!this.data;
    this.buildForm();

    // 🔥 El Estado se sigue auto-calculando en tiempo real mientras se teclea
    // el stock (umbral dinámico según la clasificación elegida), pero el
    // control queda HABILITADO para que el operador pueda sobreescribirlo
    // manualmente a 'En Reparación' o 'Prestado' cuando la operación lo requiera.
    this.f['estado'].enable({ emitEvent: false });
    this.f['stock'].valueChanges.subscribe((valor) => this.sincronizarEstadoConStock(valor));

    if (this.isEditMode && this.data) {
      let tipoDb = this.data.id_tipo_insumo || this.data.tipoInsumo || this.data.TIPO_INSUMO;

      // Retrocompatibilidad con los textos viejos
      if (tipoDb === 'Médico' || tipoDb === 'Insumo Médico') tipoDb = 1;
      if (tipoDb === 'Rescate' || tipoDb === 'Herramienta') tipoDb = 4;
      if (tipoDb === 'EPP') tipoDb = 2;

      this.form.patchValue({
        id_tipo_insumo: tipoDb,
        // 🔥 Se respeta el ESTADO ya guardado (incluye 'En Reparación'/'Prestado');
        // solo se recalcula a partir de aquí si el usuario vuelve a tocar el stock.
        estado     : this.data.estado || this.data.ESTADO || 'Activo',
        stock      : this.data.stock || this.data.STOCK || 0,
        descripcion: this.data.descripcion || this.data.DESCRIPCION || '',
        marca      : this.data.marca || this.data.MARCA || '',
        modelo     : this.data.modelo || this.data.MODELO || '',
        numeroSerie: this.data.numeroSerie || this.data.NUMERO_SERIE || '',
        proposito  : this.data.proposito || this.data.PROPOSITO || '',
      });

      this.onTipoChange(tipoDb);

      const nombreDb = this.data.nombre || this.data.NOMBRE;
      const existeEnCatalogo = this.nombresDisponibles.some(i => i.nombre === nombreDb);

      if (existeEnCatalogo) {
        this.form.patchValue({ nombre: nombreDb });
      } else {
        this.form.patchValue({ nombre: 'Otro', nombreOtro: nombreDb });
        this.f['nombreOtro'].setValidators([Validators.required, Validators.minLength(2)]);
        this.f['nombreOtro'].updateValueAndValidity();
      }
    } else {
      // 🔥 Alta nueva: no hay ESTADO guardado que respetar, se calcula desde
      // el stock inicial del formulario.
      this.sincronizarEstadoConStock(this.f['stock'].value);
    }
  }

  // 🔥 Umbral de "Bajo Stock" según la clasificación — mismos IDs y mismos
  // valores que insumoHelper.js en el backend (única fuente de verdad):
  //   1 = Insumo Médico/Consumible -> 10 · 4 = Herramienta / 2 = EPP -> 3
  private obtenerUmbralBajoStock(idTipoInsumo: any): number {
    if (idTipoInsumo === 4 || idTipoInsumo === 2) return 3;
    return 10;
  }

  // 🔥 Umbral vigente para la clasificación seleccionada, usado en el hint del HTML
  get umbralActual(): number {
    return this.obtenerUmbralBajoStock(this.f['id_tipo_insumo'].value);
  }

  calcularEstadoPorStock(stock: number): string {
    const stockNum = Number(stock) || 0;
    const umbral = this.obtenerUmbralBajoStock(this.f['id_tipo_insumo'].value);
    if (stockNum >= umbral) return 'Activo';
    if (stockNum > 0)       return 'Bajo Stock';
    return 'De Baja';
  }

  private sincronizarEstadoConStock(stock: number): void {
    this.f['estado'].setValue(this.calcularEstadoPorStock(stock), { emitEvent: false });
    this.cdr.markForCheck();
  }

  private buildForm(): void {
    this.form = this.fb.group({
      id_tipo_insumo : [null, Validators.required],
      nombre     : [null, Validators.required], 
      nombreOtro : [''], 
      proposito  : ['', [Validators.maxLength(150)]],
      marca      : ['', [Validators.maxLength(100)]],
      modelo     : ['', [Validators.maxLength(100)]],
      numeroSerie: ['', [Validators.maxLength(50)]],
      stock      : [0,  [Validators.required, Validators.min(0), Validators.max(99999)]],
      estado     : ['Activo', Validators.required],
      descripcion: ['', [Validators.maxLength(500)]]
    });
  }

  get f(): { [key: string]: AbstractControl } { return this.form.controls; }

  onTipoChange(tipo: any): void {
    if (tipo && this.CATALOGO_RECURSOS[tipo]) {
      this.nombresDisponibles = this.CATALOGO_RECURSOS[tipo];
    } else {
      this.nombresDisponibles = [];
    }

    const marcaCtrl = this.f['marca'];
    const modeloCtrl = this.f['modelo'];
    const serieCtrl = this.f['numeroSerie'];

    if (tipo === 4 || tipo === 2) { // 4 = Herramienta, 2 = EPP
      const validacionAlfanumerica = Validators.pattern(/^[a-zA-Z0-9\s\-_/#]+$/);
      marcaCtrl.setValidators([Validators.required, Validators.maxLength(100), validacionAlfanumerica]);
      modeloCtrl.setValidators([Validators.required, Validators.maxLength(100), validacionAlfanumerica]);
      serieCtrl.setValidators([Validators.required, Validators.maxLength(50), validacionAlfanumerica]);
    } else {
      marcaCtrl.clearValidators();
      modeloCtrl.clearValidators();
      serieCtrl.clearValidators();
    }

    marcaCtrl.updateValueAndValidity();
    modeloCtrl.updateValueAndValidity();
    serieCtrl.updateValueAndValidity();

    if (!this.isEditMode) {
      this.form.patchValue({ nombre: null, nombreOtro: '', proposito: '', marca: '', modelo: '', numeroSerie: '' });
    }
    this.cdr.markForCheck();
  }

  onNombreChange(nombre: string): void {
    const txtOtro = this.f['nombreOtro'];
    if (nombre === 'Otro') {
      txtOtro.setValidators([Validators.required, Validators.minLength(2), Validators.maxLength(150)]);
      txtOtro.setValue('');
      this.form.patchValue({ proposito: '' });
    } else {
      txtOtro.clearValidators();
      txtOtro.setValue('');
      
      const itemEncontrado = this.nombresDisponibles.find(i => i.nombre === nombre);
      if (itemEncontrado) {
        this.form.patchValue({ proposito: itemEncontrado.proposito });
      }
    }
    txtOtro.updateValueAndValidity();
    this.cdr.markForCheck();
  }

  onSubmit(): void {
    this.form.markAllAsTouched();
    if (this.form.invalid || this.isSaving) return;

    this.isSaving = true;
    this.errorMsg = '';
    this.cdr.markForCheck();

    const seleccion = this.f['nombre'].value;
    const nombreFinal = seleccion === 'Otro' ? this.f['nombreOtro'].value.trim() : seleccion;

    const payload: InsumoPayload = {
      NOMBRE       : nombreFinal,
      DESCRIPCION  : this.f['descripcion'].value?.trim() || '',
      id_tipo_insumo: this.f['id_tipo_insumo'].value, // 🔥 Enviamos el ID a Node.js
      STOCK        : Number(this.f['stock'].value),
      ESTADO       : this.f['estado'].value,
      MARCA        : this.f['marca'].value?.trim() || null,
      MODELO       : this.f['modelo'].value?.trim() || null,
      NUMERO_SERIE : this.f['numeroSerie'].value?.trim() || null,
      PROPOSITO    : this.f['proposito'].value?.trim() || null
    };

    const request$ = this.isEditMode
      ? this.service.update(this.data!.id || this.data!.ID_INSUMO, payload) 
      : this.service.create(payload);

    request$.subscribe({
      next : () => {
        this.isSaving = false;
        this.dialogRef.close({ saved: true, action: this.isEditMode ? 'edit' : 'create' });
      },
      error: (err) => {
        this.isSaving = false;
        // 🔥 Prioriza el mensaje real del backend (p. ej. nombre duplicado);
        // el genérico por status queda solo como fallback si no hay respuesta.
        this.errorMsg = err?.error?.message || err?.error?.msg
          || (err.status === 0 ? 'Sin conexión con el servidor.' : `Error al guardar (${err.status}).`);
        this.cdr.markForCheck();
        this.scrollToError();
      },
    });
  }

  // 🔥 Lleva el scroll del modal hasta arriba para que el usuario vea la
  // alerta roja del error, aunque esté desplazado hasta el final del formulario.
  private scrollToError(): void {
    this.scrollContainer?.nativeElement.scrollTo({ top: 0, behavior: 'smooth' });
  }

  onCancel(): void { this.dialogRef.close(); }

  // 🔥 HELPERS ACTUALIZADOS
  getTipoLabelActivo(): string {
    const t = this.f['id_tipo_insumo']?.value;
    return this.TIPOS.find(x => x.value === t)?.label ?? 'Seleccione...';
  }
  getTipoIconActivo(): string {
    const t = this.f['id_tipo_insumo']?.value;
    return this.TIPOS.find(x => x.value === t)?.icon ?? 'inventory_2';
  }
  getTipoColorActivo(): string {
    const t = this.f['id_tipo_insumo']?.value;
    return this.TIPOS.find(x => x.value === t)?.color ?? 'rgba(255,255,255,0.7)';
  }
  getEstadoIconActivo(): string {
    const e = this.f['estado']?.value;
    return this.ESTADOS.find(x => x.value === e)?.icon ?? 'help_outline';
  }

  bloquearCaracteres(event: KeyboardEvent): void {
    if (['-', 'e', 'E', '+', '.'].includes(event.key)) {
      event.preventDefault();
    }
  }
}