import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';
import { environment } from '../../../environments/environment';
import { Favorites } from './favorites';

const API = environment.apiUrl;

describe('Favorites', () => {
  let fixture: ComponentFixture<Favorites>;
  let http: HttpTestingController;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Favorites],
      providers: [provideRouter([]), provideHttpClient(), provideHttpClientTesting()],
    }).compileComponents();

    http = TestBed.inject(HttpTestingController);
    fixture = TestBed.createComponent(Favorites);
    http.expectOne(`${API}/collections`).flush([]);
    http.expectOne(`${API}/collectionGifs`).flush([]);
  });

  afterEach(() => http.verify());

  function text(): string {
    return (fixture.nativeElement as HTMLElement).textContent ?? '';
  }

  it('shows the favorite GIFs', async () => {
    http.expectOne(`${API}/favorites`).flush([
      {
        id: '1',
        gif: { sourceId: 'a', source: 'klipy', title: 'Happy cat', url: '', previewUrl: '' },
        addedAt: '2026-11-04T09:00:00.000Z',
      },
    ]);
    await fixture.whenStable();

    expect(text()).toContain('Happy cat');
  });

  it('shows the empty state', async () => {
    http.expectOne(`${API}/favorites`).flush([]);
    await fixture.whenStable();

    expect(text()).toContain('Pas encore de favoris');
  });
});
