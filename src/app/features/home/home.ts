import { Component, computed, effect, inject, signal } from '@angular/core';
import { toObservable, toSignal } from '@angular/core/rxjs-interop';
import { Observable, Subscription, debounceTime, distinctUntilChanged, map } from 'rxjs';
import { Collection, Gif, GifPage } from '../../core/models';
import { CollectionService } from '../../core/services/collection.service';
import { FavoriteService } from '../../core/services/favorite.service';
import { KlipyService } from '../../core/services/klipy.service';
import { CollectionPicker } from '../../shared/components/collection-picker/collection-picker';
import { GifGrid } from '../../shared/components/gif-grid/gif-grid';
import { SearchBar } from '../../shared/components/search-bar/search-bar';
import { StateMessage } from '../../shared/components/state-message/state-message';

const MIN_QUERY_LENGTH = 2;

@Component({
  imports: [CollectionPicker, GifGrid, SearchBar, StateMessage],
  selector: 'app-home',
  styleUrl: './home.scss',
  templateUrl: './home.html',
})
export class Home {
  private readonly klipyService = inject(KlipyService);
  private readonly favoriteService = inject(FavoriteService);
  private readonly collectionService = inject(CollectionService);

  protected readonly query = signal('');

  private readonly searchTerm = toSignal(
    toObservable(this.query).pipe(
      debounceTime(400),
      map((query) => query.trim()),
      map((query) => (query.length >= MIN_QUERY_LENGTH ? query : '')),
      distinctUntilChanged(),
    ),
    { initialValue: '' },
  );

  protected readonly gifs = signal<Gif[]>([]);
  protected readonly hasNext = signal(false);
  protected readonly loading = signal(false);
  protected readonly loadingMore = signal(false);
  protected readonly error = signal<string | null>(null);
  protected readonly loadMoreError = signal<string | null>(null);

  protected readonly favoriteIds = this.favoriteService.favoriteIds;
  protected readonly collections = this.collectionService.sortedCollections;
  protected readonly gifCounts = this.collectionService.gifCounts;

  protected readonly pickerOpen = signal(false);
  protected readonly successMessage = signal<string | null>(null);
  protected readonly errorMessage = signal<string | null>(null);

  protected readonly title = computed(() => {
    const term = this.searchTerm();
    return term ? `Résultats pour « ${term} »` : 'Tendances';
  });

  protected readonly emptyHeading = computed(() => {
    const term = this.searchTerm();
    return term ? `Aucun GIF pour « ${term} »` : 'Aucun GIF pour le moment';
  });

  protected readonly emptyMessage = computed(() =>
    this.searchTerm() ? 'Essaie un mot plus court, ou en anglais.' : 'Réessaie dans quelques instants.',
  );

  protected readonly showMinLengthHint = computed(() => {
    const length = this.query().trim().length;
    return length > 0 && length < MIN_QUERY_LENGTH;
  });

  private readonly selectedGif = signal<Gif | null>(null);

  protected readonly containingIds = computed(() => {
    const gif = this.selectedGif();
    return gif ? this.collectionService.collectionIdsWith(gif.sourceId) : new Set<string>();
  });
  private currentPage = 1;
  private request?: Subscription;

  constructor() {
    this.favoriteService.load();
    this.collectionService.load();

    effect(() => {
      this.searchTerm();
      this.loadFirstPage();
    });
  }

  protected onReload(): void {
    this.loadFirstPage();
  }

  protected onLoadMore(): void {
    this.loadingMore.set(true);
    this.loadMoreError.set(null);

    this.request?.unsubscribe();
    this.request = this.getPage(this.currentPage + 1).subscribe({
      next: (page) => {
        this.currentPage++;
        this.gifs.update((gifs) => [...gifs, ...page.gifs]);
        this.hasNext.set(page.hasNext);
        this.loadingMore.set(false);
      },
      error: (error: Error) => {
        this.loadMoreError.set(error.message);
        this.loadingMore.set(false);
      },
    });
  }

  protected onFavoriteToggled(gif: Gif): void {
    this.favoriteService.toggle(gif).subscribe({
      error: (error: Error) => this.showError(`Favori non modifié : ${error.message}`),
    });
  }

  protected onAddToCollectionRequested(gif: Gif): void {
    this.selectedGif.set(gif);
    this.pickerOpen.set(true);
  }

  protected onCollectionSelected(collection: Collection): void {
    const gif = this.selectedGif();
    if (!gif) return;

    this.collectionService.addGif(collection.id, gif).subscribe({
      next: () => this.showSuccess(`Ajouté à « ${collection.name} ».`),
      error: (error: Error) => this.showError(error.message),
    });
  }

  private loadFirstPage(): void {
    this.currentPage = 1;
    this.loading.set(true);
    this.error.set(null);
    this.loadMoreError.set(null);

    this.request?.unsubscribe();
    this.request = this.getPage(1).subscribe({
      next: (page) => {
        this.gifs.set(page.gifs);
        this.hasNext.set(page.hasNext);
        this.loading.set(false);
      },
      error: (error: Error) => {
        this.gifs.set([]);
        this.error.set(error.message);
        this.loading.set(false);
      },
    });
  }

  private getPage(page: number): Observable<GifPage> {
    const term = this.searchTerm();
    return term ? this.klipyService.search(term, page) : this.klipyService.trending(page);
  }

  private showSuccess(message: string): void {
    this.errorMessage.set(null);
    this.successMessage.set(message);
  }

  private showError(message: string): void {
    this.successMessage.set(null);
    this.errorMessage.set(message);
  }
}
