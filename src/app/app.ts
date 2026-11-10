import { Component, inject } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { FavoriteService } from './core/services/favorite.service';

@Component({
  imports: [RouterOutlet, RouterLink, RouterLinkActive],
  selector: 'app-root',
  styleUrl: './app.scss',
  templateUrl: './app.html',
})
export class App {
  private readonly favoriteService = inject(FavoriteService);

  protected readonly favoriteCount = this.favoriteService.count;

  constructor() {
    this.favoriteService.load();
  }

  protected onSkipToContent(event: Event): void {
    event.preventDefault();
    document.getElementById('main-content')?.focus();
  }
}
