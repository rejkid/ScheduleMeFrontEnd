import { AfterViewInit, Component, OnInit, ViewChild } from '@angular/core';
import { FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms';
import * as moment from 'moment';
import { first } from 'rxjs/operators';
import { ScheduleDateTime } from '../_models/scheduledatetime';
import { ScheduleDateTimes } from '../_models/scheduledatetimes';
import { Team, } from '../_models/team';
import { DateFunctionTeams } from '../_models/teams';
import { AccountService } from '../_services';
import { Constants } from '../constants';
import { MatTableDataSource } from '@angular/material/table';
import { MatSort } from '@angular/material/sort';
import { MatPaginator } from '@angular/material/paginator';
import { AppDateAdapter } from '../admin/accounts/accounts.module';

const COLUMNS_SCHEMA = [
  {
    key: "date",
    type: "text",
    label: "Date"
  }, {
    key: "day",
    type: "text",
    label: "Day"
  },
]

@Component({
  selector: 'app-raport-test',
  templateUrl: './raport-for-date.component.html',
  styleUrls: ['./raport-for-date.component.less']
})
export class RaportForDateComponent implements OnInit, AfterViewInit {
  @ViewChild(MatPaginator) paginator: MatPaginator;
  @ViewChild(MatSort) sort: MatSort;

  form: FormGroup;
  list: ScheduleDateTime[] = [];
  futureScheduleDateStrings: string[] = [];

  dateSelected: string;
  isLoaded: boolean = false;

  isUsersLoaded: boolean = false;
  teams: Team[] = [];
  scheduleDateTime: ScheduleDateTime[] = [];

  displayedColumns: string[] = COLUMNS_SCHEMA.map((col) => col.key);
  columnsSchema: any = COLUMNS_SCHEMA;
  dataSource: MatTableDataSource<ScheduleDateTime> = new MatTableDataSource();

  currentSelectedAccount: ScheduleDateTime = null;
  lastSelectedAccount: ScheduleDateTime = null;
  highlighted: boolean;
  futureScheduleDates: ScheduleDateTime[] = [];
  //lastSelectedAccountHighlighted: boolean;

  constructor(private accountService: AccountService,
    private formBuilder: FormBuilder) {
  }
  ngAfterViewInit(): void {
    this.dataSource.paginator = this.paginator;
    this.dataSource.sort = this.sort;
    this.dataSource = new MatTableDataSource();

    this.getAllDates();
  }

  ngOnInit(): void {
    this.form = this.formBuilder.group({
      dates: ['', [Validators.required, this.dateValidator]],
      allDates: [false, '',]
    });
  }
  onCheckboxChange(event: any) {
    this.getAllDates();
    this.teams = []; // Remove all current teams - we have new set of dates
  }

  get f() {
    return this.form.controls;
  }


  getAllDates() {
    this.futureScheduleDateStrings = [];
    this.list = [];
    this.futureScheduleDates = [];
    this.accountService.getAllDates()
      .pipe(first())
      .subscribe({
        next: (value: ScheduleDateTimes) => {
          this.scheduleDateTime = value.scheduleDateTimes;

          for (let index = 0; index < value.scheduleDateTimes.length; index++) {
            // Add server side dates
            this.list.push( value.scheduleDateTimes[index]/* moment(value.scheduleDateTimes[index].date).toDate() */)
          }
          this.list.sort(function (a, b) {
            var aDate = moment(a.date, Constants.dateTimeFormat).toDate();
            var bDate = moment(b.date, Constants.dateTimeFormat).toDate();
            if (aDate > bDate) return 1
            if (aDate < bDate) return -1
            return 0
          });

          // Convert dates to date strings and optionally filter out past date strings
          for (let index = 0; index < this.list.length; index++) {
            var nowMs = Date.now();
            const scheduleServerDate = moment(this.list[index].date).toDate();
            var scheduleLocalDateStr = moment(scheduleServerDate).format(Constants.dateTimeFormat);
            var scheduleMs = scheduleServerDate.getTime();

            if (this.f['allDates'].value || scheduleMs > nowMs) {
              this.futureScheduleDateStrings.push(scheduleLocalDateStr + "/" + this.getDayStrFromDate(scheduleLocalDateStr));

              var futureScheduleDate: ScheduleDateTime = {
                id: '',
                date: scheduleLocalDateStr,
                highlighted: false,
                day: this.getDayStrFromDate(scheduleLocalDateStr),
                email: this.list[index].email
              }
              this.futureScheduleDates.push(futureScheduleDate);
            }

          }
          this.dataSource = new MatTableDataSource(this.futureScheduleDates);
          this.dataSource.paginator = this.paginator;
          this.dataSource.sort = this.sort;
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
  onRowSelected(date: ScheduleDateTime, tr: any, index: number) {
    date.highlighted = !date.highlighted;
    this.currentSelectedAccount = date;

    if (this.lastSelectedAccount != null) {
      this.lastSelectedAccount.highlighted = false;
    }
    this.lastSelectedAccount = this.currentSelectedAccount;

    if (!date.highlighted) {
      // If row is deselected mark both schedules as deselected(null);
      this.lastSelectedAccount = null;
      this.currentSelectedAccount = null;
    }
    this.selectSchedules4Date(date.date);
  }
  selectSchedules4Date(value: string): void {
    this.dateSelected = value;
    if (this.futureScheduleDateStrings.length <= 0)
      return;

    this.accountService.getTeamsByFunctionForDate(value)
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
}
