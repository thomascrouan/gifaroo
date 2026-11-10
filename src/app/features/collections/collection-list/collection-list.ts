import { Component, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Gif } from '../../../core/models';
import { CollectionService } from '../../../core/services/collection.service';
import { StateMessage } from '../../../shared/components/state-message/state-message';

@Component({
  imports: [RouterLink, StateMessage],
  selector: 'app-collection-list',
  styleUrl: './collection-list.scss',
  templateUrl: './collection-list.html',
})
export class CollectionList {
  private readonly collectionService = inject(CollectionService);

  protected readonly collections = this.collectionService.sortedCollections;
  protected readonly loading = this.collectionService.loading;
  protected readonly error = this.collectionService.error;

  protected readonly pendingDeleteId = signal<string | null>(null);
  protected readonly deleting = signal(false);
  protected readonly deleteError = signal<string | null>(null);

  constructor() {
    this.collectionService.load();
  }

  protected gifCountLabel(collectionId: string): string {
    const count = this.collectionService.gifCounts()[collectionId] ?? 0;
    return count > 1 ? `${count} GIFs` : `${count} GIF`;
  }

  protected coverGifs(collectionId: string): Gif[] {
    return this.collectionService.previews()[collectionId] ?? [];
  }

  protected onReload(): void {
    this.collectionService.load();
  }

  protected onDeleteClick(id: string): void {
    this.deleteError.set(null);
    this.pendingDeleteId.set(id);
  }

  protected onCancelDelete(): void {
    this.pendingDeleteId.set(null);
  }

  protected onConfirmDelete(id: string): void {
    this.deleting.set(true);
    this.deleteError.set(null);

    this.collectionService.remove(id).subscribe({
      next: () => {
        this.deleting.set(false);
        this.pendingDeleteId.set(null);
      },
      error: (error: Error) => {
        this.deleting.set(false);
        this.pendingDeleteId.set(null);
        this.deleteError.set(`Suppression impossible : ${error.message}`);
      },
    });
  }
}
