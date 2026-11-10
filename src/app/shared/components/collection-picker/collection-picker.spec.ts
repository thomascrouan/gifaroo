import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { Collection } from '../../../core/models';
import { CollectionPicker } from './collection-picker';

const collections: Collection[] = [{ id: '1', name: 'Reactions', description: '', createdAt: '' }];

describe('CollectionPicker', () => {
  let fixture: ComponentFixture<CollectionPicker>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CollectionPicker],
      providers: [provideRouter([])],
    }).compileComponents();
    fixture = TestBed.createComponent(CollectionPicker);
    fixture.componentRef.setInput('collections', collections);
  });

  it('renders nothing while closed', async () => {
    await fixture.whenStable();
    expect((fixture.nativeElement as HTMLElement).querySelector('[role="dialog"]')).toBeNull();
  });

  it('emits the chosen collection and asks to close', async () => {
    fixture.componentRef.setInput('open', true);
    await fixture.whenStable();

    let selected: Collection | undefined;
    let open: boolean | undefined;
    fixture.componentInstance.collectionSelected.subscribe((c) => (selected = c));
    fixture.componentInstance.openChange.subscribe((value) => (open = value));

    (fixture.nativeElement as HTMLElement)
      .querySelector<HTMLButtonElement>('.panel__item')!
      .click();

    expect(selected).toEqual(collections[0]);
    expect(open).toBe(false);
  });
});
