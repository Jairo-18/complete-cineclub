/* eslint-disable @typescript-eslint/no-explicit-any */
import { Component, inject, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatMenuModule } from '@angular/material/menu';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDividerModule } from '@angular/material/divider';
import { MatTooltipModule } from '@angular/material/tooltip';
import { LoaderComponent } from '../../../shared/components/loader/loader.component';
import { PageHeader } from '../../../shared/components/page-header/page-header';
import { NotificationsService } from '../../../shared/services/notifications.service';
import { MoviesInterface } from '../../interface/movies.interface';
import { MoviesService } from '../../services/movies.service';
import { PaginationInterface } from '../../../shared/interfaces/pagination.interface';
import { CollectionsService } from '../../services/collections.service';

@Component({
  selector: 'app-library-movies',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatMenuModule,
    MatIconModule,
    MatButtonModule,
    MatInputModule,
    MatFormFieldModule,
    MatProgressSpinnerModule,
    MatDividerModule,
    MatTooltipModule,
    LoaderComponent,
    PageHeader,
  ],
  templateUrl: './library-movies.html',
})
export class LibraryMovies implements OnInit, OnDestroy {
  private readonly _collectionsService: CollectionsService = inject(CollectionsService);
  private readonly _moviesService: MoviesService = inject(MoviesService);
  private readonly _notificationsService: NotificationsService = inject(NotificationsService);

  movies: MoviesInterface[] = [];
  loading: boolean = true;
  isLoadingMore: boolean = false;

  paginationParams: PaginationInterface = {
    page: 1,
    size: 12,
    total: 0,
    totalPages: 0,
    hasNext: false,
    hasPrevious: false,
  };

  searchTerm = '';
  searchTimeout: any;
  selectedGenre: string | null = null;

  genres: string[] = [
    'Action',
    'Adventure',
    'Animation',
    'Comedy',
    'Crime',
    'Documentary',
    'Drama',
    'Family',
    'Fantasy',
    'Foreign',
    'History',
    'Horror',
    'Music',
    'Mystery',
    'Romance',
    'Science Fiction',
    'Thriller',
    'War',
  ];

  ngOnInit(): void {
    this.fetchMovies();
    this.setupScrollListener();
  }

  ngOnDestroy(): void {
    const mainElement = document.querySelector('main.main');
    if (mainElement) {
      mainElement.removeEventListener('scroll', this.scrollListener);
    } else {
      window.removeEventListener('scroll', this.scrollListener);
    }
  }

  private scrollListener = () => {
    const mainElement = document.querySelector('main.main');
    if (mainElement) {
      this.checkScroll(mainElement);
    } else {
      this.checkScrollWindow();
    }
  };

  private setupScrollListener(): void {
    const mainElement = document.querySelector('main.main');
    if (mainElement) {
      mainElement.addEventListener('scroll', this.scrollListener);
    } else {
      window.addEventListener('scroll', this.scrollListener);
    }
  }

  private checkScroll(element: Element): void {
    const scrollPosition = element.scrollTop + element.clientHeight;
    const scrollHeight = element.scrollHeight;
    const scrollPercentage = (scrollPosition / scrollHeight) * 100;

    if (
      scrollPercentage >= 50 &&
      this.paginationParams.hasNext &&
      !this.isLoadingMore &&
      !this.loading
    ) {
      this.loadMoreMovies();
    }
  }

  private checkScrollWindow(): void {
    const scrollPosition = window.pageYOffset + window.innerHeight;
    const pageHeight = document.documentElement.scrollHeight;
    const scrollPercentage = (scrollPosition / pageHeight) * 100;

    if (
      scrollPercentage >= 50 &&
      this.paginationParams.hasNext &&
      !this.isLoadingMore &&
      !this.loading
    ) {
      this.loadMoreMovies();
    }
  }

  onSearchChange(): void {
    if (this.searchTimeout) {
      clearTimeout(this.searchTimeout);
    }

    this.searchTimeout = setTimeout(() => {
      this.paginationParams.page = 1;
      this.fetchMovies(true);
    }, 500);
  }

  clearSearch(): void {
    this.searchTerm = '';
    this.paginationParams.page = 1;
    this.paginationParams.size = 12;
    this.fetchMovies(true);
  }

  selectGenre(genre: string | null): void {
    this.selectedGenre = genre;
    this.paginationParams.page = 1;
    this.fetchMovies(true);
  }

