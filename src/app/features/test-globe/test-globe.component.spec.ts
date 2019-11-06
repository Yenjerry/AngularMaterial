import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { TestGlobeComponent } from './test-globe.component';

describe('TestGlobeComponent', () => {
  let component: TestGlobeComponent;
  let fixture: ComponentFixture<TestGlobeComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ TestGlobeComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(TestGlobeComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
