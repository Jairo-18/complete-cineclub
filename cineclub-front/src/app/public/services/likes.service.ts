import { inject, Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class LikesService {
  private readonly _httpClient: HttpClient = inject(HttpClient);

  private get headers(): HttpHeaders {
    const token = localStorage.getItem('access_token');
    let headers = new HttpHeaders({ 'Content-Type': 'application/json' });
    if (token) {
      headers = headers.set('Authorization', `Bearer ${token}`);
    }
    return headers;
  }

  likeReview(id: string): Observable<void> {
    return this._httpClient.post<void>(
      `${environment.backendUrl}reviews/like/${id}`,
      {},
      {
        headers: this.headers,
      },
    );
  }

  dislikeReview(id: string): Observable<void> {
    return this._httpClient.delete<void>(`${environment.backendUrl}reviews/like/${id}`, {
      headers: this.headers,
    });
  }
}
