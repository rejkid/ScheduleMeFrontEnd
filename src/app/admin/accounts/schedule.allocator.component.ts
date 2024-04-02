import { AfterViewInit, ChangeDetectorRef, Component, ElementRef, EventEmitter, OnInit, Output, QueryList, ViewChild, ViewChildren } from '@angular/core';
import { FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import * as moment from 'moment';
import { first } from 'rxjs/operators';
import { Account, Role } from 'src/app/_models';
import { Schedule } from 'src/app/_models/schedule';
import { SchedulePoolElement } from 'src/app/_models/schedulepoolelement';
import { UserFunction } from 'src/app/_models/userfunction';
import { AccountService, AlertService } from 'src/app/_services';
import { environment } from 'src/environments/environment';

import { MatTableDataSource } from '@angular/material/table';

import { UpperCasePipe, ViewportScroller } from '@angular/common';
import { ThemePalette } from '@angular/material/core';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort, MatSortable, Sort } from '@angular/material/sort';
import * as signalR from '@microsoft/signalr';
import { Constants } from '../../constants';
import { MatSelectChange } from '@angular/material/select';
import { TimeHandler } from 'src/app/_helpers/time.handler';

const COLUMNS_SCHEMA = [
  {
    key: "date",
    type: "Date",
    label: "Date"
  },
  {
    key: "userFunction",
    type: "text",
    label: "Duty"
  },
  {
    key: "scheduleGroup",
    type: "text",
    label: "Group"
  },
  {
    key: "action",
    type: "button",
    label: "Action"
  },
]

@Component({
  templateUrl: './schedule.allocator.component.html',
  styleUrls: ['./schedule.allocator.component.less'],
})

export class ScheduleAllocatorComponent implements OnInit, AfterViewInit {
  @ViewChild('paginator') paginator: MatPaginator;
  @ViewChild(MatSort) sort: MatSort;
  @ViewChild('groupDataCtrl') groupCtrl: ElementRef;

  readonly CLEANER_STR = Constants.CLEANER_STR;

  static HighlightRow: Number = -1;

  dateFormat = Constants.dateTimeFormat;
  dateTimeFormat = Constants.dateTimeFormat;

  form: FormGroup;
  @Output() onScheduledAdded: EventEmitter<any>;
  id: string;

  dataSource: MatTableDataSource<Schedule>;

  schedules: Schedule[] = [];
  userFunctionIndexer: number = 0;
  possibleTasks: UserFunction[] = [];
  submitted = false;
  accountService: AccountService;
  account: Account;
  isLoaded: boolean = false;
  isAdding: boolean = false;
  isUpdating: boolean = false;

  displayedColumns: string[] = COLUMNS_SCHEMA.map((col) => col.key);
  columnsSchema: any = COLUMNS_SCHEMA;

  userFunctions: UserFunction[] = [];

  isLoggedAsAdmin: boolean = false;

  currentSelectedSchedule: Schedule = null;
  lastSelectedSchedule: Schedule = null;
  idx: number;

  poolElements: SchedulePoolElement[] = [];
  public color: ThemePalette = 'primary';

  groupTask: string = "G";

  connection: signalR.HubConnection;
  uniqueTasks: string[];
  uniqueGroups: string[];

  constructor(accountService: AccountService,
    private route: ActivatedRoute,
    private router: Router,
    private formBuilder: FormBuilder,
    private alertService: AlertService,
    private cdr: ChangeDetectorRef,
    private uppercasePipe: UpperCasePipe,
    private scroller: ViewportScroller) {

    this.accountService = accountService;
    this.onScheduledAdded = new EventEmitter();

    this.isLoggedAsAdmin = this.accountService.isAdmin();

    this.connection = new signalR.HubConnectionBuilder()
      .configureLogging(signalR.LogLevel.Information)
      .withUrl(environment.baseUrl + '/update')
      .build();

    this.connection.start().then(function () {
      console.log('SignalR Connected!');
    }).catch(function (err) {
      return console.error(err.toString());
    });

    this.connection.on("SendUpdate", (id: number) => {
      this.updateSchedulesFromServer();
    });

    /* This form relates to upper part of the template*/
    this.form = this.formBuilder.group({
      scheduledDate: ['', Validators.required],
      groupTask: ['K',],
      function: ['', [Validators.required, this.functionValidator]],
    });
  }

  ngOnInit(): void {
    this.id = this.route.snapshot.params['id'];

  }

