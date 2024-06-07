import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { Constants } from 'src/app/constants';

import { NgxMatDatetimePickerModule } from '@angular-material-components/datetime-picker';

import { DateAdapter, MAT_DATE_FORMATS, MAT_DATE_LOCALE } from '@angular/material/core';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatTableModule } from '@angular/material/table';
import { MaterialModule } from 'src/app/material/material.module';

import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MomentDateAdapter } from '@angular/material-moment-adapter';
import { MatCardModule } from '@angular/material/card';
import { MatInputModule } from '@angular/material/input';
import { RouterModule } from '@angular/router';
import { AddEditComponent } from './add-edit.component';
import { AddEditRoutingModule } from './add.edit-routing.module';
import { USERS_SERVICE_CONFIG_TOKEN, USERS_SERVICE_TOKEN } from 'src/app/app.module';
import { TestService } from 'src/app/_services/test.service';

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

@NgModule({
  declarations: [
    AddEditComponent,
  ],
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    

    MaterialModule,
    MatCardModule,
    MatInputModule,
    MatTableModule,
    MatDatepickerModule,
    MatFormFieldModule,
    NgxMatDatetimePickerModule,
    RouterModule,
    AddEditRoutingModule
    
    
    
  ],
  exports: [
    /* CommonModule,
    FormsModule,
    ReactiveFormsModule,
    MaterialModule,
    MatCardModule,
    MatInputModule,
    MatTableModule,
    MatDatepickerModule,
    MatFormFieldModule,
    NgxMatDatetimePickerModule,
    RouterModule */
  ],
  providers: [
   
    {provide: DateAdapter, useClass: MomentDateAdapter, deps: [MAT_DATE_LOCALE]},
    {provide: MAT_DATE_FORMATS, useValue: CUSTOM_MOMENT_FORMATS},
    // TODO JD TEST
    // {provide: USERS_SERVICE_TOKEN, useClass: TestService},
    // {
    //   provide: USERS_SERVICE_CONFIG_TOKEN,
    //   useValue: { apiUrl: 'http://localhost:3004/users' },
    // },
    // TODO JD TEST END
  ],
})
export class AddEditModule { }
