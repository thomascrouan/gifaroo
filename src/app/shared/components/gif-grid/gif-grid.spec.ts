import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Gif } from '../../../core/models';
import { GifGrid } from './gif-grid';

const gifs: Gif[] = [
  { sourceId: 'a', source: 'klipy', title: 'A', url: '', previewUrl: '' },
  { sourceId: 'b', source: 'klipy', title: 'B', url: '', previewUrl: '' },
];

describe('GifGrid', () => {
  let fixture: ComponentFixture<GifGrid>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [GifGrid] }).compileComponents();
    fixture = TestBed.createComponent(GifGrid);
    fixture.componentRef.setInput('gifs', gifs);
    fixture.componentRef.setInput('favoriteIds', new Set(['b']));
    await fixture.whenStable();
  });

  it('renders one card per GIF and marks favorites', () => {
    const element = fixture.nativeElement as HTMLElement;
    expect(element.querySelectorAll('app-gif-card').length).toBe(2);
    expect(element.querySelectorAll('[aria-pressed="true"]').length).toBe(1);
  });
});
