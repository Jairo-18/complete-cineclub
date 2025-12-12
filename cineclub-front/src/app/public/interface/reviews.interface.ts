export interface CreateReview {
  content: string;
  rating: number;
  movieId: string;
}
import { PaginationInterface } from '../../shared/interfaces/pagination.interface';

export interface ReviewInterface extends CreateReview {
  id: string;
  title: string;
  reviewerName: string;
  directorName: string;
  posterPath: string;
  userId: string;
  rating: number;
  movieId: string;
  liked: boolean;
  likes: number;
  comments: number;
  createdAt: string;
  updatedAt: string;
}

export interface PaginatedReview extends PaginationInterface {
  data: ReviewInterface[];
}
