import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Gif } from '../../../core/models';
import { GifCard } from './gif-card';

const gif: Gif = {
  sourceId: 'klipy-1',
  source: 'klipy',
  title: 'Happy cat',
  url: 'full.gif',
  previewUrl: 'preview.gif',
};

describe('GifCard', () => {
  let fixture: ComponentFixture<GifCard>;
  let element: HTMLElement;

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [GifCard] }).compileComponents();
    fixture = TestBed.createComponent(GifCard);
    fixture.componentRef.setInput('gif', gif);
    element = fixture.nativeElement;
    await fixture.whenStable();
  });

  afterEach(() => vi.unstubAllGlobals());

  function button(label: string): HTMLButtonElement {
    return element.querySelector<HTMLButtonElement>(`[aria-label^="${label}"]`)!;
  }

  it('emits the GIF when the heart is clicked', () => {
    let toggled: Gif | undefined;
    fixture.componentInstance.favoriteToggled.subscribe((g) => (toggled = g));

    button('Ajouter aux favoris').click();

    expect(toggled).toEqual(gif);
  });

  it('copies the GIF link to the clipboard', async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    vi.stubGlobal('navigator', { clipboard: { writeText } });

    button('Copier le lien').click();
    await fixture.whenStable();

    expect(writeText).toHaveBeenCalledWith('full.gif');
    expect(element.textContent).toContain('Lien copié');
  });

  it('tells the user when the copy fails', async () => {
    vi.stubGlobal('navigator', {
      clipboard: { writeText: vi.fn().mockRejectedValue(new Error()) },
    });

    button('Copier le lien').click();
    await fixture.whenStable();

    expect(element.textContent).toContain('Impossible de copier le lien');
  });

  it('falls back to a placeholder when the image fails', async () => {
    const img = element.querySelector('img')!;
    img.dispatchEvent(new Event('error'));
    await fixture.whenStable();

    expect(img.getAttribute('src')).toContain('data:image/svg+xml');
  });
});
