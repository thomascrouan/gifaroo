import { Component, computed, input, output, signal } from '@angular/core';
import { Gif } from '../../../core/models';

type CopyState = 'idle' | 'copied' | 'error';

const PLACEHOLDER =
  'data:image/svg+xml;utf8,' +
  encodeURIComponent(
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><rect width="100" height="100" fill="#eee"/><text x="50" y="56" font-family="sans-serif" font-size="12" text-anchor="middle" fill="#999">GIF indisponible</text></svg>',
  );

@Component({
  imports: [],
  selector: 'app-gif-card',
  styleUrl: './gif-card.scss',
  templateUrl: './gif-card.html',
})
export class GifCard {
  gif = input.required<Gif>();
  isFavorite = input(false);
  canAddToCollection = input(true);
  favoriteToggled = output<Gif>();
  addToCollectionRequested = output<Gif>();

  protected readonly imageBroken = signal(false);
  protected readonly copyState = signal<CopyState>('idle');

  protected readonly imageSrc = computed(() =>
    this.imageBroken() ? PLACEHOLDER : this.gif().previewUrl,
  );

  protected readonly favoriteLabel = computed(() =>
    this.isFavorite() ? 'Retirer des favoris' : 'Ajouter aux favoris',
  );

  protected readonly copyIcon = computed(() => {
    if (this.copyState() === 'copied') return '✅';
    if (this.copyState() === 'error') return '⚠️';
    return '🔗';
  });

  protected readonly copyMessage = computed(() => {
    if (this.copyState() === 'copied') return 'Lien copié dans le presse-papier';
    if (this.copyState() === 'error') return 'Impossible de copier le lien';
    return '';
  });

  protected onImageError(): void {
    this.imageBroken.set(true);
  }

  protected onFavoriteClick(): void {
    this.favoriteToggled.emit(this.gif());
  }

  protected onAddToCollectionClick(): void {
    this.addToCollectionRequested.emit(this.gif());
  }

  protected onCopyClick(): void {
    navigator.clipboard.writeText(this.gif().url).then(
      () => this.showCopyState('copied'),
      () => this.showCopyState('error'),
    );
  }

  private showCopyState(state: CopyState): void {
    this.copyState.set(state);
    setTimeout(() => this.copyState.set('idle'), 2000);
  }
}
