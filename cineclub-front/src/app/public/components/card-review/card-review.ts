import { CommonModule } from '@angular/common';
import { Component, Input, Output, EventEmitter, inject } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog } from '@angular/material/dialog';

import { LikesService } from '../../services/likes.service';
import { ReviewDetailsDialogComponent } from '../../../shared/components/review-details-dialog/review-details-dialog.component';
import { ReviewInterface } from '../../interface/reviews.interface';
import { TokenService } from '../../../auth/services/token.service';
import { USER_ROLES } from '../../../shared/constants/roles.constants';

@Component({
  selector: 'app-card-review',
  standalone: true,
  imports: [CommonModule, MatIconModule, MatMenuModule, MatButtonModule],
  templateUrl: './card-review.html',
  styleUrl: './card-review.scss',
})
export class CardReview {
  private readonly _likesService: LikesService = inject(LikesService);
  private readonly _tokenService: TokenService = inject(TokenService);
  private readonly dialog: MatDialog = inject(MatDialog);

  @Input() id: string = '';
  @Input() title: string = '';
  @Input() content: string = '';
  @Input() posterPath: string = '';
  @Input() reviewerName: string = '';
  @Input() directorName: string = '';
  @Input() rating: number = 0;
  @Input() createdAt: string = '';
  @Input() userId: string = '';
  @Input() currentUserId: string = '';
  @Input() showImage: boolean = true;
  @Input() showGoToReview: boolean = false;
  @Input() likes: number = 0;
  @Input() comments: number = 0;
  @Input() liked: boolean = false;

  @Output() editReview = new EventEmitter<string>();
  @Output() deleteReview = new EventEmitter<string>();
  @Output() goToReview = new EventEmitter<string>();

  get isSuperAdmin(): boolean {
    return this._tokenService.getUserRole() === USER_ROLES.SUPERADMIN;
  }

  get isOwner(): boolean {
    const isOwner = this.userId === this.currentUserId && !!this.currentUserId;
    return isOwner || this.isSuperAdmin;
  }

  onEdit(): void {
    this.editReview.emit(this.id);
  }

  onDelete(): void {
    this.deleteReview.emit(this.id);
  }

  onGoToReview(): void {
    this.goToReview.emit(this.id);
  }

  get stars(): boolean[] {
    return Array(5)
      .fill(false)
      .map((_, i) => i < this.rating);
  }

  get formattedDate(): string {
    if (!this.createdAt) return '';
    const date = new Date(this.createdAt);
    return date.toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  }

  get moviePoster(): string {
    const defaultImage = 'assets/images/default-movie.png';
    const baseUrl = 'https://image.tmdb.org/t/p/w500';

    if (
      !this.posterPath ||
      this.posterPath.trim() === '' ||
      this.posterPath === 'null' ||
      this.posterPath === 'undefined'
    ) {
      return defaultImage;
    }

    return `${baseUrl}${this.posterPath}`;
  }

  onImageError(event: Event): void {
    const img = event.target as HTMLImageElement;
    if (img.src.includes('assets/images/default-movie.png')) {
      return;
    }
    img.src = 'assets/images/default-movie.png';
  }

  toggleLike(): void {
    if (!this.currentUserId) {
      return;
    }

    const originalLiked = this.liked;
    const originalLikes = this.likes;

    this.liked = !this.liked;
    this.likes += this.liked ? 1 : -1;

    const request$ = this.liked
      ? this._likesService.likeReview(this.id)
      : this._likesService.dislikeReview(this.id);

    request$.subscribe({
      error: () => {
        this.liked = originalLiked;
        this.likes = originalLikes;
      },
    });
  }

  openReviewDetails(): void {
    const dialogData: ReviewInterface = {
      id: this.id,
      title: this.title,
      content: this.content,
      posterPath: this.posterPath,
      reviewerName: this.reviewerName,
      directorName: this.directorName,
      rating: this.rating,
      createdAt: this.createdAt,
      updatedAt: this.createdAt,
      userId: this.userId,
      movieId: '',
      likes: this.likes,
      comments: this.comments,
      liked: this.liked,
    };

    const dialogRef = this.dialog.open(ReviewDetailsDialogComponent, {
      width: '1000px',
      maxWidth: '95vw',
      maxHeight: '90vh',
      data: dialogData,
      panelClass: 'review-details-dialog-panel',
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        if (result.action === 'edit') {
          this.editReview.emit(result.reviewId);
        } else if (result.action === 'delete') {
          this.deleteReview.emit(result.reviewId);
        } else if (result.liked !== undefined) {
          this.liked = result.liked;
          this.likes = result.likes;
        }
      }
    });
  }
}
