// src/app/features/tipos-emergencias/tipos-emergencias-form/tipos-emergencias-form.component.ts
// ══════════════════════════════════════════════════════════════
//  TiposEmergenciasFormComponent — Modal de Alta / Edición
// ──────────────────────────────────────────────────────────────
//  Campos del formulario:
//    · nombre      → text (required, ej. "Incendio Forestal")
//    · descripcion → textarea (required)
//    · prioridad   → select: Alta | Media | Baja (required)
//
//  Modo Crear (data === null) → POST /api/tipos-emergencias
//  Modo Editar (data = TipoEmergencia) → PUT /api/tipos-emergencias/:id
//
//  ✅ standalone: false — módulo tradicional
// ══════════════════════════════════════════════════════════════
import { Component, OnInit, Inject, ChangeDetectionStrategy, ChangeDetectorRef, ViewChild, ElementRef } from '@angular/core';
import { FormBuilder, FormGroup, Validators, AbstractControl } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { TiposEmergenciasService, TipoEmergencia, Prioridad } from '../../../core/services/tipos-emergencias.service';

@Component({
  standalone     : false,
  selector       : 'app-tipos-emergencias-form',
  templateUrl    : './tipos-emergencias-form.component.html',
  styleUrls      : ['./tipos-emergencias-form.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TiposEmergenciasFormComponent implements OnInit {

  // 🔥 Contenedor scrolleable del modal — se usa para llevar la vista al
  // mensaje de error cuando el usuario está desplazado hacia abajo.
  @ViewChild('scrollContainer') scrollContainer!: ElementRef<HTMLElement>;

  form     !: FormGroup;
  isEditMode = false;
  isSaving   = false;
  errorMsg   = '';

  readonly PRIORIDADES: Prioridad[] = ['Alta', 'Media', 'Baja'];

  // 🔥 BASE DE CONOCIMIENTO: Lista oficial normalizada para autocompletar
  readonly LISTA_INCIDENTES = {
    emergencias: [
      { nombre: 'Incendio Estructural', prioridad: 'Alta', categoria: 'Emergencia' },
      { nombre: 'Incendio Forestal', prioridad: 'Alta', categoria: 'Emergencia' },
      { nombre: 'Incendio Vehicular', prioridad: 'Alta', categoria: 'Emergencia' },
      { nombre: 'Accidente de Tránsito', prioridad: 'Alta', categoria: 'Emergencia' },
      { nombre: 'Enfermedad común', prioridad: 'Media', categoria: 'Emergencia' },
      { nombre: 'Herido de bala', prioridad: 'Alta', categoria: 'Emergencia' },
      { nombre: 'Herido por arma blanca', prioridad: 'Alta', categoria: 'Emergencia' },
      { nombre: 'Intoxicación / Envenenamiento', prioridad: 'Alta', categoria: 'Emergencia' },
      { nombre: 'Maternidad', prioridad: 'Media', categoria: 'Emergencia' },
      { nombre: 'Choque eléctrico / Electrocución', prioridad: 'Alta', categoria: 'Emergencia' },
      { nombre: 'Quemaduras', prioridad: 'Alta', categoria: 'Emergencia' },
      { nombre: 'Accidente colectivo', prioridad: 'Alta', categoria: 'Emergencia' },
      { nombre: 'Amputación', prioridad: 'Alta', categoria: 'Emergencia' }
    ],
    servicios: [
      { nombre: 'Traslado de paciente', prioridad: 'Media', categoria: 'Servicio' },
      { nombre: 'Llenado de cisterna / Depósito', prioridad: 'Baja', categoria: 'Servicio' },
      { nombre: 'Guardia de rescate en eventos', prioridad: 'Baja', categoria: 'Servicio' }
    ]
  };

  constructor(
    private fb         : FormBuilder,
    private service    : TiposEmergenciasService,
    private cdr        : ChangeDetectorRef,
    public  dialogRef  : MatDialogRef<TiposEmergenciasFormComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any | null,
  ) {}

  ngOnInit(): void {
    this.isEditMode = !!this.data;
    this.buildForm();

    if (this.isEditMode && this.data) {
      const nombreDb = this.data.TIPO_SERVICIO || this.data.nombre || '';

      // Verificar si el nombre de la BD está en nuestra lista estándar
      const esEstandar = [
        ...this.LISTA_INCIDENTES.emergencias,
        ...this.LISTA_INCIDENTES.servicios
      ].some(i => i.nombre.toLowerCase() === nombreDb.toLowerCase());

      if (esEstandar) {
        this.form.patchValue({
          nombre     : nombreDb,
          categoria  : this.data.CATEGORIA ?? 'Emergencia',
          descripcion: this.data.DESCRIPCION ?? '',
          prioridad  : this.data.PRIORIDAD ?? 'Media',
        });
      } else {
        // Si no es estándar, forzar la opción 'Otro' y activar el input manual
        this.form.patchValue({
          nombre     : 'Otro',
          nombreOtro : nombreDb,
          categoria  : this.data.CATEGORIA ?? 'Emergencia',
          descripcion: this.data.DESCRIPCION ?? '',
          prioridad  : this.data.PRIORIDAD ?? 'Media',
        });
        this.form.get('nombreOtro')?.setValidators([Validators.required, Validators.minLength(3)]);
        this.form.get('nombreOtro')?.updateValueAndValidity();
      }
    }
  }

  private buildForm(): void {
    this.form = this.fb.group({
      nombre     : [null, Validators.required],
      nombreOtro : [''], // Campo oculto inicialmente para escribir texto libre
      categoria  : ['Emergencia', Validators.required],
      descripcion: ['', [Validators.required, Validators.maxLength(300)]],
      prioridad  : [null, Validators.required],
    });
  }

  // 🔥 COPILOTO PROACTIVO: Se dispara cuando seleccionas un incidente del dropdown
  onIncidentSelectionChange(val: string): void {
    const txtOtro = this.form.get('nombreOtro');

    if (val === 'Otro') {
      // Activar validaciones para el nombre personalizado
      txtOtro?.setValidators([Validators.required, Validators.minLength(3), Validators.maxLength(100)]);
      txtOtro?.setValue('');
    } else {
      // Desactivar validaciones de 'Otro'
      txtOtro?.clearValidators();
      txtOtro?.setValue('');

      // Buscar los valores predeterminados en la lista de emergencias o servicios
      const incidenteEncontrado = 
        this.LISTA_INCIDENTES.emergencias.find(i => i.nombre === val) ||
        this.LISTA_INCIDENTES.servicios.find(i => i.nombre === val);

      if (incidenteEncontrado) {
        // ¡Magia! Autocompletar campos automáticamente
        this.form.patchValue({
          categoria: incidenteEncontrado.categoria,
          prioridad: incidenteEncontrado.prioridad,
        });
      }
    }
    txtOtro?.updateValueAndValidity();
    this.cdr.markForCheck();
  }

  get f(): { [key: string]: AbstractControl } {
    return this.form.controls;
  }

  onSubmit(): void {
    this.form.markAllAsTouched();
    if (this.form.invalid || this.isSaving) return;

    this.isSaving = true;
    this.errorMsg = '';
    this.cdr.markForCheck();

    // Si eligió 'Otro', el nombre real será el del input de texto; si no, el del select.
    const seleccion = this.f['nombre'].value;
    const nombreFinal = seleccion === 'Otro' ? this.f['nombreOtro'].value.trim() : seleccion;

    const payload = {
      nombre     : nombreFinal,
      categoria  : this.f['categoria'].value,
      descripcion: this.f['descripcion'].value?.trim() || null,
      prioridad  : this.f['prioridad'].value as Prioridad,
    };

    const currentId = this.data?.ID_TIPO_S || this.data?.id_tipo_emergencia;

    const request$ = this.isEditMode
      ? this.service.update(currentId, payload)
      : this.service.create(payload);

    request$.subscribe({
      next : () => {
        this.isSaving = false;
        this.dialogRef.close({ saved: true, action: this.isEditMode ? 'edit' : 'create' });
      },
      error: (err) => {
        this.isSaving = false;
        // 🔥 Prioriza el mensaje real del backend (p. ej. duplicado de nombre);
        // el genérico queda solo como fallback si no hay respuesta del servidor.
        this.errorMsg = err?.error?.message || err?.error?.msg || 'Error al guardar los cambios en el catálogo.';
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

  getHeaderClass(): string {
    const p = this.f['prioridad']?.value;
    if (p === 'Alta')  return 'header-alta';
    if (p === 'Media') return 'header-media';
    if (p === 'Baja')  return 'header-baja';
    return '';
  }
}