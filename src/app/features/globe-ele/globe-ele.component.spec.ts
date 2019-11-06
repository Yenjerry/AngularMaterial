import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { GlobeEleComponent } from './globe-ele.component';

describe('GlobeEleComponent', () => {
  let component: GlobeEleComponent;
  let fixture: ComponentFixture<GlobeEleComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ GlobeEleComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(GlobeEleComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
