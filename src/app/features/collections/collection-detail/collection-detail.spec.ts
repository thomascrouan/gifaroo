import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';
import { environment } from '../../../../environments/environment';
import { CollectionDetail } from './collection-detail';

const API = environment.apiUrl;

describe('CollectionDetail', () => {
  let fixture: ComponentFixture<CollectionDetail>;
  let http: HttpTestingController;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CollectionDetail],
      providers: [provideRouter([]), provideHttpClient(), provideHttpClientTesting()],
    }).compileComponents();

    http = TestBed.inject(HttpTestingController);
    fixture = TestBed.createComponent(CollectionDetail);
    fixture.componentRef.setInput('id', '1');
    http.expectOne(`${API}/favorites`).flush([]);
  });

  afterEach(() => http.verify());

  function text(): string {
    return (fixture.nativeElement as HTMLElement).textContent ?? '';
  }

  it('shows the collection and its GIFs', async () => {
    http
      .expectOne(`${API}/collections`)
      .flush([{ id: '1', name: 'Reactions', description: 'Quick', createdAt: '' }]);
    http.expectOne(`${API}/collectionGifs`).flush([
      {
        id: '10',
        collectionId: '1',
        gif: { sourceId: 'a', source: 'klipy', title: 'Happy cat', url: '', previewUrl: '' },
        addedAt: '',
      },
    ]);
    await fixture.whenStable();

    expect(text()).toContain('Reactions');
    expect((fixture.nativeElement as HTMLElement).querySelector('img')?.alt).toBe('Happy cat');
  });

  it('shows a clear message for an unknown collection', async () => {
    http.expectOne(`${API}/collections`).flush([]);
    http.expectOne(`${API}/collectionGifs`).flush([]);
    await fixture.whenStable();

    expect(text()).toContain("Cette collection n'existe pas.");
  });
});
