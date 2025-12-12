/* eslint-disable @typescript-eslint/no-explicit-any */
import { Component, inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { RouterLink } from '@angular/router';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatInputModule } from '@angular/material/input';
import { AuthCard } from '../../components/auth-card/auth-card';
import { SupabaseService } from '../../services/supabase.service';
import { NotificationsService } from '../../../shared/services/notifications.service';

@Component({
  selector: 'app-recover-password',
  standalone: true,
  imports: [
    RouterLink,
    MatButtonModule,
    MatFormFieldModule,
    MatIconModule,
    ReactiveFormsModule,
    MatInputModule,
    AuthCard,
  ],
  templateUrl: './recover-password.html',
  styleUrl: './recover-password.scss',
})
export class RecoverPassword {
  form: FormGroup;
  loading = false;

  private readonly _fb: FormBuilder = inject(FormBuilder);
  private readonly _supabaseService: SupabaseService = inject(SupabaseService);
  private readonly _notificationsService: NotificationsService = inject(NotificationsService);

  constructor() {
    this.form = this._fb.group({
      email: ['', [Validators.required, Validators.email]],
    });
  }

  async RecoverPassword() {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    try {
      this.loading = true;
      const { email } = this.form.value;
      await this._supabaseService.resetPasswordForEmail(email);
      this._notificationsService.success(
        'Te hemos enviado un enlace a tu correo para restablecer tu contraseña.',
      );
      this.form.reset();
    } catch (error: any) {
      this._notificationsService.error(error.message || 'Error al enviar el correo.');
    } finally {
      this.loading = false;
    }
  }
}
