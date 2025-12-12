/* eslint-disable @typescript-eslint/no-explicit-any */
import { Component, inject, OnInit, ChangeDetectorRef } from '@angular/core';
import { ReviewsContent } from '../reviews-content/reviews-content';
import { FriendCard } from '../friend-card/friend-card';
import { MatIconModule } from '@angular/material/icon';
import { MatDialog } from '@angular/material/dialog';
import { CreateReviewDialogComponent } from '../../../shared/components/create-review-dialog/create-review-dialog.component';
import { ReviewsService } from '../../services/reviews.service';
import { UserFriend } from '../../services/userFriend.service';
import { SupabaseClient } from '@supabase/supabase-js';
import { UserMongoComplete } from '../../../auth/interfaces/user.interface';
import { PaginationInterface } from '../../../shared/interfaces/pagination.interface';
import { PageHeader } from '../../../shared/components/page-header/page-header';

@Component({
  selector: 'app-home-logged',
  standalone: true,
  imports: [ReviewsContent, FriendCard, MatIconModule, PageHeader],
  templateUrl: './home-logged.html',

  styleUrl: './home-logged.scss',
})
export class HomeLogged implements OnInit {
  private readonly dialog: MatDialog = inject(MatDialog);
  private readonly reviewsService: ReviewsService = inject(ReviewsService);
  private readonly _userFriend: UserFriend = inject(UserFriend);
  private readonly _supabaseClient: SupabaseClient = inject(SupabaseClient);
  private readonly cdr: ChangeDetectorRef = inject(ChangeDetectorRef);

  desktopUsers: UserMongoComplete[] = [];
  loadingDesktop: boolean = false;
  desktopParams: PaginationInterface = {
    page: 1,
    size: 5,
    total: 0,
    pageCount: 0,
    hasPreviousPage: false,
    hasNextPage: false,
  };

  mobileUsers: UserMongoComplete[] = [];
  loadingMobile: boolean = false;
  mobileParams: PaginationInterface = {
    page: 1,
    size: 5,
    total: 0,
    pageCount: 0,
    hasPreviousPage: false,
    hasNextPage: false,
  };

  ngOnInit(): void {
    if (window.innerWidth >= 1024) {
      this.loadDesktopUsers();
    } else {
      this.loadMobileUsers();
    }
  }

  async loadDesktopUsers(filter: string = ''): Promise<void> {
    this.loadingDesktop = true;
    const query = {
      page: this.desktopParams.page,
      size: this.desktopParams.size,
      search: filter,
    };
    this.fetchUsers(query, 'desktop');
  }

  async loadMobileUsers(filter: string = '', isAppend: boolean = false): Promise<void> {
    if (!isAppend) this.loadingMobile = true;
    const query = {
      page: this.mobileParams.page,
      size: this.mobileParams.size,
      search: filter,
    };
    this.fetchUsers(query, 'mobile', isAppend);
  }

  private fetchUsers(query: any, type: 'desktop' | 'mobile', isAppend: boolean = false) {
    this._userFriend.getRecommendationsWithPagination(query).subscribe({
      next: async (res: any) => {
        let users = [];
        if (res.data && Array.isArray(res.data)) {
          users = res.data;
        } else if (Array.isArray(res)) {
          users = res;
        }

        const enrichedUsers = await this.enrichUsers(users);

        const filteredUsers = enrichedUsers.filter(
          (user) => !(user.hasPendingRequest && user.isSender === false),
        );

        const targetSize = type === 'desktop' ? this.desktopParams.size : this.mobileParams.size;
        const hasNextPage = res.hasNext || res.pagination?.hasNext || false;

        if (type === 'desktop') {
          this.desktopUsers = filteredUsers;
          this.updateParams(res, 'desktop');

          if (filteredUsers.length < targetSize && hasNextPage) {
            this.desktopParams.page++;
            this.fetchMoreDesktopUsers(targetSize - filteredUsers.length);
          } else {
            this.loadingDesktop = false;
          }
        } else {
          if (isAppend) {
            const currentIds = new Set(this.mobileUsers.map((u) => u.id));
            const newUsers = filteredUsers.filter((u) => !currentIds.has(u.id));
            this.mobileUsers = [...this.mobileUsers, ...newUsers];
          } else {
            this.mobileUsers = filteredUsers;
          }
          this.updateParams(res, 'mobile');
          this.loadingMobile = false;
        }

        this.cdr.detectChanges();
      },
      error: (err: any) => {
        console.error(`❌ Error en solicitud ${type}:`, err);
        if (type === 'desktop') this.loadingDesktop = false;
        else this.loadingMobile = false;
      },
    });
  }

