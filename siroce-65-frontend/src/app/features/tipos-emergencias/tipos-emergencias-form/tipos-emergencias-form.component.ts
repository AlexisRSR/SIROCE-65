// src/app/features/tipos-emergencias/tipos-emergencias-form/tipos-emergencias-form.component.ts
// ══════════════════════════════════════════════════════════════
//  TiposEmergenciasFormComponent — Modal de Alta / Edición
// ──────────────────────────────────────────────────────────────
//  Campos del formulario:
//    · nombre      → text (required, ej. "Incendio Forestal")
//    · descripcion → textarea (optional)
//    · prioridad   → select: Alta | Media | Baja (required)
//
//  Modo Crear (data === null) → POST /api/tipos-emergencias
//  Modo Editar (data = TipoEmergencia) → PUT /api/tipos-emergencias/:id
//
//  ✅ standalone: false — módulo tradicional
// ══════════════════════════════════════════════════════════════
import { Component, OnInit, Inject, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { FormBuilder, FormGroup, Validators, AbstractControl } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { TiposEmergenciasService, TipoEmergencia, Prioridad } from '../../../core/services/tipos-emergencias.service';
import { VehiculosService, TipoVehiculo } from '../../../core/services/vehiculos.service';

@Component({
  standalone     : false,
  selector       : 'app-tipos-emergencias-form',
  templateUrl    : './tipos-emergencias-form.component.html',
  styleUrls      : ['./tipos-emergencias-form.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TiposEmergenciasFormComponent implements OnInit {

  form     !: FormGroup;
  isEditMode = false;
  isSaving   = false;
  errorMsg   = '';

  tiposVehiculos: TipoVehiculo[] = [];
  readonly PRIORIDADES: Prioridad[] = ['Alta', 'Media', 'Baja'];

  // 🔥 BASE DE CONOCIMIENTO: Lista oficial normalizada para autocompletar
  readonly LISTA_INCIDENTES = {
    emergencias: [
      { nombre: 'Incendio Estructural', prioridad: 'Alta', categoria: 'Emergencia', idTipoV: 4 }, // 4 = Motobomba
      { nombre: 'Incendio Forestal', prioridad: 'Alta', categoria: 'Emergencia', idTipoV: 4 },
      { nombre: 'Incendio Vehicular', prioridad: 'Alta', categoria: 'Emergencia', idTipoV: 4 },
      { nombre: 'Accidente de Tránsito', prioridad: 'Alta', categoria: 'Emergencia', idTipoV: 1 }, // 1 = Ambulancia
      { nombre: 'Enfermedad común', prioridad: 'Media', categoria: 'Emergencia', idTipoV: 1 },
      { nombre: 'Herido de bala', prioridad: 'Alta', categoria: 'Emergencia', idTipoV: 1 },
      { nombre: 'Herido por arma blanca', prioridad: 'Alta', categoria: 'Emergencia', idTipoV: 1 },
      { nombre: 'Intoxicación / Envenenamiento', prioridad: 'Alta', categoria: 'Emergencia', idTipoV: 1 },
      { nombre: 'Maternidad', prioridad: 'Media', categoria: 'Emergencia', idTipoV: 1 },
      { nombre: 'Choque eléctrico / Electrocución', prioridad: 'Alta', categoria: 'Emergencia', idTipoV: 1 },
      { nombre: 'Quemaduras', prioridad: 'Alta', categoria: 'Emergencia', idTipoV: 1 },
      { nombre: 'Accidente colectivo', prioridad: 'Alta', categoria: 'Emergencia', idTipoV: 1 },
      { nombre: 'Amputación', prioridad: 'Alta', categoria: 'Emergencia', idTipoV: 1 }
    ],
    servicios: [
      { nombre: 'Traslado de paciente', prioridad: 'Media', categoria: 'Servicio', idTipoV: 1 },
      { nombre: 'Llenado de cisterna / Depósito', prioridad: 'Baja', categoria: 'Servicio', idTipoV: 5 }, // 5 = Cisterna
      { nombre: 'Guardia de rescate en eventos', prioridad: 'Baja', categoria: 'Servicio', idTipoV: 3 }   // 3 = Pickup
    ]
  };

  private readonly TIPOS_VEHICULOS_DEFAULT = [
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

  constructor(
    private fb         : FormBuilder,
    private service    : TiposEmergenciasService,
    private vehiculoSvc: VehiculosService,
    private cdr        : ChangeDetectorRef,
    public  dialogRef  : MatDialogRef<TiposEmergenciasFormComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any | null,
  ) {}

  ngOnInit(): void {
    this.isEditMode = !!this.data;
    this.buildForm();
    this.loadVehiculos();

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
          idTipoV    : this.data.ID_TIPO_V ?? null,
        });
      } else {
        // Si no es estándar, forzar la opción 'Otro' y activar el input manual
        this.form.patchValue({
          nombre     : 'Otro',
          nombreOtro : nombreDb,
          categoria  : this.data.CATEGORIA ?? 'Emergencia',
          descripcion: this.data.DESCRIPCION ?? '',
          prioridad  : this.data.PRIORIDAD ?? 'Media',
          idTipoV    : this.data.ID_TIPO_V ?? null,
        });
        this.form.get('nombreOtro')?.setValidators([Validators.required, Validators.minLength(3)]);
        this.form.get('nombreOtro')?.updateValueAndValidity();
      }
    }
  }

  private loadVehiculos(): void {
    this.vehiculoSvc.getTipos().subscribe({
      next: (res) => {
        this.tiposVehiculos = res.ok && res.data?.length ? res.data : this.TIPOS_VEHICULOS_DEFAULT;
        this.cdr.markForCheck();
      },
      error: () => {
        this.tiposVehiculos = this.TIPOS_VEHICULOS_DEFAULT;
        this.cdr.markForCheck();
      }
    });
  }

  private buildForm(): void {
    this.form = this.fb.group({
      nombre     : [null, Validators.required],
      nombreOtro : [''], // Campo oculto inicialmente para escribir texto libre
      categoria  : ['Emergencia', Validators.required],
      descripcion: ['', [Validators.maxLength(300)]],
      prioridad  : [null, Validators.required],
      idTipoV    : [null]
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
          idTipoV  : incidenteEncontrado.idTipoV
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
      idTipoV    : this.f['idTipoV'].value
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
        this.errorMsg = err.status === 409
          ? 'Ya existe un incidente registrado con ese nombre.'
          : 'Error al guardar los cambios en el catálogo.';
        this.cdr.markForCheck();
      },
    });
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