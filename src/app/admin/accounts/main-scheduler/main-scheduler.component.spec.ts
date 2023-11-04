import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MainSchedulerComponent } from './main-scheduler.component';

describe('MainSchedulerComponent', () => {
  let component: MainSchedulerComponent;
  let fixture: ComponentFixture<MainSchedulerComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ MainSchedulerComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(MainSchedulerComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
