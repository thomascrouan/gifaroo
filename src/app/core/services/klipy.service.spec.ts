import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { GifPage } from '../models';
import { KlipyService } from './klipy.service';

const file = (name: string) => ({
  hd: { gif: { url: `${name}-hd.gif` } },
  sm: { gif: { url: `${name}-sm.gif` } },
});

const response = {
  result: true,
  data: {
    current_page: 1,
    per_page: 24,
    has_next: true,
    data: [
      { id: 1, slug: 'cat', title: 'Cat', type: 'gif', file: file('cat') },
      { id: 2, slug: 'promo', title: 'Ad', type: 'ad', file: {} },
    ],
  },
};

describe('KlipyService', () => {
  let service: KlipyService;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(KlipyService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('maps trending GIFs and skips ads', () => {
    let page: GifPage | undefined;
    service.trending().subscribe((result) => (page = result));

    const req = http.expectOne((r) => r.url.endsWith('/gifs/trending'));
    expect(req.request.params.get('page')).toBe('1');
    req.flush(response);

    expect(page).toEqual({
      gifs: [
        {
          sourceId: 'klipy-1',
          source: 'klipy',
          title: 'Cat',
          url: 'cat-hd.gif',
          previewUrl: 'cat-sm.gif',
        },
      ],
      hasNext: true,
    });
  });

  it('serves a repeated search from the cache', () => {
    service.search('Cat', 2).subscribe();
    const req = http.expectOne((r) => r.url.endsWith('/gifs/search'));
    expect(req.request.params.get('q')).toBe('cat');
    expect(req.request.params.get('page')).toBe('2');
    req.flush(response);

    let page: GifPage | undefined;
    service.search(' cat ', 2).subscribe((result) => (page = result));

    http.expectNone((r) => r.url.endsWith('/gifs/search'));
    expect(page?.gifs.length).toBe(1);
  });

  it('explains the rate limit error', () => {
    let message = '';
    service.search('cat').subscribe({ error: (error: Error) => (message = error.message) });

    http
      .expectOne((r) => r.url.endsWith('/gifs/search'))
      .flush(null, { status: 429, statusText: 'Too Many Requests' });

    expect(message).toBe('Trop de recherches, réessaie dans quelques minutes.');
  });
});
