import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { PaginationInterface } from '../../shared/interfaces/pagination.interface';
import { HttpUtilitiesService } from '../../shared/utilities/http-utilities.service';
import { MoviesInterface, VoteResponse } from '../interface/movies.interface';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class MoviesService {
  private readonly _httpClient: HttpClient = inject(HttpClient);
  private readonly _httpUtilities: HttpUtilitiesService = inject(HttpUtilitiesService);

  getMoviesWithPagination(
    query: object,
  ): Observable<PaginationInterface & { data: MoviesInterface[] }> {
    const params = this._httpUtilities.httpParamsFromObject({
      ...query,
      sort: 'release_date,desc',
    });
    return this._httpClient.get<PaginationInterface & { data: MoviesInterface[] }>(
      `${environment.backendUrl}movies`,
      {
        params,
      },
    );
  }

  getRandomMovie(): Observable<{ data: MoviesInterface }> {
    return this._httpClient.get<{ data: MoviesInterface }>(
      `${environment.backendUrl}movies/random`,
    );
  }

  getTopMovies(limit: number = 10): Observable<{ data: MoviesInterface[] }> {
    return this._httpClient.get<{ data: MoviesInterface[] }>(
      `${environment.backendUrl}movies/top`,
      {
        params: { limit: limit.toString() },
      },
    );
  }

  voteMovie(id: string, type: 'UP' | 'DOWN'): Observable<VoteResponse> {
    return this._httpClient.post<VoteResponse>(`${environment.backendUrl}movies/${id}/vote`, {
      type,
    });
  }
}
