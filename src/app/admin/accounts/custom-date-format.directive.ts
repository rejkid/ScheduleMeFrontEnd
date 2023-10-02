import { Directive } from '@angular/core';
import { MAT_DATE_FORMATS } from '@angular/material/core';
import { environment } from 'src/environments/environment';

export const FORMAT = {
  parse: {
    dateInput: `${environment.dateFormat}`,
  },
  display: {
    dateInput: `${environment.dateFormat}`,
    monthYearLabel: 'MMM YYYY',
    dateA11yLabel: 'LL',
    monthYearA11yLabel: 'MMMM YYYY',
  },
};

@Directive({
  selector: '[appCustomDateFormat]',
  providers: [
    { provide: MAT_DATE_FORMATS, useValue: FORMAT },
  ],
})
export class CustomDateFormatDirective {

  constructor() { }

}
