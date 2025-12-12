import { Routes } from '@angular/router';
import { AuthCallBack } from './pages/auth-call-back/auth-call-back';
import { noAuthGuard } from '../shared/guards/noAuth.guard';

export const authRoutes: Routes = [
  {
    path: '',
    children: [
      {
        path: 'login',
        loadComponent: () => import('./pages/login/login').then((m) => m.Login),
        canActivate: [noAuthGuard],
      },
      {
        path: 'register',
        loadComponent: () => import('./pages/register/register').then((m) => m.Register),
        canActivate: [noAuthGuard],
      },
      {
        path: 'recover-password',
        loadComponent: () =>
          import('./pages/recover-password/recover-password').then((m) => m.RecoverPassword),
        canActivate: [noAuthGuard],
      },
      {
        path: 'set-password',
        loadComponent: () => import('./pages/set-password/set-password').then((m) => m.SetPassword),
      },
      {
        path: 'callback',
        component: AuthCallBack,
      },
      {
        path: 'send-email',
        loadComponent: () => import('./pages/send-email/send-email').then((m) => m.SendEmail),
        canActivate: [noAuthGuard],
      },
    ],
  },
];
