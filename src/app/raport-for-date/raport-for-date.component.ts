import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms';
import * as moment from 'moment';
import { first } from 'rxjs/operators';
import { ScheduleDateTime } from '../_models/scheduledatetime';
import { ScheduleDateTimes } from '../_models/scheduledatetimes';
import { Team, } from '../_models/team';
import { DateFunctionTeams } from '../_models/teams';
import { AccountService } from '../_services';
import { Constants } from '../constants';


@Component({
  selector: 'app-raport-test',
  templateUrl: './raport-for-date.component.html',
  styleUrls: ['./raport-for-date.component.less']
})
export class RaportForDateComponent implements OnInit {
  form: FormGroup;
  list: Date[] = [];
  futureScheduleDateStrings: string[] = [];

  dateSelected: string;
  isLoaded: boolean = false;

  isUsersLoaded: boolean = false;
  teams: Team[] = [];
  scheduleDateTime: ScheduleDateTime[] = [];

  constructor(private accountService: AccountService,
    private formBuilder: FormBuilder) {
  }

  ngOnInit(): void {
    this.form = this.formBuilder.group({
      dates: ['', [Validators.required, this.dateValidator]],
      allDates: [false, '',]
    });
    this.getAllDates();
  }
  onCheckboxChange(event: any) {
    this.getAllDates();
    this.teams = []; // Remove all current teams - we have new set of dates
  }

  get f() {
    return this.form.controls;
  }

  onSelected(value: any): void {
    this.dateSelected = value;
    if (this.futureScheduleDateStrings.length <= 0)
      return;

    var selectedDate = this.form.get('dates').value;
    const array : string[] = selectedDate.split("/");

    var date = array[0];
    this.accountService.GetTeamsByFunctionForDate(date)
      .pipe(first())
      .subscribe({
        next: (dateFunctionTeams: DateFunctionTeams) => {
          this.teams = dateFunctionTeams.dateFunctionTeams;
        },
        error: error => {
          console.log();
        }
      });

  }
  getAllDates() {
    this.futureScheduleDateStrings = [];
    this.list = [];
    this.accountService.getAllDates()
      .pipe(first())
      .subscribe({
        next: (value: ScheduleDateTimes) => {
          this.scheduleDateTime = value.scheduleDateTimes;

          for (let index = 0; index < value.scheduleDateTimes.length; index++) {
            // Add server side dates
            this.list.push(value.scheduleDateTimes[index].date)
          }
          this.list.sort(function (a, b) {
            if (a > b) return 1
            if (a < b) return -1
            return 0
          });

          // Convert dates to date strings and optionally filter out past date strings
          for (let index = 0; index < this.list.length; index++) {
            var nowMs = Date.now();
            const scheduleServerDate = moment(this.list[index]).toDate();
            var scheduleLocalDateStr = moment(scheduleServerDate).format(Constants.dateTimeFormat);
            var scheduleMs = scheduleServerDate.getTime();

            if (this.f['allDates'].value || scheduleMs > nowMs) {
              this.futureScheduleDateStrings.push(scheduleLocalDateStr);
            }
          }
          this.isLoaded = true;
        },
        error: error => {
          console.log();
        }
      });

  }
  getDayStrFromDate(dateStr: string): string {
    var days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    var date = moment(dateStr, Constants.dateTimeFormat).toDate();
    return days[date.getDay()];
  }
  dateValidator(control: FormControl): { [s: string]: boolean } {
    var test = control.value.match(/^\d/);
    if (!test) {
      return { invalidDate: true };
    }
    return null;
  }
}
