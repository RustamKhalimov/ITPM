
import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    redirectTo: 'overview',
    pathMatch: 'full'
  },
  {
    path: 'login',
    loadComponent: () =>
      import('./pages/login/login')
        .then(m => m.Login)
  },
  {
    path: 'register',
    loadComponent: () =>
      import('./pages/register/register')
        .then(m => m.Register)
  },
  {
    path: 'account',
    loadComponent: () =>
      import('./pages/account/account')
        .then(m => m.Account)
  },
  {
    path: 'overview',
    loadComponent: () =>
      import('./pages/overview/overview')
        .then(m => m.Overview)
  },
  {
    path: 'inventory',
    loadComponent: () =>
      import('./pages/inventory/inventory')
        .then(m => m.Inventory)
  },
  {
    path: 'rules',
    loadComponent: () =>
      import('./pages/rules/rules')
        .then(m => m.Rules)
  },
  {
    path: '**',
    redirectTo: 'overview'
  }
];
