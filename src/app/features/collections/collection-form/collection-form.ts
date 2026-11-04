import { Component, computed, input } from '@angular/core';

@Component({
  selector: 'app-collection-form',
  templateUrl: './collection-form.html',
  styleUrl: './collection-form.scss',
})
export class CollectionForm {
  readonly id = input<string>();
  readonly isEdit = computed(() => !!this.id());
}
