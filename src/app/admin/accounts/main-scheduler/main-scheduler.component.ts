
import { Component, ViewChild, signal } from '@angular/core';
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
    key: "scheduleDate",
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

  displayedColumns: string[] = COLUMNS_SCHEMA.map((col) => col.key);
  columnsSchema: any = COLUMNS_SCHEMA;
  dataSource: MatTableDataSource<ScheduleDateTime> = new MatTableDataSource();

  futureScheduleDates = signal<ScheduleDateTime[]>([]);

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
          var oldSelected = this.futureScheduleDates().find(function (item) { return item.highlighted });
          this.futureScheduleDateStrings = [];
          this.list = [];
          this.futureScheduleDates.set([]);
          console.assert(this.list.length <= 0, "list not empty");


          for (let index = 0; index < value.scheduleDateTimes.length; index++) {
            // Add server side dates
            this.list.push(value.scheduleDateTimes[index])
          }
          // Optionally filter out past date strings
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
              this.futureScheduleDates().push(futureScheduleDate);
            }
          }
          this.dataSource.data = this.futureScheduleDates();
          this.dataSource.paginator = this.paginator;
          this.dataSource.sort = this.sort;
          this.isLoaded = true;
          this.sortInAscDateOrder();

          /* Set up selected row if still exists*/
          /* selected == undefined if user selected and deleted row in Schedules - top screen table */
          if (oldSelected != undefined) {
            var selected = this.futureScheduleDates().find(function (item) { return item.id == oldSelected.id });
            selected.highlighted = oldSelected.highlighted;
          }
        },
        error: error => {
          console.log();
        }
      });
  }
  private sortInAscDateOrder() {
    const sortState: Sort = { active: 'scheduleDate', direction: 'asc' };
    this.sort.active = sortState.active;
    this.sort.direction = sortState.direction;
    this.sort.sortChange.emit(sortState);
  }

  sortData(sort: Sort) {
    TimeHandler.sortData(this.futureScheduleDates(), sort);
    this.dataSource.data = this.futureScheduleDates();
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

  onRowSelected(schedule: ScheduleDateTime, tr: any, index: number, event: any) {
    if (event.ctrlKey) {
      if (schedule.highlighted) {
        schedule.highlighted = false;
        return;
      }
    }
    this.selectRow(schedule);
  }

  selectRow(scheduleDateTime: ScheduleDateTime) {
    for (let index = 0; index < this.futureScheduleDates().length; index++) {
      const element = this.futureScheduleDates()[index];
      if (element.highlighted)
        element.highlighted = false;

      if (this.isSameScheduleDateTime(scheduleDateTime, element)) {
        var pageNumber = Math.floor(index / this.paginator.pageSize);
        this.paginator.pageIndex = pageNumber;

        this.paginator.page.next({
          pageIndex: pageNumber,
          pageSize: this.paginator.pageSize,
          length: this.paginator.length
        });
      }
    }
    scheduleDateTime.highlighted = true;
    if (!scheduleDateTime.isDeleting) {
      var date = moment(scheduleDateTime.date, Constants.dateTimeFormat).toDate();
      /* Trigger `dateTimeChanged` on every `FunctionScheduleComponent` component (via `GenerateSchedulesComponent`) */
      this.generateScheduleComponent.setCurrentDate(scheduleDateTime.date);
    }
  }
  isSameScheduleDateTime(s1: ScheduleDateTime, s2: ScheduleDateTime): boolean {
    console.assert(s1 != null && s2 != null, "One or both of the schedule date-time slots is null");
    return s1.date == s2.date;
  }
  dateTimeChanged(date: string) {
    var futureScheduleDate = this.futureScheduleDates().find((d) => { return d.date == date });

    if (futureScheduleDate != undefined) {
      this.selectRow(futureScheduleDate);
    }
    // else {
    //   var newSchedule: ScheduleDateTime = {
    //     id: '',
    //     date: date,
    //     highlighted: false,
    //     isDeleting: false,
    //     day: this.getDayStrFromDate(date),
    //   }
    //   futureScheduleDate = newSchedule;
    // }
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
