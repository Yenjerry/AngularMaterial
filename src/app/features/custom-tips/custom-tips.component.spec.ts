import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { CustomTipsComponent } from './custom-tips.component';

describe('CustomTipsComponent', () => {
  let component: CustomTipsComponent;
  let fixture: ComponentFixture<CustomTipsComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ CustomTipsComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(CustomTipsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
