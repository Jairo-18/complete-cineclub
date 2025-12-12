/* eslint-disable @typescript-eslint/no-explicit-any */
import { inject, Injectable } from '@angular/core';
import { SupabaseClient } from '@supabase/supabase-js';
import { NotificationsService } from '../../shared/services/notifications.service';
import { Router } from '@angular/router';
import { TokenService } from './token.service';
import { SupabaseService } from './supabase.service';
import { UserWithRoleInterface } from '../interfaces/session.interface';

@Injectable({
  providedIn: 'root',
})
export class SignInService {
  private readonly _notificationsService: NotificationsService = inject(NotificationsService);
  private readonly _tokenService: TokenService = inject(TokenService);
  private readonly _supabaseClient: SupabaseClient = inject(SupabaseClient);
  private readonly _supabaseService: SupabaseService = inject(SupabaseService);
  private readonly _router: Router = inject(Router);

  private async getUserWithRole(userId: string): Promise<UserWithRoleInterface> {
    const response = await this._supabaseClient
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
      .eq('id', userId)
      .single();

    if (response.error) {
      console.error('❌ Error obteniendo usuario con rol:', response.error);
      throw new Error('No se pudo obtener la información del usuario');
    }

    if (!response.data) {
      console.error('❌ No se encontró el usuario en la tabla profile');
      throw new Error('Usuario no encontrado');
    }

    const transformedData = {
      ...response.data,
      roleType: Array.isArray(response.data?.roleType)
        ? response.data?.roleType[0]
        : response.data?.roleType,
    };

    return transformedData as UserWithRoleInterface;
  }

  async signIn(email: string, password: string) {
    try {
      const { data, error } = await this._supabaseClient.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        if (error.message.includes('Invalid login credentials'))
          throw new Error('Correo o contraseña incorrectos.');
        throw new Error('Error al iniciar sesión.');
      }

      if (!data.session || !data.user) throw new Error('No se pudo iniciar sesión correctamente.');

      const googleAvatarUrl =
        data.user.user_metadata?.['avatar_url'] ||
        data.user.user_metadata?.['picture'] ||
        data.user.identities?.[0]?.identity_data?.['avatar_url'] ||
        data.user.identities?.[0]?.identity_data?.['picture'];

      const { data: profile } = await this._supabaseClient
        .from('profile')
        .select('fullName, country, phone, roleTypeId')
        .eq('id', data.user.id)
        .maybeSingle();

      if (googleAvatarUrl) {
        const { error: updateError } = await this._supabaseClient
          .from('profile')
          .update({ avatarUrl: googleAvatarUrl })
          .eq('id', data.user.id);

        if (updateError) {
          console.error('❌ Error guardando avatarUrl:', updateError);
        }
      }

      if (!profile?.fullName || !profile?.country || !profile?.phone) {
        const minimalUser = {
          id: data.user.id,
          roleTypeId: '',
          roleType: {
            id: '',
            code: '',
            name: '',
          },
        };

        this._tokenService.saveSession(
          data.session.access_token,
          data.session.refresh_token,
          minimalUser,
        );

        await this._router.navigate(['/profile/register-profile']);
        this._notificationsService.info('Completa tu perfil antes de continuar.');
        return { ...data, userWithRole: minimalUser };
      }

      const userWithRole = await this.getUserWithRole(data.user.id);

      this._tokenService.saveSession(
        data.session.access_token,
        data.session.refresh_token,
        userWithRole,
      );

      await new Promise((resolve) => setTimeout(resolve, 300));

      await this._router.navigate(['/']);

      return { ...data, userWithRole };
    } catch (error: any) {
      console.error('❌ Error en signIn:', error);
      this._notificationsService.error(error.message || 'Error iniciando sesión.');
      throw error;
    }
  }

  async signInWithGoogle() {
    try {
      const { data, error } = await this._supabaseClient.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: '/auth/callback',
          skipBrowserRedirect: true,
        },
      });

      if (error) throw error;

      const popup = window.open(
        data?.url,
        'Login con Google',
        'width=500,height=600,scrollbars=no,resizable=no',
      );

      return new Promise((resolve, reject) => {
        const check = setInterval(async () => {
          const { data: sessionData } = await this._supabaseClient.auth.getSession();

          if (sessionData.session) {
            clearInterval(check);
            try {
              if (popup && !popup.closed) {
                popup.close();
              }
            } catch {
              console.warn('Could not close popup programmatically (expected if COOP is active)');
            }

            const { user, access_token, refresh_token } = {
              user: sessionData.session.user,
              access_token: sessionData.session.access_token,
              refresh_token: sessionData.session.refresh_token,
            };

            const googleAvatarUrl =
              sessionData.session.user.user_metadata?.['avatar_url'] ||
              sessionData.session.user.user_metadata?.['picture'] ||
              sessionData.session.user.identities?.[0]?.identity_data?.['avatar_url'] ||
              sessionData.session.user.identities?.[0]?.identity_data?.['picture'];

            const { data: profile } = await this._supabaseClient
              .from('profile')
              .select('fullName, country, phone, roleTypeId')
              .eq('id', user.id)
              .maybeSingle();

            if (googleAvatarUrl) {
              const { error: updateError } = await this._supabaseClient
                .from('profile')
                .update({ avatarUrl: googleAvatarUrl })
                .eq('id', user.id);

              if (updateError) {
                console.error('❌ Error guardando avatarUrl:', updateError);
              }
            }

            if (!profile?.fullName || !profile?.country || !profile?.phone) {
              const minimalUser = {
                id: user.id,
                roleTypeId: '',
                roleType: {
                  id: '',
                  code: '',
                  name: '',
                },
              };

              this._tokenService.saveSession(access_token, refresh_token, minimalUser);

              await this._router.navigate(['/profile/register-profile']);
              this._notificationsService.info('Completa tu perfil antes de continuar.');
              resolve(sessionData.session);
              return;
            }

            const userWithRole = await this.getUserWithRole(user.id);

            this._tokenService.saveSession(access_token, refresh_token, userWithRole);

            await new Promise((resolve) => setTimeout(resolve, 300));

            await this._router.navigate(['/']);

            resolve(sessionData.session);
          }
        }, 1000);

        setTimeout(() => {
          clearInterval(check);
          try {
            if (popup && !popup.closed) {
              popup.close();
            }
          } catch {
            // Ignore COOP errors
          }
          reject(new Error('Timeout esperando autenticación'));
        }, 60000);
      });
    } catch (error: any) {
      console.error('❌ Error en signInWithGoogle:', error);
      this._notificationsService.error('Error al iniciar sesión con Google.');
      throw error;
    }
  }

  async signOut() {
    this._tokenService.notifyLoggingOut();

    await this._router.navigate(['/auth/login']);

    await new Promise((resolve) => setTimeout(resolve, 100));

    this._supabaseService.clearUser();
    this._tokenService.clearSession(true);

    try {
      await Promise.race([
        this._supabaseService.signOut(),
        new Promise((_, reject) => setTimeout(() => reject(new Error('Logout timeout')), 3000)),
      ]);
    } catch (error: any) {
      if (!error.message?.includes('Auth session missing') && error.message !== 'Logout timeout') {
        console.error('❌ Error al cerrar sesión en Supabase:', error);
      }
    }

    this._notificationsService.success('Sesión cerrada correctamente.');
  }
}
