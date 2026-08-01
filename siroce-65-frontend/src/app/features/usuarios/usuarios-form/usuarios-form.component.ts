import { Component, OnInit, Inject, ChangeDetectorRef } from '@angular/core'; // 🔥 Agregamos ChangeDetectorRef
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, AbstractControl, ValidationErrors } from '@angular/forms';
import { MatDialogRef, MatDialogModule, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatTooltipModule } from '@angular/material/tooltip';
import { UsuariosService } from '../../../core/services/usuarios.service';

@Component({
  selector: 'app-usuarios-form',
  templateUrl: './usuarios-form.component.html',
  styleUrls: ['./usuarios-form.component.scss'],
  standalone: true,
  imports: [
    CommonModule, ReactiveFormsModule, MatIconModule, MatButtonModule,
    MatDialogModule, MatFormFieldModule, MatInputModule, MatSelectModule,
    MatTooltipModule
  ]
})
export class UsuariosFormComponent implements OnInit {
  
  form!: FormGroup;
  isSaving = false;
  errorMsg = '';
  hidePassword = true;
  hideConfirm = true;
  isEditMode = false; 

  constructor(
    private fb: FormBuilder,
    private usuariosService: UsuariosService,
    public dialogRef: MatDialogRef<UsuariosFormComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any,
    private cdr: ChangeDetectorRef // 🔥 Inyectamos el detector de cambios
  ) {}

  ngOnInit(): void {
    this.isEditMode = !!this.data; 

    let nombreForm = '';
    let apellidoForm = '';
    
    if (this.isEditMode) {
      nombreForm = this.data.nombrePersona || '';
      apellidoForm = this.data.apellidoPersona || '';

      if (!nombreForm && !apellidoForm && this.data.nombreCompleto) {
        const partes = this.data.nombreCompleto.split(' ');
        nombreForm = partes[0] || '';
        apellidoForm = partes.length > 1 ? partes.slice(1).join(' ') : '';
      }
    }

    this.form = this.fb.group({
      nombre: [nombreForm, Validators.required],
      apellido: [apellidoForm, Validators.required],
      dpi: [this.data?.dpi || '', [Validators.required, Validators.pattern('^[0-9]{13}$')]],
      usuario: [this.data?.usuario || '', Validators.required],
      rol: [this.data?.rol || 'DESPACHO', Validators.required],
      password: ['', this.isEditMode ? [] : [Validators.required, Validators.pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&.#-]).{12,15}$/)]],
      confirmPassword: ['', this.isEditMode ? [] : [Validators.required]]
    }, { validators: this.passwordMatchValidator });

    if (!this.isEditMode) {
      this.form.get('nombre')?.valueChanges.subscribe(() => this.generarUsuario());
      this.form.get('apellido')?.valueChanges.subscribe(() => this.generarUsuario());
    }
  }

  generarUsuario(): void {
    const nom = this.form.get('nombre')?.value || '';
    const ape = this.form.get('apellido')?.value || '';

    if (nom && ape) {
      const inicial = nom.trim().charAt(0).toLowerCase();
      const primerApellido = ape.trim().split(' ')[0].toLowerCase();
      let usuarioGenerado = (inicial + primerApellido).normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();

      this.form.patchValue({ usuario: usuarioGenerado }, { emitEvent: false });
    }
  }

  passwordMatchValidator(group: AbstractControl): ValidationErrors | null {
    const pass = group.get('password')?.value;
    const confirm = group.get('confirmPassword')?.value;
    if (!pass && !confirm && group.parent && group.parent.get('isEditMode')) return null;
    return pass === confirm ? null : { mismatch: true };
  }

  get passValue(): string { return this.form.get('password')?.value || ''; }
  
  hasLength(): boolean  { return this.passValue.length >= 12 && this.passValue.length <= 15; }
  hasUpper(): boolean   { return /(?=.*[A-Z])/.test(this.passValue); }
  hasLower(): boolean   { return /(?=.*[a-z])/.test(this.passValue); }
  hasNumber(): boolean  { return /(?=.*\d)/.test(this.passValue); }
  hasSpecial(): boolean { return /(?=.*[@$!%*?&.#-])/.test(this.passValue); }

  // 🔥 NUEVO: Genera una contraseña de 12 caracteres que cumple SIEMPRE
  // con la política de seguridad (mayúscula, minúscula, número y especial)
  generarPasswordSegura(): void {
    const UPPER   = 'ABCDEFGHJKLMNPQRSTUVWXYZ';
    const LOWER   = 'abcdefghijkmnopqrstuvwxyz';
    const NUMBERS = '23456789';
    const SPECIAL = '@$!%*?&.#-';
    const ALL     = UPPER + LOWER + NUMBERS + SPECIAL;

    const pick = (chars: string) => chars[Math.floor(Math.random() * chars.length)];

    // Garantiza al menos un carácter de cada categoría exigida por el validador
    const obligatorios = [pick(UPPER), pick(LOWER), pick(NUMBERS), pick(SPECIAL)];
    const resto = Array.from({ length: 12 - obligatorios.length }, () => pick(ALL));

    const caracteres = [...obligatorios, ...resto];

    // Fisher-Yates shuffle para no dejar el patrón de posiciones fijas
    for (let i = caracteres.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [caracteres[i], caracteres[j]] = [caracteres[j], caracteres[i]];
    }

    const passwordGenerada = caracteres.join('');

    // Se rellena también "Confirmar Contraseña" para que el admin solo tenga que copiarla
    this.form.patchValue({ password: passwordGenerada, confirmPassword: passwordGenerada });
    this.hidePassword = false;
    this.hideConfirm = false;
  }

  soloNumeros(event: KeyboardEvent): boolean {
    const charCode = (event.which) ? event.which : event.keyCode;
    if (charCode > 31 && (charCode < 48 || charCode > 57)) {
      event.preventDefault(); return false;
    }
    return true;
  }

  onSubmit(): void {
    if (this.form.hasError('mismatch')) {
      this.errorMsg = 'Las contraseñas no coinciden.'; return;
    }
    if (this.form.invalid || this.isSaving) return;

    this.isSaving = true;
    this.errorMsg = '';
    
    // Función manejadora de errores con actualización forzada
    const manejarError = (err: any) => {
      this.isSaving = false; 
      this.errorMsg = err.error?.error || 'Ocurrió un error al guardar en la base de datos.';
      
      // 🔥 Le decimos a Angular: "¡Actualiza la pantalla AHORA!"
      this.cdr.detectChanges(); 
    };

    if (this.isEditMode) {
      this.usuariosService.actualizarUsuario(this.data.id_usuario, this.form.value).subscribe({
        next: () => {
          this.isSaving = false;
          this.dialogRef.close({ saved: true, action: 'edit' });
        },
        error: manejarError
      });
    } else {
      this.usuariosService.registrarUsuario(this.form.value).subscribe({
        next: () => {
          this.isSaving = false;
          this.dialogRef.close({ saved: true, action: 'create' });
        },
        error: manejarError
      });
    }
  }

  onCancel(): void {
    this.dialogRef.close();
  }
}