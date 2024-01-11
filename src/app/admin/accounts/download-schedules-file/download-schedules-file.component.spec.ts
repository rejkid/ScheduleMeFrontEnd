import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DownloadSchedulesFileComponent } from './download-schedules-file.component';

describe('DownloadSchedulesFileComponent', () => {
  let component: DownloadSchedulesFileComponent;
  let fixture: ComponentFixture<DownloadSchedulesFileComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DownloadSchedulesFileComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(DownloadSchedulesFileComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
