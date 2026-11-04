import { Component, input } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-collection-detail',
  imports: [RouterLink],
  templateUrl: './collection-detail.html',
  styleUrl: './collection-detail.scss',
})
export class CollectionDetail {
  /** Filled from the `:id` route parameter thanks to withComponentInputBinding(). */
  readonly id = input.required<string>();
}
