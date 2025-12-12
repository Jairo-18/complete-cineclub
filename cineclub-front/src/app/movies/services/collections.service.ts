/* eslint-disable @typescript-eslint/no-explicit-any */
import { inject, Injectable } from '@angular/core';
import { PaginationInterface } from '../../shared/interfaces/pagination.interface';
import { Observable } from 'rxjs';
import { MoviesInterface, SavedMoviesResponse } from '../interface/movies.interface';
import { HttpUtilitiesService } from '../../shared/utilities/http-utilities.service';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class CollectionsService {
  private readonly _httpClient: HttpClient = inject(HttpClient);
  private readonly _httpUtilities: HttpUtilitiesService = inject(HttpUtilitiesService);

  private get headers(): HttpHeaders {
    const token = localStorage.getItem('access_token');
    let headers = new HttpHeaders({ 'Content-Type': 'application/json' });
    if (token) {
      headers = headers.set('Authorization', `Bearer ${token}`);
    }
    return headers;
  }
  getMoviesWithPaginationLibrary(query: object): Observable<{
    pagination: PaginationInterface;
    data: MoviesInterface[];
  }> {
    const params = this._httpUtilities.httpParamsFromObject(query);

    return this._httpClient.get<{
      pagination: PaginationInterface;
      data: MoviesInterface[];
    }>(`${environment.backendUrl}collections`, {
      params,
      headers: this.headers,
    });
  }

  saveMovieToCollection(movieId: string): Observable<any> {
    return this._httpClient.post(
      `${environment.backendUrl}collections`,
      { movieId },
      { headers: this.headers },
    );
  }

  removeMovieFromCollection(collectionId: string): Observable<any> {
    return this._httpClient.delete(`${environment.backendUrl}collections/${collectionId}`, {
      headers: this.headers,
    });
  }

  getSavedMovies(query: object = {}): Observable<SavedMoviesResponse> {
    const params = this._httpUtilities.httpParamsFromObject(query);
    return this._httpClient.get<SavedMoviesResponse>(`${environment.backendUrl}collections`, {
      headers: this.headers,
      params,
    });
  }

  getUserSavedMovies(userId: string): Observable<any> {
    return this._httpClient.get(`${environment.backendUrl}collections/user/${userId}`, {
      headers: this.headers,
    });
  }
}
