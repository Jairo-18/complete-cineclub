import { Routes } from '@angular/router';
import { LibraryMovies } from './pages/library-movies/library-movies';

export const moviesRoutes: Routes = [
  {
    path: '',
    children: [
      {
        path: 'library-movies',
        component: LibraryMovies,
      },
      {
        path: 'top',
        loadComponent: () => import('./pages/top-movies/top-movies').then((m) => m.TopMovies),
      },
      {
        path: 'my-collections',
        loadComponent: () =>
          import('./pages/my-collections/my-collections').then((m) => m.MyCollections),
      },
      {
        path: 'random',
        loadComponent: () => import('./pages/random-movie/random-movie').then((m) => m.RandomMovie),
      },
    ],
  },
];
