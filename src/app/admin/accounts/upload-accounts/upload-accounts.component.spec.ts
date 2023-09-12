import { ComponentFixture, TestBed } from '@angular/core/testing';

import { UploadAccountsComponent } from './upload-accounts.component';

describe('UploadAccountsComponent', () => {
  let component: UploadAccountsComponent;
  let fixture: ComponentFixture<UploadAccountsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ UploadAccountsComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(UploadAccountsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