  clearGenreFilter(): void {
    this.selectedGenre = null;
    this.paginationParams.page = 1;
    this.fetchMovies(true);
  }

  private fetchMovies(reset: boolean = false): void {
    if (reset) {
      this.loading = true;
      this.movies = [];
    }

    const params: any = {
      page: this.paginationParams.page,
      size: this.paginationParams.size,
    };

    if (this.searchTerm && this.searchTerm.trim()) {
      params.title = this.searchTerm.trim();
    }

    if (this.selectedGenre) {
      params.title = this.selectedGenre;
    }

    this._moviesService.getMoviesWithPagination(params).subscribe({
      next: (response) => {
        if (reset) {
          this.movies = response.data;
        } else {
          this.movies = [...this.movies, ...response.data];
        }

        this.loading = false;
        this.isLoadingMore = false;
        this.paginationParams.total = response.total || 0;
        this.paginationParams.totalPages = response.totalPages || 0;
        // this.paginationParams.size = response.size || this.paginationParams.size;
        this.paginationParams.hasNext = response.hasNext || false;
        this.paginationParams.hasPrevious = response.hasPrevious || false;
      },
      error: (error) => {
        console.error('Error fetching movies:', error);
        this.loading = false;
        this.isLoadingMore = false;
      },
    });
  }

  loadMoreMovies(): void {
    if (this.paginationParams.hasNext && !this.isLoadingMore) {
      this.isLoadingMore = true;
      this.paginationParams.page++;
      this.fetchMovies(false);
    }
  }

  guardarPelicula(movie: MoviesInterface): void {
    this._collectionsService.saveMovieToCollection(movie.id!).subscribe({
      next: () => {
        // this._notificationsService.success('Película guardada correctamente');
      },
      error: (err) => {
        console.error('Error al guardar la película:', err);
        if (err.status === 409) {
          this._notificationsService.error('Película ya guardada');
        } else {
          this._notificationsService.error('❌ No se pudo guardar la película.');
        }
      },
    });
  }

  vote(movie: MoviesInterface, type: 'UP' | 'DOWN'): void {
    const previousVote = movie.userVote;

    if (movie.userVote === type) {
      movie.userVote = null;
    } else {
      movie.userVote = type;
    }

    this._moviesService.voteMovie(movie.id!, type).subscribe({
      next: (response) => {
        this._notificationsService.success(response.message);
      },
      error: (err) => {
        console.error('Error al votar:', err);
        this._notificationsService.error('Error al registrar el voto');

        movie.userVote = previousVote;
      },
    });
  }

  formatRuntime(minutes: number): string {
    if (!minutes) return 'No disponible';
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    return `${hours}h ${remainingMinutes}min`;
  }

  parseGenres(genres: string | { id: number; name: string }[] | undefined): string[] {
    if (!genres) return [];

    try {
      if (Array.isArray(genres)) {
        return genres.map((genre: { id: number; name: string }) => genre.name);
      }

      if (typeof genres === 'string') {
        const formattedString = genres.replace(/'/g, '"');
        const parsedGenres = JSON.parse(formattedString);
        return parsedGenres.map((genre: { id: number; name: string }) => genre.name);
      }

      return [];
    } catch (error) {
      console.error('Error parsing genres:', error);
      return [];
    }
  }
  getMoviePoster(posterPath: string | undefined): string {
    const defaultImage = 'assets/images/default-movie.png';
    const baseUrl = 'https://image.tmdb.org/t/p/w500';

    if (
      !posterPath ||
      posterPath.trim() === '' ||
      posterPath === 'null' ||
      posterPath === 'undefined'
    ) {
      return defaultImage;
    }

    return `${baseUrl}${posterPath}`;
  }

  onImageError(event: Event): void {
    const img = event.target as HTMLImageElement;
    if (img.src.includes('assets/images/default-movie.png')) {
      return;
    }
    img.src = 'assets/images/default-movie.png';
  }

  expandedOverviews: Record<string, boolean> = {};

  toggleOverview(movieId: string): void {
    this.expandedOverviews[movieId] = !this.expandedOverviews[movieId];
  }

  isOverviewExpanded(movieId: string): boolean {
    return this.expandedOverviews[movieId] || false;
  }

  getDisplayedOverview(movie: MoviesInterface): string {
    const overview = movie.overview || '';
    if (overview.length <= 150 || this.isOverviewExpanded(movie.id)) {
      return overview;
    }
    return overview.slice(0, 150) + '...';
  }
}
