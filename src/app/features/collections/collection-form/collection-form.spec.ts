import { ComponentFixture, TestBed } from '@angular/core/testing';
import { CollectionForm } from './collection-form';

describe('CollectionForm', () => {
  let component: CollectionForm;
  let fixture: ComponentFixture<CollectionForm>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CollectionForm],
    }).compileComponents();

    fixture = TestBed.createComponent(CollectionForm);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
