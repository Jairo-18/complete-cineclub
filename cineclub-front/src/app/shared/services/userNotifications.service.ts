import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ApiResponseInterface } from '../interfaces/api-response.interface';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class UserNotificationsService {
  private readonly _httpClient: HttpClient = inject(HttpClient);

  getCount(): Observable<ApiResponseInterface<number>> {
    return this._httpClient.get<ApiResponseInterface<number>>(
      `${environment.backendUrl}notifications/count`,
    );
  }
}