  private fetchMoreDesktopUsers(needed: number): void {
    const query = {
      page: this.desktopParams.page,
      size: this.desktopParams.size,
      search: '',
    };

    this._userFriend.getRecommendationsWithPagination(query).subscribe({
      next: async (res: any) => {
        let users = [];
        if (res.data && Array.isArray(res.data)) {
          users = res.data;
        } else if (Array.isArray(res)) {
          users = res;
        }

        const enrichedUsers = await this.enrichUsers(users);
        const filteredUsers = enrichedUsers.filter(
          (user) => !(user.hasPendingRequest && user.isSender === false),
        );

        const currentIds = new Set(this.desktopUsers.map((u) => u.id));
        const newUsers = filteredUsers.filter((u) => !currentIds.has(u.id));
        this.desktopUsers = [...this.desktopUsers, ...newUsers.slice(0, needed)];

        const stillNeeded = needed - newUsers.length;
        const hasNextPage = res.hasNext || res.pagination?.hasNext || false;

        if (stillNeeded > 0 && hasNextPage && newUsers.length > 0) {
          this.desktopParams.page++;
          this.fetchMoreDesktopUsers(stillNeeded);
        } else {
          this.desktopParams = {
            ...this.desktopParams,
            page: 1,
            pageCount: 1,
            hasPreviousPage: false,
            hasNextPage: hasNextPage && stillNeeded <= 0,
          };
          this.loadingDesktop = false;
          this.cdr.detectChanges();
        }
      },
      error: () => {
        this.loadingDesktop = false;
      },
    });
  }

  private async enrichUsers(users: UserMongoComplete[]): Promise<UserMongoComplete[]> {
    const userIds = users.map((u) => u.id);
    const profilesMap: Record<string, any> = {};

    if (userIds.length > 0) {
      const { data: profiles } = await this._supabaseClient
        .from('profile')
        .select('id, username, avatarUrl')
        .in('id', userIds);

      if (profiles) {
        profiles.forEach((p) => {
          profilesMap[p.id] = p;
        });
      }
    }

    return users.map((user) => {
      const profile = profilesMap[user.id];
      return {
        ...user,
        username: profile?.username || user.username || 'usuario',
        avatarUrl: profile?.avatarUrl || user.avatarUrl || '/assets/images/defaultUser.png',
      };
    });
  }

  private updateParams(res: any, type: 'desktop' | 'mobile') {
    const params = {
      page:
        res.page ||
        res.pagination?.page ||
        (type === 'desktop' ? this.desktopParams.page : this.mobileParams.page),
      size: type === 'desktop' ? this.desktopParams.size : this.mobileParams.size,
      total: res.total || res.pagination?.total || 0,
      pageCount: res.totalPages || res.pagination?.totalPages || 0,
      hasPreviousPage: res.hasPrevious || res.pagination?.hasPrevious || false,
      hasNextPage: res.hasNext || res.pagination?.hasNext || false,
    };

    if (type === 'desktop') this.desktopParams = params;
    else this.mobileParams = params;
  }

  nextDesktopPage(): void {
    if (this.desktopParams.hasNextPage && !this.loadingDesktop) {
      this.desktopParams.page++;
      this.loadDesktopUsers();
    }
  }

  prevDesktopPage(): void {
    if (this.desktopParams.hasPreviousPage && !this.loadingDesktop) {
      this.desktopParams.page--;
      this.loadDesktopUsers();
    }
  }

  nextMobilePage(): void {
    if (this.mobileParams.hasNextPage && !this.loadingMobile) {
      this.mobileParams.page++;
      this.loadMobileUsers('', true);
    }
  }

  createReviews(): void {
    const dialogRef = this.dialog.open(CreateReviewDialogComponent, {
      width: '600px',
      maxWidth: '90vw',
      data: {
        title: 'Crear Reseña',
        message: 'Comparte tu opinión sobre una película',
      },
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result && result.content && result.rating && result.movieId) {
        this.reviewsService.createReview(result).subscribe({
          next: () => {
            this.reviewsService.notifyReviewsChanged();
          },
          error: (error) => {
            console.error('Error creando review:', error);
          },
        });
      }
    });
  }
}
