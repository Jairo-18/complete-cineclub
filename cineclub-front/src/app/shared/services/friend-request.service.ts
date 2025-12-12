import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { FriendRequestResponse } from '../interfaces/friend-request.interface';
import { FriendsResponseInterface } from '../../profile/interfaces/friends.interface';
import { HttpUtilitiesService } from '../utilities/http-utilities.service';

@Injectable({
  providedIn: 'root',
})
export class FriendRequestService {
  private readonly _httpClient: HttpClient = inject(HttpClient);
  private readonly _httpUtilities: HttpUtilitiesService = inject(HttpUtilitiesService);

  sendFriendRequest(friendId: string): Observable<FriendRequestResponse> {
    const body = { friendId };
    return this._httpClient.post<FriendRequestResponse>(
      `${environment.backendUrl}social/friend-requests`,
      body,
    );
  }

  getSendFriendRequests(): Observable<FriendRequestResponse> {
    return this._httpClient.get<FriendRequestResponse>(
      `${environment.backendUrl}social/friend-requests/sent`,
    );
  }

  getReceivedFriendRequests(): Observable<FriendRequestResponse> {
    return this._httpClient.get<FriendRequestResponse>(
      `${environment.backendUrl}social/friend-requests/received`,
    );
  }

  acceptFriendRequest(senderId: string): Observable<FriendRequestResponse> {
    return this._httpClient.put<FriendRequestResponse>(
      `${environment.backendUrl}social/friend-requests/accept/${senderId}`,
      {},
    );
  }

  rejectFriendRequest(senderId: string): Observable<FriendRequestResponse> {
    return this._httpClient.put<FriendRequestResponse>(
      `${environment.backendUrl}social/friend-requests/reject/${senderId}`,
      {},
    );
  }

  cancelFriendRequest(receiverId: string): Observable<FriendRequestResponse> {
    return this._httpClient.delete<FriendRequestResponse>(
      `${environment.backendUrl}social/friend-requests/cancel/${receiverId}`,
    );
  }

  getFriends(query: object = {}): Observable<FriendsResponseInterface> {
    const params = this._httpUtilities.httpParamsFromObject(query);
    return this._httpClient.get<FriendsResponseInterface>(
      `${environment.backendUrl}social/friends`,
      { params },
    );
  }

  removeFriend(friendId: string): Observable<FriendRequestResponse> {
    return this._httpClient.delete<FriendRequestResponse>(
      `${environment.backendUrl}social/friends/${friendId}`,
    );
  }

  getFriendshipStatus(
    friendId: string,
    currentUserId: string,
  ): Observable<'FRIEND' | 'REQUEST_SENT' | 'REQUEST_RECEIVED' | 'NONE' | 'SELF'> {
    return new Observable((observer) => {
      if (friendId === currentUserId) {
        observer.next('SELF');
        observer.complete();
        return;
      }

      import('rxjs').then(({ forkJoin }) => {
        forkJoin([
          this.getFriends({ size: 100 }),
          this.getSendFriendRequests(),
          this.getReceivedFriendRequests(),
        ]).subscribe({
          next: ([friends, sent, received]) => {
            const isFriend = friends.data.some((f) => f.friend?.id === friendId);
            if (isFriend) {
              observer.next('FRIEND');
              observer.complete();
              return;
            }

            const isRequestSent = sent.data.some(
              (r) => r.receiverId === friendId && r.status === 'PENDING',
            );
            if (isRequestSent) {
              observer.next('REQUEST_SENT');
              observer.complete();
              return;
            }

            const isRequestReceived = received.data.some(
              (r) => r.senderId === friendId && r.status === 'PENDING',
            );
            if (isRequestReceived) {
              observer.next('REQUEST_RECEIVED');
              observer.complete();
              return;
            }

            observer.next('NONE');
            observer.complete();
          },
          error: (err) => {
            console.error('Error determining friendship status', err);
            observer.next('NONE');
            observer.complete();
          },
        });
      });
    });
  }
}
