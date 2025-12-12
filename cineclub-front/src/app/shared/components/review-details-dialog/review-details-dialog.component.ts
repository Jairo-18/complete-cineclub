import { Component, inject, EventEmitter, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatMenuModule } from '@angular/material/menu';
import { LikesService } from '../../../public/services/likes.service';
import { CommentsList } from '../../../public/components/comments-list/comments-list';
import { ReviewInterface } from '../../../public/interface/reviews.interface';
import { TokenService } from '../../../auth/services/token.service';
import { USER_ROLES } from '../../constants/roles.constants';

@Component({
  selector: 'app-review-details-dialog',
  standalone: true,
  imports: [CommonModule, MatIconModule, MatButtonModule, MatMenuModule, CommentsList],
  templateUrl: './review-details-dialog.component.html',
  styleUrl: './review-details-dialog.component.scss',
})
export class ReviewDetailsDialogComponent {
  private readonly _likesService: LikesService = inject(LikesService);
  private readonly _tokenService: TokenService = inject(TokenService);
  private readonly dialogRef = inject(MatDialogRef<ReviewDetailsDialogComponent>);
  readonly data: ReviewInterface = inject(MAT_DIALOG_DATA);

  @Output() editReview = new EventEmitter<string>();
  @Output() deleteReview = new EventEmitter<string>();

  likes: number;
  liked: boolean;

  constructor() {
    this.likes = this.data.likes;
    this.liked = this.data.liked;
  }

  get isSuperAdmin(): boolean {
    return this._tokenService.getUserRole() === USER_ROLES.SUPERADMIN;
  }

  get currentUserId(): string | null {
    return this._tokenService.getUserId();
  }

  get isOwner(): boolean {
    const isOwner = this.data.userId === this.currentUserId && !!this.currentUserId;
    return isOwner || this.isSuperAdmin;
  }

  get stars(): boolean[] {
    return Array(5)
      .fill(false)
      .map((_, i) => i < this.data.rating);
  }

  get formattedDate(): string {
    if (!this.data.createdAt) return '';
    const date = new Date(this.data.createdAt);
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
      !this.data.posterPath ||
      this.data.posterPath.trim() === '' ||
      this.data.posterPath === 'null' ||
      this.data.posterPath === 'undefined'
    ) {
      return defaultImage;
    }

    return `${baseUrl}${this.data.posterPath}`;
  }

  onImageError(event: Event): void {
    const img = event.target as HTMLImageElement;
    if (img.src.includes('assets/images/default-movie.png')) {
      return;
    }
    img.src = 'assets/images/default-movie.png';
  }

  toggleLike(): void {
    if (!this.data.userId) {
      return;
    }

    const originalLiked = this.liked;
    const originalLikes = this.likes;

    this.liked = !this.liked;
    this.likes += this.liked ? 1 : -1;

    const request$ = this.liked
      ? this._likesService.likeReview(this.data.id)
      : this._likesService.dislikeReview(this.data.id);

    request$.subscribe({
      error: () => {
        this.liked = originalLiked;
        this.likes = originalLikes;
      },
    });
  }

  onEdit(): void {
    this.dialogRef.close({ action: 'edit', reviewId: this.data.id });
  }

  onDelete(): void {
    this.dialogRef.close({ action: 'delete', reviewId: this.data.id });
  }

  close(): void {
    this.dialogRef.close({ liked: this.liked, likes: this.likes });
  }
}
