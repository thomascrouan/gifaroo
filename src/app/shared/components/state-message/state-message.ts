import { Component, computed, input, output } from '@angular/core';

export type StateType = 'loading' | 'error' | 'empty';

const DEFAULT_MESSAGES: Record<StateType, string> = {
  loading: 'Chargement…',
  error: 'Une erreur est survenue.',
  empty: 'Rien à afficher pour le moment.',
};

@Component({
  imports: [],
  selector: 'app-state-message',
  styleUrl: './state-message.scss',
  templateUrl: './state-message.html',
})
export class StateMessage {
  type = input.required<StateType>();
  heading = input<string | null>(null);
  message = input<string | null>(null);
  retry = output<void>();

  protected readonly text = computed(() => this.message() || DEFAULT_MESSAGES[this.type()]);

  protected onRetryClick(): void {
    this.retry.emit();
  }
}
