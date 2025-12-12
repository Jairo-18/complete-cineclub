import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, Subject } from 'rxjs';
import { CollectionRequestResponse } from '../interfaces/collection-request.interface';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class CollectionRequestService {
  private readonly _httpClient: HttpClient = inject(HttpClient);

  shareCollection(friendId: string): Observable<CollectionRequestResponse> {
    return this._httpClient.post<CollectionRequestResponse>(
      `${environment.backendUrl}collections/requests/share/${friendId}`,
      {},
    );
  }

  getCollectionRequests(): Observable<CollectionRequestResponse> {
    return this._httpClient.get<CollectionRequestResponse>(
      `${environment.backendUrl}collections/requests`,
    );
  }

  acceptCollectionRequest(requestId: string): Observable<CollectionRequestResponse> {
    return this._httpClient.post<CollectionRequestResponse>(
      `${environment.backendUrl}collections/requests/${requestId}/accept`,
      {},
    );
  }

  rejectCollectionRequest(requestId: string): Observable<CollectionRequestResponse> {
    return this._httpClient.delete<CollectionRequestResponse>(
      `${environment.backendUrl}collections/requests/${requestId}`,
      {},
    );
  }

  getSentCollectionRequests(): Observable<CollectionRequestResponse> {
    return this._httpClient.get<CollectionRequestResponse>(
      `${environment.backendUrl}collections/requests/sended`,
    );
  }

  private readonly _refreshMovies$ = new Subject<void>();

  get refreshMovies$(): Observable<void> {
    return this._refreshMovies$.asObservable();
  }

  notifyRefresh(): void {
    this._refreshMovies$.next();
  }
}
