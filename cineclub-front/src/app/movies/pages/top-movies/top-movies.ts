import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatMenuModule } from '@angular/material/menu';
import { MoviesService } from '../../services/movies.service';
import { MoviesInterface } from '../../interface/movies.interface';
import { LoaderComponent } from '../../../shared/components/loader/loader.component';
import { PageHeader } from '../../../shared/components/page-header/page-header';

@Component({
  selector: 'app-top-movies',
  standalone: true,
  imports: [
    CommonModule,
    MatProgressSpinnerModule,
    MatIconModule,
    MatButtonModule,
    MatMenuModule,
    LoaderComponent,
    PageHeader,
  ],
  templateUrl: './top-movies.html',
  styleUrl: './top-movies.scss',
})
export class TopMovies implements OnInit {
  private readonly _moviesService: MoviesService = inject(MoviesService);

  movies = signal<MoviesInterface[]>([]);
  loading = signal<boolean>(true);

  ngOnInit(): void {
    this.loadTopMovies();
  }

  loadTopMovies(): void {
    this.loading.set(true);
    this._moviesService.getTopMovies(10).subscribe({
      next: (response) => {
        this.movies.set(response.data);
        this.loading.set(false);
      },
      error: (err) => {
        console.error('Error loading top movies:', err);
        this.loading.set(false);
      },
    });
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

  expandedOverviews = signal<Record<string, boolean>>({});

  parseGenres(genres: string | { id: number; name: string }[] | undefined): string[] {
    if (!genres) return [];

    try {
      if (Array.isArray(genres)) {
        return genres.map((genre) => genre.name);
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

  toggleOverview(movieId: string): void {
    this.expandedOverviews.update((current) => ({
      ...current,
      [movieId]: !current[movieId],
    }));
  }

  isOverviewExpanded(movieId: string): boolean {
    return this.expandedOverviews()[movieId] || false;
  }

  getDisplayedOverview(movie: MoviesInterface): string {
    const overview = movie.overview || '';
    if (overview.length <= 150 || this.isOverviewExpanded(movie.id)) {
      return overview;
    }
    return overview.slice(0, 150) + '...';
  }

  formatRuntime(runtime: number): string {
    const hours = Math.floor(runtime / 60);
    const minutes = runtime % 60;
    return `${hours}h ${minutes}m`;
  }
}
