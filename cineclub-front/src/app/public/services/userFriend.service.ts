import { inject, Injectable } from '@angular/core';
import { HttpUtilitiesService } from '../../shared/utilities/http-utilities.service';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { UserMongoComplete } from '../../auth/interfaces/user.interface';
import { ApiResponseInterface } from '../../shared/interfaces/api-response.interface';

@Injectable({
  providedIn: 'root',
})
export class UserFriend {
  private readonly _httpClient: HttpClient = inject(HttpClient);
  private readonly _httpUtilities: HttpUtilitiesService = inject(HttpUtilitiesService);

  getRecommendationsWithPagination(
    query: object,
  ): Observable<ApiResponseInterface<UserMongoComplete[]>> {
    const params = this._httpUtilities.httpParamsFromObject(query);
    return this._httpClient.get<ApiResponseInterface<UserMongoComplete[]>>(
      `${environment.backendUrl}recommendations`,
      { params },
    );
  }
}
