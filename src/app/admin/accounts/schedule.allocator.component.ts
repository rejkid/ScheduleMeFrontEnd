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

import { UpperCasePipe } from '@angular/common';
import { ThemePalette } from '@angular/material/core';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort, MatSortable } from '@angular/material/sort';
import * as signalR from '@microsoft/signalr';
import { Constants } from '../../constants';

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

  readonly CLEANER_STR = Constants.CLEANER_STR;

  dateFormat = Constants.dateTimeFormat;
  dateTimeFormat = Constants.dateTimeFormat;

  form: FormGroup;
  @Output() onScheduledAdded: EventEmitter<any>;
  id: string;

  dataSource: MatTableDataSource<Schedule>;

  schedules: Schedule[] = [];
  userFunctionIndexer: number = 0;
  functions: string[] = [];
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

  currentSelectedSchedule : Schedule = null;
  lastSelectedSchedule : Schedule = null;
  idx : number;

  poolElements: SchedulePoolElement[] = [];
  public color: ThemePalette = 'primary';

  groupTask : string = "G";

  connection: signalR.HubConnection;

  constructor(accountService: AccountService,
    private route: ActivatedRoute,
    private router: Router,
    private formBuilder: FormBuilder,
    private alertService: AlertService,
    private cdr: ChangeDetectorRef,
    private uppercasePipe: UpperCasePipe) {

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

    this.form = this.formBuilder.group({
      scheduledDate: ['', Validators.required],
      cleanerGroup: ['K', ] ,
      function: ['', [Validators.required, this.functionValidator]],
    });

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
              this.functions = value;
              this.initSchedules(account);

              // Initial sorting by date
              this.sort.sort(({ id: 'date', start: 'asc' }) as MatSortable);

              this.userFunctions = account.userFunctions.slice();

              this.form.get('scheduledDate').setValue(new Date());
              if (this.userFunctions.length > 0) {
                this.form.get('function').setValue(this.userFunctions[0].userFunction);
              }
              if (!this.isCleaner) {
                this.form.get('cleanerGroup').disable();
              } else {
                this.form.get('cleanerGroup').addValidators(Validators.required);
                this.form.get('cleanerGroup').addValidators(Validators.minLength(1));
                this.form.get('cleanerGroup').setValue(account.scheduleGroup);
              }

              this.account = account;
              this.onScheduledAdded.emit(this.schedules);
              this.userFunctionIndexer = account.userFunctions.length > 0 ? parseInt(account.userFunctions[account.userFunctions.length - 1].id) : 0;

              this.isLoaded = true;

              this.f["cleanerGroup"].setValue(this.group);

              //this.groupTask = this.group;
            },
            error: error => {
              this.alertService.error(error);
            }
          });
      });

  }

  ngOnInit(): void {
    this.id = this.route.snapshot.params['id'];

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
  
  onDutyChanged(event: any) {
    if(event.value == this.CLEANER_STR) {
      this.form.get('cleanerGroup').enable();
      this.f["cleanerGroup"].setValue(this.group);
    } else {
      this.form.get('cleanerGroup').disable();
    }
  }
  // convenience getter for easy access to form fields
  get f() { return this.form.controls; }

  onAddSchedule() {

    this.submitted = true;

    // reset alerts on submit
    this.alertService.clear();

    // stop here if form is invalid
    if (this.form.invalid) {
      this.form.markAsTouched(); //markAllAsTouched();
      this.f['cleanerGroup'].markAsTouched();
      return;
    }

    var schedule = this.createSchedule('scheduledDate', 'function');
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
          this.isAdding = false;
        }
      });
  }

  onInputFunc(date: HTMLInputElement, event : any ) {
    var k = event.key;
    
    var retVal = this.uppercasePipe.transform(event.key);
    return retVal;
  }
  createSchedule(dateStr: string, functionStr: string): Schedule {
    var formDate = new Date(this.form.controls[dateStr].value);
    formDate.setSeconds(0); // Re-set seconds to zero
    var formTimeStr = moment(formDate).format(Constants.dateTimeFormat);

    var formFunction = this.form.controls[functionStr].value;

    for (let index = 0; index < this.schedules.length; index++) {
      var scheduleTime = new Date(this.schedules[index].date).getTime();
      var scheduleTimeStr = this.schedules[index].date;

      var scheduleFunction = this.schedules[index].userFunction;
      if (scheduleTimeStr == formTimeStr && scheduleFunction == formFunction) {
        this.alertService.warn("The user is already " + scheduleFunction + " for that date/time");
        return null;
      }
    }

    var scheduleGroupVal = "";
    if (this.form.controls['cleanerGroup'].enabled) {
      scheduleGroupVal = this.form.controls['cleanerGroup'].value;
    }
    var schedule: Schedule = {
      accountId: this.account.id,
      date: formTimeStr,
      newDate: formTimeStr,
      dob: this.account.dob,
      required: true,
      deleting: false,
      userAvailability: true,
      scheduleGroup: scheduleGroupVal,
      userFunction: this.form.controls[functionStr].value,
      newUserFunction: this.form.controls[functionStr].value
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
              this.functions = value;
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

  onCleanerGroupPressed(event : any) {
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

  onRowSelected(schedule: Schedule, tr: any, index : number) {
    schedule.highlighted = !schedule.highlighted;
    this.currentSelectedSchedule = schedule;

    if (!schedule.deleting) {
      var date = moment(schedule.date, Constants.dateTimeFormat).toDate();
      this.form.get('scheduledDate').setValue(date);
      this.form.get('function').setValue(schedule.userFunction);
      this.form.get('cleanerGroup').setValue(schedule.scheduleGroup);
    }
    if(this.lastSelectedSchedule != null) {
      this.lastSelectedSchedule.highlighted = false;
    }
    this.lastSelectedSchedule = this.currentSelectedSchedule;

    if(!schedule.highlighted) {
      // If row is deselected mark both schedules as deselected(null);
      this.lastSelectedSchedule = null;
    this.currentSelectedSchedule = null;
    }
  } 

  initSchedules(account: Account) {
    var date = 
    this.schedules = account.schedules.slice();
    // Fix up the date string for the schedules
    this.schedules.forEach(element => {
      var date = new Date(element.date);
      var dateTimeStr = moment(date).format(Constants.dateTimeFormat);
      element.date = dateTimeStr;
    }); 

    this.dataSource = new MatTableDataSource(this.schedules);
    this.dataSource.paginator = this.paginator;
    this.dataSource.sort = this.sort;

  }
  get isAdmin() {
    return this.account.role == Role.Admin;
  }
  get isCleaner() {
    if(this.form == undefined)
     return false;
    return this.form.get('function').value === this.CLEANER_STR
  }
  get group() : string {
    var fun = this.account.userFunctions.find(f => {
      // console.log(f);
      return f.group.length > 0
    });
    if (fun != null)
      return fun.group
    else
      return "";
  }
  get isReadOnly() : boolean {
    return this.group.length > 0;
  }
}
