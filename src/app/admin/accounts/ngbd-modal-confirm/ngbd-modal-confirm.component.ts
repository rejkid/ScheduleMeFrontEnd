import { Component, Input, inject } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { Observable, Subject } from 'rxjs';

@Component({
  selector: 'app-ngbd-modal-confirm',
  standalone: true,
  imports: [ReactiveFormsModule],
  
  template: `
  <form [formGroup]="form" (ngSubmit)="onSubmit()" class="ui form">
  <div class="modal-header">
  <h4 class="modal-title" id="modal-title">{{titleStr}}</h4>
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
    <strong>{{bodyQuestionStr}}</strong>
  </p>
  <p>
    {{bodyInfoStr}}
    <span class="text-danger">This operation can not be undone.</span>
  </p>
</div>
<div class="modal-footer">
  <button type="button" class="btn btn-outline-secondary" (click)="modal.dismiss('Operation cancelled')">Cancel</button>
  <a><button type="submit" ngbAutofocus class="button btn btn-outline-success btn-default">Submit</button></a>
</div>
</form>
`,
  styleUrl: './ngbd-modal-confirm.component.less'
})
export class NgbdModalConfirmComponent {
  @Input() titleStr: string;
  @Input() bodyQuestionStr: string;
  @Input() bodyInfoStr: string;

  constructor(private formBuilder : FormBuilder)
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
    this.modal.close("Submit");
  }
}
