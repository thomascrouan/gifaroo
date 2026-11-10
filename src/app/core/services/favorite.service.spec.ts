import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { environment } from '../../../environments/environment';
import { Favorite, Gif } from '../models';
import { FavoriteService } from './favorite.service';

const API = environment.apiUrl;

const gif: Gif = { sourceId: 'klipy-1', source: 'klipy', title: 'Cat', url: '', previewUrl: '' };
const favorites: Favorite[] = [{ id: '1', gif, addedAt: '2026-11-04T09:00:00.000Z' }];

describe('FavoriteService', () => {
  let service: FavoriteService;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(FavoriteService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('loads favorites and knows which GIFs are favorites', () => {
    service.load();
    http.expectOne(`${API}/favorites`).flush(favorites);

    expect(service.isFavorite('klipy-1')).toBe(true);
    expect(service.isFavorite('klipy-2')).toBe(false);
    expect(service.gifs()).toEqual([gif]);
  });

  it('toggles a favorite on and off', () => {
    const other: Gif = { ...gif, sourceId: 'klipy-2' };

    service.toggle(other).subscribe();
    const post = http.expectOne({ method: 'POST', url: `${API}/favorites` });
    post.flush({ ...post.request.body, id: '2' });
    expect(service.isFavorite('klipy-2')).toBe(true);

    service.toggle(other).subscribe();
    http.expectOne({ method: 'DELETE', url: `${API}/favorites/2` }).flush(null);
    expect(service.isFavorite('klipy-2')).toBe(false);
  });

  it('exposes a readable error when loading fails', () => {
    service.load();
    for (let attempt = 0; attempt < 2; attempt++) {
      http.expectOne(`${API}/favorites`).flush(null, { status: 500, statusText: 'Server Error' });
    }

    expect(service.error()).toBe('Erreur du serveur, réessaie dans quelques instants.');
  });
});
