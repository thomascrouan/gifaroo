import { Component, input, output } from '@angular/core';
import { Gif } from '../../../core/models';
import { GifCard } from '../gif-card/gif-card';

@Component({
  imports: [GifCard],
  selector: 'app-gif-grid',
  styleUrl: './gif-grid.scss',
  templateUrl: './gif-grid.html',
})
export class GifGrid {
  gifs = input.required<Gif[]>();
  favoriteIds = input<ReadonlySet<string>>(new Set());
  favoriteToggled = output<Gif>();
  addToCollectionRequested = output<Gif>();

  protected onFavoriteToggled(gif: Gif): void {
    this.favoriteToggled.emit(gif);
  }

  protected onAddToCollectionRequested(gif: Gif): void {
    this.addToCollectionRequested.emit(gif);
  }
}
