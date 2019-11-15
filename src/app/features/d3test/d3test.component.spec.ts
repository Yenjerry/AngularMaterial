import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { D3testComponent } from './d3test.component';

describe('D3testComponent', () => {
  let component: D3testComponent;
  let fixture: ComponentFixture<D3testComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ D3testComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(D3testComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
