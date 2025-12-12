/* eslint-disable @typescript-eslint/no-explicit-any */
import { Component, Input, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatMenuModule } from '@angular/material/menu';
import { MatDialog } from '@angular/material/dialog';
import { CommentsService } from '../../services/comments.service';
import { UserService } from '../../../shared/services/user.service';
import { CommentInterface, PaginatedComments } from '../../interface/comments.interface';
import { YesNoDialogComponent } from '../../../shared/components/yes-no-dialog/yes-no-dialog.component';
import { SupabaseClient } from '@supabase/supabase-js';
import { TokenService } from '../../../auth/services/token.service';
import { USER_ROLES } from '../../../shared/constants/roles.constants';

@Component({
  selector: 'app-comments-list',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatIconModule,
    MatButtonModule,
    MatInputModule,
    MatFormFieldModule,
    MatProgressSpinnerModule,
    MatMenuModule,
  ],
  templateUrl: './comments-list.html',
  styleUrl: './comments-list.scss',
})
export class CommentsList implements OnInit {
  private readonly _commentsService: CommentsService = inject(CommentsService);

  @Input({ required: true }) reviewId!: string;
  @Input() currentUserId: string = '';

  comments: CommentInterface[] = [];
  isLoading: boolean = false;
  newCommentContent: string = '';
  replyContent: string = '';
  replyingToId: string | null = null;
  editingCommentId: string | null = null;
  editContent: string = '';

  currentUserName: string = '';
  currentUserAvatar: string = '/assets/images/defaultUser.png';

  replyVisibility: Record<string, boolean> = {};
  private readonly _userService: UserService = inject(UserService);
  private readonly _tokenService: TokenService = inject(TokenService);

  get isSuperAdmin(): boolean {
    return this._tokenService.getUserRole() === USER_ROLES.SUPERADMIN;
  }

  ngOnInit(): void {
    this.getCurrentUser();
    this.loadComments();
  }

  getCurrentUser(): void {
    const sessionStr = localStorage.getItem('app_session');
    if (sessionStr) {
      try {
        const session = JSON.parse(sessionStr);
        this.currentUserId = session.user?.id || '';

        if (this.currentUserId) {
          this._userService.getUserById(this.currentUserId).subscribe({
            next: async (user) => {
              this.currentUserName = user.fullName || user.username || 'Usuario';

              const { data: profile } = await this._supabaseClient
                .from('profile')
                .select('avatarUrl')
                .eq('id', this.currentUserId)
                .maybeSingle();

              if (profile) {
                this.currentUserAvatar =
                  (profile as any).avatarUrl || '/assets/images/defaultUser.png';
              }
            },
            error: () => {
              this.currentUserName = 'Usuario';
            },
          });
        }
      } catch (error) {
        console.error('Error parsing session:', error);
      }
    }
  }

  toggleRepliesVisibility(commentId: string): void {
    this.replyVisibility[commentId] = !this.replyVisibility[commentId];
  }

  addComment(): void {
    if (!this.newCommentContent.trim()) return;

    this._commentsService
      .createComment({ content: this.newCommentContent, reviewId: this.reviewId })
      .subscribe({
        next: (id) => {
          const newComment: CommentInterface = {
            id: id,
            reviewId: this.reviewId,
            userId: this.currentUserId,
            userName: this.currentUserName,
            avatarUrl: this.currentUserAvatar,
            content: this.newCommentContent,
            likes: 0,
            liked: false,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            replies: [],
          };

          this.comments.unshift(newComment);
          this.newCommentContent = '';
        },
      });
  }

  toggleReply(commentId: string): void {
    if (this.replyingToId === commentId) {
      this.replyingToId = null;
      this.replyContent = '';
    } else {
      this.replyingToId = commentId;
      this.replyContent = '';
    }
  }

  sendReply(parentId: string): void {
    if (!this.replyContent.trim()) return;

    this._commentsService
      .replyToComment(parentId, { content: this.replyContent, reviewId: this.reviewId })
      .subscribe({
        next: (id) => {
          const newReply: CommentInterface = {
            id: id,
            reviewId: this.reviewId,
            userId: this.currentUserId,
            userName: this.currentUserName,
            avatarUrl: this.currentUserAvatar,
            content: this.replyContent,
            likes: 0,
            liked: false,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            parentId: parentId,
            replies: [],
          };

          const parentComment = this.comments.find((c) => c.id === parentId);
          if (parentComment) {
            if (!parentComment.replies) {
              parentComment.replies = [];
            }
            parentComment.replies.unshift(newReply);
            this.replyVisibility[parentId] = true;
          }

          this.replyingToId = null;
          this.replyContent = '';
        },
      });
  }

  private readonly _supabaseClient: SupabaseClient = inject(SupabaseClient);

