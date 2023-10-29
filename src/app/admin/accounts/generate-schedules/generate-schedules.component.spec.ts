import { ComponentFixture, TestBed } from '@angular/core/testing';

import { GenerateSchedulesComponent } from './generate-schedules.component';

describe('GenerateSchedulesComponent', () => {
  let component: GenerateSchedulesComponent;
  let fixture: ComponentFixture<GenerateSchedulesComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ GenerateSchedulesComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(GenerateSchedulesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
