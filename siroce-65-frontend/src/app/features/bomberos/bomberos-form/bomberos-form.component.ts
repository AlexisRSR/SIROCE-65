// src/app/features/bomberos/bomberos-form/bomberos-form.component.ts
import {
  Component,
  OnInit,
  Inject,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  ViewChild,
  ElementRef,
} from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  Validators,
  AbstractControl,
  ValidationErrors,
} from '@angular/forms';
import {
  MatDialogRef,
  MAT_DIALOG_DATA,
} from '@angular/material/dialog';
import { MAT_DATE_LOCALE } from '@angular/material/core';

import {
  BomberosService,
  Bombero,
  GradoBombero,
  EstadoBombero,
  CargoBombero,
}  from '../../../core/services/bomberos.service';

@Component({
  standalone     : false,
  selector       : 'app-bomberos-form',
  templateUrl    : './bomberos-form.component.html',
  styleUrls      : ['./bomberos-form.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  // 🔥 i18n: los mat-datepicker de este formulario (FECHA_NACIMIENTO, FECHA_INGRESO)
  // deben mostrar meses/días en español, no en inglés por defecto.
  providers      : [{ provide: MAT_DATE_LOCALE, useValue: 'es-GT' }],
})
export class BomberosFormComponent implements OnInit {

  // 🔥 Contenedor scrolleable del modal — se usa para llevar la vista al
  // mensaje de error cuando el usuario está desplazado hacia abajo.
  @ViewChild('scrollContainer') scrollContainer!: ElementRef<HTMLElement>;

  form      !: FormGroup;
  isEditMode = false;
  isSaving   = false;
  errorMsg   = '';

  grados : GradoBombero[] = [];
  estados: EstadoBombero[] = [];
  cargos : CargoBombero[] = []; // 🔥 3NF: catálogo dinámico, reemplaza las 6 opciones fijas del <mat-select>
  turnos = ['Turno 1', 'Turno 2', 'Turno 3', 'Permanente', 'Voluntario fin de semana'];

  // 🔥 Regla de negocio: un bombero no puede ser menor de edad — el datepicker
  // no permite seleccionar una fecha más reciente que "hoy menos 18 años".
  readonly fechaMaxima18: Date = (() => {
    const d = new Date();
    d.setFullYear(d.getFullYear() - 18);
    return d;
  })();

  // 🔥 Tope para el datepicker de Fecha de Ingreso: no se permiten fechas futuras
  readonly fechaHoy: Date = new Date();

  private readonly GRADOS_DEFAULT: GradoBombero[] = [
    { ID_GRADO: 1, GRADO: 'Oficial'           },
    { ID_GRADO: 2, GRADO: 'Galonista'         },
    { ID_GRADO: 3, GRADO: 'Caballero Bombero' },
  ];

  private readonly ESTADOS_DEFAULT: EstadoBombero[] = [
    { ID_ESTADO_B: 1, ESTADO: 'Activo'     },
    { ID_ESTADO_B: 2, ESTADO: 'Suspendido' },
    { ID_ESTADO_B: 3, ESTADO: 'Baja'       },
  ];

  constructor(
    private fb         : FormBuilder,
    private service    : BomberosService,
    private cdr        : ChangeDetectorRef,
    public  dialogRef  : MatDialogRef<BomberosFormComponent>,
    @Inject(MAT_DIALOG_DATA) public data: Bombero | null,
  ) {}

  ngOnInit(): void {
    this.isEditMode = !!this.data;
    this.buildForm();
    this.loadCatalogs();

    if (this.isEditMode && this.data) {
      this.patchForm(this.data);
    }
  }

  private buildForm(): void {
    this.form = this.fb.group({
      // RegExp para permitir solo letras, espacios y acentos
      NOMBRE       : ['', [Validators.required, Validators.minLength(2), Validators.maxLength(100), Validators.pattern(/^[a-zA-ZñÑáéíóúÁÉÍÓÚüÜ\s]+$/)]],
      APELLIDO     : ['', [Validators.required, Validators.minLength(2), Validators.maxLength(100), Validators.pattern(/^[a-zA-ZñÑáéíóúÁÉÍÓÚüÜ\s]+$/)]],
      DPI          : ['', [Validators.required, Validators.pattern('^[0-9]{13}$')]],
      TELEFONO     : ['', [Validators.required, Validators.pattern('^[0-9]{8}$')]],
      CORREO       : ['', [Validators.required, Validators.email, Validators.maxLength(255)]],
      // 🔥 Obligatorio: un bombero debe ser mayor de edad (ver fechaMaxima18)
      FECHA_NACIMIENTO: ['', [Validators.required, this.fechaNoFuturaValidator]],
      FECHA_INGRESO: ['', [Validators.required, this.fechaNoFuturaValidator]],
      ID_GRADO     : [null, Validators.required],
      ID_CARGO     : [null, Validators.required], // 🔥 3NF: reemplaza al antiguo CARGO de texto libre
      ID_ESTADO_B  : [null, Validators.required],
      TURNO        : ['', Validators.required],
    });
  }

  private patchForm(b: Bombero): void {
    this.form.patchValue({
      NOMBRE       : b.persona?.NOMBRE       ?? '',
      APELLIDO     : b.persona?.APELLIDO     ?? '',
      DPI          : b.persona?.DPI          ?? '', //
      TELEFONO     : b.persona?.TELEFONO     ?? '',
      CORREO       : b.persona?.CORREO       ?? '',
      FECHA_NACIMIENTO: b.persona?.FECHA_NACIMIENTO ?? '',
      FECHA_INGRESO: b.FECHA_INGRESO         ?? '',
      ID_GRADO     : b.ID_GRADO              ?? null,
      ID_CARGO     : b.ID_CARGO ?? (b as any).cargo?.ID_CARGO ?? null, // 🔥 3NF: se recupera el cargo al editar
      ID_ESTADO_B  : b.ID_ESTADO_B           ?? null,
      TURNO        : b.TURNO                 ?? '', 
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
    this.service.getGrados().subscribe({
      next : (res) => {
        this.grados = res.ok && res.data?.length ? res.data : this.GRADOS_DEFAULT;
        this.cdr.markForCheck();
      },
      error: () => {
        this.grados = this.GRADOS_DEFAULT;
        this.cdr.markForCheck();
      }
    });

    this.service.getEstados().subscribe({
      next : (res) => {
        this.estados = res.ok && res.data?.length ? res.data : this.ESTADOS_DEFAULT;
        this.cdr.markForCheck();
      },
      error: () => {
        this.estados = this.ESTADOS_DEFAULT;
        this.cdr.markForCheck();
      }
    });

    // 🔥 3NF: catálogo de cargos. A propósito NO tiene un "*_DEFAULT" de respaldo
    // como grados/estados: sus ID_CARGO reales los generó la migración de datos
    // y no los conocemos de antemano, así que un fallback con IDs inventados
    // podría guardar un cargo incorrecto en silencio. Si esta llamada falla,
    // el select queda vacío y el Validators.required bloquea el guardado.
    this.service.getCargos().subscribe({
      next : (res) => {
        this.cargos = res.ok ? (res.data || []) : [];
        this.cdr.markForCheck();
      },
      error: () => {
        this.cargos = [];
        this.errorMsg = 'No se pudo cargar el catálogo de cargos. Recarga la página.';
        this.cdr.markForCheck();
      }
    });
  }

  onSubmit(): void {
    this.form.markAllAsTouched();

    if (this.form.invalid || this.isSaving) return;

    this.isSaving = true;
    this.errorMsg = '';
    this.cdr.markForCheck();

    const fd = this.form.getRawValue();

    if (this.isEditMode) {
      // ── EDITAR
      this.service
        .updateBomberoCompleto(this.data!.ID_PERSONA!, this.data!.ID_BOMBERO!, fd)
        .subscribe({
          next : () => {
            this.isSaving = false;
            this.dialogRef.close({ saved: true, action: 'edit' });
          },
          error: (err) => this.handleError(err),
        });

    } else {
      // ── CREAR
      this.service
        .createCompleto({
          persona: {
            NOMBRE          : fd.NOMBRE.trim(),
            APELLIDO        : fd.APELLIDO.trim(),
            DPI             : fd.DPI.trim(),
            TELEFONO        : fd.TELEFONO?.trim() ?? '',
            CORREO          : fd.CORREO?.trim() ?? '',
            FECHA_NACIMIENTO: fd.FECHA_NACIMIENTO || null, // 🔥 NUEVO CAMPO AÑADIDO
          },
          bombero: {
            ID_GRADO     : fd.ID_GRADO,
            ID_CARGO     : fd.ID_CARGO, // 🔥 3NF: reemplaza al antiguo CARGO de texto libre
            ID_ESTADO_B  : fd.ID_ESTADO_B,
            FECHA_INGRESO: fd.FECHA_INGRESO,
            TURNO        : fd.TURNO, 
          },
        })
        .subscribe({
          next : () => {
            this.isSaving = false;
            this.dialogRef.close({ saved: true, action: 'create' });
          },
          error: (err) => this.handleError(err),
        });
    }
  }

  private handleError(err: any): void {
    this.isSaving = false;
    // 🔥 Prioriza el mensaje real del backend (p. ej. DPI duplicado); el
    // genérico por status queda solo como fallback si no hay respuesta.
    this.errorMsg = err?.error?.message || err?.error?.msg
      || (err.status === 0
        ? 'Sin conexión con el servidor. Verifique su red.'
        : `Error al guardar (${err.status}). Intente nuevamente.`);
    this.cdr.markForCheck();
    this.scrollToError();
  }

  // 🔥 Lleva el scroll del modal hasta arriba para que el usuario vea la
  // alerta roja del error, aunque esté desplazado hasta el final del formulario.
  private scrollToError(): void {
    this.scrollContainer?.nativeElement.scrollTo({ top: 0, behavior: 'smooth' });
  }

  // 🔥 FUNCIÓN QUE BLOQUEA LETRAS Y SÍMBOLOS
  soloNumeros(event: KeyboardEvent): boolean {
    const charCode = (event.which) ? event.which : event.keyCode;
    // Permite solo los códigos ASCII numéricos (del 48 al 57)
    if (charCode > 31 && (charCode < 48 || charCode > 57)) {
      event.preventDefault();
      return false;
    }
    return true;
  }

  // 🔥 FUNCIÓN QUE BLOQUEA NÚMEROS Y CARACTERES ESPECIALES EN NOMBRES
  soloLetras(event: KeyboardEvent): boolean {
    const regex = new RegExp("^[a-zA-ZñÑáéíóúÁÉÍÓÚüÜ\\s]$");
    const key = event.key;
    
    // Si la tecla presionada no coincide con una letra, espacio o acento, se bloquea
    if (!regex.test(key)) {
      event.preventDefault();
      return false;
    }
    return true;
  }

  onCancel(): void {
    this.dialogRef.close();
  }
}