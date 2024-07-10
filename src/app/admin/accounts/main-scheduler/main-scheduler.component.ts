
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
import { AccountService, AlertService } from 'src/app/_services';
import { Constants } from 'src/app/constants';
import { GenerateSchedulesComponent } from '../generate-schedules/generate-schedules.component';
import { NgbdModalOptionsComponent } from '../ngbd-modal-options/ngbd-modal-options.component';
import { NgbModal, NgbModalRef } from '@ng-bootstrap/ng-bootstrap';
import { NgbdModalConfirmComponent } from '../ngbd-modal-confirm/ngbd-modal-confirm.component';
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
  styleUrls: ['./main-scheduler.component.less'],

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
    private alertService: AlertService,
    private modalService: NgbModal,
    private formBuilder: FormBuilder) {
  }
  ngAfterViewInit(): void {
    this.dataSource.paginator = this.paginator;
    this.dataSource.sort = this.sort;
    this.dataSource = new MatTableDataSource();

    this.getAllDates();
    console.log("Sorting ngAfterViewInit");
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
    this.isLoaded = false;
    console.log("MainSchedulerComponent:getAllDates");
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
          this.sortInAscDateOrder(); //this.sortInDescDateOrder();

          /* Set up selected row if still exists*/
          /* selected == undefined if user selected and deleted row in Schedules - top screen table */
          if (oldSelected != undefined) {
            var selected = this.futureScheduleDates().find(function (item) { return item.id == oldSelected.id });
            if (selected != undefined) {
              selected.highlighted = oldSelected.highlighted;
            }
          }
          this.isLoaded = true;
        },
        error: error => {
          console.log();
          this.isLoaded = true;
        }
      });
  }
  private sortInAscDateOrder() {
    const sortState: Sort = { active: 'scheduleDate', direction: 'asc' };
    this.sort.active = sortState.active;
    this.sort.direction = sortState.direction;
    this.sort.sortChange.emit(sortState);
    console.log("main-scheduler sorting");
  }

  private sortInDescDateOrder() {
    const sortState: Sort = { active: 'scheduleDate', direction: 'desc' };
    this.sort.active = sortState.active;
    this.sort.direction = sortState.direction;
    this.sort.sortChange.emit(sortState);
    console.log("main-scheduler sorting");
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
        this.generateScheduleComponent.unselect();
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
      this.generateScheduleComponent.setCurrentDateTime(scheduleDateTime.date);
    }
  }
  isSameScheduleDateTime(s1: ScheduleDateTime, s2: ScheduleDateTime): boolean {
    console.assert(s1 != null && s2 != null, "One or both of the schedule date-time slots is/are null");
    return s1.date == s2.date;
  }
  dateTimeChanged(date: string) {
    var futureScheduleDate = this.futureScheduleDates().find((d) => { return d.date == date });

    if (futureScheduleDate != undefined) {
      this.selectRow(futureScheduleDate);
    }
    else { // New date - not existing yet
      this.unselect();
    }
  }

  onDeleteSchedules(event: MouseEvent, date: ScheduleDateTime) {
    this.isLoaded = false;

    // First display confirmation dialog box ...
    const modalRef = this.modalService.open(NgbdModalConfirmComponent);
    modalRef.componentInstance.titleStr = "Schedules Deletion";
    modalRef.componentInstance.bodyQuestionStr = "Are you sure you want to delete schedules?";
    modalRef.componentInstance.bodyInfoStr = "All information associated with the schedules will be permanently deleted.";

    modalRef.result.then((data) => {

      // ... then display busy cursor
      const modalRef = this.modalService.open(NgbdModalOptionsComponent, {
        backdrop: 'static',
        centered: true,
        windowClass: 'modalClass',
        keyboard: false
      });
      console.log("MainSchedulerComponent deleting called");
      this.accountService.deleteSchedules4Date(date.date) //getAll()
        .pipe(first())
        .subscribe({
          next: (value) => {
          },
          complete: () => {
            console.log("Deleting schedules for date: " + date.date);
            this.getAllDates();
            this.generateScheduleComponent.unselect();
            this.isLoaded = true;
            modalRef.close();
          },
          error: (error) => {
            this.alertService.error(error);
            this.isLoaded = true;
          }
        });
    }).catch((error) => {
      this.alertService.error(error);
    })
  }
  get pageSize() {
    return MainSchedulerComponent.pageSize;
  }
  unselect() {
    for (let index = 0; index < this.futureScheduleDates().length; index++) {
      const element = this.futureScheduleDates()[index];
      if (element.highlighted)
        element.highlighted = false;
    }
    this.paginator.page.next({
      pageIndex: 0,
      pageSize: this.paginator.pageSize,
      length: this.paginator.length
    });
  }
}
