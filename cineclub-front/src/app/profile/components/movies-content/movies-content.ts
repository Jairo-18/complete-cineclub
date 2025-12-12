/* eslint-disable @typescript-eslint/no-explicit-any */
import { Component, inject, OnInit, OnDestroy } from '@angular/core';
import { MoviesInterface } from '../../../movies/interface/movies.interface';
import { CommonModule } from '@angular/common';
import { MatDialog } from '@angular/material/dialog';
import { YesNoDialogComponent } from '../../../shared/components/yes-no-dialog/yes-no-dialog.component';
import { NotificationsService } from '../../../shared/services/notifications.service';
import { MatIcon } from '@angular/material/icon';
import { LoaderComponent } from '../../../shared/components/loader/loader.component';
import { FormsModule } from '@angular/forms';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatButtonModule } from '@angular/material/button';
import { PaginationInterface } from '../../../shared/interfaces/pagination.interface';
import { CollectionsService } from '../../../movies/services/collections.service';
import { SharedCollectionDialogComponent } from '../../../shared/components/shared-collection-dialog/shared-collection-dialog.component';
import { CollectionRequestService } from '../../../shared/services/collection-request.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-movies-content',
  standalone: true,
  imports: [
    CommonModule,
    MatIcon,
    LoaderComponent,
    FormsModule,
    MatPaginatorModule,
    MatInputModule,
    MatFormFieldModule,
    MatButtonModule,
  ],
  templateUrl: './movies-content.html',
  styleUrls: ['./movies-content.scss'],
})
export class MoviesContent implements OnInit, OnDestroy {
  movies: MoviesInterface[] = [];
  allMovies: MoviesInterface[] = [];
  loading = false;
  searchTerm = '';
  searchTimeout: any;

  paginationParams: PaginationInterface = {
    page: 1,
    size: 4,
    total: 0,
    totalPages: 0,
    hasNext: false,
    hasPrevious: false,
  };

  private readonly _collectionsService: CollectionsService = inject(CollectionsService);
  private readonly _collectionRequestService: CollectionRequestService =
    inject(CollectionRequestService);
  private readonly _dialog: MatDialog = inject(MatDialog);
  private readonly _notificationsService: NotificationsService = inject(NotificationsService);
  private _collectionsService_refreshSubscription: Subscription | undefined;

  ngOnInit() {
    this.loadSavedMovies();
    this._collectionsService_refreshSubscription =
      this._collectionRequestService.refreshMovies$.subscribe(() => {
        this.loadSavedMovies();
      });
  }

  ngOnDestroy(): void {
    if (this._collectionsService_refreshSubscription) {
      this._collectionsService_refreshSubscription.unsubscribe();
    }
  }

  loadSavedMovies(background: boolean = false) {
    if (!background) {
      this.loading = true;
    }

    this._collectionsService.getSavedMovies({ page: 1, size: 100 }).subscribe({
      next: (res) => {
        this.allMovies = res.data.flatMap((collection) => collection.movies) || [];

        this.applyFilterAndPagination();

        this.loading = false;
      },
      error: () => {
        this.loading = false;
      },
    });
  }

  applyFilterAndPagination() {
    let filteredMovies = this.allMovies;

    if (this.searchTerm && this.searchTerm.trim()) {
      const term = this.searchTerm.toLowerCase().trim();
      filteredMovies = this.allMovies.filter((movie) => movie.title?.toLowerCase().includes(term));
    }

    this.paginationParams.total = filteredMovies.length;
    this.paginationParams.totalPages = Math.ceil(
      this.paginationParams.total / this.paginationParams.size,
    );

    const startIndex = (this.paginationParams.page - 1) * this.paginationParams.size;
    const endIndex = startIndex + this.paginationParams.size;

    this.movies = filteredMovies.slice(startIndex, endIndex);
  }

  onChangePagination(event: PageEvent): void {
    this.paginationParams.page = event.pageIndex + 1;
    this.paginationParams.size = event.pageSize;
    this.applyFilterAndPagination();
  }

  onSearchChange(): void {
    if (this.searchTimeout) {
      clearTimeout(this.searchTimeout);
    }

    this.searchTimeout = setTimeout(() => {
      this.paginationParams.page = 1;
      this.applyFilterAndPagination();
    }, 500);
  }

  clearSearch(): void {
    this.searchTerm = '';
    this.paginationParams.page = 1;
    this.applyFilterAndPagination();
  }

  openDeleteMovieDialog(movieId: string) {
    const dialogRef = this._dialog.open(YesNoDialogComponent, {
      data: {
        title: '¿Eliminar de la colección?',
        message: 'Esta acción no se puede deshacer.',
      },
    });

    dialogRef.afterClosed().subscribe((confirm) => {
      if (confirm) {
        this.removeMovie(movieId);
      }
    });
  }

  removeMovie(movieId: string) {
    this.allMovies = this.allMovies.filter((m) => m.id !== movieId);
    this.applyFilterAndPagination();
    // this._notificationsService.success('Película eliminada correctamente');

    this._collectionsService.removeMovieFromCollection(movieId).subscribe({
      next: () => {
        this.loadSavedMovies(true);
      },
      error: (err) => {
        console.error(err);
        this._notificationsService.error('No se pudo eliminar');

        this.loadSavedMovies(false);
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

  openShareDialog() {
    this._dialog.open(SharedCollectionDialogComponent, {
      width: '600px',
      maxWidth: '90vw',
    });
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
