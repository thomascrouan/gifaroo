import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { environment } from '../../../environments/environment';
import { Collection, CollectionGif, Gif } from '../models';
import { CollectionService } from './collection.service';

const API = environment.apiUrl;

const gif: Gif = {
  sourceId: 'klipy-abc',
  source: 'klipy',
  title: 'Happy cat',
  url: 'https://example.com/full.gif',
  previewUrl: 'https://example.com/preview.gif',
};

const collections: Collection[] = [
  { id: '1', name: 'Reactions', description: '', createdAt: '2026-11-04T09:00:00.000Z' },
  { id: '2', name: 'Animals', description: 'Cute', createdAt: '2026-11-04T09:00:00.000Z' },
];

const collectionGifs: CollectionGif[] = [
  { id: '10', collectionId: '1', gif, addedAt: '2026-11-04T09:05:00.000Z' },
  {
    id: '11',
    collectionId: '1',
    gif: { ...gif, sourceId: 'klipy-def' },
    addedAt: '2026-11-04T09:06:00.000Z',
  },
  { id: '12', collectionId: '2', gif, addedAt: '2026-11-04T09:07:00.000Z' },
];

describe('CollectionService', () => {
  let service: CollectionService;
  let http: HttpTestingController;

  function flushLoad(): void {
    http.expectOne(`${API}/collections`).flush(collections);
    http.expectOne(`${API}/collectionGifs`).flush(collectionGifs);
  }

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(CollectionService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('loads collections and exposes computed values', () => {
    service.load();
    expect(service.loading()).toBe(true);
    flushLoad();

    expect(service.loading()).toBe(false);
    expect(service.error()).toBeNull();
    expect(service.count()).toBe(2);
    expect(service.sortedCollections().map((c) => c.name)).toEqual(['Animals', 'Reactions']);
    expect(service.gifCounts()).toEqual({ '1': 2, '2': 1 });
  });

  it('retries once then exposes a readable error when the server is down', () => {
    service.load();
    for (let attempt = 0; attempt < 2; attempt++) {
      http.expectOne(`${API}/collections`).error(new ProgressEvent('error'), { status: 0 });
      http.match(`${API}/collectionGifs`);
    }

    expect(service.loading()).toBe(false);
    expect(service.error()).toContain('Impossible de joindre le serveur');
  });

  it('creates a collection and appends it to the list', () => {
    let result: Collection | undefined;
    service.create({ name: 'New', description: '' }).subscribe((c) => (result = c));

    const req = http.expectOne(`${API}/collections`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body.name).toBe('New');
    expect(req.request.body.createdAt).toBeTruthy();
    req.flush({ ...req.request.body, id: '3' });

    expect(result?.id).toBe('3');
    expect(service.count()).toBe(1);
  });

  it('updates a collection in place', () => {
    service.load();
    flushLoad();

    service.update('1', { name: 'Renamed', description: 'x' }).subscribe();
    const req = http.expectOne(`${API}/collections/1`);
    expect(req.request.method).toBe('PATCH');
    req.flush({ ...collections[0], name: 'Renamed', description: 'x' });

    expect(service.collections().find((c) => c.id === '1')?.name).toBe('Renamed');
  });

  it('removes the GIFs of a collection before the collection itself', () => {
    service.load();
    flushLoad();

    let done = false;
    service.remove('1').subscribe(() => (done = true));

    http
      .expectOne(`${API}/collectionGifs?collectionId=1`)
      .flush(collectionGifs.filter((item) => item.collectionId === '1'));
    http.expectNone({ method: 'DELETE', url: `${API}/collections/1` });
    http.expectOne({ method: 'DELETE', url: `${API}/collectionGifs/10` }).flush(null);
    http.expectOne({ method: 'DELETE', url: `${API}/collectionGifs/11` }).flush(null);
    http.expectOne({ method: 'DELETE', url: `${API}/collections/1` }).flush(null);

    expect(done).toBe(true);
    expect(service.collections().map((c) => c.id)).toEqual(['2']);
    expect(service.gifCounts()).toEqual({ '2': 1 });
  });

  it('turns a failed mutation into a readable error', () => {
    let message = '';
    service.update('99', { name: 'X', description: '' }).subscribe({
      error: (error: Error) => (message = error.message),
    });
    http.expectOne(`${API}/collections/99`).flush(null, { status: 404, statusText: 'Not Found' });

    expect(message).toBe('Élément introuvable.');
  });

  it('adds a GIF to a collection', () => {
    service.addGif('2', { ...gif, sourceId: 'klipy-new' }).subscribe();

    http.expectOne(`${API}/collectionGifs?collectionId=2`).flush([collectionGifs[2]]);
    const req = http.expectOne({ method: 'POST', url: `${API}/collectionGifs` });
    expect(req.request.body.collectionId).toBe('2');
    req.flush({ ...req.request.body, id: '13' });

    expect(service.gifCounts()).toEqual({ '2': 1 });
  });

  it('refuses to add the same GIF twice', () => {
    let message = '';
    service.addGif('2', gif).subscribe({ error: (error: Error) => (message = error.message) });

    http.expectOne(`${API}/collectionGifs?collectionId=2`).flush([collectionGifs[2]]);

    expect(message).toBe('Ce GIF est déjà dans cette collection.');
  });

  it('removes a GIF from a collection', () => {
    service.load();
    flushLoad();

    service.removeGif('10').subscribe();
    http.expectOne({ method: 'DELETE', url: `${API}/collectionGifs/10` }).flush(null);

    expect(service.gifCounts()).toEqual({ '1': 1, '2': 1 });
  });

  it('checks name uniqueness ignoring case and the edited collection', () => {
    service.load();
    flushLoad();

    expect(service.nameExists('  reactions ')).toBe(true);
    expect(service.nameExists('Reactions', '1')).toBe(false);
    expect(service.nameExists('Other')).toBe(false);
  });
});
