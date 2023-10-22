import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';

import { ScheduleModule } from '../schedule/schedule.module';
import { DetailsComponent } from './details.component';
import { LayoutComponent } from './layout.component';
import { ProfileRoutingModule } from './profile-routing.module';
import { UpdateComponent } from './update.component';

import { NgxMatDatetimePickerModule } from '@angular-material-components/datetime-picker';
import { NgxMatMomentModule } from '@angular-material-components/moment-adapter';
import { MomentDateAdapter } from '@angular/material-moment-adapter';
import { MatButtonModule } from '@angular/material/button';
import { DateAdapter, MAT_DATE_FORMATS, MAT_DATE_LOCALE, MatNativeDateModule, NativeDateAdapter } from '@angular/material/core';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatPaginatorModule } from '@angular/material/paginator';
import { MatSelectModule } from '@angular/material/select';
import { MatSortModule } from '@angular/material/sort';
import { MatTableModule } from '@angular/material/table';
import { MaterialModule } from 'src/app/material/material.module';
import { Constants } from '../constants';
import * as moment from 'moment';

const CUSTOM_MOMENT_FORMATS = {
  parse: {
    dateInput:  Constants.dateFormat,
  },
  display: {
    dateInput: Constants.dateFormat,
    monthYearLabel: 'MMM YYYY',
    dateA11yLabel: 'LL',
    monthYearA11yLabel: 'MMMM YYYY',
  },
};
// export class UserDateAdapter extends NativeDateAdapter {
//   override parse(value: any): Date | null {
//    //Your custom parse method 
//    if ((typeof value === 'string') && (value.indexOf('-') > -1) && 
//         value.length == 10) {
//           const str = value.split('-');
//           const year = Number(str[2]);
//           const month = Number(str[0]) - 1;
//           const date = Number(str[1]);
//           var dateStr = moment(new Date(year, month, date)).format(Constants.dateFormat);
//           return moment(dateStr, Constants.dateFormat).toDate();
//     } else {
//            return new Date(undefined);
//     }
//   }
// }
@NgModule({
  imports: [
    CommonModule,
    ReactiveFormsModule,
    ProfileRoutingModule,
    ScheduleModule,

    MaterialModule,
    MatSortModule,
    MatTableModule,
    MatPaginatorModule,
    MatButtonModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatInputModule,
    MatFormFieldModule,
    NgxMatDatetimePickerModule,
    NgxMatMomentModule,
    MatSelectModule,

  ],
  declarations: [
    LayoutComponent,
    DetailsComponent,
    UpdateComponent
  ],
  providers: [
    {provide: DateAdapter, useClass: /* UserDateAdapter */MomentDateAdapter, deps: [MAT_DATE_LOCALE]},
    {provide: MAT_DATE_FORMATS, useValue: CUSTOM_MOMENT_FORMATS},

  ],
})
export class ProfileModule { }