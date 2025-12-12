import { Injectable, PLATFORM_ID, inject } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { BehaviorSubject } from 'rxjs';
import { supabase } from '../../supabaseClient';
import { UnifiedSession } from '../interfaces/session.interface';

@Injectable({
  providedIn: 'root',
})
export class TokenService {
  private readonly SESSION_KEY = 'app_session';
  private readonly platformId = inject(PLATFORM_ID);
  private readonly isBrowser = isPlatformBrowser(this.platformId);

  private readonly _sessionSubject = new BehaviorSubject<UnifiedSession | null>(
    this.isBrowser ? this.getSession() : null,
  );
  public session$ = this._sessionSubject.asObservable();

  private readonly _userRoleSubject = new BehaviorSubject<string | null>(
    this.isBrowser ? this.getUserRole() : null,
  );
  public userRole$ = this._userRoleSubject.asObservable();

  private readonly _isLoggingOutSubject = new BehaviorSubject<boolean>(false);
  public isLoggingOut$ = this._isLoggingOutSubject.asObservable();

  saveSession(accessToken: string, refreshToken: string, userData: UnifiedSession['user']): void {
    if (!this.isBrowser) return;

    if (!accessToken || !refreshToken || !userData) {
      console.warn('⚠️ No se puede guardar sesión: faltan datos');
      return;
    }

    const session: UnifiedSession = {
      access_token: accessToken,
      refresh_token: refreshToken,
      user: userData,
    };

    localStorage.setItem(this.SESSION_KEY, JSON.stringify(session));

    this._sessionSubject.next(session);
    this._userRoleSubject.next(userData?.roleType?.code ?? null);
  }

  getSession(): UnifiedSession | null {
    if (!this.isBrowser) return null;

    const sessionStr = localStorage.getItem(this.SESSION_KEY);
    if (!sessionStr) return null;

    try {
      const session = JSON.parse(sessionStr) as UnifiedSession;

      if (!session.access_token || !session.refresh_token || !session.user) {
        console.warn('⚠️ Sesión inválida en localStorage, se eliminará');
        this.clearSession();
        return null;
      }

      return session;
    } catch (error) {
      console.error('❌ Error parseando sesión almacenada:', error);
      this.clearSession();
      return null;
    }
  }

  getAccessToken(): string | null {
    return this.getSession()?.access_token ?? null;
  }

  getRefreshToken(): string | null {
    return this.getSession()?.refresh_token ?? null;
  }

  getUserData(): UnifiedSession['user'] | null {
    return this.getSession()?.user ?? null;
  }

  getUserId(): string | null {
    return this.getUserData()?.id ?? null;
  }

  getUserRole(): string | null {
    return this.getUserData()?.roleType?.code ?? null;
  }

  isLoggedIn(): boolean {
    return !!this.getAccessToken();
  }

  notifyLoggingOut(): void {
    this._isLoggingOutSubject.next(true);
  }

  clearSession(isIntentionalLogout: boolean = false): void {
    if (!this.isBrowser) return;

    if (isIntentionalLogout) {
      this._isLoggingOutSubject.next(true);
    }

    localStorage.removeItem(this.SESSION_KEY);

    this._sessionSubject.next(null);
    this._userRoleSubject.next(null);

    if (isIntentionalLogout) {
      setTimeout(() => {
        this._isLoggingOutSubject.next(false);
      }, 1000);
    }
  }

  isLoggingOut(): boolean {
    return this._isLoggingOutSubject.value;
  }

  async refreshSession(): Promise<UnifiedSession | null> {
    const currentSession = this.getSession();
    if (!currentSession?.refresh_token) {
      console.warn('⚠️ No hay refresh token disponible para refrescar sesión');
      return null;
    }

    const { data, error } = await supabase.auth.refreshSession({
      refresh_token: currentSession.refresh_token,
    });

    if (error) {
      console.error('❌ Error al refrescar sesión:', error.message);
      this.clearSession();
      return null;
    }

    const newSession = data?.session;
    if (!newSession) {
      console.error('❌ No se recibió una nueva sesión de Supabase');
      return null;
    }

    this.saveSession(newSession.access_token, newSession.refresh_token, currentSession.user);
    return this.getSession();
  }

  updateUserData(userData: UnifiedSession['user']): void {
    if (!this.isBrowser) return;

    const currentSession = this.getSession();
    if (!currentSession) {
      console.warn('⚠️ No hay sesión activa para actualizar datos de usuario');
      return;
    }

    this.saveSession(currentSession.access_token, currentSession.refresh_token, userData);
  }
}