  ngAfterViewInit(): void {
    
    this.accountService.getById(this.id)
      .pipe(first())
      .subscribe(account => {

        this.account = account;

        this.accountService.getTasks()
          .pipe(first())
          .subscribe({
            next: (value) => {
              this.possibleTasks = value.functions;
              this.initSchedules(account);

              // Initial sorting by date
              this.sort.sort(({ id: 'date', start: 'asc' }) as MatSortable);

              this.uniqueTasks = [... new Set(account.userFunctions.slice().map((f) => {
                return f.userFunction
              }))]
              if(this.uniqueTasks.length > 0) {
                this.form.get('function').setValue(this.uniqueTasks[0]);
              }

              this.uniqueGroups = [... new Set(account.userFunctions.slice().map((f) => {
                return f.group
              }))]
              if(this.uniqueGroups.length > 0) {
                this.form.get('groupTask').setValue(this.uniqueGroups[0]);
              }

              this.form.get('scheduledDate').setValue(new Date());
              if (this.userFunctions.length > 0) {
                this.form.get('function').setValue(this.userFunctions[0].userFunction);
              }

              // if (!this.isGroupTaskSelected) {
              //   this.form.get('groupTask').disable();
              // } else {
              //   this.form.get('groupTask').addValidators(Validators.required);
              //   this.form.get('groupTask').addValidators(Validators.minLength(1));
              //   this.form.get('groupTask').setValue(account.scheduleGroup);
              // }

              this.account = account;
              this.onScheduledAdded.emit(this.schedules);
              this.userFunctionIndexer = account.userFunctions.length > 0 ? parseInt(account.userFunctions[account.userFunctions.length - 1].id) : 0;

              this.isLoaded = true;

              //this.f["groupTask"].setValue(this.assignedGroup);

            },
            error: error => {
              this.alertService.error(error);
            }
          });
      });
  }

  ngOnDestroy() {
    console.log("Called");
    this.connection.stop().
      catch((err) =>
        console.error(err.toString())
      );
  }
  /* I am not sure if we need 'input' parameter - keep it for now*/
  applyFilter(t: any, input: any) {
    const target = t as HTMLTextAreaElement;
    var filterValue = target.value;
    filterValue = filterValue.trim(); // Remove whitespace
    filterValue = filterValue.toLowerCase(); // Datasource defaults to lowercase matches
    this.dataSource.filter = filterValue;
  }

  functionValidator(control: FormControl): { [s: string]: boolean } {
    if (control.value === '') {
      return { invalidFunction: true };
    }
    return null;
  }

  // onDutyChanged(event: any) {
  //   if (event.value == this.CLEANER_STR) {
  //     this.form.get('groupTask').enable();
  //     this.f["groupTask"].setValue(this.assignedGroup);
  //   } else {
  //     this.form.get('groupTask').disable();
  //   }
  // }
  // convenience getter for easy access to form fields
  get f() { return this.form.controls; }

  onAddSchedule() {

    this.submitted = true;

    // reset alerts on submit
    this.alertService.clear();

    // stop here if form is invalid
    if (this.form.invalid) {
      this.form.markAsTouched(); //markAllAsTouched();
      this.f['groupTask'].markAsTouched();
      return;
    }

    var schedule = this.createSchedule('scheduledDate', 'function', 'groupTask');
    if (schedule == null)
      return; // Already exists

    this.isAdding = true;
    this.accountService.addSchedule(this.account.id, schedule)
      .pipe(first())
      .subscribe({
        next: (account) => {
          this.updateSchedulesFromServer();
          this.initSchedules(account);
        },
        complete: () => {
          this.isAdding = false;
        },
        error: error => {
          this.updateSchedulesFromServer();
          this.alertService.error(error);
          this.scroller.scrollToAnchor("pageStart");
          this.isAdding = false;
        }
      });
  }

  onInputFunc(date: HTMLInputElement, event: any) {
    var k = event.key;

    var retVal = this.uppercasePipe.transform(event.key);
    return retVal;
  }
  createSchedule(dateStr: string, functionStr: string, groupStr : string): Schedule {
    var formDate = new Date(this.form.controls[dateStr].value);
    formDate.setSeconds(0); // Re-set seconds to zero

    var formTimeStr = moment(formDate).format(Constants.dateTimeFormat);
    var formFunctionStr = this.form.controls[functionStr].value;
    var formGroup = this.form.controls[groupStr].value;

    for (let index = 0; index < this.schedules.length; index++) {
      var scheduleTimeStr = this.schedules[index].date;
      var scheduleFunction = this.schedules[index].userFunction;
      var scheduleGroup = this.schedules[index].scheduleGroup;

      if (scheduleTimeStr == formTimeStr && scheduleFunction == formFunctionStr && scheduleGroup == formGroup) {
        var GroupStr = scheduleGroup.length > 0 ? "/" + formGroup : "";
        this.alertService.error("The user is already " + scheduleFunction + GroupStr + " for that date/time");
        this.scroller.scrollToAnchor("pageStart");

        return null;
      }
    }

    var schedule: Schedule = {
      accountId: this.account.id,
      date: formTimeStr,
      newDate: formTimeStr,
      dob: this.account.dob,
      required: true,
      deleting: false,
      userAvailability: true,
      scheduleGroup: formGroup,
      userFunction: formFunctionStr,
      newUserFunction: formFunctionStr
    }
    return schedule;
  }
  onDeleteSchedule(rowIndex: string, schedule2Delete: Schedule) { // rowIndex is table index
    schedule2Delete.deleting = true;
    this.accountService.deleteSchedule(this.account.id, schedule2Delete)
      .pipe(first())
      .subscribe({
        next: (account) => {
          this.updateSchedulesFromServer();
        },
        complete: () => {
          schedule2Delete.deleting = false;
        },
        error: error => {
          this.alertService.error(error);
          schedule2Delete.deleting = false;
          this.updateSchedulesFromServer();
        }
      });
  }

