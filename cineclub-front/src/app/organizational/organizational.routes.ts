import { Routes } from '@angular/router';

export const organizationalRoutes: Routes = [
  {
    path: 'see-users',
    loadComponent: () => import('./pages/see-users/see-users').then((m) => m.SeeUsers),
  },
  {
    path: 'edit-user/:id',
    loadComponent: () =>
      import('./pages/edit-user-panel/edit-user-panel').then((m) => m.EditUserPanel),
  },
];
