import { PaginationInterface } from '../../shared/interfaces/pagination.interface';

export interface CreateComment {
  content: string;
  reviewId: string;
}

export interface CreateReply {
  content: string;
  reviewId: string;
}

export interface UpdateComment {
  content: string;
}

export interface CommentInterface {
  id: string;
  reviewId: string;
  userId: string;
  userName: string;
  avatarUrl?: string;
  content: string;
  parentId?: string;
  likes: number;
  liked: boolean;
  createdAt: string;
  updatedAt: string;
  replies?: CommentInterface[];
}

export interface PaginatedComments extends PaginationInterface {
  data: CommentInterface[];
}
