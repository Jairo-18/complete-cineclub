/* eslint-disable @typescript-eslint/no-explicit-any */
import { Injectable, inject } from '@angular/core';
import { SupabaseClient, User } from '@supabase/supabase-js';
import { BehaviorSubject, Observable } from 'rxjs';
import { NotificationsService } from '../../shared/services/notifications.service';
import { supabase } from '../../supabaseClient';

@Injectable({
  providedIn: 'root',
})
export class SupabaseService {
  private readonly supabase: SupabaseClient = supabase;
  private readonly currentUser = new BehaviorSubject<User | null>(null);
  private readonly isInitialized = new BehaviorSubject<boolean>(false);

  private readonly _notificationsService: NotificationsService = inject(NotificationsService);
  private authInitialized: boolean = false;

  constructor() {
    this.initializeAuth();
  }

  private async initializeAuth() {
    try {
      const {
        data: { session },
        error,
      } = await this.supabase.auth.getSession();

      if (error) {
        console.error('Error obteniendo sesión inicial:', error);
      } else {
        this.currentUser.next(session?.user ?? null);
      }

      this.supabase.auth.onAuthStateChange(async (event, session) => {
        this.currentUser.next(session?.user ?? null);

        if (event === 'SIGNED_IN' && session?.user) {
          const pendingUserData = localStorage.getItem('pendingUserData');
          if (pendingUserData) {
            try {
              const userData = JSON.parse(pendingUserData);
              const { user } = session;

              const { error: upsertError } = await this.supabase.from('profile').upsert({
                id: user.id,
                fullName: userData.fullName,
                country: userData.country,
                phone: userData.phone,
                created_at: new Date(),
              });

              if (upsertError) {
                console.error('❌ Error al crear perfil tras confirmar correo:', upsertError);
              } else {
                this._notificationsService.success('Tu perfil ha sido creado correctamente');
              }

              localStorage.removeItem('pendingUserData');
            } catch (err) {
              console.error('Error procesando pendingUserData:', err);
            }
          }
        }

        if (event === 'INITIAL_SESSION' || event === 'SIGNED_OUT') {
          this.markAsInitialized();
        }
      });

      setTimeout(() => {
        this.markAsInitialized();
      }, 1000);
    } catch (error) {
      console.error('❌ Error inicializando auth:', error);
      this.markAsInitialized();
    }
  }

  private markAsInitialized() {
    if (!this.authInitialized) {
      this.authInitialized = true;
      this.isInitialized.next(true);
    }
  }

  get user$(): Observable<User | null> {
    return this.currentUser.asObservable();
  }

  get currentUserValue(): User | null {
    return this.currentUser.value;
  }

  get isInitialized$(): Observable<boolean> {
    return this.isInitialized.asObservable();
  }

  async getSession() {
    return await this.supabase.auth.getSession();
  }

  async getCurrentSession() {
    const {
      data: { session },
    } = await this.supabase.auth.getSession();
    return session;
  }

  async waitForAuthReady(): Promise<boolean> {
    if (this.authInitialized) {
      return true;
    }

    return new Promise((resolve) => {
      const subscription = this.isInitialized$.subscribe((initialized) => {
        if (initialized) {
          subscription.unsubscribe();
          resolve(true);
        }
      });

      setTimeout(() => {
        subscription.unsubscribe();
        resolve(false);
      }, 1000);
    });
  }

  async signOut() {
    try {
      const { error } = await this.supabase.auth.signOut();

      if (error && !error.message?.includes('Auth session missing')) {
        console.error('Error en signOut:', error);
      }
    } catch (error: any) {
      if (!error.message?.includes('Auth session missing')) {
        console.error('❌ Error deslogeando:', error);
      }
    } finally {
      localStorage.clear();
      sessionStorage.clear();
    }
  }

  async resetPasswordForEmail(email: string) {
    try {
      const { error } = await this.supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/set-password`,
      });

      if (error) throw error;
    } catch (error: any) {
      console.error('❌ Error enviando correo de recuperación:', error);
      throw new Error(error.message || 'Error enviando correo de recuperación');
    }
  }

  clearUser(): void {
    this.currentUser.next(null);
  }
}
