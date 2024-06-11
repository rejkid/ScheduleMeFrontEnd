import { ComponentFixture, TestBed } from '@angular/core/testing';

import { UploadTimeslotsTasksComponent } from './upload-timeslots-tasks.component';

describe('AutoGeneratorComponent', () => {
  let component: UploadTimeslotsTasksComponent;
  let fixture: ComponentFixture<UploadTimeslotsTasksComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ UploadTimeslotsTasksComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(UploadTimeslotsTasksComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
