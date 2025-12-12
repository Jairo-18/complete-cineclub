/* eslint-disable @typescript-eslint/no-explicit-any */
import { Component, inject, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatTabsModule } from '@angular/material/tabs';
import { MatIconModule } from '@angular/material/icon';
import { MatDialog } from '@angular/material/dialog';
import { forkJoin, Subscription } from 'rxjs';
import { CollectionsContent } from '../../components/collections-content/collections-content';
import { ReceivedCollectionRequestsComponent } from '../../components/received-collection-requests/received-collection-requests';
import { SentCollectionRequestsComponent } from '../../components/sent-collection-requests/sent-collection-requests';
import { CollectionsService } from '../../services/collections.service';
import { CollectionRequestService } from '../../../shared/services/collection-request.service';
import { NotificationsService } from '../../../shared/services/notifications.service';
import { TokenService } from '../../../auth/services/token.service';
import { YesNoDialogComponent } from '../../../shared/components/yes-no-dialog/yes-no-dialog.component';
import { MoviesInterface } from '../../interface/movies.interface';
import { CollectionRequestInterface } from '../../../shared/interfaces/collection-request.interface';
import { PaginationInterface } from '../../../shared/interfaces/pagination.interface';
import { PageHeader } from '../../../shared/components/page-header/page-header';

@Component({
  selector: 'app-my-collections',
  standalone: true,
  imports: [
    CommonModule,
    MatTabsModule,
    MatIconModule,
    CollectionsContent,
    ReceivedCollectionRequestsComponent,
    SentCollectionRequestsComponent,
    PageHeader,
  ],
  templateUrl: './my-collections.html',
  styleUrl: './my-collections.scss',
})
export class MyCollections implements OnInit, OnDestroy {
  private readonly _collectionsService: CollectionsService = inject(CollectionsService);
  private readonly _collectionRequestService: CollectionRequestService =
    inject(CollectionRequestService);
  private readonly _notificationsService: NotificationsService = inject(NotificationsService);
  private readonly _tokenService: TokenService = inject(TokenService);
  private readonly _dialog: MatDialog = inject(MatDialog);

  private _refreshSubscription: Subscription | undefined;

  movies: MoviesInterface[] = [];
  loadingMovies: boolean = false;
  isLoadingMoreMovies: boolean = false;
  moviesSearchTerm: string = '';

  moviesPagination: PaginationInterface = {
    page: 1,
    size: 10,
    total: 0,
    totalPages: 0,
    hasNext: false,
    hasPrevious: false,
  };

  receivedRequests: CollectionRequestInterface[] = [];
  loadingReceived: boolean = false;

  sentRequests: CollectionRequestInterface[] = [];
  loadingSent: boolean = false;

  private scrollHandler: (() => void) | null = null;
  private scrollTarget: EventTarget | null = null;

  ngOnInit() {
    this.loadInitialData();
    this.setupScrollListener();

    this._refreshSubscription = this._collectionRequestService.refreshMovies$.subscribe(() => {
      this.loadMovies(true);
    });
  }

  ngOnDestroy(): void {
    if (this._refreshSubscription) {
      this._refreshSubscription.unsubscribe();
    }
    if (this.scrollTarget && this.scrollHandler) {
      this.scrollTarget.removeEventListener('scroll', this.scrollHandler);
    }
  }

  loadInitialData() {
    this.loadingMovies = true;
    this.loadingReceived = true;
    this.moviesPagination.page = 1;
    this.movies = [];

    const moviesQuery = {
      page: 1,
      size: this.moviesPagination.size,
    };

    forkJoin({
      movies: this._collectionsService.getSavedMovies(moviesQuery),
      requests: this._collectionRequestService.getCollectionRequests(),
      sentRequests: this._collectionRequestService.getSentCollectionRequests(),
    }).subscribe({
      next: (res: any) => {
        const newMovies = res.movies.data?.flatMap((collection: any) => collection.movies) || [];
        this.movies = newMovies;
        this.moviesPagination = {
          ...this.moviesPagination,
          ...res.movies.pagination,
        };

        this.receivedRequests = res.requests.data || [];
        this.sentRequests = res.sentRequests.data || [];

        this.loadingMovies = false;
        this.loadingReceived = false;
        this.loadingSent = false;
      },
      error: (err) => {
        console.error('Error loading initial data', err);
        this.loadingMovies = false;
        this.loadingReceived = false;
        this.loadingSent = false;
      },
    });
  }

  private setupScrollListener() {
    const mainElement = document.querySelector('main.main');
    this.scrollTarget = mainElement || window;

    this.scrollHandler = () => {
      if (mainElement) {
        this.checkScroll(mainElement);
      } else {
        this.checkScrollWindow();
      }
    };

    this.scrollTarget.addEventListener('scroll', this.scrollHandler);
  }

