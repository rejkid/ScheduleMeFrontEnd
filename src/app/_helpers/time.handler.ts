import { Injectable } from '@angular/core';


import { AbstractControl } from '@angular/forms';
import * as moment from 'moment';
import { Constants } from '../constants';

@Injectable()
export class TimeHandler {
    constructor() { }
    static dateValidator(AC: AbstractControl) {
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