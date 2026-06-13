import { Routes } from '@angular/router';
import { authChildGuard, authGuard, guestGuard } from './core/auth/auth.guard';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./layout/public-shell/public-shell')
        .then(m => m.PublicShell),
    children: [
      {
        path: '',
        loadComponent: () =>
          import('./features/public/pages/landing-page/landing-page')
            .then(m => m.LandingPage),
      },
      {
        path: 'login',
        canActivate: [guestGuard],
        loadComponent: () =>
          import('./features/auth/pages/login-page/login-page')
            .then(m => m.LoginPage),
      },
      {
        path: 'register',
        canActivate: [guestGuard],
        loadComponent: () =>
          import('./features/auth/pages/register-page/register-page')
            .then(m => m.RegisterPage),
      },
    ],
  },
  {
    path: 'dashboard',
    canActivate: [authGuard],
    canActivateChild: [authChildGuard],
    loadComponent: () =>
      import('./layout/dashboard-shell/dashboard-shell')
        .then(m => m.DashboardShell),
    children: [
      {
        path: '',
        loadComponent: () =>
          import('./features/dashboard/pages/dashboard-page/dashboard-page')
            .then(m => m.DashboardPage),
      },
      {
        path: 'holdings',
        loadComponent: () =>
          import('./features/holdings/pages/holdings-page/holdings-page')
            .then(m => m.HoldingsPage),
      },
      {
        path: 'trades',
        loadComponent: () =>
          import('./features/trades/pages/trades-page/trades-page')
            .then(m => m.TradesPage),
      },
    ],
  },
  {
    path: '**',
    redirectTo: '',
  },
];
