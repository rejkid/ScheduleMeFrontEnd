import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { Constants } from 'src/app/constants';

import { NGX_MAT_DATE_FORMATS, NgxMatDateAdapter, NgxMatDateFormats, NgxMatDatetimePickerModule } from '@angular-material-components/datetime-picker';
import { NGX_MAT_MOMENT_DATE_ADAPTER_OPTIONS, NgxMatMomentAdapter } from '@angular-material-components/moment-adapter';

import { DateAdapter, MAT_DATE_FORMATS, MAT_DATE_LOCALE } from '@angular/material/core';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatTableModule } from '@angular/material/table';
import { MaterialModule } from 'src/app/material/material.module';

import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { BrowserModule } from '@angular/platform-browser';
import { AddEditComponent } from './add-edit.component';
import { MatInputModule } from '@angular/material/input';
import { AccountsRoutingModule } from '../accounts-routing.module';
import { MomentDateAdapter } from '@angular/material-moment-adapter';


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
    BrowserModule,
    FormsModule,
    ReactiveFormsModule,
    AccountsRoutingModule,

    MaterialModule,
    MatInputModule,
    MatTableModule,
    MatDatepickerModule,
    MatFormFieldModule,
    NgxMatDatetimePickerModule,
  ],
  exports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule
  ],
  providers: [
   
    {provide: DateAdapter, useClass: MomentDateAdapter, deps: [MAT_DATE_LOCALE]},
    {provide: MAT_DATE_FORMATS, useValue: CUSTOM_MOMENT_FORMATS},

  ],
})
export class AddEditModule { }
