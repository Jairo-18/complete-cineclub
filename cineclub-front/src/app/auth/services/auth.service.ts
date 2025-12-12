import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { environment } from '../../../environments/environment';
import { BehaviorSubject, map, Observable, of, ReplaySubject, tap } from 'rxjs';
import {
  LoginCredentials,
  LoginSuccessInterface,
  RawLoginResponse,
} from '../interfaces/login.interface';
import { HttpUtilitiesService } from '../../shared/utilities/http-utilities.service';
import { ApiResponseInterface } from '../../shared/interfaces/api-response.interface';
import { Router } from '@angular/router';

import { TokenService } from './token.service';
import { UserInterface } from '../interfaces/user.interface';
import { LogOutInterface } from '../interfaces/logout.interface';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private readonly _tokenService: TokenService = inject(TokenService);
  private readonly _httpClient: HttpClient = inject(HttpClient);
  private readonly _httpUtilities: HttpUtilitiesService = inject(HttpUtilitiesService);
  private _refreshingToken: boolean = false;
  _isLoggedSubject: ReplaySubject<boolean> = new ReplaySubject<boolean>(1);
  private readonly _router: Router = inject(Router);
  private _currentUserSubject: BehaviorSubject<UserInterface | null> =
    new BehaviorSubject<UserInterface | null>(null);
  public currentUser$: Observable<UserInterface | null> = this._currentUserSubject.asObservable();

  /**
   * @param saveLocalUserData - Servicio para iniciar sesión,
   */
  login(credentials: LoginCredentials): Observable<ApiResponseInterface<LoginSuccessInterface>> {
    const params = this._httpUtilities.httpParamsFromObject(credentials);

    return this._httpClient
      .post<ApiResponseInterface<RawLoginResponse>>(`${environment.backendUrl}auth/sign-in`, params)
      .pipe(
        map(
          (
            res: ApiResponseInterface<RawLoginResponse>,
          ): ApiResponseInterface<LoginSuccessInterface> => {
            const raw = res.data;

            const loginSuccessData: LoginSuccessInterface = {
              tokens: raw.tokens,
              user: {
                userId: raw.user.userId,
                roleType: raw.user.roleType,
              },
              session: {
                accessSessionId: raw.accessSessionId,
              },
            };

            return {
              ...res,
              data: loginSuccessData,
            };
          },
        ),
        tap((res) => {
          this.saveLocalUserData(res.data);
        }),
      );
  }

  /**
   * @param saveLocalUserData - Servicio para guardar al usuario en el localStorage,
   */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  saveLocalUserData(userData: LoginSuccessInterface): void {
    console.warn('⚠️ saveLocalUserData está deprecated, use TokenService.saveSession en su lugar');
  }

  /**
   * @param logout - Servicio cerrar sesión,
   */
  logout(data: LogOutInterface): Observable<unknown> {
    const params = this._httpUtilities.httpParamsFromObject(data);
    return this._httpClient.post<unknown>(`${environment.backendUrl}auth/sign-out`, params).pipe(
      tap(() => {
        this._tokenService.clearSession();
        this._isLoggedSubject.next(false);
        this._router.navigateByUrl('/auth/login');
      }),
    );
  }

  isAuthenticated(): boolean {
    return this._tokenService.isLoggedIn();
  }

  isAuthenticatedToGuard() {
    const token = this.isAuthenticated();
    return of(!!token);
  }

  getAuthToken(): string | undefined {
    return this._tokenService.getAccessToken() || undefined;
  }

  getRefreshToken(): string | undefined {
    return this._tokenService.getRefreshToken() || undefined;
  }

  set setRefreshingToken(status: boolean) {
    this._refreshingToken = status;
  }

  get getRefreshingToken(): boolean {
    return this._refreshingToken;
  }

  get isLogged(): boolean {
    return !!this.getAuthToken();
  }

  refreshToken(refreshToken: string): Observable<ApiResponseInterface<LoginSuccessInterface>> {
    this.setRefreshingToken = true;

    return this._httpClient
      .post<
        ApiResponseInterface<LoginSuccessInterface>
      >(`${environment.backendUrl}auth/refresh-token`, { refreshToken: refreshToken })
      .pipe(
        tap((response: ApiResponseInterface<LoginSuccessInterface>): void => {
          this._updateAccessToken(response?.data?.tokens?.accessToken);
          this._isLoggedEmit();
        }),
      );
  }

  private _isLoggedEmit(): void {
    this._isLoggedSubject.next(this.isLogged);
  }

  private _updateAccessToken(accessToken: string): void {
    const session = this._tokenService.getSession();

    if (session) {
      this._tokenService.saveSession(accessToken, session.refresh_token, session.user);
    }
  }

  cleanStorageAndRedirectToLogin(): void {
    this._tokenService.clearSession();
    this._isLoggedEmit();

    this._router.navigate([`auth/login`]);
  }

  getUserLoggedIn(): UserInterface {
    const userData = this._tokenService.getUserData();

    return {
      id: userData?.id || '',
      fullName: '',
      country: '',
      phone: '',
      email: '',
      password: '',
      confirmPassword: '',
    };
  }

  setRedirectUrl(url: string): void {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem('redirectUrl', url);
    }
  }

  getRedirectUrl(): string | null {
    if (typeof localStorage !== 'undefined') {
      return localStorage.getItem('redirectUrl');
    }
    return null;
  }

  cleanRedirectUrl(): void {
    if (typeof localStorage !== 'undefined') {
      localStorage.removeItem('redirectUrl');
    }
  }

  getCurrentUserId(): string | null {
    try {
      return this._tokenService.getUserId();
    } catch (error) {
      console.error('Error getting current user ID:', error);
      return null;
    }
  }

  getCurrentUser(): UserInterface | null {
    try {
      return this.getUserLoggedIn();
    } catch (error) {
      console.error('Error getting current user:', error);
      return null;
    }
  }
}
