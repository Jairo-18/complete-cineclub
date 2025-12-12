/* eslint-disable @typescript-eslint/no-explicit-any */
import { Component, inject, OnInit, output } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { MatTabsModule } from '@angular/material/tabs';
import { NotificationRequests } from '../notification-requests/notification-requests';
import { CollectionRequestService } from '../../../shared/services/collection-request.service';
import { NotificationsService } from '../../services/notifications.service';
import { UserService } from '../../../shared/services/user.service';
import { forkJoin } from 'rxjs';
import { CommonModule } from '@angular/common';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

@Component({
  selector: 'app-notification',
  standalone: true,
  imports: [
    MatTabsModule,
    MatIconModule,
    NotificationRequests,
    CommonModule,
    MatProgressSpinnerModule,
  ],
  templateUrl: './notification.html',
  styleUrl: './notification.scss',
})
export class Notification implements OnInit {
  private readonly _collectionRequestService: CollectionRequestService =
    inject(CollectionRequestService);
  private readonly _notificationsService: NotificationsService = inject(NotificationsService);
  private readonly _userService: UserService = inject(UserService);

  isLoading: boolean = true;
  collectionRequestsData: any[] = [];
  notificationsData: any[] = [];

  notificationCount = output<string>();

  ngOnInit(): void {
    this.loadAllData();
  }

  public handleNotificationCount(event: string): void {
    if (event === 'add') {
      this.notificationCount.emit('add');
    } else if (event === 'remove') {
      this.notificationCount.emit('remove');
    }
  }

  loadAllData() {
    this.isLoading = true;
    forkJoin({
      collectionRequests: this._collectionRequestService.getCollectionRequests(),
      notifications: this._notificationsService.getNotifications(),
    }).subscribe({
      next: async (results: any) => {
        const collections = results.collectionRequests.data || [];
        const notifs = results.notifications.data || [];

        const userIds = new Set<string>();
        collections.forEach((r: any) => userIds.add(r.senderId));
        notifs.forEach((n: any) => n.senderId && userIds.add(n.senderId));

        const usersMap = new Map<string, any>();
        if (userIds.size > 0) {
          try {
            const users = await this._userService.getUsersByIds(Array.from(userIds));
            users.forEach((u) => usersMap.set(u.id, u));
          } catch (error) {
            console.error('Error fetching users batch:', error);
          }
        }

        this.collectionRequestsData = collections.map((r: any) => ({
          ...r,
          senderAvatar: usersMap.get(r.senderId)?.avatarUrl || 'assets/images/defaultUser.png',
        }));
        this.notificationsData = notifs.map((n: any) => {
          const user = usersMap.get(n.senderId);
          if (user && n.sender) {
            n.sender.avatarUrl = user.avatarUrl;
          }
          return n;
        });

        this.isLoading = false;
      },
      error: (err) => {
        console.error('Error loading notification data', err);
        this.isLoading = false;
      },
    });
  }
}
