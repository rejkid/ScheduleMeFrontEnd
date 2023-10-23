import { Injectable } from '@angular/core';


import { AbstractControl, FormControl } from '@angular/forms';
import * as moment from 'moment';
import { Constants } from '../constants';

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
}