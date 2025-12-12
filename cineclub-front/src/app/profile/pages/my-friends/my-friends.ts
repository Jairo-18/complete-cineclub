/* eslint-disable @typescript-eslint/no-explicit-any */
import { Component, inject, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FriendsContent } from '../../components/friends-content/friends-content';
import { SentRequestsComponent } from '../../components/sent-requests/sent-requests';
import { ReceivedRequestsComponent } from '../../components/received-requests/received-requests';
import { FriendRequestService } from '../../../shared/services/friend-request.service';
import { UserService } from '../../../shared/services/user.service';
import { NotificationsService } from '../../../shared/services/notifications.service';
import { WebSocketService } from '../../../shared/services/webSocket.service';
import { forkJoin, Subject, takeUntil } from 'rxjs';
import { MatTabsModule } from '@angular/material/tabs';
import { MatIconModule } from '@angular/material/icon';
import { FriendInterface } from '../../interfaces/friends.interface';
import { PaginationInterface } from '../../../shared/interfaces/pagination.interface';
import { PageHeader } from '../../../shared/components/page-header/page-header';

@Component({
  selector: 'app-my-friends',
  standalone: true,
  imports: [
    CommonModule,
    FriendsContent,
    SentRequestsComponent,
    ReceivedRequestsComponent,
    MatTabsModule,
    MatIconModule,
    PageHeader,
  ],
  templateUrl: './my-friends.html',
  styleUrl: './my-friends.scss',
})
export class MyFriends implements OnInit, OnDestroy {
  private readonly _friendRequestService: FriendRequestService = inject(FriendRequestService);
  private readonly _notificationsService: NotificationsService = inject(NotificationsService);
  private readonly _userService: UserService = inject(UserService);
  private readonly _webSocketService: WebSocketService = inject(WebSocketService);
  private destroy$ = new Subject<void>();

  sentRequests: any[] = [];
  receivedRequests: any[] = [];
  loadingSent: boolean = false;
  loadingReceived: boolean = false;

  friendsInterface: FriendInterface[] = [];
  loadingFriends: boolean = false;
  isLoadingMoreFriends: boolean = false;
  friendsSearchQuery = '';
  paginationParams: PaginationInterface = {
    page: 1,
    size: 10,
    perPage: 10,
    total: 0,
    totalPages: 0,
    hasNext: false,
    hasPrevious: false,
  };

