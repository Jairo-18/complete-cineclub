/* eslint-disable @typescript-eslint/no-explicit-any */
import {
  Component,
  inject,
  OnInit,
  ViewChild,
  ElementRef,
  AfterViewInit,
  OnDestroy,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import { FriendRequestService } from '../../services/friend-request.service';
import { FriendInterface } from '../../../profile/interfaces/friends.interface';
import { NotificationsService } from '../../services/notifications.service';
import { SupabaseClient } from '@supabase/supabase-js';
import { BaseDialogComponent } from '../base-dialog/base-dialog.component';
import { CollectionRequestService } from '../../services/collection-request.service';

@Component({
  selector: 'app-shared-collection-dialog',
  standalone: true,
  imports: [
    CommonModule,
    MatDialogModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatTooltipModule,
    BaseDialogComponent,
  ],
  templateUrl: './shared-collection-dialog.component.html',
  styleUrls: ['./shared-collection-dialog.component.scss'],
})
export class SharedCollectionDialogComponent implements OnInit, AfterViewInit, OnDestroy {
  @ViewChild('scrollContainer') scrollContainer!: ElementRef;

  private readonly _friendRequestService: FriendRequestService = inject(FriendRequestService);
  private readonly _collectionRequestService: CollectionRequestService =
    inject(CollectionRequestService);
  private readonly _notificationsService: NotificationsService = inject(NotificationsService);
  private readonly _dialogRef: MatDialogRef<SharedCollectionDialogComponent> = inject(MatDialogRef);
  private readonly _supabaseClient: SupabaseClient = inject(SupabaseClient);

  friends: FriendInterface[] = [];
  loading: boolean = false;
  isLoadingMore: boolean = false;
  sharing: boolean = false;
  currentPage: number = 1;
  totalPages: number = 0;
  hasNext: boolean = false;
  private scrollListener: (() => void) | null = null;

  ngOnInit() {
    this.loadFriends();
  }

  ngAfterViewInit() {
    this.setupScrollListener();
  }

  ngOnDestroy() {
    if (this.scrollListener && this.scrollContainer) {
      this.scrollContainer.nativeElement.removeEventListener('scroll', this.scrollListener);
    }
  }

  setupScrollListener() {
    if (this.scrollContainer) {
      this.scrollListener = () => {
        this.checkScroll(this.scrollContainer.nativeElement);
      };
      this.scrollContainer.nativeElement.addEventListener('scroll', this.scrollListener);
    }
  }

  checkScroll(element: HTMLElement) {
    const scrollPosition = element.scrollTop + element.clientHeight;
    const scrollHeight = element.scrollHeight;
    const scrollPercentage = (scrollPosition / scrollHeight) * 100;

    const isNearBottom = scrollPercentage >= 90;
    const isContentTooShort = scrollHeight <= element.clientHeight;

    if (
      (isNearBottom || isContentTooShort) &&
      this.hasNext &&
      !this.isLoadingMore &&
      !this.loading
    ) {
      this.loadMore();
    }
  }

  loadFriends() {
    if (this.loading) return;
    this.loading = true;

    this._friendRequestService.getFriends({ page: this.currentPage, size: 5 }).subscribe({
      next: async (res) => {
        const friends = res.data || [];
        const friendIds = friends.map((f: FriendInterface) => f.friend?.id).filter(Boolean);

        const profilesMap: Record<string, any> = {};
        if (friendIds.length > 0) {
          const { data: profiles } = await this._supabaseClient
            .from('profile')
            .select('id, avatarUrl')
            .in('id', friendIds);

          if (profiles) {
            profiles.forEach((p) => {
              profilesMap[p.id] = p;
            });
          }
        }

        const enrichedFriends = friends.map((friendData: FriendInterface) => {
          const profile = friendData.friend?.id ? profilesMap[friendData.friend.id] : null;
          return {
            ...friendData,
            friend: {
              ...friendData.friend,
              avatarUrl: profile?.avatarUrl || '/assets/images/defaultUser.png',
            },
          };
        });

        if (this.currentPage === 1) {
          this.friends = enrichedFriends;
        } else {
          this.friends = [...this.friends, ...enrichedFriends];
        }

        this.totalPages = res.totalPages ?? 0;
        this.hasNext = res.hasNext ?? false;
        this.loading = false;
        this.isLoadingMore = false;

        setTimeout(() => {
          if (this.scrollContainer) {
            this.checkScroll(this.scrollContainer.nativeElement);
          }
        });
      },
      error: (err) => {
        console.error('Error loading friends:', err);
        this.loading = false;
        this.isLoadingMore = false;
      },
    });
  }

  loadMore() {
    if (this.hasNext && !this.isLoadingMore) {
      this.isLoadingMore = true;
      this.currentPage++;
      this.loadFriends();
    }
  }

  shareWithFriend(friendId: string) {
    this.sharing = true;
    this._collectionRequestService.shareCollection(friendId).subscribe({
      next: () => {
        this.sharing = false;
        this._dialogRef.close();
      },
      error: () => {
        this._notificationsService.error('Ya has enviado una solicitud a este usuario.');
        this.sharing = false;
      },
    });
  }

  close() {
    this._dialogRef.close();
  }

  onImageError(event: Event): void {
    const img = event.target as HTMLImageElement;
    if (img.src.includes('assets/images/defaultUser.png')) {
      return;
    }
    img.src = '/assets/images/defaultUser.png';
  }
}
