
import { Component, ViewChild } from '@angular/core';
import { FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort, Sort } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table';
import * as moment from 'moment';
import { first } from 'rxjs/operators';
import { TimeHandler } from 'src/app/_helpers/time.handler';
import { FunctionScheduleData } from 'src/app/_models/functionscheduledata';
import { ScheduleDateTime } from 'src/app/_models/scheduledatetime';
import { ScheduleDateTimes } from 'src/app/_models/scheduledatetimes';
import { AccountService } from 'src/app/_services';
import { Constants } from 'src/app/constants';
import { GenerateSchedulesComponent } from '../generate-schedules/generate-schedules.component';
const COLUMNS_SCHEMA = [
  {
    key: "date",
    type: "text",
    label: "Date"
  }, {
    key: "day",
    type: "text",
    label: "Day"
  }, {
    key: "delete",
    type: "text",
    label: "Delete"
  },
]

@Component({
  selector: 'app-main-scheduler',
  templateUrl: './main-scheduler.component.html',
  styleUrls: ['./main-scheduler.component.less']
})
export class MainSchedulerComponent {
  @ViewChild(MatPaginator) paginator: MatPaginator;
  @ViewChild(MatSort) sort: MatSort;
  @ViewChild(`scheduleDate`) generateScheduleComponent: GenerateSchedulesComponent;

  form: FormGroup;
  list: ScheduleDateTime[] = [];
  futureScheduleDateStrings: string[] = [];

  dateSelected: string;
  isLoaded: boolean = false;

  isUsersLoaded: boolean = false;
  scheduleDateTime: ScheduleDateTime[] = [];

  displayedColumns: string[] = COLUMNS_SCHEMA.map((col) => col.key);
  columnsSchema: any = COLUMNS_SCHEMA;
  dataSource: MatTableDataSource<ScheduleDateTime> = new MatTableDataSource();

  currentSelectedAccount: ScheduleDateTime = null;
  lastSelectedAccount: ScheduleDateTime = null;
  highlighted: boolean;
  futureScheduleDates: ScheduleDateTime[] = [];

  static pageSize: number;

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
      allDates: [true, '',]
    });
  }
  onCheckboxChange(event: any) {
    this.getAllDates();
  }

  get f() {
    return this.form.controls;
  }


  getAllDates() {
    this.accountService.getAllDates()
      .pipe(first())
      .subscribe({
        next: (value: ScheduleDateTimes) => {
          this.futureScheduleDateStrings = [];
          this.list = [];
          this.futureScheduleDates = [];
          this.scheduleDateTime = value.scheduleDateTimes;
          console.assert(this.list.length <= 0, "list not empty");


          for (let index = 0; index < value.scheduleDateTimes.length; index++) {
            // Add server side dates
            this.list.push(value.scheduleDateTimes[index])
          }
          this.list.sort(function (a, b) {
            var aDate = moment(a.date, Constants.dateTimeFormat).toDate();
            var bDate = moment(b.date, Constants.dateTimeFormat).toDate();
            if (aDate > bDate) return 1;
            else if (aDate < bDate) return -1;
            else
              return 0
          });

          // Convert dates to date strings and optionally filter out past date strings
          for (let index = 0; index < this.list.length; index++) {
            var nowMs = Date.now();
            const scheduleServerDate = moment(this.list[index].date, Constants.dateTimeFormat).toDate();
            var scheduleLocalDateStr = moment(scheduleServerDate).format(Constants.dateTimeFormat);
            var scheduleMs = scheduleServerDate.getTime();

            if (this.f['allDates'].value || scheduleMs > nowMs) {
              this.futureScheduleDateStrings.push(scheduleLocalDateStr + "/" + this.getDayStrFromDate(scheduleLocalDateStr));

              var futureScheduleDate: ScheduleDateTime = {
                id: this.list[index].id,
                date: scheduleLocalDateStr,
                highlighted: false,
                isDeleting: false,
                day: this.getDayStrFromDate(scheduleLocalDateStr),
              }
              this.futureScheduleDates.push(futureScheduleDate);
            }
          }
          this.dataSource.data = this.futureScheduleDates;
          this.dataSource.paginator = this.paginator;
          this.dataSource.sort = this.sort;
          this.isLoaded = true;

          /* Set up selected row if still exists*/
          if (this.currentSelectedAccount != null) {
            var id = this.currentSelectedAccount.id;
            var selected = this.futureScheduleDates.filter(function (item) { return item.id == id });
            /* selected.length == 0 if user selected and deleted row in Schedules - top screen table */
            if (selected != null && selected.length == 1) {
              selected[0].highlighted = this.currentSelectedAccount.highlighted;
            }
          }
        },
        error: error => {
          console.log();
        }
      });
  }
  sortData(sort: Sort) {
    TimeHandler.sortData(this.futureScheduleDates, sort);
    this.dataSource = new MatTableDataSource(this.futureScheduleDates);
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
  onSchedulesUpdated(data: FunctionScheduleData) {
    this.getAllDates();
  }
  onChangePageProperties(event: any) {
    MainSchedulerComponent.pageSize = event.pageSize;
  }

  onRowSelected(scheduleDateTime: ScheduleDateTime) {
    console.log("MainSchedulerComponent row selected");

    /* Find out if element is from  `this.futureScheduleDates` */
    var found = false;
    for (let index = 0; index < this.futureScheduleDates.length; index++) {
      const element = this.futureScheduleDates[index];
      if (scheduleDateTime.date === element.date) {
        found = true;
        this.currentSelectedAccount = element;
        break;
      }
    }
    if (this.currentSelectedAccount) {
      this.currentSelectedAccount.highlighted = !this.currentSelectedAccount.highlighted;

      if (!found) {
        /* Deselect it */
        this.currentSelectedAccount.highlighted = false;
      }

      if (found) {
        /* Trigger `dateTimeChanged` on every `FunctionScheduleComponent` component (via `GenerateSchedulesComponent`) */
        this.generateScheduleComponent.setCurrentDate(this.currentSelectedAccount.date);
      }
    }
    if (this.lastSelectedAccount != null) {
      this.lastSelectedAccount.highlighted = false;
    }
    this.lastSelectedAccount = this.currentSelectedAccount;

    if (this.currentSelectedAccount && !this.currentSelectedAccount.highlighted) {
      // If row is deselected mark both schedules as deselected(null);
      this.lastSelectedAccount = null;
      this.currentSelectedAccount = null;
    }
  }
  dateTimeChanged(date: string) {

    var futureScheduleDate: ScheduleDateTime = {
      id: '',
      date: date,
      highlighted: false,
      isDeleting: false,
      day: this.getDayStrFromDate(date),
    }
    this.onRowSelected(futureScheduleDate);
  }


  onDeleteSchedules(event: MouseEvent, data: ScheduleDateTime) {
    console.log("MainSchedulerComponent deleting called");
    data.isDeleting = true;
    this.generateScheduleComponent.onDeleteSchedules(event, data);
  }
  get pageSize() {
    return MainSchedulerComponent.pageSize;
  }
}
