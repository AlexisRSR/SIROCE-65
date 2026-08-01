// src/app/features/bomberos/bomberos-form/bomberos-form.component.ts
import {
  Component,
  OnInit,
  Inject,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
} from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  Validators,
  AbstractControl,
} from '@angular/forms';
import {
  MatDialogRef,
  MAT_DIALOG_DATA,
} from '@angular/material/dialog';

import {
  BomberosService,
  Bombero,
  GradoBombero,
  EstadoBombero,
}  from '../../../core/services/bomberos.service';

@Component({
  standalone     : false,
  selector       : 'app-bomberos-form',
  templateUrl    : './bomberos-form.component.html',
  styleUrls      : ['./bomberos-form.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BomberosFormComponent implements OnInit {

  form      !: FormGroup;
  isEditMode = false;
  isSaving   = false;
  errorMsg   = '';

  grados : GradoBombero[] = [];
  estados: EstadoBombero[] = [];
  turnos = ['Turno 1', 'Turno 2', 'Turno 3', 'Permanente', 'Voluntario fin de semana'];

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
      CORREO       : ['', [Validators.required, Validators.email, Validators.maxLength(150)]],
      FECHA_INGRESO: ['', Validators.required],
      ID_GRADO     : [null, Validators.required],
      CARGO        : [null, Validators.required],
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
      FECHA_INGRESO: b.FECHA_INGRESO         ?? '',
      ID_GRADO     : b.ID_GRADO              ?? null,
      CARGO        : (b as any).CARGO        ?? null, // 🔥 SE RECUPERA EL CARGO AL EDITAR
      ID_ESTADO_B  : b.ID_ESTADO_B           ?? null,
      TURNO        : b.TURNO                 ?? '', 
    });
  }

  get f(): { [key: string]: AbstractControl } {
    return this.form.controls;
  }

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
            NOMBRE  : fd.NOMBRE.trim(),
            APELLIDO: fd.APELLIDO.trim(),
            DPI     : fd.DPI.trim(),
            TELEFONO: fd.TELEFONO?.trim() ?? '',
            CORREO  : fd.CORREO?.trim() ?? '', 
          },
          bombero: {
            ID_GRADO     : fd.ID_GRADO,
            CARGO        : fd.CARGO, // 🔥 SE ENVÍA EL CAMPO CARGO A LA BASE DE DATOS
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
    this.errorMsg = err.status === 0
      ? 'Sin conexión con el servidor. Verifique su red.'
      : `Error al guardar (${err.status}). Intente nuevamente.`;
    this.cdr.markForCheck();
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