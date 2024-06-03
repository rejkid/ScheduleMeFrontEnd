import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TimeSlotTasksEditorComponent } from './time-slot-tasks-editor.component';

describe('TimeSlotTasksEditorComponent', () => {
  let component: TimeSlotTasksEditorComponent;
  let fixture: ComponentFixture<TimeSlotTasksEditorComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [TimeSlotTasksEditorComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(TimeSlotTasksEditorComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
