import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import {
  HttpTestingController,
  provideHttpClientTesting,
  TestRequest,
} from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';
import { environment } from '../../../environments/environment';
import { Home } from './home';

const API = environment.apiUrl;

function klipyPage(title: string) {
  return {
    result: true,
    data: {
      current_page: 1,
      per_page: 24,
      has_next: false,
      data: [
        {
          id: 1,
          slug: 's',
          title,
          type: 'gif',
          file: { hd: { gif: { url: 'x.gif' } }, sm: { gif: { url: 'x.gif' } } },
        },
      ],
    },
  };
}

describe('Home', () => {
  let fixture: ComponentFixture<Home>;
  let http: HttpTestingController;

  const klipy = (endpoint: string) => (r: { url: string }) => r.url.endsWith(`/gifs/${endpoint}`);

  beforeEach(async () => {
    vi.useFakeTimers();
    await TestBed.configureTestingModule({
      imports: [Home],
      providers: [provideRouter([]), provideHttpClient(), provideHttpClientTesting()],
    }).compileComponents();

    http = TestBed.inject(HttpTestingController);
    fixture = TestBed.createComponent(Home);
    fixture.detectChanges();

    http.expectOne(`${API}/favorites`).flush([]);
    http.expectOne(`${API}/collections`).flush([]);
    http.expectOne(`${API}/collectionGifs`).flush([]);
  });

  afterEach(() => {
    http.verify();
    vi.useRealTimers();
  });

  function text(): string {
    return (fixture.nativeElement as HTMLElement).textContent ?? '';
  }

  it('shows trending GIFs on arrival', () => {
    http.expectOne(klipy('trending')).flush(klipyPage('Trending cat'));
    fixture.detectChanges();

    expect(text()).toContain('Tendances');
    expect(text()).toContain('Trending cat');
    expect(text()).toContain('Powered by');
  });

  it('sends a single search request while the user types fast', () => {
    http.expectOne(klipy('trending')).flush(klipyPage('Trending cat'));

    const input = (fixture.nativeElement as HTMLElement).querySelector('input')!;
    for (const value of ['c', 'ca', 'cat']) {
      input.value = value;
      input.dispatchEvent(new Event('input'));
      TestBed.tick();
      vi.advanceTimersByTime(100);
    }
    vi.advanceTimersByTime(400);
    TestBed.tick();

    const requests: TestRequest[] = http.match(klipy('search'));
    expect(requests.length).toBe(1);
    expect(requests[0].request.params.get('q')).toBe('cat');
    requests[0].flush(klipyPage('Search cat'));
    fixture.detectChanges();

    expect(text()).toContain('Résultats pour « cat »');
    expect(text()).toContain('Search cat');
  });
});
