import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { Notification } from '../interfaces/notification.interface';
import { environment } from '../../../environments/environment';
import { ApiResponseInterface } from '../../shared/interfaces/api-response.interface';

@Injectable({
  providedIn: 'root',
})
export class NotificationsService {
  private readonly _httpClient: HttpClient = inject(HttpClient);

  public getNotifications(
    page: number = 1,
    limit: number = 10,
  ): Observable<ApiResponseInterface<Notification[]>> {
    return this._httpClient.get<ApiResponseInterface<Notification[]>>(
      `${environment.backendUrl}notifications`,
      {
        params: {
          page: page.toString(),
          limit: limit.toString(),
        },
      },
    );
  }

  public readNotification(notificationId: string): Observable<ApiResponseInterface<void>> {
    return this._httpClient.patch<ApiResponseInterface<void>>(
      `${environment.backendUrl}notifications/${notificationId}/read`,
      {},
    );
  }
}
