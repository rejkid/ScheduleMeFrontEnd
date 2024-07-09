import { Component } from '@angular/core';
import { ViewEncapsulation } from '@angular/core';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';


@Component({
  selector: 'app-ngbd-modal-options',
  encapsulation: ViewEncapsulation.None,

  templateUrl: './ngbd-modal-options.component.html',
  styles: [`
    body {
      padding: 3rem;
    }
    .modalClass .modal-content {
      border: none;
      background: none;
    }
    .spinner-border {
      width: 5rem !important;
      height: 5rem !important;
      border-width: 0.5rem;
      border-color: blue;
      border-right-color: transparent;
    }
    .loader {
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translateX(-50%) translateY(-50%);
    }
  `]
})
export class NgbdModalOptionsComponent {
  closeResult: string;
  constructor(private modalService: NgbModal) { }
}
