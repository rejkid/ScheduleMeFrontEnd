import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FunctionScheduleComponent } from './function-schedule.component';

describe('FunctionScheduleComponent', () => {
  let component: FunctionScheduleComponent;
  let fixture: ComponentFixture<FunctionScheduleComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ FunctionScheduleComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(FunctionScheduleComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
