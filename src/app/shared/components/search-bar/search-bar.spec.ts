import { ComponentFixture, TestBed } from '@angular/core/testing';
import { SearchBar } from './search-bar';

describe('SearchBar', () => {
  let fixture: ComponentFixture<SearchBar>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [SearchBar] }).compileComponents();
    fixture = TestBed.createComponent(SearchBar);
    await fixture.whenStable();
  });

  it('shows the Klipy placeholder and emits typed text', () => {
    let emitted = '';
    fixture.componentInstance.queryChange.subscribe((value) => (emitted = value));

    const input = (fixture.nativeElement as HTMLElement).querySelector('input')!;
    expect(input.placeholder).toBe('Search KLIPY');

    input.value = 'cat';
    input.dispatchEvent(new Event('input'));

    expect(emitted).toBe('cat');
  });
});
