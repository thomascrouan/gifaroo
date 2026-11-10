import { HttpClient, HttpErrorResponse, HttpParams } from '@angular/common/http';
import { Service, inject } from '@angular/core';
import { Observable, catchError, map, of, tap, throwError } from 'rxjs';
import { environment } from '../../../environments/environment';
import { toErrorMessage } from '../http/http-error';
import { Gif, GifPage } from '../models';

interface KlipyFile {
  gif: { url: string };
}

interface KlipyItem {
  id: number;
  title: string;
  type: string;
  file: {
    hd: KlipyFile;
    sm: KlipyFile;
  };
}

interface KlipyResponse {
  result: boolean;
  data: {
    data: KlipyItem[];
    has_next: boolean;
  };
}

@Service()
export class KlipyService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = `https://api.klipy.com/api/v1/${environment.klipyApiKey}/gifs`;
  private readonly perPage = 24;

  private readonly cache = new Map<string, GifPage>();

  trending(page = 1): Observable<GifPage> {
    const params = new HttpParams().set('page', page).set('per_page', this.perPage);
    return this.getPage(`${this.apiUrl}/trending`, params);
  }

  search(query: string, page = 1): Observable<GifPage> {
    const params = new HttpParams()
      .set('q', query.trim().toLowerCase())
      .set('page', page)
      .set('per_page', this.perPage);
    return this.getPage(`${this.apiUrl}/search`, params);
  }

  private getPage(url: string, params: HttpParams): Observable<GifPage> {
    const cacheKey = `${url}?${params.toString()}`;
    const cachedPage = this.cache.get(cacheKey);
    if (cachedPage) {
      return of(cachedPage);
    }

    return this.http.get<KlipyResponse>(url, { params }).pipe(
      map((response) => ({
        gifs: response.data.data.filter((item) => item.type === 'gif').map(toGif),
        hasNext: response.data.has_next,
      })),
      tap((page) => this.cache.set(cacheKey, page)),
      catchError((error) => throwError(() => new Error(toKlipyErrorMessage(error)))),
    );
  }
}

function toGif(item: KlipyItem): Gif {
  return {
    sourceId: `klipy-${item.id}`,
    source: 'klipy',
    title: item.title,
    url: item.file.hd.gif.url,
    previewUrl: item.file.sm.gif.url,
  };
}

function toKlipyErrorMessage(error: unknown): string {
  if (error instanceof HttpErrorResponse) {
    if (error.status === 429) {
      return 'Trop de recherches, réessaie dans quelques minutes.';
    }
    if (error.status === 401 || error.status === 403) {
      return 'Clé API Klipy invalide. Vérifie src/environments/environment.ts.';
    }
    if (error.status === 0) {
      return 'Impossible de joindre Klipy. Vérifie ta connexion internet.';
    }
  }
  return toErrorMessage(error);
}
