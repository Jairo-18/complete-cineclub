/* eslint-disable @typescript-eslint/no-explicit-any */
import { NavigationEnd, Router, RouterOutlet } from '@angular/router';
import { Component, inject, OnDestroy, OnInit, ViewChild, ChangeDetectorRef } from '@angular/core';
import { NavBar } from '../../components/nav-bar/nav-bar';
import { SupabaseService } from '../../../auth/services/supabase.service';
import { filter, Subject, Subscription, takeUntil } from 'rxjs';
import { SideBar } from '../../components/side-bar/side-bar';
import { Notification } from '../../components/notification/notification';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { CommonModule } from '@angular/common';
import { TokenService } from '../../../auth/services/token.service';
import { LoaderComponent } from '../../../shared/components/loader/loader.component';
import { MatBadgeModule } from '@angular/material/badge';
import { UserNotificationsService } from '../../../shared/services/userNotifications.service';
import { WebSocketService } from '../../../shared/services/webSocket.service';
import { Notification as NotificationInterface } from '../../interfaces/notification.interface';

@Component({
  selector: 'app-default-layout',
  standalone: true,
  imports: [
    RouterOutlet,
    NavBar,
    SideBar,
    Notification,
    MatIconModule,
    MatButtonModule,
    CommonModule,
    LoaderComponent,
    MatBadgeModule,
  ],
  templateUrl: './default-layout.html',
  styleUrl: './default-layout.scss',
})
export class DefaultLayout implements OnInit, OnDestroy {
  @ViewChild('sidebar') sidebar!: SideBar;

  private readonly _supabaseService: SupabaseService = inject(SupabaseService);
  private readonly _tokenService: TokenService = inject(TokenService);
  private readonly _router: Router = inject(Router);
  private readonly _cdr: ChangeDetectorRef = inject(ChangeDetectorRef);
  private readonly _userNotificationsService: UserNotificationsService =
    inject(UserNotificationsService);
  private readonly _webSocketService: WebSocketService = inject(WebSocketService);
  private sub?: Subscription;
  private initSub?: Subscription;
  private roleSub?: Subscription;
  private destroy$ = new Subject<void>();

  showSidebar: boolean = true;
  isReady: boolean = false;
  isLoggedIn: boolean = false;
  isInitializing: boolean = true;
  isTransitioning: boolean = false;
  showNotifications: boolean = false;
  isClosingNotifications: boolean = false;
  hasValidRole: boolean = false;
  isSidebarCollapsed: boolean = true;
  notificationCount: number = 0;

  private isRoleLoaded: boolean = false;
  private isAuthChecked: boolean = false;

  constructor() {
    this.roleSub = this._tokenService.userRole$.subscribe((role) => {
      if (this._tokenService.isLoggingOut()) return;

      const newHasValidRole = !!role && role !== '';

      if (this.isLoggedIn && this.hasValidRole && !newHasValidRole) {
        this.isTransitioning = true;
      }

      this.hasValidRole = newHasValidRole;
      this.isRoleLoaded = true;
      this._checkReadiness();
    });

    this._router.events
      .pipe(filter((event) => event instanceof NavigationEnd))
      .subscribe((event: any) => {
        const hideSidebarRoutes = ['/profile/register-profile', '/auth'];

        this.showSidebar = !hideSidebarRoutes.some((route) =>
          event.urlAfterRedirects.includes(route),
        );

        this._checkReadiness();
      });

    this._tokenService.isLoggingOut$.subscribe((isLoggingOut) => {
      this.isTransitioning = isLoggingOut;
      this._cdr.markForCheck();
    });
  }

  async ngOnInit() {
    this.initSub = this._supabaseService.isInitialized$.subscribe(async (initialized) => {
      if (initialized) {
        try {
          const session = await this._supabaseService.getSession();
          this.isLoggedIn = !!session.data.session;
          this.isAuthChecked = true;

          if (this.isLoggedIn) {
            this._subscribeToNotificationWs();
            this._getNotificationCount();
          }

          this.sub = this._supabaseService.user$.subscribe((user) => {
            const wasLoggedIn = this.isLoggedIn;
            const isNowLoggedIn = !!user;

            if (wasLoggedIn !== isNowLoggedIn && this.isReady) {
              this.isTransitioning = true;
              setTimeout(() => {
                this.isLoggedIn = isNowLoggedIn;
                if (!isNowLoggedIn) {
                  if (!this._tokenService.isLoggingOut()) {
                    this.isTransitioning = false;
                  }
                } else {
                  this._checkReadiness();
                }
              }, 800);
            } else {
              this.isLoggedIn = isNowLoggedIn;
              this._checkReadiness();
            }
          });

          this._checkReadiness();
        } catch (error) {
          console.error('Error al obtener sesión:', error);
          this.isAuthChecked = true;
          this.isReady = true;
          this.isInitializing = false;
        }
      }
    });

    setTimeout(() => {
      if (this.isInitializing) {
        console.warn('Auth initialization timed out, forcing ready state.');
        this.isReady = true;
        this.isInitializing = false;
      }
    }, 3000);
  }

  private _getNotificationCount() {
    this._userNotificationsService.getCount().subscribe((res) => {
      this.notificationCount = res.data;
    });
  }

  private _subscribeToNotificationWs() {
    this._webSocketService.notifications$
      .pipe(
        takeUntil(this.destroy$),
        filter((notification): notification is NotificationInterface => notification !== null),
      )
      .subscribe(() => this.handleNotificationCount('add'));
  }

  public handleNotificationCount(event: string): void {
    if (event === 'add') {
      this.notificationCount++;
    } else if (event === 'remove') {
      this.notificationCount = this.notificationCount > 0 ? this.notificationCount - 1 : 0;
    }
  }

  private _checkReadiness() {
    if (!this.isAuthChecked) return;

    if (this.isLoggedIn && !this.isRoleLoaded) return;

    if (this.isLoggedIn && this._router.url.includes('/auth/')) {
      return;
    }

    if (this.isTransitioning && this.isLoggedIn) {
      if (this._tokenService.isLoggingOut()) return;

      setTimeout(() => {
        this.isTransitioning = false;
      }, 100);
    }

    if (this.isInitializing) {
      setTimeout(() => {
        this.isReady = true;
        this.isInitializing = false;
      }, 200);
    }
  }

  ngOnDestroy() {
    this.sub?.unsubscribe();
    this.initSub?.unsubscribe();
    this.roleSub?.unsubscribe();
  }

  toggleNotifications(): void {
    if (this.showNotifications) {
      this.closeNotifications();
    } else {
      this.showNotifications = true;
      this.isClosingNotifications = false;
    }
  }

  closeNotifications(): void {
    this.isClosingNotifications = true;
    setTimeout(() => {
      this.showNotifications = false;
      this.isClosingNotifications = false;
    }, 300);
  }

  onSidebarStateChanged(isCollapsed: boolean): void {
    this.isSidebarCollapsed = isCollapsed;
  }

  closeSidebarFromOverlay(): void {
    if (this.sidebar) {
      this.sidebar.closeSidebar();
    }
  }
}
