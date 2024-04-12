import { NgModule } from '@angular/core';
import { CommonModule, UpperCasePipe } from '@angular/common';
import { NGX_MAT_DATE_FORMATS, NgxMatDateAdapter, NgxMatDateFormats, NgxMatDatetimePickerModule } from '@angular-material-components/datetime-picker';
import { NGX_MAT_MOMENT_DATE_ADAPTER_OPTIONS, NgxMatMomentAdapter, NgxMatMomentModule } from '@angular-material-components/moment-adapter';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DATE_LOCALE, MatNativeDateModule, NativeDateAdapter } from '@angular/material/core';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatPaginatorModule } from '@angular/material/paginator';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatSelectModule } from '@angular/material/select';
import { MatSortModule } from '@angular/material/sort';
import { MatTableModule } from '@angular/material/table';
import { ApplicationPipesModuleModule } from 'src/app/application-pipes-module/application-pipes-module.module';
import { Constants } from 'src/app/constants';
import { DOBModule } from 'src/app/dob/dob.module';
import { MaterialModule } from 'src/app/material/material.module';
import { ScheduleModule } from 'src/app/schedule/schedule.module';
import { AccountsRoutingModule } from './accounts-routing.module';
import { CustomDateFormatDirective } from './custom-date-format.directive';
import { FunctionScheduleComponent } from './function-schedule/function-schedule.component';
import { FunctionComponent } from './function.component';
import { GenerateSchedulesComponent } from './generate-schedules/generate-schedules.component';
import { ListComponent } from './list.component';
import { MainSchedulerComponent } from './main-scheduler/main-scheduler.component';
import { ScheduleAllocatorComponent } from './schedule.allocator.component';
import { UploadAccountsComponent } from './upload-accounts/upload-accounts.component';
import { OrderByDateOrFunctionPipe } from 'src/app/application-pipes-module/order-by-date-or-function.pipe';
import { CustomNgxDatetimeAdapter } from './custom-date-time-adapter/CustomNgxDatetimeAdapter';



// If using Moment
const CUSTOM_MOMENT_FORMATS: NgxMatDateFormats = {
  parse: {
    dateInput: Constants.dateTimeFormat,
  },
  display: {
    dateInput: Constants.dateTimeFormat,
    monthYearLabel: 'MMM YYYY',
    dateA11yLabel: 'LL',
    monthYearA11yLabel: 'MMMM YYYY',
  },
};

/* This is an alternative way of displaying Date in the format `${environment.dateFormat}` */
@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    AccountsRoutingModule,
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
    DOBModule,
    MatProgressBarModule,
    ApplicationPipesModuleModule,
    OrderByDateOrFunctionPipe
  
  ],
  declarations: [
    ListComponent,
    FunctionComponent,
    ScheduleAllocatorComponent,
    UploadAccountsComponent,
    CustomDateFormatDirective,
    GenerateSchedulesComponent,
    FunctionScheduleComponent,
    MainSchedulerComponent,
    
  ],
  providers: [
    {
      provide: UpperCasePipe
    },
    {
      provide: NgxMatDateAdapter,
      useClass: NgxMatMomentAdapter /* CustomNgxDatetimeAdapter */, /* Moment adapter */
      deps: [MAT_DATE_LOCALE, NGX_MAT_MOMENT_DATE_ADAPTER_OPTIONS]
    },
    // values
    {
      provide: NGX_MAT_DATE_FORMATS, useValue: CUSTOM_MOMENT_FORMATS

    },
  ],
  exports: [
    MatPaginatorModule
  ]
})
export class AccountsModule { }