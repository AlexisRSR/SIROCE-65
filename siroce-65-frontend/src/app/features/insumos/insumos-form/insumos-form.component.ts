// src/app/features/insumos/insumos-form/insumos-form.component.ts
import { Component, OnInit, Inject, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { FormBuilder, FormGroup, Validators, AbstractControl } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { InsumosService, Insumo, InsumoPayload } from '../../../core/services/insumos.service';

// 🔥 Agregamos 'color' a la interfaz para el diseño premium
interface SelectOption { value: string; label: string; icon: string; color?: string; }

@Component({
  standalone     : false,
  selector       : 'app-insumos-form',
  templateUrl    : './insumos-form.component.html',
  styleUrls      : ['./insumos-form.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class InsumosFormComponent implements OnInit {

  form     !: FormGroup;
  isEditMode = false;
  isSaving   = false;
  errorMsg   = '';
  
  nombresDisponibles: any[] = [];

  // 🔥 Colores específicos para cada categoría
  readonly TIPOS: SelectOption[] = [
    { value: 'Insumo Médico', label: 'Insumo Médico / Consumible', icon: 'local_hospital', color: '#69f0ae' }, // Verde Menta
    { value: 'Herramienta',   label: 'Herramienta de Rescate',     icon: 'construction',   color: '#ffb74d' }, // Naranja
    { value: 'EPP',           label: 'Equipo de Protección (EPP)', icon: 'security',       color: '#90caf9' }, // Azul
  ];

  readonly ESTADOS: SelectOption[] = [
    { value: 'Activo',        label: 'Activo / Disponible',  icon: 'check_circle' },
    { value: 'Bajo Stock',    label: 'Bajo Stock',           icon: 'warning' },
    { value: 'En Reparación', label: 'En Reparación',        icon: 'build' },
    { value: 'Prestado',      label: 'Prestado',             icon: 'assignment_return' },
    { value: 'De Baja',       label: 'De Baja / Dañado',     icon: 'cancel' },
  ];

  readonly CATALOGO_RECURSOS: any = {
    'Insumo Médico': [
      { nombre: 'Gasa estéril', proposito: 'Cubrir/contener heridas' },
      { nombre: 'Venda elástica', proposito: 'Inmovilización/Compresión' },
      { nombre: 'Hilo de sutura', proposito: 'Sutura temporal' },
      { nombre: 'Desinfectante', proposito: 'Desinfección de heridas' },
      { nombre: 'Guantes de látex', proposito: 'Bioseguridad' },
      { nombre: 'Solución salina', proposito: 'Limpieza/Hidratación' }
    ],
    'Herramienta': [
      { nombre: 'Quijada de la vida', proposito: 'Extracción vehicular / Corte hidráulico' },
      { nombre: 'Hacha de bombero', proposito: 'Entrada forzada / Corte' },
      { nombre: 'Pala', proposito: 'Remoción de escombros' },
      { nombre: 'Cizalla', proposito: 'Corte de metales' },
      { nombre: 'Motosierra', proposito: 'Corte de madera / Árboles' }
    ],
    'EPP': [
      { nombre: 'Equipo Autocontenido (SCBA)', proposito: 'Respiración en atmósferas tóxicas' },
      { nombre: 'Casco de rescate', proposito: 'Protección craneal' },
      { nombre: 'Casaca contra incendios', proposito: 'Protección térmica superior' },
      { nombre: 'Pantalón contra incendios', proposito: 'Protección térmica inferior' },
      { nombre: 'Botas de bombero', proposito: 'Protección térmica y mecánica en pies' },
      { nombre: 'Guantes estructurales', proposito: 'Protección térmica en manos' }
    ]
  };

  constructor(
    private fb        : FormBuilder,
    private service   : InsumosService,
    private cdr       : ChangeDetectorRef,
    public  dialogRef : MatDialogRef<InsumosFormComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any | null,
  ) {}

  ngOnInit(): void {
    this.isEditMode = !!this.data;
    this.buildForm();

    if (this.isEditMode && this.data) {
      let tipoDb = this.data.tipoInsumo || this.data.TIPO_INSUMO;
      if (tipoDb === 'Médico') tipoDb = 'Insumo Médico';
      if (tipoDb === 'Rescate') tipoDb = 'Herramienta';

      this.form.patchValue({
        tipoInsumo : tipoDb,
        estado     : this.data.estado || this.data.ESTADO,
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
    }
  }

  private buildForm(): void {
    this.form = this.fb.group({
      tipoInsumo : [null, Validators.required],
      nombre     : [null, Validators.required], 
      nombreOtro : [''], 
      proposito  : ['', [Validators.maxLength(150)]],
      marca      : ['', [Validators.maxLength(100)]],
      modelo     : ['', [Validators.maxLength(100)]],
      numeroSerie: ['', [Validators.maxLength(50)]],
      // 🔥 FIX: Límite máximo lógico de 99,999 unidades
      stock      : [0,  [Validators.required, Validators.min(0), Validators.max(99999)]],
      estado     : ['Activo', Validators.required],
      descripcion: ['', [Validators.maxLength(500)]]
    });
  }

  get f(): { [key: string]: AbstractControl } { return this.form.controls; }

  onTipoChange(tipo: string): void {
    if (tipo && this.CATALOGO_RECURSOS[tipo]) {
      this.nombresDisponibles = this.CATALOGO_RECURSOS[tipo];
    } else {
      this.nombresDisponibles = [];
    }

    const marcaCtrl = this.f['marca'];
    const modeloCtrl = this.f['modelo'];
    const serieCtrl = this.f['numeroSerie'];

    if (tipo === 'Herramienta' || tipo === 'EPP') {
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
      TIPO_INSUMO  : this.f['tipoInsumo'].value, 
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
        this.errorMsg = err.status === 400
          ? (err.error?.message ?? 'Datos inválidos. Revise los campos.')
          : err.status === 0
            ? 'Sin conexión con el servidor.'
            : `Error al guardar (${err.status}).`;
        this.cdr.markForCheck();
      },
    });
  }

  onCancel(): void { this.dialogRef.close(); }

  // 🔥 HELPER DE COLORES
  getTipoIconActivo(): string {
    const t = this.f['tipoInsumo']?.value;
    return this.TIPOS.find(x => x.value === t)?.icon ?? 'inventory_2';
  }
  getTipoColorActivo(): string {
    const t = this.f['tipoInsumo']?.value;
    return this.TIPOS.find(x => x.value === t)?.color ?? 'rgba(255,255,255,0.7)';
  }
  getEstadoIconActivo(): string {
    const e = this.f['estado']?.value;
    return this.ESTADOS.find(x => x.value === e)?.icon ?? 'help_outline';
  }

  // 🔥 HELPER: Bloquea caracteres inválidos en campos de stock (enteros positivos)
  bloquearCaracteres(event: KeyboardEvent): void {
    // Evita que se ingresen signos negativos, puntos decimales o letras matemáticas (e, E, +)
    if (['-', 'e', 'E', '+', '.'].includes(event.key)) {
      event.preventDefault();
    }
  }
}