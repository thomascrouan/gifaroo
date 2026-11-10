import { HttpErrorResponse } from '@angular/common/http';

export function toErrorMessage(error: unknown): string {
  if (error instanceof HttpErrorResponse) {
    if (error.status === 0) {
      return 'Impossible de joindre le serveur. Vérifie que json-server est lancé (npm run api).';
    }
    if (error.status === 404) {
      return 'Élément introuvable.';
    }
    if (error.status >= 500) {
      return 'Erreur du serveur, réessaie dans quelques instants.';
    }
    return `Erreur inattendue (code ${error.status}).`;
  }
  if (error instanceof Error) {
    return error.message;
  }
  return 'Une erreur inattendue est survenue.';
}
