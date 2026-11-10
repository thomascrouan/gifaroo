import { Component, input, output } from '@angular/core';

@Component({
  imports: [],
  selector: 'app-search-bar',
  styleUrl: './search-bar.scss',
  templateUrl: './search-bar.html',
})
export class SearchBar {
  query = input('');
  queryChange = output<string>();

  protected onInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.queryChange.emit(input.value);
  }
}
