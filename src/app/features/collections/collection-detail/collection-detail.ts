import { Component, computed, inject, input, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { CollectionGif, Gif } from '../../../core/models';
import { CollectionService } from '../../../core/services/collection.service';
import { FavoriteService } from '../../../core/services/favorite.service';
import { GifCard } from '../../../shared/components/gif-card/gif-card';
import { StateMessage } from '../../../shared/components/state-message/state-message';

const DATE_FORMAT = new Intl.DateTimeFormat('fr-FR', {
  day: 'numeric',
  month: 'long',
  year: 'numeric',
});

@Component({
  imports: [GifCard, RouterLink, StateMessage],
  selector: 'app-collection-detail',
  styleUrl: './collection-detail.scss',
  templateUrl: './collection-detail.html',
})
export class CollectionDetail {
  /** Filled from the `:id` route parameter thanks to withComponentInputBinding(). */
  id = input.required<string>();

  private readonly collectionService = inject(CollectionService);
  private readonly favoriteService = inject(FavoriteService);
  private readonly router = inject(Router);

  protected readonly loading = this.collectionService.loading;
  protected readonly error = this.collectionService.error;
  protected readonly favoriteIds = this.favoriteService.favoriteIds;

  protected readonly removingId = signal<string | null>(null);
  protected readonly actionError = signal<string | null>(null);
  protected readonly confirmingDelete = signal(false);
  protected readonly deleting = signal(false);

  protected readonly collection = computed(() =>
    this.collectionService.collections().find((c) => c.id === this.id()),
  );

  protected readonly gifs = computed(() =>
    this.collectionService.collectionGifs().filter((g) => g.collectionId === this.id()),
  );

  protected readonly createdLabel = computed(() => {
    const date = new Date(this.collection()?.createdAt ?? '');
    return Number.isNaN(date.getTime()) ? null : DATE_FORMAT.format(date);
  });

  constructor() {
    this.collectionService.load();
    this.favoriteService.load();
  }

  protected onReload(): void {
    this.collectionService.load();
  }

  protected onFavoriteToggled(gif: Gif): void {
    this.actionError.set(null);
    this.favoriteService.toggle(gif).subscribe({
      error: (error: Error) => this.actionError.set(`Favori non modifié : ${error.message}`),
    });
  }

  protected onRemoveClick(collectionGif: CollectionGif): void {
    this.removingId.set(collectionGif.id);
    this.actionError.set(null);

    this.collectionService.removeGif(collectionGif.id).subscribe({
      next: () => this.removingId.set(null),
      error: (error: Error) => {
        this.removingId.set(null);
        this.actionError.set(`Impossible de retirer le GIF : ${error.message}`);
      },
    });
  }

  protected onDeleteClick(): void {
    this.actionError.set(null);
    this.confirmingDelete.set(true);
  }

  protected onCancelDelete(): void {
    this.confirmingDelete.set(false);
  }

  protected onConfirmDelete(): void {
    this.deleting.set(true);
    this.actionError.set(null);

    this.collectionService.remove(this.id()).subscribe({
      next: () => this.router.navigate(['/collections']),
      error: (error: Error) => {
        this.deleting.set(false);
        this.confirmingDelete.set(false);
        this.actionError.set(`Suppression impossible : ${error.message}`);
      },
    });
  }
}
