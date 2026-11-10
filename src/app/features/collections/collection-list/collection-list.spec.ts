import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';
import { environment } from '../../../../environments/environment';
import { CollectionList } from './collection-list';

const API = environment.apiUrl;

describe('CollectionList', () => {
  let fixture: ComponentFixture<CollectionList>;
  let http: HttpTestingController;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CollectionList],
      providers: [provideRouter([]), provideHttpClient(), provideHttpClientTesting()],
    }).compileComponents();

    http = TestBed.inject(HttpTestingController);
    fixture = TestBed.createComponent(CollectionList);
  });

  afterEach(() => http.verify());

  function text(): string {
    return (fixture.nativeElement as HTMLElement).textContent ?? '';
  }

  it('shows the collections with their GIF count', async () => {
    http
      .expectOne(`${API}/collections`)
      .flush([{ id: '1', name: 'Reactions', description: 'Quick replies', createdAt: '' }]);
    http
      .expectOne(`${API}/collectionGifs`)
      .flush([{ id: '10', collectionId: '1', gif: {}, addedAt: '' }]);
    await fixture.whenStable();

    expect(text()).toContain('Reactions');
    expect(text()).toContain('1 GIF');
  });

  it('shows the empty state', async () => {
    http.expectOne(`${API}/collections`).flush([]);
    http.expectOne(`${API}/collectionGifs`).flush([]);
    await fixture.whenStable();

    expect(text()).toContain('Aucune collection');
  });

  it('shows the error state with a retry button', async () => {
    for (let attempt = 0; attempt < 2; attempt++) {
      http.expectOne(`${API}/collections`).error(new ProgressEvent('error'), { status: 0 });
      http.match(`${API}/collectionGifs`);
    }
    await fixture.whenStable();

    expect(text()).toContain('Impossible de joindre le serveur');
    expect(text()).toContain('Réessayer');
  });
});
