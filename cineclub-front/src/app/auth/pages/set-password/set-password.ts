import { Component, inject, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { SupabaseClient } from '@supabase/supabase-js';
import { NotificationsService } from '../../../shared/services/notifications.service';
import { AuthCard } from '../../components/auth-card/auth-card';
import { TokenService } from '../../services/token.service';

@Component({
  selector: 'app-set-password',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    AuthCard,
  ],
  templateUrl: './set-password.html',
  styleUrl: './set-password.scss',
})
export class SetPassword implements OnInit, OnDestroy {
  form: FormGroup;
  hidePassword: boolean = true;
  hideConfirmPassword: boolean = true;
  isLoading: boolean = true;

  private readonly _fb: FormBuilder = inject(FormBuilder);
  private readonly _router: Router = inject(Router);
  private readonly _supabaseClient: SupabaseClient = inject(SupabaseClient);
  private readonly _notificationsService: NotificationsService = inject(NotificationsService);
  private readonly _tokenService: TokenService = inject(TokenService);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private authSubscription: any;
  private sessionResolved: boolean = false;

  constructor() {
    this.form = this._fb.group(
      {
        password: ['', [Validators.required, Validators.minLength(6)]],
        confirmPassword: ['', [Validators.required]],
      },
      { validators: this.passwordsMatchValidator },
    );
  }

  async ngOnInit() {
    this.isLoading = true;
    this.sessionResolved = false;

    const {
      data: { subscription },
    } = this._supabaseClient.auth.onAuthStateChange((event, session) => {
      if (session && !this.sessionResolved) {
        this.sessionResolved = true;
        this.isLoading = false;
      }

      if (event === 'PASSWORD_RECOVERY' && !session) {
        this._notificationsService.error(
          'Link inválido o expirado. Por favor solicita un nuevo correo.',
        );
        this._router.navigate(['/auth/login']);
      }
    });
    this.authSubscription = subscription;
  }

  ngOnDestroy() {
    if (this.authSubscription) {
      this.authSubscription.unsubscribe();
    }
  }

  passwordsMatchValidator(group: FormGroup) {
    const password = group.get('password')?.value;
    const confirmPassword = group.get('confirmPassword')?.value;
    return password === confirmPassword ? null : { passwordsMismatch: true };
  }

  async setPassword() {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.isLoading = true;

    try {
      const { password } = this.form.value;

      const { error } = await this._supabaseClient.auth.updateUser({
        password: password,
      });

      if (error) throw error;

      await this._supabaseClient.auth.signOut();
      this._tokenService.clearSession(true);

      this._notificationsService.success(
        '¡Contraseña establecida correctamente! Ahora puedes iniciar sesión.',
      );
      this._router.navigate(['/auth/login']);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error: any) {
      this._notificationsService.error(error.message || 'Error al establecer la contraseña.');
    } finally {
      this.isLoading = false;
    }
  }

  togglePasswordVisibility() {
    this.hidePassword = !this.hidePassword;
  }

  toggleConfirmPasswordVisibility() {
    this.hideConfirmPassword = !this.hideConfirmPassword;
  }
}
