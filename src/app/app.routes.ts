import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./features/dashboard/pages/dashboard-page/dashboard-page')
        .then(m => m.DashboardPage)
  },
  {
    path: 'holdings',
    loadComponent: () =>
      import('./features/holdings/pages/holdings-page/holdings-page')
        .then(m => m.HoldingsPage)
  }
];