  paginationParams = {
    page: 1,
    size: 10,
    total: 0,
    hasNext: false,
  };

  loadComments(reset: boolean = false): void {
    if (reset) {
      this.paginationParams.page = 1;
      this.comments = [];
    }

    this.isLoading = true;
    this._commentsService
      .getCommentsByReview(this.reviewId, {
        page: this.paginationParams.page,
        size: this.paginationParams.size,
        sort: 'created_at,desc',
      })
      .subscribe({
        next: async (response: PaginatedComments) => {
          try {
            const newComments = response.data;

            const userIds = new Set<string>();
            newComments.forEach((comment) => {
              userIds.add(comment.userId);
              if (comment.replies) {
                comment.replies.forEach((reply) => userIds.add(reply.userId));
              }
            });

            const avatars: Record<string, string> = {};
            if (userIds.size > 0) {
              const { data: profiles } = await this._supabaseClient
                .from('profile')
                .select('id, avatarUrl')
                .in('id', Array.from(userIds));

              if (profiles) {
                profiles.forEach((profile) => {
                  avatars[profile.id] = profile.avatarUrl;
                });
              }
            }

            newComments.forEach((comment) => {
              comment.avatarUrl = avatars[comment.userId] || '/assets/images/defaultUser.png';
              if (comment.replies && comment.replies.length > 0) {
                comment.replies = [...comment.replies].sort((a, b) => {
                  return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
                });
                comment.replies.forEach((reply) => {
                  reply.avatarUrl = avatars[reply.userId] || '/assets/images/defaultUser.png';
                });
              }
            });

            if (reset) {
              this.comments = newComments;
            } else {
              this.comments = [...this.comments, ...newComments];
            }

            this.paginationParams.total = response.total;
            this.paginationParams.hasNext = response.hasNext || false;
          } finally {
            this.isLoading = false;
          }
        },
        error: () => {
          this.isLoading = false;
        },
      });
  }

  loadMoreComments(): void {
    if (this.paginationParams.hasNext && !this.isLoading) {
      this.paginationParams.page++;
      this.loadComments(false);
    }
  }

  toggleLike(comment: CommentInterface): void {
    const originalLiked = comment.liked;
    const originalLikes = comment.likes;

    comment.liked = !comment.liked;
    comment.likes += comment.liked ? 1 : -1;

    const request$ = comment.liked
      ? this._commentsService.likeComment(comment.id)
      : this._commentsService.dislikeComment(comment.id);

    request$.subscribe({
      error: () => {
        comment.liked = originalLiked;
        comment.likes = originalLikes;
      },
    });
  }

  startEdit(comment: CommentInterface): void {
    this.editingCommentId = comment.id;
    this.editContent = comment.content;
  }

  cancelEdit(): void {
    this.editingCommentId = null;
    this.editContent = '';
  }

  saveEdit(comment: CommentInterface): void {
    if (!this.editContent.trim()) return;

    this._commentsService.updateComment(comment.id, { content: this.editContent }).subscribe({
      next: () => {
        comment.content = this.editContent;
        this.editingCommentId = null;
      },
    });
  }

  private readonly dialog: MatDialog = inject(MatDialog);

  deleteComment(comment: CommentInterface): void {
    const dialogRef = this.dialog.open(YesNoDialogComponent, {
      width: '600px',
      maxWidth: '90vw',
      data: {
        title: 'Eliminar Comentario',
        message:
          '¿Estás seguro de que deseas eliminar este comentario? Esta acción no se puede deshacer.',
      },
    });

    dialogRef.afterClosed().subscribe((confirmed) => {
      if (confirmed) {
        const request$ = comment.parentId
          ? this._commentsService.deleteReply(comment.id)
          : this._commentsService.deleteComment(comment.id);

        request$.subscribe({
          next: () => {
            if (comment.parentId) {
              const parent = this.comments.find((c) => c.id === comment.parentId);
              if (parent && parent.replies) {
                parent.replies = parent.replies.filter((r) => r.id !== comment.id);
              }
            } else {
              this.comments = this.comments.filter((c) => c.id !== comment.id);
            }
          },
        });
      }
    });
  }

  isOwner(comment: CommentInterface): boolean {
    return comment.userId === this.currentUserId || this.isSuperAdmin;
  }

  expandedComments: Set<string> = new Set();

  toggleCommentExpansion(commentId: string): void {
    if (this.expandedComments.has(commentId)) {
      this.expandedComments.delete(commentId);
    } else {
      this.expandedComments.add(commentId);
    }
  }

  isCommentExpanded(commentId: string): boolean {
    return this.expandedComments.has(commentId);
  }

  onImageError(event: Event): void {
    const img = event.target as HTMLImageElement;
    if (img.src.includes('assets/images/defaultUser.png')) {
      return;
    }
    img.src = '/assets/images/defaultUser.png';
  }
}
