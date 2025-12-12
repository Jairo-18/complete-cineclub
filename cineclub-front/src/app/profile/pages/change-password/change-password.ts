import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { SupabaseClient } from '@supabase/supabase-js';
import { NotificationsService } from '../../../shared/services/notifications.service';
import { TokenService } from '../../../auth/services/token.service';
import { AuthCard } from '../../../auth/components/auth-card/auth-card';
import { CustomValidationsService } from '../../../shared/validators/customValidations.service';

@Component({
  selector: 'app-change-password',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatCardModule,
    AuthCard,
  ],
  templateUrl: './change-password.html',
  styleUrl: './change-password.scss',
})
export class ChangePassword {
  form: FormGroup;
  hideCurrentPassword: boolean = true;
  hideNewPassword: boolean = true;
  hideConfirmPassword: boolean = true;
  isLoading: boolean = false;

  private readonly _fb: FormBuilder = inject(FormBuilder);
  private readonly _router: Router = inject(Router);
  private readonly _supabaseClient: SupabaseClient = inject(SupabaseClient);
  private readonly _notificationsService: NotificationsService = inject(NotificationsService);
  private readonly _tokenService: TokenService = inject(TokenService);
  private readonly _passwordValidationService: CustomValidationsService =
    inject(CustomValidationsService);

  constructor() {
    this.form = this._fb.group(
      {
        currentPassword: ['', [Validators.required]],
        newPassword: [
          '',
          [Validators.required, this._passwordValidationService.passwordStrength()],
        ],
        confirmPassword: ['', [Validators.required]],
      },
      {
        validators: this._passwordValidationService.passwordsMatch(
          'newPassword',
          'confirmPassword',
        ),
      },
    );
  }

  async changePassword() {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.isLoading = true;

    try {
      const { currentPassword, newPassword } = this.form.value;

      const session = await this._supabaseClient.auth.getSession();
      const userEmail = session.data.session?.user?.email;

      if (!userEmail) {
        throw new Error('No se pudo obtener el email del usuario');
      }

      const { error: signInError } = await this._supabaseClient.auth.signInWithPassword({
        email: userEmail,
        password: currentPassword,
      });

      if (signInError) {
        this._notificationsService.error('La contraseña actual es incorrecta');
        this.isLoading = false;
        return;
      }

      const { error: updateError } = await this._supabaseClient.auth.updateUser({
        password: newPassword,
      });

      if (updateError) throw updateError;

      await this._supabaseClient.auth.signOut();
      this._tokenService.clearSession(true);

      this._notificationsService.success(
        '¡Contraseña cambiada exitosamente! Por favor inicia sesión con tu nueva contraseña.',
      );
      this._router.navigate(['/auth/login']);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error: any) {
      this._notificationsService.error(error.message || 'Error al cambiar la contraseña.');
    } finally {
      this.isLoading = false;
    }
  }

  toggleCurrentPasswordVisibility() {
    this.hideCurrentPassword = !this.hideCurrentPassword;
  }

  toggleNewPasswordVisibility() {
    this.hideNewPassword = !this.hideNewPassword;
  }

  toggleConfirmPasswordVisibility() {
    this.hideConfirmPassword = !this.hideConfirmPassword;
  }
}
