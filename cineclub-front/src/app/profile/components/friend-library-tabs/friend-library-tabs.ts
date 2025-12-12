import { Component, inject, Input, OnInit, OnChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { NotificationsService } from '../../../shared/services/notifications.service';
import { ReviewsService } from '../../../public/services/reviews.service';
import { ReviewInterface } from '../../../public/interface/reviews.interface';
import { PaginationInterface } from '../../../shared/interfaces/pagination.interface';
import { CardReview } from '../../../public/components/card-review/card-review';

@Component({
  selector: 'app-friend-library-tabs',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatIconModule,
    MatInputModule,
    MatFormFieldModule,
    MatProgressSpinnerModule,
    CardReview,
  ],
  templateUrl: './friend-library-tabs.html',
  styleUrls: ['./friend-library-tabs.scss'],
})
export class FriendLibraryTabs implements OnInit, OnChanges {
  private readonly _reviewsService: ReviewsService = inject(ReviewsService);
  private readonly _notificationsService: NotificationsService = inject(NotificationsService);
  private readonly router: Router = inject(Router);

  @Input({ required: true }) friendId!: string;

  reviews: ReviewInterface[] = [];
  filteredReviews: ReviewInterface[] = [];
  isLoading = false;
  isLoadingMore = false;
  searchQuery = '';
  currentUserId: string = '';
  pagination: PaginationInterface = {
    page: 1,
    size: 10,
    total: 0,
    totalPages: 0,
    hasNext: false,
    hasPrevious: false,
  };

  ngOnInit(): void {
    this.getCurrentUserId();
    this.setupScrollListener();
  }

  ngOnChanges(): void {
    if (!this.friendId) return;

    this.pagination = {
      page: 1,
      size: 10,
      total: 0,
      totalPages: 0,
      hasNext: false,
      hasPrevious: false,
    };
    this.reviews = [];
    this.filteredReviews = [];
    this.loadFriendReviews();
  }

  loadFriendReviews(showLoader: boolean = true): void {
    if (showLoader) {
      this.isLoading = true;
    }

    const query = {
      page: this.pagination.page,
      size: this.pagination.size,
      sort: 'created_at,desc',
    };

    this._reviewsService.getUserReviewsByIdWithPagination(this.friendId, query).subscribe({
      next: (response) => {
        this.reviews = response.data.sort((a, b) => {
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        });
        this.pagination = { ...response.pagination };
        this.applySearch();

        if (showLoader) {
          this.isLoading = false;
        }
      },
      error: (err) => {
        console.error('Error al obtener reviews del amigo:', err);
        this._notificationsService.error('Error al cargar reviews del amigo');
        if (showLoader) {
          this.isLoading = false;
        }
      },
    });
  }

  private getCurrentUserId(): void {
    const sessionStr = localStorage.getItem('app_session');
    if (sessionStr) {
      try {
        const session = JSON.parse(sessionStr);
        this.currentUserId = session.user?.id || '';
      } catch (error) {
        console.error('Error parsing session:', error);
      }
    }
  }

  private setupScrollListener(): void {
    const mainElement = document.querySelector('main.main');

    if (mainElement) {
      mainElement.addEventListener('scroll', () => {
        this.checkScroll(mainElement);
      });
    } else {
      window.addEventListener('scroll', () => {
        this.checkScrollWindow();
      });
    }
  }

  private checkScroll(element: Element): void {
    const scrollPosition = element.scrollTop + element.clientHeight;
    const scrollHeight = element.scrollHeight;
    const scrollPercentage = (scrollPosition / scrollHeight) * 100;

    if (scrollPercentage >= 50 && this.pagination.hasNext && !this.isLoadingMore) {
      this.loadMoreReviews();
    }
  }

  private checkScrollWindow(): void {
    const scrollPosition = window.pageYOffset + window.innerHeight;
    const pageHeight = document.documentElement.scrollHeight;
    const scrollPercentage = (scrollPosition / pageHeight) * 100;

    if (scrollPercentage >= 50 && this.pagination.hasNext && !this.isLoadingMore) {
      this.loadMoreReviews();
    }
  }

  loadMoreReviews(): void {
    if (!this.pagination.hasNext || this.isLoadingMore) return;

    this.isLoadingMore = true;
    this.pagination.page++;

    const query = {
      page: this.pagination.page,
      size: this.pagination.size,
      sort: 'created_at,desc',
    };

    this._reviewsService.getUserReviewsByIdWithPagination(this.friendId, query).subscribe({
      next: (response) => {
        const existingIds = new Set(this.reviews.map((r) => r.id));
        const newReviews = response.data.filter((review) => !existingIds.has(review.id));

        this.reviews = [...this.reviews, ...newReviews];

        this.reviews.sort((a, b) => {
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        });

        this.pagination = { ...response.pagination };
        this.applySearch();
        this.isLoadingMore = false;
      },
      error: (err) => {
        console.error('Error al cargar más reviews:', err);
        this.isLoadingMore = false;
        this.pagination.page--;
      },
    });
  }

  onSearchChange(): void {
    this.applySearch();
  }

  private applySearch(): void {
    if (!this.searchQuery.trim()) {
      this.filteredReviews = [...this.reviews];
    } else {
      const query = this.searchQuery.toLowerCase().trim();
      this.filteredReviews = this.reviews.filter((review) =>
        review.title.toLowerCase().includes(query),
      );
    }
  }

  onGoToReview(reviewId: string): void {
    this.router.navigate(['/home'], { queryParams: { reviewId } });
  }
}
