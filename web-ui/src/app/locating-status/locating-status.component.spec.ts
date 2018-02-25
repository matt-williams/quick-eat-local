import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { LocatingStatusComponent } from './locating-status.component';

describe('LocatingStatusComponent', () => {
  let component: LocatingStatusComponent;
  let fixture: ComponentFixture<LocatingStatusComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ LocatingStatusComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(LocatingStatusComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
