/* eslint-disable @typescript-eslint/no-explicit-any */
import { Component, inject, OnDestroy, OnInit, Input, output } from '@angular/core';
import { WebSocketService } from '../../../shared/services/webSocket.service';
import { Subject, filter, takeUntil } from 'rxjs';
import { Notification } from '../../interfaces/notification.interface';
import { NotificationItem } from '../notification-item/notification-item';
import { NotificationsService } from '../../services/notifications.service';
import { UserService } from '../../../shared/services/user.service';

import { SupabaseClient } from '@supabase/supabase-js';

@Component({
  selector: 'app-notification-requests',
  standalone: true,
  imports: [NotificationItem],
  templateUrl: './notification-requests.html',
  styleUrl: './notification-requests.scss',
})
export class NotificationRequests implements OnInit, OnDestroy {
  private readonly _notificationsService: NotificationsService = inject(NotificationsService);
  private readonly _userService: UserService = inject(UserService);
  private webSocketService: WebSocketService = inject(WebSocketService);
  private readonly _supabaseClient: SupabaseClient = inject(SupabaseClient);
  private destroy$ = new Subject<void>();

  notificationCount = output<string>();

  notifications: Notification[] = [];
  currentPage = 1;
  pageSize = 10;
  isLoading = false;
  hasMore = true;

  @Input() initialData: any[] | null = null;

  ngOnInit(): void {
    if (this.initialData) {
      this.notifications = this.initialData;
    } else {
      this.getNotifications();
    }

    this.webSocketService.notifications$
      .pipe(
        takeUntil(this.destroy$),
        filter((notification): notification is Notification => notification !== null),
      )
      .subscribe((notification) => this.addNotification(notification));
  }

  private addNotification(notification: Notification): void {
    if (this.notifications.find((n) => n.id === notification.id)) {
      return;
    }
    this.notifications.unshift({
      ...notification,
      createdAt: new Date().toLocaleString(),
      read: false,
    });
    this.notificationCount.emit('add');
  }

  private getNotifications(): void {
    if (this.isLoading || !this.hasMore) return;
    this.isLoading = true;

    this._notificationsService.getNotifications(this.currentPage, this.pageSize).subscribe({
      next: async (response) => {
        const newNotifications = response.data.map((n) => ({
          ...n,
          createdAt: new Date(n.createdAt).toLocaleString('es-CO', {
            timeZone: 'America/Bogota',
            hour12: true,
          }),
        }));

        if (newNotifications.length < this.pageSize) {
          this.hasMore = false;
        }

        const senderIds = [...new Set(newNotifications.map((n) => n.senderId))];

        try {
          const users = await this._userService.getUsersByIds(senderIds);

          const enrichedNotifications = newNotifications.map((n) => {
            const user = users.find((u) => u.id === n.senderId);
            if (user && n.sender) {
              n.sender.avatarUrl = user.avatarUrl;
            }
            return n;
          });

          this.notifications = [...this.notifications, ...enrichedNotifications];
          this.currentPage++;
        } catch (error) {
          console.error('Error loading notification avatars:', error);
        } finally {
          this.isLoading = false;
        }
      },
      error: (error) => {
        console.error(error);
        this.isLoading = false;
      },
    });
  }

  onScroll(event: Event): void {
    const element = event.target as HTMLElement;
    if (element.scrollHeight - element.scrollTop <= element.clientHeight + 50) {
      this.currentPage++;
      this.getNotifications();
    }
  }

  public handleEvent(entityId: string): void {
    this.notifications = this.notifications.filter(
      (notification) => notification.entityId !== entityId,
    );
    this.notificationCount.emit('remove');
  }

  public readNotification(notificationId: string): void {
    this._notificationsService.readNotification(notificationId).subscribe({
      next: () => {
        this.notifications = this.notifications.map((n) => {
          if (n.id === notificationId) {
            n.read = true;
          }
          return n;
        });
        this.notificationCount.emit('remove');
      },
      error: (error) => {
        console.error(error);
      },
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
