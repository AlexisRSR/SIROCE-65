import { Component, OnInit, Inject, ChangeDetectionStrategy, ChangeDetectorRef, ViewChild, ElementRef } from '@angular/core';
import { FormBuilder, FormGroup, Validators, AbstractControl, ValidationErrors } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { VehiculosService, Vehiculo, TipoVehiculo, EstadoVehiculo } from '../../../core/services/vehiculos.service';

@Component({
  standalone     : false,
  selector       : 'app-vehiculos-form',
  templateUrl    : './vehiculos-form.component.html',
  styleUrls      : ['./vehiculos-form.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class VehiculosFormComponent implements OnInit {

  // 🔥 Contenedor scrolleable del modal — se usa para llevar la vista al
  // mensaje de error cuando el usuario está desplazado hacia abajo.
  @ViewChild('scrollContainer') scrollContainer!: ElementRef<HTMLElement>;

  form     !: FormGroup;
  isEditMode = false;
  isSaving   = false;
  errorMsg   = '';

  tipos  : TipoVehiculo[]   = [];
  estados: EstadoVehiculo[]  = [];

  // 🔥 Tope para el datepicker de Fecha de Ingreso: no se permiten fechas futuras
  readonly fechaHoy: Date = new Date();

  // 🔥 Tope lógico para Año del Modelo: permite registrar el modelo del año
  // entrante (p. ej. 2027 estando en 2026) pero bloquea años irreales.
  readonly anioMinimo: number = 1950;
  readonly anioMaximo: number = new Date().getFullYear() + 1;

  // 🔥 Catálogo actualizado con las correcciones ortográficas
  private readonly TIPOS_DEFAULT: TipoVehiculo[] = [
    { ID_TIPO_V: 1, TIPO: 'Ambulancia' },
    { ID_TIPO_V: 2, TIPO: 'Panel acondicionada' },
    { ID_TIPO_V: 3, TIPO: 'Pickup' },
    { ID_TIPO_V: 4, TIPO: 'Motobomba' },
    { ID_TIPO_V: 5, TIPO: 'Cisterna' },
    { ID_TIPO_V: 6, TIPO: 'Camioneta' },
    { ID_TIPO_V: 7, TIPO: 'Sedán' },
    { ID_TIPO_V: 8, TIPO: 'Hatchback' },
    { ID_TIPO_V: 9, TIPO: 'Motocicleta' },
  ];

  private readonly ESTADOS_DEFAULT: EstadoVehiculo[] = [
    { ID_ESTADO_V: 1, ESTADO: 'Operativo'        },
    { ID_ESTADO_V: 2, ESTADO: 'En Taller'        },
    { ID_ESTADO_V: 3, ESTADO: 'Fuera de Servicio'},
  ];

  constructor(
    private fb         : FormBuilder,
    private service    : VehiculosService,
    private cdr        : ChangeDetectorRef,
    public  dialogRef  : MatDialogRef<VehiculosFormComponent>,
    @Inject(MAT_DIALOG_DATA) public data: Vehiculo | null,
  ) {}

  ngOnInit(): void {
    this.isEditMode = !!this.data;
    this.buildForm();
    this.loadCatalogs();

    // 🔥 El Número de Unidad ya no lo escribe el operador: el backend lo
    // autogenera (correlativo B-101, B-102...) e ignora cualquier valor que
    // se le envíe. El control queda deshabilitado; solo se muestra su valor.
    this.f['NUMERO_UNIDAD'].disable({ emitEvent: false });

    if (this.isEditMode && this.data) {
      this.patchForm(this.data);
    } else {
      // Alta nueva: pedimos al backend cuál sería el próximo número, solo
      // como vista previa — el valor definitivo lo decide el servidor al guardar.
      this.form.patchValue({ NUMERO_UNIDAD: 'Calculando...' });
      this.service.getSiguienteNumero().subscribe({
        next : (res) => {
          this.form.patchValue({ NUMERO_UNIDAD: res.ok ? res.data.numeroUnidad : '' });
          this.cdr.markForCheck();
        },
        error: () => {
          this.form.patchValue({ NUMERO_UNIDAD: '' });
          this.cdr.markForCheck();
        },
      });
    }
  }

  private buildForm(): void {
    this.form = this.fb.group({
      NUMERO_UNIDAD      : ['', [Validators.maxLength(20)]], // 🔥 Autogenerado por el backend — ya no es obligatorio a mano
      MARCA              : ['', [Validators.required, Validators.minLength(2), Validators.maxLength(50)]],
      MODELO             : ['', [Validators.required, Validators.minLength(1), Validators.maxLength(50)]],
      PLACA              : ['', [Validators.required, Validators.minLength(3), Validators.maxLength(20)]],
      KILOMETRAJE_ACTUAL : [null, [Validators.required, Validators.min(0)]],
      ID_TIPO_V          : [null, Validators.required],
      ID_ESTADO_V        : [null, Validators.required],
      FECHA_INGRESO      : [null, [this.fechaNoFuturaValidator]], // 🔥 Opcional, pero si se llena no puede ser futura
      OBSERVACIONES      : [''],
      ANIO               : [null, [Validators.min(this.anioMinimo), Validators.max(this.anioMaximo)]], // Validación de año lógico
      CHASIS             : ['', [Validators.maxLength(50)]],
      MOTOR              : ['', [Validators.maxLength(50)]] 
    });
  }

  // Se castea como 'any' asumiendo que tu interfaz 'Vehiculo' en el service aún no tiene estos campos agregados.
  private patchForm(v: any): void {
    this.form.patchValue({
      NUMERO_UNIDAD      : v.NUMERO_UNIDAD       ?? '',
      MARCA              : v.MARCA               ?? '',
      MODELO             : v.MODELO              ?? '',
      PLACA              : v.PLACA               ?? '',
      KILOMETRAJE_ACTUAL : v.KILOMETRAJE_ACTUAL  ?? 0,
      ID_TIPO_V          : v.ID_TIPO_V           ?? null,
      ID_ESTADO_V        : v.ID_ESTADO_V         ?? null,
      FECHA_INGRESO      : v.FECHA_INGRESO       ?? null,
      OBSERVACIONES      : v.OBSERVACIONES       ?? '',
      ANIO               : v.ANIO                ?? null,
      CHASIS             : v.CHASIS              ?? '',
      MOTOR              : v.MOTOR               ?? ''
    });
  }

  get f(): { [key: string]: AbstractControl } {
    return this.form.controls;
  }

  // 🔥 Validador: rechaza fechas posteriores a hoy (permite el día de hoy completo)
  private readonly fechaNoFuturaValidator = (control: AbstractControl): ValidationErrors | null => {
    if (!control.value) return null;
    const fecha = new Date(control.value);
    const finDeHoy = new Date();
    finDeHoy.setHours(23, 59, 59, 999);
    return fecha > finDeHoy ? { fechaFutura: true } : null;
  };

  private loadCatalogs(): void {
    this.service.getTipos().subscribe({
      next : res => {
        this.tipos = res.ok && res.data?.length ? res.data : this.TIPOS_DEFAULT;
        this.cdr.markForCheck();
      },
      error: () => { this.tipos = this.TIPOS_DEFAULT; this.cdr.markForCheck(); },
    });

    this.service.getEstados().subscribe({
      next : res => {
        this.estados = res.ok && res.data?.length ? res.data : this.ESTADOS_DEFAULT;
        this.cdr.markForCheck();
      },
      error: () => { this.estados = this.ESTADOS_DEFAULT; this.cdr.markForCheck(); },
    });
  }

  onSubmit(): void {
    this.form.markAllAsTouched();
    if (this.form.invalid || this.isSaving) return;

    this.isSaving = true;
    this.errorMsg = '';
    this.cdr.markForCheck();

    const payload = {
      NUMERO_UNIDAD      : this.f['NUMERO_UNIDAD'].value.trim().toUpperCase(),
      MARCA              : this.f['MARCA'].value.trim().toUpperCase(),
      MODELO             : this.f['MODELO'].value.trim(),
      PLACA              : this.f['PLACA'].value.trim().toUpperCase(),
      KILOMETRAJE_ACTUAL : Number(this.f['KILOMETRAJE_ACTUAL'].value),
      ID_TIPO_V          : this.f['ID_TIPO_V'].value,
      ID_ESTADO_V        : this.f['ID_ESTADO_V'].value,
      FECHA_INGRESO      : this.f['FECHA_INGRESO'].value,
      OBSERVACIONES      : this.f['OBSERVACIONES'].value?.trim() || null,
      ANIO               : this.f['ANIO'].value ? Number(this.f['ANIO'].value) : null,
      CHASIS             : this.f['CHASIS'].value?.trim().toUpperCase() || null,
      MOTOR              : this.f['MOTOR'].value?.trim().toUpperCase() || null
    };

    const request$ = this.isEditMode
      ? this.service.update(this.data!.ID_VEHICULO!, payload)
      : this.service.create(payload);

    request$.subscribe({
      next : () => {
        this.isSaving = false;
        this.dialogRef.close({
          saved : true,
          action: this.isEditMode ? 'edit' : 'create',
        });
      },
      error: (err) => {
        this.isSaving = false;
        this.errorMsg = err.status === 0
          ? 'Sin conexión con el servidor.'
          : err.error?.message || `Error al guardar (${err.status}). Intente nuevamente.`;
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

  // 🔥 BLOQUEO FÍSICO PARA KILOMETRAJE (Solo números y punto)
  soloNumerosDecimales(event: KeyboardEvent): boolean {
    const charCode = (event.which) ? event.which : event.keyCode;
    // Permite código 46 (punto) y del 48 al 57 (números)
    if (charCode !== 46 && charCode > 31 && (charCode < 48 || charCode > 57)) {
      event.preventDefault();
      return false;
    }
    return true;
  }

  // 🔥 BLOQUEO FÍSICO PARA AÑO (solo dígitos enteros, sin punto decimal)
  soloNumerosEnteros(event: KeyboardEvent): boolean {
    const charCode = (event.which) ? event.which : event.keyCode;
    if (charCode > 31 && (charCode < 48 || charCode > 57)) {
      event.preventDefault();
      return false;
    }
    return true;
  }

  onCancel(): void {
    this.dialogRef.close();
  }
}