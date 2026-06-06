import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    redirectTo: 'holdings',
    pathMatch: 'full'
  },
  {
    path: 'holdings',
    loadComponent: () =>
      import('./features/holdings/pages/holdings-page/holdings-page')
        .then(m => m.HoldingsPage)
  }
];