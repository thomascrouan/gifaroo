import { Component, ElementRef, effect, input, output, viewChild } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Collection } from '../../../core/models';

@Component({
  imports: [RouterLink],
  selector: 'app-collection-picker',
  styleUrl: './collection-picker.scss',
  templateUrl: './collection-picker.html',
  host: { '(document:keydown.escape)': 'onClose()' },
})
export class CollectionPicker {
  collections = input.required<readonly Collection[]>();
  gifCounts = input<Readonly<Record<string, number>>>({});
  containingIds = input<ReadonlySet<string>>(new Set());
  open = input(false);
  collectionSelected = output<Collection>();
  openChange = output<boolean>();

  private readonly panel = viewChild<ElementRef<HTMLElement>>('panel');
  private previousFocus: HTMLElement | null = null;

  constructor() {
    effect(() => {
      const panel = this.panel();
      if (panel) {
        this.previousFocus = document.activeElement as HTMLElement | null;
        panel.nativeElement.focus();
      }
    });
  }

  protected onSelect(collection: Collection): void {
    this.collectionSelected.emit(collection);
    this.onClose();
  }

  protected onClose(): void {
    if (!this.open()) return;

    this.openChange.emit(false);
    this.previousFocus?.focus();
    this.previousFocus = null;
  }
}
