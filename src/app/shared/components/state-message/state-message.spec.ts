import { ComponentFixture, TestBed } from '@angular/core/testing';
import { StateMessage } from './state-message';

describe('StateMessage', () => {
  let component: StateMessage;
  let fixture: ComponentFixture<StateMessage>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [StateMessage],
    }).compileComponents();

    fixture = TestBed.createComponent(StateMessage);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
