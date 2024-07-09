import { ComponentFixture, TestBed } from '@angular/core/testing';

import { NgbdModalOptionsComponent } from './ngbd-modal-options.component';

describe('NgbdModalOptionsComponent', () => {
  let component: NgbdModalOptionsComponent;
  let fixture: ComponentFixture<NgbdModalOptionsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [NgbdModalOptionsComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(NgbdModalOptionsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
