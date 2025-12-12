import { inject, Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { environment } from '../../../environments/environment';
import { HttpUtilitiesService } from '../../shared/utilities/http-utilities.service';
import { ApiResponseInterface } from '../../shared/interfaces/api-response.interface';
import {
  CommentInterface,
  CreateComment,
  CreateReply,
  PaginatedComments,
  UpdateComment,
} from '../interface/comments.interface';

@Injectable({
  providedIn: 'root',
})
export class CommentsService {
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

  getCommentsByReview(reviewId: string, query: object): Observable<PaginatedComments> {
    const params = this._httpUtilities.httpParamsFromObject(query);
    return this._httpClient.get<PaginatedComments>(
      `${environment.backendUrl}comments/${reviewId}`,
      {
        params,
        headers: this.headers,
      },
    );
  }

  createComment(comment: CreateComment): Observable<string> {
    return this._httpClient
      .post<ApiResponseInterface<string>>(`${environment.backendUrl}comments`, comment, {
        headers: this.headers,
      })
      .pipe(map((response) => response.data));
  }

  replyToComment(parentId: string, reply: CreateReply): Observable<string> {
    return this._httpClient
      .post<ApiResponseInterface<string>>(
        `${environment.backendUrl}comments/reply/${parentId}`,
        reply,
        {
          headers: this.headers,
        },
      )
      .pipe(map((response) => response.data));
  }

  likeComment(id: string): Observable<void> {
    return this._httpClient.post<void>(
      `${environment.backendUrl}comments/like/${id}`,
      {},
      {
        headers: this.headers,
      },
    );
  }

  dislikeComment(id: string): Observable<void> {
    return this._httpClient.delete<void>(`${environment.backendUrl}comments/like/${id}`, {
      headers: this.headers,
    });
  }

  updateComment(id: string, comment: UpdateComment): Observable<CommentInterface> {
    return this._httpClient
      .patch<ApiResponseInterface<CommentInterface>>(
        `${environment.backendUrl}comments/${id}`,
        comment,
        {
          headers: this.headers,
        },
      )
      .pipe(map((response) => response.data));
  }

  deleteComment(id: string): Observable<void> {
    return this._httpClient.delete<void>(`${environment.backendUrl}comments/${id}`, {
      headers: this.headers,
    });
  }

  deleteReply(id: string): Observable<void> {
    return this._httpClient.delete<void>(`${environment.backendUrl}comments/reply/${id}`, {
      headers: this.headers,
    });
  }
}