  ngOnInit(): void {
    // this.loadAllRequests();
    // this.loadFriends(true);
    this.loadInitialData();
    this.setupWebSocket();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  setupWebSocket() {
    this._webSocketService.friendRequests$.pipe(takeUntil(this.destroy$)).subscribe((requests) => {
      if (requests.length > 0) {
        this.loadReceivedRequests();
      }
    });
  }

  loadInitialData() {
    this.loadingSent = true;
    this.loadingReceived = true;
    this.loadingFriends = true;

    this.paginationParams.page = 1;
    this.friendsInterface = [];

    const friendsQuery = {
      page: 1,
      size: this.paginationParams.size,
      sort: 'createdAt,desc',
    };

    forkJoin({
      sent: this._friendRequestService.getSendFriendRequests(),
      received: this._friendRequestService.getReceivedFriendRequests(),
      friends: this._friendRequestService.getFriends(friendsQuery),
    }).subscribe({
      next: async (res: any) => {
        const sentData = res.sent.data || [];
        const receivedData = res.received.data || [];
        const friendsData = res.friends.data || [];

        const sentIds = sentData.map((r: any) => r.receiverId);
        const receivedIds = receivedData.map((r: any) => r.senderId);
        const friendIds = friendsData.map((f: any) => f.friend.id);

        const allIds = [...new Set([...sentIds, ...receivedIds, ...friendIds])];

        try {
          const users = await this._userService.getUsersByIds(allIds);
          const usersMap = new Map(users.map((u: any) => [u.id, u]));

          this.sentRequests = sentData.map((req: any) => {
            const user: any = usersMap.get(req.receiverId) || {};
            return {
              ...req,
              user: {
                ...user,
                username: user.username || '@usuario',
                avatarUrl: user.avatarUrl || '/assets/images/defaultUser.png',
              },
            };
          });

          this.receivedRequests = receivedData.map((req: any) => {
            const user: any = usersMap.get(req.senderId) || {};
            return {
              ...req,
              user: {
                ...user,
                username: user.username || '@usuario',
                avatarUrl: user.avatarUrl || '/assets/images/defaultUser.png',
              },
            };
          });

          this.friendsInterface = friendsData.map((f: any) => {
            const user: any = usersMap.get(f.friend.id) || {};
            return {
              ...f,
              friend: {
                ...f.friend,
                username: user.username || f.friend.username || '@usuario',
                avatarUrl: user.avatarUrl || '/assets/images/defaultUser.png',
              },
            };
          });

          this.paginationParams.hasNext = res.friends.hasNext ?? false;
          this.paginationParams.total = res.friends.total ?? 0;
        } catch (error) {
          console.error('Error in batch loading', error);
        } finally {
          this.loadingSent = false;
          this.loadingReceived = false;
          this.loadingFriends = false;
        }
      },
      error: (err) => {
        console.error('Error loading initial data', err);
        this.loadingSent = false;
        this.loadingReceived = false;
        this.loadingFriends = false;
      },
    });
  }

  loadAllRequests() {
    this.loadSentRequests();
    this.loadReceivedRequests();
  }

  loadSentRequests() {
    this.loadingSent = true;
    this._friendRequestService.getSendFriendRequests().subscribe({
      next: async (res: any) => {
        const requests = res.data || [];
        if (requests.length > 0) {
          const userIds = requests.map((req: any) => req.receiverId);
          await this.enrichRequestsWithUsers(requests, userIds, 'receiverId');
        } else {
          this.sentRequests = [];
        }
        this.loadingSent = false;
      },
      error: (err) => {
        console.error('Error loading sent requests', err);
        this.loadingSent = false;
      },
    });
  }

  loadReceivedRequests() {
    this.loadingReceived = true;
    this._friendRequestService.getReceivedFriendRequests().subscribe({
      next: async (res: any) => {
        const requests = res.data || [];
        if (requests.length > 0) {
          const userIds = requests.map((req: any) => req.senderId);
          await this.enrichRequestsWithUsers(requests, userIds, 'senderId');
        } else {
          this.receivedRequests = [];
        }
        this.loadingReceived = false;
      },
      error: (err) => {
        console.error('Error loading received requests', err);
        this.loadingReceived = false;
      },
    });
  }

  async enrichRequestsWithUsers(requests: any[], userIds: string[], userIdField: string) {
    try {
      const users = await this._userService.getUsersByIds(userIds);

      const enriched = requests.map((req) => ({
        ...req,
        user: users.find((u) => u.id === req[userIdField]),
      }));

      if (userIdField === 'receiverId') {
        this.sentRequests = enriched;
      } else {
        this.receivedRequests = enriched;
      }
    } catch (error) {
      console.error('Error fetching users batch:', error);
    }
  }

  loadFriends(reset = false, background = false) {
    if (reset && !background) {
      this.paginationParams.page = 1;
      this.friendsInterface = [];
      this.loadingFriends = true;
    } else if (reset && background) {
      this.paginationParams.page = 1;
    } else {
      this.isLoadingMoreFriends = true;
    }

    const query: any = {
      page: this.paginationParams.page,
      size: this.paginationParams.size,
      sort: 'createdAt,desc',
    };

    if (this.friendsSearchQuery && this.friendsSearchQuery.trim()) {
      query.name = this.friendsSearchQuery.trim();
    }

    this._friendRequestService.getFriends(query).subscribe({
      next: async (res) => {
        const friendsData = res.data || [];
        const friendIds = friendsData
          .map((f: FriendInterface) => f.friend?.id)
          .filter((id): id is string => !!id);

        let profilesMap = new Map();
        if (friendIds.length > 0) {
          try {
            const users = await this._userService.getUsersByIds(friendIds);
            profilesMap = new Map(users.map((u: any) => [u.id, u]));
          } catch (error) {
            console.error('Error fetching friend profiles', error);
          }
        }

        const enrichedFriends = friendsData.map((friendData: FriendInterface) => {
          const user: any = profilesMap.get(friendData.friend?.id) || {};
          return {
            ...friendData,
            friend: {
              ...friendData.friend,
              username: user?.username || friendData.friend?.username || '@usuario',
              avatarUrl: user?.avatarUrl || '/assets/images/defaultUser.png',
            },
          };
        });

        if (reset) {
          this.friendsInterface = enrichedFriends;
        } else {
          this.friendsInterface = [...this.friendsInterface, ...enrichedFriends];
        }

        this.paginationParams.hasNext = res.hasNext ?? false;
        this.paginationParams.total = res.total ?? 0;
        this.loadingFriends = false;
        this.isLoadingMoreFriends = false;
      },
      error: (err) => {
        console.error('Error al obtener amigos:', err);
        // this._notificationsService.error('Error al cargar amigos');
        this.loadingFriends = false;
        this.isLoadingMoreFriends = false;
      },
    });
  }

  onLoadMoreFriends() {
    if (this.paginationParams.hasNext && !this.isLoadingMoreFriends) {
      this.paginationParams.page = (this.paginationParams.page ?? 1) + 1;
      this.loadFriends(false);
    }
  }

  onSearchFriends(query: string) {
    this.friendsSearchQuery = query;
    this.loadFriends(true);
  }

  onRemoveFriend(friendId: string) {
    this.friendsInterface = this.friendsInterface.filter((f) => f.friend?.id !== friendId);
    // this._notificationsService.success('Amigo eliminado correctamente');

    this._friendRequestService.removeFriend(friendId).subscribe({
      next: () => {
        this.loadFriends(true, true);
      },
      error: (err) => {
        console.error(err);
        this._notificationsService.error('No se pudo eliminar');

        this.loadFriends(true);
      },
    });
  }

  onCancelRequest(receiverId: string) {
    this.sentRequests = this.sentRequests.filter((r) => r.receiverId !== receiverId);

    this._friendRequestService.cancelFriendRequest(receiverId).subscribe({
      next: (response) => {
        this._notificationsService.success(response.message || 'Solicitud cancelada');
      },
      error: (err) => {
        console.error('Error cancelling request', err);
        this._notificationsService.error(err?.error?.message || 'Error al cancelar solicitud');

        this.loadSentRequests();
      },
    });
  }

  onAcceptRequest(senderId: string) {
    this.receivedRequests = this.receivedRequests.filter((r) => r.senderId !== senderId);

    this._friendRequestService.acceptFriendRequest(senderId).subscribe({
      next: () => {
        this.loadFriends(true, true);
      },
      error: (err) => {
        console.error('Error accepting request', err);
        this._notificationsService.error('Error al aceptar solicitud');

        this.loadReceivedRequests();
      },
    });
  }

  onRejectRequest(senderId: string) {
    this.receivedRequests = this.receivedRequests.filter((r) => r.senderId !== senderId);

    this._friendRequestService.rejectFriendRequest(senderId).subscribe({
      next: () => {
        // No action needed, item already removed
      },
      error: (err) => {
        console.error('Error rejecting request', err);
        this._notificationsService.error('Error al rechazar solicitud');

        this.loadReceivedRequests();
      },
    });
  }
}
