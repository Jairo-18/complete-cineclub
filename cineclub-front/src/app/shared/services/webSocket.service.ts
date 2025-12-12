import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import SockJS from 'sockjs-client';
import { Client, IMessage, StompSubscription } from '@stomp/stompjs';
import { environment } from '../../../environments/environment';
import { Notification } from '../../layout/interfaces/notification.interface';

export interface FriendRequestNotification {
  id: string;
  senderId: string;
  receiverId: string;
  sender: {
    id: string;
    fullName: string;
    email: string;
  };
  createdAt: string;
  status: string;
}

@Injectable({
  providedIn: 'root',
})
export class WebSocketService {
  private stompClient: Client | null = null;
  private subscriptions: Map<string, StompSubscription> = new Map();

  private connectionStatus = new BehaviorSubject<boolean>(false);
  public connectionStatus$ = this.connectionStatus.asObservable();

  private friendRequestsSubject = new BehaviorSubject<FriendRequestNotification[]>([]);
  public friendRequests$ = this.friendRequestsSubject.asObservable();

  private collectionRequestsSubject = new BehaviorSubject<FriendRequestNotification | null>(null);
  public collectionRequests$ = this.collectionRequestsSubject.asObservable();

  private notificationsSubject = new BehaviorSubject<Notification | null>(null);
  public notifications$ = this.notificationsSubject.asObservable();

  connect(userId: string, token: string): void {
    if (this.stompClient && this.connectionStatus.value) {
      return;
    }

    if (!token) {
      console.warn('⚠️ No hay token JWT disponible, no se puede conectar al WS');
      return;
    }

    const socket = new SockJS(`${environment.backendUrl}ws`);

    this.stompClient = new Client({
      webSocketFactory: () => socket,
      connectHeaders: {
        Authorization: `Bearer ${token}`,
        userId: userId,
      },

      onConnect: () => {
        this.connectionStatus.next(true);
        this.subscribeToChannels(userId);
      },

      onStompError: (frame) => {
        console.error('❌ Error STOMP:', frame.headers['message']);
        this.connectionStatus.next(false);
      },

      onWebSocketClose: () => {
        this.connectionStatus.next(false);
      },

      reconnectDelay: 5000,
      heartbeatIncoming: 4000,
      heartbeatOutgoing: 4000,
      // debug: (str) => console.log('Debug STOMP:', str),
    });

    this.stompClient.activate();
  }

  private subscribeToChannels(userId: string): void {
    if (!this.stompClient) return;

    const friendRequestsSub = this.stompClient.subscribe(
      `/user/${userId}/queue/friend-requests`,
      (message: IMessage) => {
        const notification: FriendRequestNotification = JSON.parse(message.body);

        const currentRequests = this.friendRequestsSubject.value;
        this.friendRequestsSubject.next([notification, ...currentRequests]);
      },
    );
    this.subscriptions.set('friend-requests', friendRequestsSub);

    const collectionRequestsSub = this.stompClient.subscribe(
      `/user/${userId}/queue/collection-requests`,
      (message: IMessage) => {
        const notification: FriendRequestNotification = JSON.parse(message.body);

        this.collectionRequestsSubject.next(notification);
      },
    );
    this.subscriptions.set('collection-requests', collectionRequestsSub);

    const notificationsSub = this.stompClient.subscribe(
      `/user/${userId}/notifications`,
      (message: IMessage) => {
        const notification: Notification = JSON.parse(message.body);

        this.notificationsSubject.next(notification);
      },
    );
    this.subscriptions.set('notifications', notificationsSub);
  }

  disconnect(): void {
    if (this.stompClient) {
      this.stompClient.deactivate();
      this.subscriptions.clear();
      this.connectionStatus.next(false);
      this.stompClient = null;
    }
  }

  clearFriendRequests(): void {
    this.friendRequestsSubject.next([]);
  }

  isConnected(): boolean {
    return this.connectionStatus.value;
  }
}
