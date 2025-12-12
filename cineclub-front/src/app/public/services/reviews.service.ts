import { inject, Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, Subject } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { CreateReview, ReviewInterface } from '../interface/reviews.interface';
import { PaginationInterface } from '../../shared/interfaces/pagination.interface';
import { HttpUtilitiesService } from '../../shared/utilities/http-utilities.service';

@Injectable({
  providedIn: 'root',
})
export class ReviewsService {
  private readonly _httpClient: HttpClient = inject(HttpClient);
  private readonly _httpUtilities: HttpUtilitiesService = inject(HttpUtilitiesService);

  private reviewsChangedSubject = new Subject<void>();
  public reviewsChanged$ = this.reviewsChangedSubject.asObservable();

  notifyReviewsChanged(): void {
    this.reviewsChangedSubject.next();
  }

  private get headers(): HttpHeaders {
    const token = localStorage.getItem('access_token');
    let headers = new HttpHeaders({ 'Content-Type': 'application/json' });
    if (token) {
      headers = headers.set('Authorization', `Bearer ${token}`);
    }
    return headers;
  }

  createReview(review: CreateReview): Observable<ReviewInterface> {
    return this._httpClient.post<ReviewInterface>(`${environment.backendUrl}reviews`, review, {
      headers: this.headers,
    });
  }

  getReviews(): Observable<ReviewInterface[]> {
    return this._httpClient.get<ReviewInterface[]>(`${environment.backendUrl}reviews`, {
      headers: this.headers,
    });
  }

  getReviewsWithPagination(query: object): Observable<{
    pagination: PaginationInterface;
    data: ReviewInterface[];
  }> {
    const params = this._httpUtilities.httpParamsFromObject(query);
    return (
      this._httpClient
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .get<any>(`${environment.backendUrl}reviews`, {
          params,
          headers: this.headers,
        })
        .pipe(
          map((response) => ({
            data: response.data,
            pagination: {
              page: response.page,
              size: response.size,
              total: response.total,
              totalPages: response.totalPages,
              hasNext: response.hasNext,
              hasPrevious: response.hasPrevious,
            },
          })),
        )
    );
  }

  getReviewsByMovie(movieId: string): Observable<ReviewInterface[]> {
    return this._httpClient.get<ReviewInterface[]>(
      `${environment.backendUrl}reviews/movie/${movieId}`,
      { headers: this.headers },
    );
  }

  getReviewById(id: string): Observable<ReviewInterface> {
    return this._httpClient.get<ReviewInterface>(`${environment.backendUrl}reviews/${id}`, {
      headers: this.headers,
    });
  }

  updateReview(
    id: string,
    review: { content: string; rating: number },
  ): Observable<ReviewInterface> {
    return this._httpClient.patch<ReviewInterface>(
      `${environment.backendUrl}reviews/${id}`,
      review,
      { headers: this.headers },
    );
  }

  deleteReview(id: string): Observable<void> {
    return this._httpClient.delete<void>(`${environment.backendUrl}reviews/${id}`, {
      headers: this.headers,
    });
  }

  getUserReviewsWithPagination(query: object): Observable<{
    pagination: PaginationInterface;
    data: ReviewInterface[];
  }> {
    const params = this._httpUtilities.httpParamsFromObject(query);
    return (
      this._httpClient
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .get<any>(`${environment.backendUrl}reviews/user`, {
          params,
          headers: this.headers,
        })
        .pipe(
          map((response) => ({
            data: response.data,
            pagination: {
              page: response.page,
              size: response.size,
              total: response.total,
              totalPages: response.totalPages,
              hasNext: response.hasNext,
              hasPrevious: response.hasPrevious,
            },
          })),
        )
    );
  }

  getUserReviewsByIdWithPagination(
    userId: string,
    query: object,
  ): Observable<{
    pagination: PaginationInterface;
    data: ReviewInterface[];
  }> {
    const params = this._httpUtilities.httpParamsFromObject({ ...query, userId });
    return (
      this._httpClient
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .get<any>(`${environment.backendUrl}reviews`, {
          params,
          headers: this.headers,
        })
        .pipe(
          map((response) => ({
            data: response.data,
            pagination: {
              page: response.page,
              size: response.size,
              total: response.total,
              totalPages: response.totalPages,
              hasNext: response.hasNext,
              hasPrevious: response.hasPrevious,
            },
          })),
        )
    );
  }
}
