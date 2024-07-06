import { Component, inject } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { Observable, Subject } from 'rxjs';


export class CtrlActionService {
  private actionStatus = new Subject<any>();

  constructor() {}

  //ctrl submit action
  public callAction() {
    this.actionStatus.next(true);
  }
  public getAction(): Observable<boolean> {
    return this.actionStatus.asObservable();
  }
}

@Component({
  selector: 'app-ngbd-modal-confirm',
  standalone: true,
  imports: [ReactiveFormsModule],
  
  template: `
  <form [formGroup]="form" (ngSubmit)="onSubmit()" class="ui form">
  <div class="modal-header">
  <h4 class="modal-title" id="modal-title">User Accounts Deletion</h4>
  <button
    type="button"
    class="btn-close"
    aria-label="Close button"
    aria-describedby="modal-title"
    (click)="modal.dismiss('Cross click')"
  ></button>
</div>
<div class="modal-body">
  <p>
    <strong>Are you sure you want to delete user account profiles?</strong>
  </p>
  <p>
    All information associated to the user profiles will be permanently deleted.
    <span class="text-danger">This operation can not be undone.</span>
  </p>
</div>
<div class="modal-footer">
  <button type="button" class="btn btn-outline-secondary" (click)="modal.dismiss('cancel click')">Cancel</button>
  <a><button type="submit" ngbAutofocus class="button btn btn-outline-success btn-default">Submit</button></a>
</div>
</form>
`,
  styleUrl: './ngbd-modal-confirm.component.less'
})
export class NgbdModalConfirmComponent {
  constructor(private formBuilder : FormBuilder, private ctrlActionService : CtrlActionService  )
  {
    this.form = this.formBuilder.group({});
  }
  modal = inject(NgbActiveModal);
  form: FormGroup;

  onClick(event : any) {
    console.log("Submit button was clicked!");
    this.modal.close('Ok click')

  }
  onSubmit() {
    console.log("Form was submitted!");
    this.ctrlActionService.callAction();
    this.modal.close("Submit");
  }
}
