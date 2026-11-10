import { HttpClient } from '@angular/common/http';
import { Service, computed, inject, signal } from '@angular/core';
import { Observable, catchError, map, retry, tap, throwError } from 'rxjs';
import { environment } from '../../../environments/environment';
import { toErrorMessage } from '../http/http-error';
import { Favorite, Gif } from '../models';

@Service()
export class FavoriteService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = `${environment.apiUrl}/favorites`;

  private readonly favoritesSignal = signal<Favorite[]>([]);
  private readonly loadingSignal = signal(false);
  private readonly errorSignal = signal<string | null>(null);

  readonly favorites = this.favoritesSignal.asReadonly();
  readonly loading = this.loadingSignal.asReadonly();
  readonly error = this.errorSignal.asReadonly();

  readonly count = computed(() => this.favoritesSignal().length);

  readonly gifs = computed(() =>
    [...this.favoritesSignal()]
      .sort((a, b) => b.addedAt.localeCompare(a.addedAt))
      .map((favorite) => favorite.gif),
  );

  readonly favoriteIds = computed(
    () => new Set(this.favoritesSignal().map((favorite) => favorite.gif.sourceId)),
  );

  load(): void {
    this.loadingSignal.set(true);
    this.errorSignal.set(null);

    this.http
      .get<Favorite[]>(this.apiUrl)
      .pipe(retry(1))
      .subscribe({
        next: (favorites) => {
          this.favoritesSignal.set(favorites);
          this.loadingSignal.set(false);
        },
        error: (error) => {
          this.errorSignal.set(toErrorMessage(error));
          this.loadingSignal.set(false);
        },
      });
  }

  isFavorite(sourceId: string): boolean {
    return this.favoriteIds().has(sourceId);
  }

  toggle(gif: Gif): Observable<void> {
    const favorite = this.favoritesSignal().find((f) => f.gif.sourceId === gif.sourceId);
    return favorite ? this.remove(favorite) : this.add(gif);
  }

  private add(gif: Gif): Observable<void> {
    const favorite = { gif, addedAt: new Date().toISOString() };

    return this.http.post<Favorite>(this.apiUrl, favorite).pipe(
      tap((created) => {
        this.favoritesSignal.update((favorites) => [...favorites, created]);
      }),
      map(() => undefined),
      catchError((error) => throwError(() => new Error(toErrorMessage(error)))),
    );
  }

  private remove(favorite: Favorite): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${favorite.id}`).pipe(
      tap(() => {
        this.favoritesSignal.update((favorites) => favorites.filter((f) => f.id !== favorite.id));
      }),
      catchError((error) => throwError(() => new Error(toErrorMessage(error)))),
    );
  }
}
