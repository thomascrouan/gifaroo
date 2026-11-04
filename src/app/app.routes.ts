import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    title: 'Gifaroo',
    loadComponent: () => import('./features/home/home').then((m) => m.Home),
  },
  {
    path: 'favorites',
    title: 'Favoris · Gifaroo',
    loadComponent: () => import('./features/favorites/favorites').then((m) => m.Favorites),
  },
  {
    path: 'collections',
    title: 'Collections · Gifaroo',
    loadComponent: () =>
      import('./features/collections/collection-list/collection-list').then(
        (m) => m.CollectionList,
      ),
  },
  {
    path: 'collections/new',
    title: 'Nouvelle collection · Gifaroo',
    loadComponent: () =>
      import('./features/collections/collection-form/collection-form').then(
        (m) => m.CollectionForm,
      ),
  },
  {
    path: 'collections/:id',
    title: 'Collection · Gifaroo',
    loadComponent: () =>
      import('./features/collections/collection-detail/collection-detail').then(
        (m) => m.CollectionDetail,
      ),
  },
  {
    path: 'collections/:id/edit',
    title: 'Modifier la collection · Gifaroo',
    loadComponent: () =>
      import('./features/collections/collection-form/collection-form').then(
        (m) => m.CollectionForm,
      ),
  },
  {
    path: '**',
    title: 'Page introuvable · Gifaroo',
    loadComponent: () => import('./features/not-found/not-found').then((m) => m.NotFound),
  },
];
