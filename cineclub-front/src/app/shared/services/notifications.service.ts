import { inject, Injectable } from '@angular/core';
import { ToastrService } from 'ngx-toastr';
import {
  NotificationInterface,
  NotificationsTypes
} from '../interfaces/notifications.interface';

@Injectable({
  providedIn: 'root'
})
export class NotificationsService {
  private _toastrService: ToastrService = inject(ToastrService);

  success(message: string, title?: string, duration = 3000): void {
    this.showNotification('success', message, title, duration);
  }

  error(message: string, title?: string, duration = 3000): void {
    this.showNotification('error', message, title, duration);
  }

  info(message: string, title?: string, duration = 3000): void {
    this.showNotification('info', message, title, duration);
  }

  warning(message: string, title?: string, duration = 3000): void {
    this.showNotification('warning', message, title, duration);
  }

  showNotification(
    type: NotificationsTypes,
    information: string,
    title?: string,
    duration = 3000
  ): void {
    const notification: NotificationInterface = {
      title,
      type,
      information
    };
    this._showToast(notification, duration);
  }

  private _showToast(notification: NotificationInterface, duration: number): void {
    const iconMap = {
      success: '<i class="fas fa-check-circle"></i>',
      error: '<i class="fas fa-exclamation-circle"></i>',
      info: '<i class="fas fa-info-circle"></i>',
      warning: '<i class="fas fa-exclamation-triangle"></i>'
    };

    const template = `
      <div class="flex items-center">
        <div class="toast-icon">${iconMap[notification.type]}</div>
        <div class="toast-body">
          <div class="toast-title">${notification.title || ''}</div>
          <div class="toast-message">${notification.information}</div>
        </div>
      </div>
    `;

    this._toastrService.show(template, '', {
      timeOut: duration,
      tapToDismiss: true,
      enableHtml: true,
      progressBar: true,
      progressAnimation: 'increasing',
      toastClass: `toast-container ngx-toastr brand-toast-${notification.type}`,
      positionClass: 'toast-top-right',
      extendedTimeOut: duration
    });
  }
}
