import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MoviesService } from '../../services/movies.service';
import { MoviesInterface } from '../../interface/movies.interface';
import { LoaderComponent } from '../../../shared/components/loader/loader.component';
import { PageHeader } from '../../../shared/components/page-header/page-header';

@Component({
  selector: 'app-random-movie',
  standalone: true,
  imports: [CommonModule, MatIconModule, MatButtonModule, LoaderComponent, PageHeader],
  templateUrl: './random-movie.html',
  styleUrl: './random-movie.scss',
})
export class RandomMovie implements OnInit {
  private readonly _moviesService: MoviesService = inject(MoviesService);

  movie = signal<MoviesInterface | null>(null);
  loading = signal<boolean>(true);
  expandedOverview = signal<boolean>(false);

  ngOnInit(): void {
    this.loadRandomMovie();
  }

  loadRandomMovie(): void {
    this.loading.set(true);
    this.expandedOverview.set(false);
    this._moviesService.getRandomMovie().subscribe({
      next: (response: { data: MoviesInterface }) => {
        this.movie.set(response.data);
        this.loading.set(false);
      },
      error: (err: unknown) => {
        console.error('Error loading random movie:', err);
        this.loading.set(false);
      },
    });
  }

  getMoviePoster(posterPath?: string): string {
    if (!posterPath) {
      return 'assets/images/default-movie.png';
    }
    return `https://image.tmdb.org/t/p/w500${posterPath}`;
  }

  onImageError(event: Event): void {
    const target = event.target as HTMLImageElement;
    target.src = 'assets/images/default-movie.png';
  }

  parseGenres(genres: string | { id: number; name: string }[] | undefined): string[] {
    if (!genres) return [];
    if (typeof genres === 'string') {
      try {
        const parsed = JSON.parse(genres.replace(/'/g, '"'));
        return parsed.map((g: { name: string }) => g.name);
      } catch {
        return [genres];
      }
    }
    return genres.map((g) => g.name);
  }

  toggleOverview(): void {
    this.expandedOverview.update((v) => !v);
  }

  getDisplayedOverview(): string {
    const movie = this.movie();
    if (!movie) return '';
    const overview = movie.overview || '';
    if (overview.length <= 300 || this.expandedOverview()) {
      return overview;
    }
    return overview.slice(0, 300) + '...';
  }

  formatRuntime(runtime?: number): string {
    if (!runtime) return 'N/A';
    const hours = Math.floor(runtime / 60);
    const minutes = runtime % 60;
    return `${hours}h ${minutes}m`;
  }
}
