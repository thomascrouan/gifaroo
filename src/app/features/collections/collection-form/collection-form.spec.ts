import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';
import { environment } from '../../../../environments/environment';
import { CollectionForm } from './collection-form';

const API = environment.apiUrl;

describe('CollectionForm', () => {
  let fixture: ComponentFixture<CollectionForm>;
  let http: HttpTestingController;
  let element: HTMLElement;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CollectionForm],
      providers: [provideRouter([]), provideHttpClient(), provideHttpClientTesting()],
    }).compileComponents();

    http = TestBed.inject(HttpTestingController);
    fixture = TestBed.createComponent(CollectionForm);
    element = fixture.nativeElement;
  });

  afterEach(() => http.verify());

  async function loadCollections(): Promise<void> {
    http
      .expectOne(`${API}/collections`)
      .flush([{ id: '1', name: 'Reactions', description: 'Quick', createdAt: '' }]);
    http.expectOne(`${API}/collectionGifs`).flush([]);
    await fixture.whenStable();
  }

  async function typeName(value: string): Promise<void> {
    const input = element.querySelector<HTMLInputElement>('#name')!;
    input.value = value;
    input.dispatchEvent(new Event('input'));
    input.dispatchEvent(new Event('blur'));
    await fixture.whenStable();
  }

  it('shows the validation messages', async () => {
    await loadCollections();

    await typeName('');
    expect(element.textContent).toContain('Le nom est obligatoire');

    await typeName('a');
    expect(element.textContent).toContain('2 caractères minimum');

    await typeName('x'.repeat(51));
    expect(element.textContent).toContain('50 caractères maximum');

    await typeName('reactions');
    expect(element.textContent).toContain('Une collection porte déjà ce nom');

    await typeName('Animals');
    expect(element.querySelector('.field__errors p')).toBeNull();
  });

  it('prefills the form in edit mode', async () => {
    fixture.componentRef.setInput('id', '1');
    await loadCollections();

    expect(element.querySelector<HTMLInputElement>('#name')!.value).toBe('Reactions');
    expect(element.querySelector<HTMLTextAreaElement>('#description')!.value).toBe('Quick');
    expect(element.textContent).not.toContain('Une collection porte déjà ce nom');
  });

  it('shows a clear message for an unknown collection', async () => {
    fixture.componentRef.setInput('id', '99');
    await loadCollections();

    expect(element.textContent).toContain("Cette collection n'existe pas.");
  });
});
