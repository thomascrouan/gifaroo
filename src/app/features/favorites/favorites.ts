import { Component, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Collection, Gif } from '../../core/models';
import { CollectionService } from '../../core/services/collection.service';
import { FavoriteService } from '../../core/services/favorite.service';
import { CollectionPicker } from '../../shared/components/collection-picker/collection-picker';
import { GifGrid } from '../../shared/components/gif-grid/gif-grid';
import { StateMessage } from '../../shared/components/state-message/state-message';

@Component({
  imports: [CollectionPicker, GifGrid, RouterLink, StateMessage],
  selector: 'app-favorites',
  styleUrl: './favorites.scss',
  templateUrl: './favorites.html',
})
export class Favorites {
  private readonly favoriteService = inject(FavoriteService);
  private readonly collectionService = inject(CollectionService);

  protected readonly gifs = this.favoriteService.gifs;
  protected readonly favoriteIds = this.favoriteService.favoriteIds;
  protected readonly loading = this.favoriteService.loading;
  protected readonly error = this.favoriteService.error;
  protected readonly collections = this.collectionService.sortedCollections;
  protected readonly gifCounts = this.collectionService.gifCounts;

  protected readonly pickerOpen = signal(false);
  protected readonly successMessage = signal<string | null>(null);
  protected readonly errorMessage = signal<string | null>(null);

  private readonly selectedGif = signal<Gif | null>(null);

  protected readonly containingIds = computed(() => {
    const gif = this.selectedGif();
    return gif ? this.collectionService.collectionIdsWith(gif.sourceId) : new Set<string>();
  });

  constructor() {
    this.favoriteService.load();
    this.collectionService.load();
  }

  protected onReload(): void {
    this.favoriteService.load();
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

  private showSuccess(message: string): void {
    this.errorMessage.set(null);
    this.successMessage.set(message);
  }

  private showError(message: string): void {
    this.successMessage.set(null);
    this.errorMessage.set(message);
  }
}
