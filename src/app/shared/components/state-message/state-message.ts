import { Component, computed, input, output } from '@angular/core';

export type StateType = 'loading' | 'error' | 'empty';

const DEFAULT_MESSAGES: Record<StateType, string> = {
  loading: 'Chargement…',
  error: 'Une erreur est survenue.',
  empty: 'Rien à afficher pour le moment.',
};

@Component({
  selector: 'app-state-message',
  templateUrl: './state-message.html',
  styleUrl: './state-message.scss',
})
export class StateMessage {
  readonly type = input.required<StateType>();
  readonly message = input<string | null>(null);

  readonly retry = output<void>();

  readonly text = computed(() => this.message() || DEFAULT_MESSAGES[this.type()]);
}