  updateSchedulesFromServer() {
    this.accountService.getById(this.id)
      .pipe(first())
      .subscribe(account => {

        this.accountService.getTasks()
          .pipe(first())
          .subscribe({
            next: (value) => {
              this.possibleTasks = value.functions;
              this.initSchedules(account);
            },
            error: error => {
              this.alertService.error(error);
            }
          });
      });
  }

  onDateChanged(event: any, schedule: Schedule) {
    var dateTime = event.value;
    var t = typeof (dateTime === 'Date');

    var newDate: Date = event.value.toDate(); // Convert moment to Date
    schedule.newDate = newDate.setSeconds(0).toString();
    //schedule.newDate.setSeconds(0); // Little trick which does what mat angular should have done - reset seconds
    schedule.newUserFunction = schedule.userFunction;

    this.updateSchedules(schedule);
  }
  onUserFunctionChanged(event: any, schedule: Schedule) {
    var funcName = event.value;
    var t = typeof (funcName === 'string');

    schedule.newUserFunction = event.value;
    schedule.newDate = schedule.date;

    this.updateSchedules(schedule);
  }

  onCleanerGroupPressed(event: any) {
    console.log("You entered: ", event.target.value);
  }

  updateSchedules(schedule: Schedule) {
    this.isUpdating = true;
    // reset alerts on submit
    this.alertService.clear();

    this.accountService.updateSchedule(this.account.id, schedule)
      .pipe(first())
      .subscribe({
        next: (account) => {
          console.log(account);
          this.initSchedules(account);
        },
        complete: () => {
          this.isUpdating = false;
        },
        error: error => {
          this.alertService.error(error);
          this.isUpdating = false;
        }
      });
  }

  onRowSelected(schedule: Schedule, tr: any, index: number, event: any) {
    schedule.highlighted = !schedule.highlighted;
    this.currentSelectedSchedule = schedule;

    if (event.ctrlKey) {
      ScheduleAllocatorComponent.HighlightRow = ScheduleAllocatorComponent.HighlightRow == index ? -1 : index;
    } else {
      ScheduleAllocatorComponent.HighlightRow = index;//this.HighlightRow == index ? -1 : index;
    }

    if (!schedule.deleting) {
      var date = moment(schedule.date, Constants.dateTimeFormat).toDate();
      this.form.get('scheduledDate').setValue(date);
      this.form.get('function').setValue(schedule.userFunction);
      this.form.get('groupTask').setValue(schedule.scheduleGroup);
    }
    if (this.lastSelectedSchedule != null) {
      this.lastSelectedSchedule.highlighted = false;
    }
    this.lastSelectedSchedule = this.currentSelectedSchedule;

    if (!schedule.highlighted) {
      // If row is deselected mark both schedules as deselected(null);
      this.lastSelectedSchedule = null;
      this.currentSelectedSchedule = null;
    }
  }

  initSchedules(account: Account) {
    var date =
      this.schedules = account.schedules.slice();

    this.dataSource = new MatTableDataSource(this.schedules);
    this.dataSource.paginator = this.paginator;
    this.dataSource.sort = this.sort;

  }
  sortData(sort: Sort) {
    TimeHandler.sortData(this.schedules, sort);
    this.dataSource = new MatTableDataSource(this.schedules);
  }

  get isAdmin() {
    return this.account.role == Role.Admin;
  }
  get isGroupTaskSelected() {
    if(this.form == undefined)
     return false;
    for (let index = 0; index < this.possibleTasks.length; index++) {
      const possibleTask = this.possibleTasks[index];
      if(possibleTask.userFunction === this.form.get('function').value)
      {
        return possibleTask.isGroup;
      }
    }
    return false;
  }
  // get assignedGroup(): string {
  //   const taskSelected = this.form.controls['function'].value;
  //   var task = this.account.userFunctions.find((f) => {
  //     return f.userFunction === taskSelected;
  //   });
  //   return (task != null && task != undefined) ? task.group : "";
  // }
  // onTaskChanged(event: MatSelectChange) {
  //   var valueSelected = event.value;
  //   if(this.isGroupTaskSelected) {
  //     this.f["groupTask"].setValue(this.assignedGroup);
  //   } else {
  //     this.f["groupTask"].setValue("");
  //   }
  // }
  // onGroupChanged(event: MatSelectChange) {
  //   var valueSelected = event.value;
  //   if(this.isGroupTaskSelected) {
  //     this.f["groupTask"].setValue(this.assignedGroup);
  //   } else {
  //     this.f["groupTask"].setValue("");
  //   }
  // }
  // get isReadOnly(): boolean {
  //   return this.assignedGroup.length > 0;
  // }
  get staticHighlightRow() {
    return ScheduleAllocatorComponent.HighlightRow;
}
}
