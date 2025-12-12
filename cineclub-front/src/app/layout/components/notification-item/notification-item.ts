import { Component, input, computed, inject, output } from '@angular/core';
import { Notification, NotificationType } from '../../interfaces/notification.interface';
import { RouterLink } from '@angular/router';
import { FriendRequestService } from '../../../shared/services/friend-request.service';
import { MatButtonModule } from '@angular/material/button';
import { ColombianDatePipe } from '../../../shared/pipes/date.pipe';
import { CollectionRequestService } from '../../../shared/services/collection-request.service';

@Component({
  selector: 'app-notification-item',
  standalone: true,
  imports: [RouterLink, MatButtonModule, ColombianDatePipe],
  templateUrl: './notification-item.html',
  styleUrl: './notification-item.scss',
})
export class NotificationItem {
  notification = input<Notification>();
  private readonly _friendRequestService: FriendRequestService = inject(FriendRequestService);
  private readonly _collectionsRequestService: CollectionRequestService =
    inject(CollectionRequestService);
  actionPerformed = output<string>();
  markAsRead = output<string>();

  onHover(): void {
    const notif = this.notification();

    if (notif && !notif.read) {
      this.markAsRead.emit(notif.id);
    }
  }

  message = computed(() => {
    const notif = this.notification();
    if (!notif) return '';

    switch (notif.type) {
      case NotificationType.FRIEND_REQUEST:
        return 'te envió una solicitud de amistad';
      case NotificationType.FRIEND_ACCEPTED:
        return 'aceptó tu solicitud de amistad';
      case NotificationType.COLLECTION_REQUEST:
        return 'te envió su biblioteca privada';
      case NotificationType.COLLECTION_ACCEPTED:
        return 'aceptó tu biblioteca';
      default:
        return 'envió una notificación';
    }
  });

  actions = computed(() => {
    const notif = this.notification();
    if (!notif) return [];

    switch (notif.type) {
      case NotificationType.FRIEND_REQUEST:
        return [
          {
            label: 'Aceptar',
            action: () => {
              this._friendRequestService.acceptFriendRequest(notif.senderId).subscribe({
                next: () => {
                  this.actionPerformed.emit(notif.entityId);
                },
                error: (err) => console.error('Error al aceptar solicitud', err),
              });
            },
          },
          {
            label: 'Rechazar',
            action: () => {
              this._friendRequestService.rejectFriendRequest(notif.senderId).subscribe({
                next: () => {
                  this.actionPerformed.emit(notif.entityId);
                },
                error: (err) => console.error('Error al rechazar solicitud', err),
              });
            },
          },
        ];
      case NotificationType.FRIEND_ACCEPTED:
        return [];
      case NotificationType.COLLECTION_REQUEST:
        return [
          {
            label: 'Aceptar',
            action: () => {
              this._collectionsRequestService.acceptCollectionRequest(notif.entityId).subscribe({
                next: () => {
                  this.actionPerformed.emit(notif.entityId);
                },
                error: (err) => console.error('Error al aceptar solicitud', err),
              });
            },
          },
          {
            label: 'Rechazar',
            action: () => {
              this._collectionsRequestService.rejectCollectionRequest(notif.entityId).subscribe({
                next: () => {
                  this.actionPerformed.emit(notif.entityId);
                },
                error: (err) => console.error('Error al rechazar solicitud', err),
              });
            },
          },
        ];
      case NotificationType.COLLECTION_ACCEPTED:
        return [];
      default:
        return [];
    }
  });

  onImageError(event: Event): void {
    const img = event.target as HTMLImageElement;
    if (img.src.includes('assets/images/defaultUser.png')) {
      return;
    }
    img.src = 'assets/images/defaultUser.png';
  }
}
