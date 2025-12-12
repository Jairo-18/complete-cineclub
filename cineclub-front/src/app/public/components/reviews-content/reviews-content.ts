/* eslint-disable @typescript-eslint/no-explicit-any */
import {
  Component,
  OnInit,
  OnDestroy,
  inject,
  AfterViewChecked,
  Input,
  Output,
  EventEmitter,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDialog } from '@angular/material/dialog';
import { Subscription } from 'rxjs';
import { ReviewsService } from '../../services/reviews.service';
import { ReviewInterface } from '../../interface/reviews.interface';
import { CardReview } from '../card-review/card-review';
import { PaginationInterface } from '../../../shared/interfaces/pagination.interface';
import { YesNoDialogComponent } from '../../../shared/components/yes-no-dialog/yes-no-dialog.component';
import { CreateReviewDialogComponent } from '../../../shared/components/create-review-dialog/create-review-dialog.component';
import { FriendCard } from '../friend-card/friend-card';
import { UserMongoComplete } from '../../../auth/interfaces/user.interface';

@Component({
  selector: 'app-reviews-content',
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
    FriendCard,
  ],
  templateUrl: './reviews-content.html',
  styleUrl: './reviews-content.scss',
})
export class ReviewsContent implements OnInit, OnDestroy, AfterViewChecked {
  private readonly _reviewsService: ReviewsService = inject(ReviewsService);
  private readonly dialog: MatDialog = inject(MatDialog);
  private readonly route: ActivatedRoute = inject(ActivatedRoute);
  private readonly router: Router = inject(Router);
  private reviewsChangedSubscription?: Subscription;
  private targetReviewId: string | null = null;
  private hasScrolled: boolean = false;

  @Input() users: UserMongoComplete[] = [];
  @Input() loadingUsers: boolean = false;
  @Output() nextUsers = new EventEmitter<void>();
  @Output() prevUsers = new EventEmitter<void>();

  @Input() mobileUsers: UserMongoComplete[] = [];
  @Input() loadingMobile: boolean = false;
  @Input() mobileParams: PaginationInterface = {
    page: 1,
    size: 5,
    total: 0,
    pageCount: 0,
    hasPreviousPage: false,
    hasNextPage: false,
  };
  @Output() nextMobilePage = new EventEmitter<void>();

  reviews: ReviewInterface[] = [];
  isLoading: boolean = false;
  isLoadingMore: boolean = false;
  currentUserId: string = '';
  searchQuery: string = '';
  searchTimeout: any;
  readonly PAGE_SIZE = 10;
  pagination: PaginationInterface = {
    page: 1,
    size: this.PAGE_SIZE,
    total: 0,
    totalPages: 0,
    hasNext: false,
    hasPrevious: false,
  };

  ngOnInit(): void {
    this.getCurrentUserId();

    this.route.queryParams.subscribe((params) => {
      if (params['reviewId']) {
        this.targetReviewId = params['reviewId'];
        this.hasScrolled = false;
      }
    });

    this.loadReviews();
    this.setupScrollListener();

    this.reviewsChangedSubscription = this._reviewsService.reviewsChanged$.subscribe(() => {
      this.reviews = [];
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

  ngAfterViewChecked(): void {
    if (this.targetReviewId && !this.hasScrolled && this.reviews.length > 0) {
      this.scrollToReview(this.targetReviewId);
    }
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
      const query: any = {
        page: this.pagination.page,
        size: this.PAGE_SIZE,
        sort: 'created_at,desc',
      };

      if (this.searchQuery && this.searchQuery.trim()) {
        query.title = this.searchQuery.trim();
      }

      this._reviewsService.getReviewsWithPagination(query).subscribe({
        next: (response) => {
          const data = response.data || [];
          this.reviews = data.sort((a, b) => {
            return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
          });
          this.pagination = { ...response.pagination };

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

    const query: any = {
      page: this.pagination.page,
      size: this.PAGE_SIZE,
      sort: 'created_at,desc',
    };

    if (this.searchQuery && this.searchQuery.trim()) {
      query.title = this.searchQuery.trim();
    }

    this._reviewsService.getReviewsWithPagination(query).subscribe({
      next: (response) => {
        const existingIds = new Set(this.reviews.map((r) => r.id));
        const data = response.data || [];
        const newReviews = data.filter((review) => !existingIds.has(review.id));

        this.reviews = [...this.reviews, ...newReviews];

        this.reviews.sort((a, b) => {
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        });

        this.pagination = { ...response.pagination };
        this.isLoadingMore = false;
      },
      error: () => {
        this.isLoadingMore = false;
        this.pagination.page--;
      },
    });
  }

  goToPage(page: number): void {
    if (page >= 1 && page <= (this.pagination.totalPages || 0)) {
      this.pagination.page = page;
      this.loadReviews();
    }
  }

  nextPage(): void {
    if (this.pagination.hasNext) {
      this.pagination.page++;
      this.loadReviews();
    }
  }

  previousPage(): void {
    if (this.pagination.hasPrevious) {
      this.pagination.page--;
      this.loadReviews();
    }
  }

  get pages(): number[] {
    const pages: number[] = [];
    const maxPagesToShow = 5;
    const totalPages = this.pagination.totalPages || 0;
    let startPage = Math.max(1, this.pagination.page - Math.floor(maxPagesToShow / 2));
    const endPage = Math.min(totalPages, startPage + maxPagesToShow - 1);

    if (endPage - startPage + 1 < maxPagesToShow) {
      startPage = Math.max(1, endPage - maxPagesToShow + 1);
    }

    for (let i = startPage; i <= endPage; i++) {
      pages.push(i);
    }

    return pages;
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
          title: review.title,
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

  onSearchChange(): void {
    if (this.searchTimeout) {
      clearTimeout(this.searchTimeout);
    }

    this.searchTimeout = setTimeout(() => {
      this.pagination.page = 1;
      this.pagination.size = this.PAGE_SIZE;
      this.loadReviews(true);
    }, 500);
  }

  private scrollToReview(reviewId: string): void {
    const reviewElement = document.getElementById(`review-${reviewId}`);
    if (reviewElement) {
      setTimeout(() => {
        const mainElement = document.querySelector('main.main');
        if (mainElement) {
          const containerRect = mainElement.getBoundingClientRect();
          const elementRect = reviewElement.getBoundingClientRect();

          const currentScroll = mainElement.scrollTop;

          const elementTopRelativeToContainer = elementRect.top - containerRect.top;
          const targetScroll =
            currentScroll +
            elementTopRelativeToContainer -
            containerRect.height / 2 +
            elementRect.height / 2;

          mainElement.scrollTo({
            top: targetScroll,
            behavior: 'smooth',
          });
        } else {
          reviewElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }

        reviewElement.classList.add('highlight-review');
        setTimeout(() => {
          reviewElement.classList.remove('highlight-review');
        }, 2000);

        this.hasScrolled = true;

        this.router.navigate([], {
          relativeTo: this.route,
          queryParams: {},
          queryParamsHandling: 'merge',
        });
      }, 800);
    }
  }

  shouldShowFriendSlider(index: number): boolean {
    return (index + 1) % 20 === 0;
  }
}
