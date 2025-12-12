import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MoviesInterface } from '../../interface/movies.interface';
import { LoaderComponent } from '../../../shared/components/loader/loader.component';

@Component({
  selector: 'app-collections-content',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatIconModule,
    MatInputModule,
    MatFormFieldModule,
    MatButtonModule,
    MatProgressSpinnerModule,
    LoaderComponent,
  ],
  templateUrl: './collections-content.html',
  styleUrl: './collections-content.scss',
})
export class CollectionsContent {
  @Input() movies: MoviesInterface[] = [];
  @Input() loading: boolean = false;
  @Input() isLoadingMore: boolean = false;
  @Input() hasNext: boolean = false;

  // eslint-disable-next-line @angular-eslint/no-output-native
  @Output() search = new EventEmitter<string>();
  @Output() loadMore = new EventEmitter<void>();
  @Output() removeMovie = new EventEmitter<string>();

  searchTerm: string = '';
  private searchTimeout: ReturnType<typeof setTimeout> | null = null;
  expandedOverviews: Record<string, boolean> = {};

  onSearchChange() {
    if (this.searchTimeout) {
      clearTimeout(this.searchTimeout);
    }
    this.searchTimeout = setTimeout(() => {
      this.search.emit(this.searchTerm);
    }, 500);
  }

  clearSearch() {
    this.searchTerm = '';
    this.search.emit('');
  }

  onRemoveMovie(movieId: string) {
    this.removeMovie.emit(movieId);
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

  formatRuntime(runtime: number): string {
    const hours = Math.floor(runtime / 60);
    const minutes = runtime % 60;
    return `${hours}h ${minutes}m`;
  }
}