  private checkScroll(element: Element) {
    const scrollPosition = element.scrollTop + element.clientHeight;
    const scrollHeight = element.scrollHeight;
    const scrollPercentage = (scrollPosition / scrollHeight) * 100;

    if (
      scrollPercentage >= 50 &&
      this.moviesPagination.hasNext &&
      !this.isLoadingMoreMovies &&
      !this.loadingMovies &&
      !this._tokenService.isLoggingOut()
    ) {
      this.loadMoreMovies();
    }
  }

  private checkScrollWindow() {
    const scrollPosition = window.pageYOffset + window.innerHeight;
    const pageHeight = document.documentElement.scrollHeight;
    const scrollPercentage = (scrollPosition / pageHeight) * 100;

    if (
      scrollPercentage >= 50 &&
      this.moviesPagination.hasNext &&
      !this.isLoadingMoreMovies &&
      !this.loadingMovies &&
      !this._tokenService.isLoggingOut()
    ) {
      this.loadMoreMovies();
    }
  }

  loadMovies(reset: boolean = false, background: boolean = false) {
    if (reset && !background) {
      this.loadingMovies = true;
      this.moviesPagination.page = 1;
      this.movies = [];
    } else if (reset && background) {
      this.moviesPagination.page = 1;
    } else {
      this.isLoadingMoreMovies = true;
    }

    const query: any = {
      page: this.moviesPagination.page,
      size: this.moviesPagination.size,
    };

    if (this.moviesSearchTerm && this.moviesSearchTerm.trim()) {
      query.title = this.moviesSearchTerm.trim();
    }

    this._collectionsService.getSavedMovies(query).subscribe({
      next: (res: any) => {
        const newMovies = res.data.flatMap((collection: any) => collection.movies) || [];

        let filteredBatch = newMovies;
        if (this.moviesSearchTerm && this.moviesSearchTerm.trim()) {
          const term = this.moviesSearchTerm.toLowerCase().trim();
          filteredBatch = newMovies.filter((movie: MoviesInterface) =>
            movie.title?.toLowerCase().includes(term),
          );
        }

        if (reset) {
          this.movies = filteredBatch;
        } else {
          this.movies = [...this.movies, ...filteredBatch];
        }

        this.moviesPagination = {
          ...this.moviesPagination,
          ...res.pagination,
        };

        this.loadingMovies = false;
        this.isLoadingMoreMovies = false;
      },
      error: () => {
        this.loadingMovies = false;
        this.isLoadingMoreMovies = false;
      },
    });
  }

  loadMoreMovies() {
    this.moviesPagination.page++;
    this.loadMovies(false);
  }

  onSearchMovies(searchTerm: string) {
    this.moviesSearchTerm = searchTerm;
    this.loadMovies(true);
  }

  onRemoveMovie(movieId: string) {
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
    this.movies = this.movies.filter((m) => m.id !== movieId);
    // this._notificationsService.success('Película eliminada correctamente');

    this._collectionsService.removeMovieFromCollection(movieId).subscribe({
      next: () => {
        this.loadMovies(true, true);
      },
      error: (err) => {
        console.error(err);
        this._notificationsService.error('No se pudo eliminar');

        this.loadMovies(true);
      },
    });
  }

  loadReceivedRequests() {
    this.loadingReceived = true;
    this._collectionRequestService.getCollectionRequests().subscribe({
      next: (res: any) => {
        this.receivedRequests = res.data || [];
        this.loadingReceived = false;
      },
      error: (err) => {
        console.error('Error loading collection requests', err);
        this.loadingReceived = false;
      },
    });
  }

  onAcceptRequest(requestId: string) {
    this.receivedRequests = this.receivedRequests.filter((r) => r.id !== requestId);

    this._collectionRequestService.acceptCollectionRequest(requestId).subscribe({
      next: (res: any) => {
        this._notificationsService.success(res.message || 'Colección aceptada');

        this.loadMovies(true, true);
      },
      error: (err) => {
        console.error('Error accepting request', err);
        this._notificationsService.error(err?.error?.message || 'Error al aceptar solicitud');

        this.loadReceivedRequests();
      },
    });
  }

  onRejectRequest(requestId: string) {
    this.receivedRequests = this.receivedRequests.filter((r) => r.id !== requestId);

    this._collectionRequestService.rejectCollectionRequest(requestId).subscribe({
      next: (res: any) => {
        this._notificationsService.success(res.message || 'Solicitud rechazada');
      },
      error: (err) => {
        console.error('Error rejecting request', err);
        this._notificationsService.error(err?.error?.message || 'Error al rechazar solicitud');

        this.loadReceivedRequests();
      },
    });
  }

  loadSentRequests() {
    this.loadingSent = true;
    this._collectionRequestService.getSentCollectionRequests().subscribe({
      next: (res: any) => {
        this.sentRequests = res.data || [];
        this.loadingSent = false;
      },
      error: (err) => {
        console.error('Error loading sent requests', err);
        this.loadingSent = false;
      },
    });
  }
}
