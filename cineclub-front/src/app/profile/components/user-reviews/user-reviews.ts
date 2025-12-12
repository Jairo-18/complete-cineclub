import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDialog } from '@angular/material/dialog';
import { Subscription } from 'rxjs';
import { ReviewsService } from '../../../public/services/reviews.service';
import { ReviewInterface } from '../../../public/interface/reviews.interface';
import { CardReview } from '../../../public/components/card-review/card-review';
import { PaginationInterface } from '../../../shared/interfaces/pagination.interface';
import { YesNoDialogComponent } from '../../../shared/components/yes-no-dialog/yes-no-dialog.component';
import { CreateReviewDialogComponent } from '../../../shared/components/create-review-dialog/create-review-dialog.component';

@Component({
  selector: 'app-user-reviews',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    CardReview,
    MatButtonModule,
    MatIconModule,
    MatInputModule,
    MatFormFieldModule,
    MatProgressSpinnerModule,
  ],
  templateUrl: './user-reviews.html',
  styleUrl: './user-reviews.scss',
})
export class UserReviews implements OnInit, OnDestroy {
  private readonly _reviewsService: ReviewsService = inject(ReviewsService);
  private readonly dialog: MatDialog = inject(MatDialog);
  private readonly router: Router = inject(Router);
  private reviewsChangedSubscription?: Subscription;

  reviews: ReviewInterface[] = [];
  filteredReviews: ReviewInterface[] = [];
  isLoading: boolean = false;
  isLoadingMore: boolean = false;
  currentUserId: string = '';
  searchQuery: string = '';
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
    this.loadReviews();
    this.setupScrollListener();

    this.reviewsChangedSubscription = this._reviewsService.reviewsChanged$.subscribe(() => {
      this.reviews = [];
      this.filteredReviews = [];
      this.pagination.page = 1;
      this.isLoadingMore = false;
      this.searchQuery = '';

      const mainElement = document.querySelector('main.main');
      if (mainElement) {
        mainElement.scrollTop = 0;
      } else {
        window.scrollTo(0, 0);
      }

      this.loadReviews(true);
    });
  }

  ngOnDestroy(): void {
    if (this.reviewsChangedSubscription) {
      this.reviewsChangedSubscription.unsubscribe();
    }
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
    } else {
      console.warn('⚠️ No session found in localStorage');
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

  loadReviews(showLoader: boolean = true): void {
    if (showLoader) {
      this.isLoading = true;
    }

    setTimeout(() => {
      const query = {
        page: this.pagination.page,
        size: this.pagination.perPage,
        sort: 'created_at,desc',
      };

      this._reviewsService.getUserReviewsWithPagination(query).subscribe({
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
        error: () => {
          if (showLoader) {
            this.isLoading = false;
          }
        },
      });
    });
  }

  loadMoreReviews(): void {
    if (!this.pagination.hasNext || this.isLoadingMore) return;

    this.isLoadingMore = true;
    this.pagination.page++;

    const query = {
      page: this.pagination.page,
      size: this.pagination.perPage,
      sort: 'created_at,desc',
    };

    this._reviewsService.getUserReviewsWithPagination(query).subscribe({
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
      error: () => {
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

  onEditReview(reviewId: string): void {
    const review = this.reviews.find((r) => r.id === reviewId);
    if (!review) return;

    const dialogRef = this.dialog.open(CreateReviewDialogComponent, {
      width: '600px',
      maxWidth: '90vw',
      data: {
        title: 'Editar Reseña',
        message: 'Modifica tu opinión sobre esta película',
        isEdit: true,
        reviewData: {
          content: review.content,
          rating: review.rating,
          movieTitle: review.title,
        },
      },
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result && result.content && result.rating) {
        this._reviewsService.updateReview(reviewId, result).subscribe({
          next: () => {
            this._reviewsService.notifyReviewsChanged();
          },
          error: (error) => {
            console.error('Error actualizando review:', error);
          },
        });
      }
    });
  }

  onDeleteReview(reviewId: string): void {
    const dialogRef = this.dialog.open(YesNoDialogComponent, {
      width: '600px',
      maxWidth: '90vw',
      data: {
        title: 'Eliminar Reseña',
        message:
          '¿Estás seguro de que deseas eliminar esta reseña? Esta acción no se puede deshacer.',
      },
    });

    dialogRef.afterClosed().subscribe((confirmed) => {
      if (confirmed) {
        this._reviewsService.deleteReview(reviewId).subscribe({
          next: () => {
            this._reviewsService.notifyReviewsChanged();
          },
          error: (error) => {
            console.error('Error eliminando review:', error);
          },
        });
      }
    });
  }

  onGoToReview(reviewId: string): void {
    this.router.navigate(['/home'], { queryParams: { reviewId } });
  }
}
