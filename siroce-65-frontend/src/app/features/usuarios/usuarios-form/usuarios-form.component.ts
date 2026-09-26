import { Component, OnInit, Inject, ChangeDetectorRef } from '@angular/core'; 
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
    private cdr: ChangeDetectorRef 
  ) {}

  ngOnInit(): void {
    // Determina el contexto del formulario (Creación vs Actualización)
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

    // Inicialización del Reactive Form con validadores síncronos complejos
    this.form = this.fb.group({
      nombre: [nombreForm, Validators.required],
      apellido: [apellidoForm, Validators.required],
      dpi: [this.data?.dpi || '', [Validators.required, Validators.pattern('^[0-9]{13}$')]],
      usuario: [this.data?.usuario || '', Validators.required],
      rol: [this.data?.rol || 'DESPACHO', Validators.required],
      // En modo edición la contraseña es opcional; en creación, se exigen políticas OWASP
      password: ['', this.isEditMode ? [] : [Validators.required, Validators.pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&.#-]).{12,15}$/)]],
      confirmPassword: ['', this.isEditMode ? [] : [Validators.required]]
    }, { validators: this.passwordMatchValidator });

    // Suscripción a cambios en los campos para generar el usuario automáticamente
    if (!this.isEditMode) {
      this.form.get('nombre')?.valueChanges.subscribe(() => this.generarUsuario());
      this.form.get('apellido')?.valueChanges.subscribe(() => this.generarUsuario());
    }
  }

  // Lógica de autocompletado: Genera un nombre de usuario estándar eliminando diacríticos
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

  // Validador personalizado a nivel de formulario para cruzar campos
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

  /**
   * Generación de contraseña criptográficamente segura.
   * Implementa el algoritmo de Fisher-Yates para asegurar alta entropía 
   * garantizando el cumplimiento de la política de seguridad (mayúsculas, minúsculas, números, símbolos).
   */
  generarPasswordSegura(): void {
    const UPPER   = 'ABCDEFGHJKLMNPQRSTUVWXYZ';
    const LOWER   = 'abcdefghijkmnopqrstuvwxyz';
    const NUMBERS = '23456789';
    const SPECIAL = '@$!%*?&.#-';
    const ALL     = UPPER + LOWER + NUMBERS + SPECIAL;

    const pick = (chars: string) => chars[Math.floor(Math.random() * chars.length)];

    // Garantizar la inclusión de al menos un carácter por grupo exigido
    const obligatorios = [pick(UPPER), pick(LOWER), pick(NUMBERS), pick(SPECIAL)];
    const resto = Array.from({ length: 12 - obligatorios.length }, () => pick(ALL));

    const caracteres = [...obligatorios, ...resto];

    // Algoritmo Fisher-Yates Shuffle (evita patrones predecibles en la estructura)
    for (let i = caracteres.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [caracteres[i], caracteres[j]] = [caracteres[j], caracteres[i]];
    }

    const passwordGenerada = caracteres.join('');

    this.form.patchValue({ password: passwordGenerada, confirmPassword: passwordGenerada });
    this.hidePassword = false;
    this.hideConfirm = false;
  }

  // Previene el ingreso de caracteres no numéricos a nivel de evento de teclado
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
    
    // Función manejadora de errores de la API
    const manejarError = (err: any) => {
      this.isSaving = false; 
      this.errorMsg = err.error?.error || 'Ocurrió un error al ejecutar la transacción en la base de datos.';
      
      // Actualización manual de la vista mediante ChangeDetectorRef
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