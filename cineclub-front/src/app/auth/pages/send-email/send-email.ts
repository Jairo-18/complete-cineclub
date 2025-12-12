import { Component, inject } from '@angular/core';
import { AuthCard } from '../../components/auth-card/auth-card';
import { Router } from '@angular/router';
import { SupabaseClient } from '@supabase/supabase-js';
import { NotificationsService } from '../../../shared/services/notifications.service';
import { MatButtonModule } from '@angular/material/button';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-send-email',
  standalone: true,
  imports: [AuthCard, MatButtonModule, CommonModule],
  templateUrl: './send-email.html',
  styleUrl: './send-email.scss',
})
export class SendEmail {
  private readonly _router: Router = inject(Router);
  private readonly _supabaseClient: SupabaseClient = inject(SupabaseClient);
  private readonly _notificationsService: NotificationsService = inject(NotificationsService);

  email: string = '';
  isLoading: boolean = false;
  canResend: boolean = true;
  countdown: number = 0;

  constructor() {
    const navigation = this._router.getCurrentNavigation();
    const state = navigation?.extras.state as { email: string };

    if (!state?.email) {
      this._router.navigate(['/auth/login']);
    } else {
      this.email = state.email;
    }
  }

  async resendEmail() {
    if (!this.canResend || this.isLoading) return;

    try {
      this.isLoading = true;
      const { error } = await this._supabaseClient.auth.resend({
        type: 'signup',
        email: this.email,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      });

      if (error) {
        if (error.status === 429) {
          this._notificationsService.error('Demasiados intentos. Espera unos minutos.');
        } else {
          throw error;
        }
      } else {
        this._notificationsService.success('Correo reenviado exitosamente.');
        this.startCountdown();
      }
    } catch (error: unknown) {
      if (typeof error === 'object' && error !== null && 'message' in error) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        this._notificationsService.error((error as any).message || 'Error reenviando correo.');
      } else {
        this._notificationsService.error('Error reenviando correo.');
      }
    } finally {
      this.isLoading = false;
    }
  }

  private startCountdown() {
    this.canResend = false;
    this.countdown = 60;
    const interval = setInterval(() => {
      this.countdown--;
      if (this.countdown <= 0) {
        this.canResend = true;
        clearInterval(interval);
      }
    }, 1000);
  }
}
