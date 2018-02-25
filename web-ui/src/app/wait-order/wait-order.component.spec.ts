import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { WaitOrderComponent } from './wait-order.component';

describe('WaitOrderComponent', () => {
  let component: WaitOrderComponent;
  let fixture: ComponentFixture<WaitOrderComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ WaitOrderComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(WaitOrderComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
