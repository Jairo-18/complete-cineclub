/* eslint-disable @typescript-eslint/no-explicit-any */
import { Component, inject, OnInit } from '@angular/core';
import { BaseDialogComponent } from '../base-dialog/base-dialog.component';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import {
  MatAutocompleteModule,
  MatAutocompleteSelectedEvent,
} from '@angular/material/autocomplete';
import { MatIconModule } from '@angular/material/icon';
import { MatOptionModule } from '@angular/material/core';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import {
  FormBuilder,
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { CommonModule } from '@angular/common';
import { MoviesService } from '../../../movies/services/movies.service';
import { MoviesInterface } from '../../../movies/interface/movies.interface';
import { debounceTime, distinctUntilChanged, map } from 'rxjs';

@Component({
  selector: 'app-create-review-dialog',
  standalone: true,
  imports: [
    BaseDialogComponent,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatAutocompleteModule,
    MatIconModule,
    MatOptionModule,
    MatProgressSpinnerModule,
    MatTooltipModule,
    ReactiveFormsModule,
    CommonModule,
  ],
  templateUrl: './create-review-dialog.component.html',
  styleUrl: './create-review-dialog.component.scss',
})
export class CreateReviewDialogComponent implements OnInit {
  private readonly dialogRef = inject(MatDialogRef<CreateReviewDialogComponent>);
  private readonly fb = inject(FormBuilder);
  private readonly moviesService = inject(MoviesService);
  public data?: {
    title?: string;
    message?: string;
    isEdit?: boolean;
    reviewData?: { content: string; rating: number; movieTitle?: string };
  } = inject(MAT_DIALOG_DATA);

  reviewForm!: FormGroup;
  movies: MoviesInterface[] = [];
  filteredMovies: MoviesInterface[] = [];
  movieFilterControl = new FormControl<string | MoviesInterface | null>('');
  isLoadingMovies = false;
  rating = 0;
  hoveredRating = 0;
  isEditMode = false;

  ngOnInit(): void {
    this.isEditMode = this.data?.isEdit || false;

    this.reviewForm = this.fb.group({
      content: ['', [Validators.required, Validators.minLength(10), Validators.maxLength(500)]],
      rating: [0, [Validators.required, Validators.min(0.5), Validators.max(5)]],
      movieId: ['', this.isEditMode ? [] : Validators.required],
    });

    if (this.isEditMode && this.data?.reviewData) {
      this.reviewForm.patchValue({
        content: this.data.reviewData.content,
        rating: this.data.reviewData.rating,
      });
      this.rating = this.data.reviewData.rating;

      const movieTitle = this.data.reviewData.movieTitle;
      if (movieTitle) {
        setTimeout(() => {
          this.movieFilterControl.setValue(movieTitle);
          this.movieFilterControl.disable();
        });
      } else {
        console.warn('No se encontró movieTitle en reviewData');
        this.movieFilterControl.disable();
      }
    } else {
      this.setupMovieAutocomplete();
    }
  }

  private fetchMovies(): void {
    this.isLoadingMovies = true;
    const params = {
      page: 1,
      size: 10,
    };

    this.moviesService.getMoviesWithPagination(params).subscribe({
      next: (response: any) => {
        this.movies = response.data;
        this.filteredMovies = this.movies;
        this.isLoadingMovies = false;
      },
      error: (error: any) => {
        console.error('Error fetching movies:', error);
        this.isLoadingMovies = false;
      },
    });
  }

  private setupMovieAutocomplete(): void {
    this.movieFilterControl.valueChanges
      .pipe(
        map((value) => (typeof value === 'string' ? value : (value?.title ?? ''))),
        debounceTime(700),
        distinctUntilChanged(),
      )
      .subscribe((query: string) => {
        this.searchMovies(query);
      });
  }

  private searchMovies(query: string): void {
    if (!query || query.length < 2) {
      this.fetchMovies();
      return;
    }

    this.isLoadingMovies = true;
    const params = {
      page: 1,
      size: 10,
      title: query.trim(),
    };

    this.moviesService.getMoviesWithPagination(params).subscribe({
      next: (response: any) => {
        this.filteredMovies = response.data || [];
        this.isLoadingMovies = false;
      },
      error: (error: any) => {
        console.error('Error searching movies:', error);
        this.isLoadingMovies = false;
        this.filteredMovies = [];
      },
    });
  }

  onMovieFocus(): void {
    if (!this.filteredMovies.length && !this.movieFilterControl.value) {
      this.fetchMovies();
    }
  }

  onMovieBlur(): void {
    this.reviewForm.get('movieId')?.markAsTouched();
  }

  setRating(value: number): void {
    this.rating = value;
    this.reviewForm.patchValue({ rating: value });
    this.reviewForm.get('rating')?.markAsTouched();
  }

  setHoverRating(value: number): void {
    this.hoveredRating = value;
  }

  clearHoverRating(): void {
    this.hoveredRating = 0;
  }

  getStarIcon(position: number): string {
    const currentRating = this.hoveredRating || this.rating;

    if (currentRating >= position) {
      return 'star';
    } else if (currentRating >= position - 0.5) {
      return 'star_half';
    } else {
      return 'star_outline';
    }
  }

  onMovieSelected(event: MatAutocompleteSelectedEvent): void {
    const movie = event.option.value as MoviesInterface;
    if (movie && movie.id) {
      this.reviewForm.patchValue({ movieId: movie.id });
    }
  }

  clearMovieSelection(): void {
    this.reviewForm.patchValue({ movieId: '' });
    this.movieFilterControl.setValue('');
  }

  get showNoResultsMessage(): boolean {
    const value = this.movieFilterControl.value;
    const searchText = typeof value === 'string' ? value : '';
    return (
      !this.isLoadingMovies &&
      this.filteredMovies.length === 0 &&
      !!searchText &&
      searchText.length >= 2
    );
  }

  displayMovie(movie: MoviesInterface | string | null): string {
    if (typeof movie === 'string') {
      return movie;
    }
    return movie?.title || '';
  }

  submitReview(): void {
    this.reviewForm.markAllAsTouched();

    if (this.reviewForm.valid) {
      const reviewData = {
        content: this.reviewForm.value.content,
        rating: this.reviewForm.value.rating,
        movieId: this.reviewForm.value.movieId,
      };
      this.dialogRef.close(reviewData);
    }
  }

  cancelAction(): void {
    this.dialogRef.close(null);
  }
}
