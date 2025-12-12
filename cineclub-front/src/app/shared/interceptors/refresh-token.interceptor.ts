import {
  HttpErrorResponse,
  HttpEvent,
  HttpHandler,
  HttpInterceptor,
  HttpRequest,
} from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Router } from '@angular/router';
import { Session } from '@supabase/supabase-js';
import { BehaviorSubject, Observable, catchError, filter, switchMap, take, throwError } from 'rxjs';
import { SupabaseService } from '../../auth/services/supabase.service';
import { NotificationsService } from '../services/notifications.service';

@Injectable()
export class RefreshTokenInterceptor implements HttpInterceptor {
  private readonly _supabaseService: SupabaseService = inject(SupabaseService);
  private readonly _router: Router = inject(Router);
  private readonly _notificationsService: NotificationsService = inject(NotificationsService);

  private isRefreshingToken: boolean = false;
  private refreshTokenSubject: BehaviorSubject<string | null> = new BehaviorSubject<string | null>(
    null,
  );

  intercept(request: HttpRequest<unknown>, next: HttpHandler): Observable<HttpEvent<unknown>> {
    const accessToken = localStorage.getItem('access_token');

    if (accessToken) {
      request = this.addToken(request, accessToken);
    }

    return next.handle(request).pipe(
      catchError((error: HttpErrorResponse) => {
        const sessionStr = localStorage.getItem('app_session');
        if (!sessionStr) {
          return throwError(() => error);
        }

        if (error.status === 401 && accessToken) {
          return this.handle401Error(request, next);
        } else {
          return throwError(() => error);
        }
      }),
    );
  }

  private addToken(request: HttpRequest<unknown>, token: string): HttpRequest<unknown> {
    return request.clone({
      setHeaders: {
        Authorization: `Bearer ${token}`,
      },
    });
  }

  private handle401Error(
    request: HttpRequest<unknown>,
    next: HttpHandler,
  ): Observable<HttpEvent<unknown>> {
    if (!this.isRefreshingToken) {
      this.isRefreshingToken = true;
      this.refreshTokenSubject.next(null);

      return new Observable<HttpEvent<unknown>>((observer) => {
        this._supabaseService
          .getCurrentSession()
          .then(async (session) => {
            if (session?.refresh_token) {
              const { data, error }: { data: { session: Session | null }; error: Error | null } =
                await this._supabaseService.getSession();

              if (error) {
                this._supabaseService.signOut();
                this._router.navigate(['/auth/login']);
                this._notificationsService.error('Tu sesión caducó');
                observer.error(error);
              } else {
                localStorage.setItem('access_token', data.session?.access_token || '');
                localStorage.setItem('refresh_token', data.session?.refresh_token || '');
                this.refreshTokenSubject.next(data.session?.access_token || '');
                next.handle(this.addToken(request, data.session?.access_token || '')).subscribe(
                  (event) => observer.next(event),
                  (err) => observer.error(err),
                  () => observer.complete(),
                );
              }
            } else {
              this._supabaseService.signOut();
              this._router.navigate(['/auth/login']);
              this._notificationsService.error('Tu sesión caducó');
              observer.error('No refresh token available');
            }
            this.isRefreshingToken = false;
          })
          .catch((err) => {
            this.isRefreshingToken = false;
            this._supabaseService.signOut();
            this._router.navigate(['/auth/login']);
            this._notificationsService.error('Tu sesión caducó');
            observer.error(err);
          });
      });
    } else {
      return this.refreshTokenSubject.pipe(
        filter((token) => token !== null),
        take(1),
        switchMap((token) => {
          return next.handle(this.addToken(request, token));
        }),
      );
    }
  }
}
