import { inject, Injectable } from '@angular/core';
import { supabase } from '../../supabaseClient';
import { Router } from '@angular/router';
import { TokenService } from './token.service';
import { NotificationsService } from '../../shared/services/notifications.service';

@Injectable({
  providedIn: 'root',
})
export class AuthCallbackService {
  private readonly _tokenService: TokenService = inject(TokenService);
  private readonly _router: Router = inject(Router);
  private readonly _notificationsService: NotificationsService = inject(NotificationsService);

  async handleCallback() {
    try {
      this._tokenService.clearSession();

      const { data: sessionData } = await supabase.auth.getSession();

      let session = sessionData.session;
      let user = sessionData.session?.user;

      if (!session || !user) {
        const { data, error } = await supabase.auth.exchangeCodeForSession(window.location.href);

        if (error) {
          console.error('❌ [Callback] Error en exchangeCodeForSession:', error);

          throw error;
        }
        session = data.session;
        user = data.user;
      }

      if (!session || !user) {
        console.error('❌ [Callback] No se obtuvo sesión o usuario');
        throw new Error('No se pudo obtener sesión.');
      }

      const { data: userProfile, error: profileError } = await supabase
        .from('profile')
        .select(
          `
          id,
          roleTypeId,
          roleType:roleType!fk_profile_roletype (
            id,
            code,
            name
          )
        `,
        )
        .eq('id', user.id)
        .single();

      if (profileError) {
        console.error('❌ Error al obtener perfil:', profileError);
        throw profileError;
      }

      const transformedProfile = {
        ...userProfile,
        roleType: Array.isArray(userProfile.roleType)
          ? userProfile.roleType[0]
          : userProfile.roleType,
      };

      this._tokenService.saveSession(
        session.access_token,
        session.refresh_token,
        transformedProfile,
      );

      this._notificationsService.success('¡Cuenta verificada exitosamente! Bienvenido.');
      await this._router.navigateByUrl('/');

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (err: any) {
      console.error('❌ Error en handleCallback:', err);

      await supabase.auth.signOut();
      this._tokenService.clearSession();

      this._notificationsService.error(
        'Error verificando la cuenta o enlace expirado. Por favor, intenta registrarte nuevamente o inicia sesión.',
      );
      await this._router.navigateByUrl('/auth/login');
    }
  }
}
