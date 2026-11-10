import { HttpClient } from '@angular/common/http';
import { Service, computed, inject, signal } from '@angular/core';
import { Observable, catchError, forkJoin, map, of, retry, switchMap, tap, throwError } from 'rxjs';
import { environment } from '../../../environments/environment';
import { toErrorMessage } from '../http/http-error';
import { Collection, CollectionGif, CollectionPayload, Gif } from '../models';

const PREVIEW_SIZE = 3;

@Service()
export class CollectionService {
  private readonly http = inject(HttpClient);
  private readonly collectionsUrl = `${environment.apiUrl}/collections`;
  private readonly collectionGifsUrl = `${environment.apiUrl}/collectionGifs`;

  private readonly collectionsSignal = signal<Collection[]>([]);
  private readonly collectionGifsSignal = signal<CollectionGif[]>([]);
  private readonly loadingSignal = signal(false);
  private readonly errorSignal = signal<string | null>(null);

  readonly collections = this.collectionsSignal.asReadonly();
  readonly collectionGifs = this.collectionGifsSignal.asReadonly();
  readonly loading = this.loadingSignal.asReadonly();
  readonly error = this.errorSignal.asReadonly();

  readonly count = computed(() => this.collectionsSignal().length);

  readonly sortedCollections = computed(() =>
    [...this.collectionsSignal()].sort((a, b) => a.name.localeCompare(b.name, 'fr')),
  );

  readonly gifCounts = computed(() => {
    const counts: Record<string, number> = {};
    for (const item of this.collectionGifsSignal()) {
      counts[item.collectionId] = (counts[item.collectionId] ?? 0) + 1;
    }
    return counts;
  });

  readonly previews = computed(() => {
    const previews: Record<string, Gif[]> = {};
    const sorted = [...this.collectionGifsSignal()].sort((a, b) =>
      b.addedAt.localeCompare(a.addedAt),
    );
    for (const item of sorted) {
      const gifs = (previews[item.collectionId] ??= []);
      if (gifs.length < PREVIEW_SIZE) {
        gifs.push(item.gif);
      }
    }
    return previews;
  });

  load(): void {
    this.loadingSignal.set(true);
    this.errorSignal.set(null);

    forkJoin({
      collections: this.http.get<Collection[]>(this.collectionsUrl),
      collectionGifs: this.http.get<CollectionGif[]>(this.collectionGifsUrl),
    })
      .pipe(retry(1))
      .subscribe({
        next: ({ collections, collectionGifs }) => {
          this.collectionsSignal.set(collections);
          this.collectionGifsSignal.set(collectionGifs);
          this.loadingSignal.set(false);
        },
        error: (error) => {
          this.errorSignal.set(toErrorMessage(error));
          this.loadingSignal.set(false);
        },
      });
  }

  create(payload: CollectionPayload): Observable<Collection> {
    const collection = { ...payload, createdAt: new Date().toISOString() };

    return this.http.post<Collection>(this.collectionsUrl, collection).pipe(
      tap((created) => {
        this.collectionsSignal.update((collections) => [...collections, created]);
      }),
      catchError(toError),
    );
  }

  update(id: string, payload: CollectionPayload): Observable<Collection> {
    return this.http.patch<Collection>(`${this.collectionsUrl}/${id}`, payload).pipe(
      tap((updated) => {
        this.collectionsSignal.update((collections) =>
          collections.map((c) => (c.id === id ? updated : c)),
        );
      }),
      catchError(toError),
    );
  }

  remove(id: string): Observable<void> {
    return this.fetchGifs(id).pipe(
      switchMap((gifs) => this.deleteGifs(gifs)),
      switchMap(() => this.http.delete<void>(`${this.collectionsUrl}/${id}`)),
      tap(() => {
        this.collectionsSignal.update((collections) => collections.filter((c) => c.id !== id));
        this.collectionGifsSignal.update((gifs) => gifs.filter((g) => g.collectionId !== id));
      }),
      map(() => undefined),
      catchError(toError),
    );
  }

  addGif(collectionId: string, gif: Gif): Observable<CollectionGif> {
    return this.fetchGifs(collectionId).pipe(
      switchMap((gifs) => {
        if (gifs.some((g) => g.gif.sourceId === gif.sourceId)) {
          return throwError(() => new Error('Ce GIF est déjà dans cette collection.'));
        }
        const collectionGif = { collectionId, gif, addedAt: new Date().toISOString() };
        return this.http.post<CollectionGif>(this.collectionGifsUrl, collectionGif);
      }),
      tap((created) => {
        this.collectionGifsSignal.update((gifs) => [...gifs, created]);
      }),
      catchError(toError),
    );
  }

  removeGif(collectionGifId: string): Observable<void> {
    return this.http.delete<void>(`${this.collectionGifsUrl}/${collectionGifId}`).pipe(
      tap(() => {
        this.collectionGifsSignal.update((gifs) => gifs.filter((g) => g.id !== collectionGifId));
      }),
      catchError(toError),
    );
  }

  nameExists(name: string, excludedId?: string): boolean {
    const searchedName = name.trim().toLowerCase();
    return this.collectionsSignal().some(
      (c) => c.id !== excludedId && c.name.trim().toLowerCase() === searchedName,
    );
  }

  collectionIdsWith(sourceId: string): Set<string> {
    return new Set(
      this.collectionGifsSignal()
        .filter((item) => item.gif.sourceId === sourceId)
        .map((item) => item.collectionId),
    );
  }

  private fetchGifs(collectionId: string): Observable<CollectionGif[]> {
    return this.http.get<CollectionGif[]>(this.collectionGifsUrl, { params: { collectionId } });
  }

  private deleteGifs(gifs: CollectionGif[]): Observable<unknown> {
    if (gifs.length === 0) {
      return of([]);
    }
    return forkJoin(gifs.map((g) => this.http.delete(`${this.collectionGifsUrl}/${g.id}`)));
  }
}

function toError(error: unknown): Observable<never> {
  return throwError(() => new Error(toErrorMessage(error)));
}
