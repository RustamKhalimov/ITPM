
import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    redirectTo: 'overview',
    pathMatch: 'full'
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
  }
];
