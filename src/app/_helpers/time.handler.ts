import { Injectable } from '@angular/core';


import { AbstractControl, FormControl } from '@angular/forms';
import * as moment from 'moment';
import { Constants } from '../constants';
import { Sort } from '@angular/material/sort';



export interface SortableDate {
    date : string
}

@Injectable()
export class TimeHandler {
    constructor() { }
    static dateValidator(AC: FormControl) {
        /* For testing purpose */
        // if (AC.value instanceof Date) {
        //     var date = AC.value;
        //     console.log("AC.value:" + "Date")
        // } else if (moment.isMoment(AC.value)) {
        //     var date = AC.value.toDate();
        //     var dateStr = moment(date).format(Constants.dateFormat);
        //     console.log("AC.value:" + "moment")
        // }
        
        if (AC && AC.value && !moment(AC.value, Constants.dateFormat, true).isValid()) {
            return { 'dateVaidator': true };
        }
        return null;
    }
    static dateTimeValidator(AC: AbstractControl) {
        if (AC && AC.value && !moment(AC.value, Constants.dateTimeFormat, true).isValid()) {
            return { 'dateVaidator': true };
        }
        return null;
    }
    
    static sortData(dateSort : SortableDate[], sort: Sort) {
      console.log("Sortation by date");
      if (!sort.active || sort.direction == '') {
          return;
        }
        dateSort.sort((a, b) => {
          let isAsc = sort.direction == 'asc';
    
          var date1 = moment(a.date, Constants.dateTimeFormat).toDate().getTime();
          var date2 = moment(b.date, Constants.dateTimeFormat).toDate().getTime();
    
          if (date1 < date2) {
            return isAsc ? -1 : 1;
          } else if (date1 > date2) {
            return isAsc ? 1 : -1;
          } else {
            return 0;
          }
        });  
      }
}