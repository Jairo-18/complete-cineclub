export interface MoviesInterface {
  id: string;
  externalId?: number;
  title?: string;
  overview?: string;
  genres?: string | { id: number; name: string }[];
  releaseDate?: Date;
  posterPath?: string;
  runtime?: number;
  originalLanguage?: string;
  director?: string;
  score?: number;
  upVotes?: number;
  downVotes?: number;
  userVote?: 'UP' | 'DOWN' | null;
}

export interface CollectionResponse {
  data: {
    id: string;
    userId: string;
    movies: MoviesInterface[];
  }[];
}

export interface SavedCollection {
  id: string;
  movies: MoviesInterface[];
  userId: string;
}

export interface SavedMoviesResponse {
  data: SavedCollection[];
}

export interface VoteResponse {
  status: number;
  message: string;
  error: string;
  data: null;
}
