import { AfterViewInit, ChangeDetectorRef, Component, ElementRef, EventEmitter, OnInit, Output, ViewChild, signal } from '@angular/core';
import { FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import * as moment from 'moment';
import { first } from 'rxjs/operators';
import { Account, Role } from 'src/app/_models';
import { Schedule } from 'src/app/_models/schedule';
import { SchedulePoolElement } from 'src/app/_models/schedulepoolelement';
import { AgentTask } from 'src/app/_models/userfunction';
import { AccountService, AlertService } from 'src/app/_services';
import { environment } from 'src/environments/environment';

import { MatTableDataSource } from '@angular/material/table';

import { UpperCasePipe, ViewportScroller } from '@angular/common';
import { ThemePalette } from '@angular/material/core';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort, MatSortable, Sort } from '@angular/material/sort';
import * as signalR from '@microsoft/signalr';
import { TimeHandler } from 'src/app/_helpers/time.handler';
import { AgentTaskConfig } from 'src/app/_models/agenttaskconfig';
import { Constants } from '../../constants';

const COLUMNS_SCHEMA = [
  {
    key: "date",
    type: "text",
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

  dateFormat = Constants.dateTimeFormat;
  dateTimeFormat = Constants.dateTimeFormat;

  form: FormGroup;
  @Output() onScheduledAdded: EventEmitter<any>;
  id: string;

  dataSource: MatTableDataSource<Schedule>;

  schedules: Schedule[] = [];
  userFunctionIndexer: number = 0;


  agentTaskConfigs = signal<AgentTaskConfig[]>([]);
  submitted = false;
  accountService: AccountService;
  account: Account;
  isLoaded: boolean = false;
  isAdding: boolean = false;
  isUpdating: boolean = false;

  displayedColumns: string[] = COLUMNS_SCHEMA.map((col) => col.key);
  columnsSchema: any = COLUMNS_SCHEMA;

  userFunctions: AgentTask[] = [];

  isLoggedAsAdmin: boolean = false;

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
    private scroller: ViewportScroller,
  ) {

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
      groupTask: ["", Validators.required],
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

        this.accountService.getAllAgentTaskConfigs()
          .pipe(first())
          .subscribe({
            next: (value) => {
              this.agentTaskConfigs.set(value);

              this.dataSource = new MatTableDataSource([]);
              this.dataSource.paginator = this.paginator;
              this.dataSource.sort = this.sort;

              this.initSchedules(account);

              // Initial sorting by date
              this.sortInAscDateOrder();

              this.uniqueTasks = [... new Set(account.userFunctions.slice().map((f) => {
                return f.userFunction
              }))]
              if (this.uniqueTasks.length > 0) {
                this.form.get('function').setValue(this.uniqueTasks[0]);
              }

              this.setupGroupTaskCtrl();

              this.form.get('scheduledDate').setValue(new Date());
              if (this.userFunctions.length > 0) {
                this.form.get('function').setValue(this.userFunctions[0].userFunction);
              }

              this.account = account;
              this.onScheduledAdded.emit(this.schedules);
              this.userFunctionIndexer = account.userFunctions.length > 0 ? parseInt(account.userFunctions[account.userFunctions.length - 1].id) : 0;

              this.isLoaded = true;
            },
            complete: () => {
            },
            error: error => {
              this.alertService.error(error);
            }
          });
      });
  }
  initSchedules(account: Account) {
    var schedules = [];

    for (let index0 = 0; index0 < account.schedules.slice().length; index0++) {
      const dbSchedule = account.schedules[index0];
      var existingGuiSchedules = this.schedules.filter((s) => { return this.isSameSchedule(s, dbSchedule) });
      console.assert(existingGuiSchedules.length <= 1, "Error - we can't have more than one schedule date per agent");
      if (existingGuiSchedules.length == 1) {
        existingGuiSchedules[0].accountId = account.id,
          existingGuiSchedules[0].userFunction = dbSchedule.userFunction;
        existingGuiSchedules[0].scheduleGroup = dbSchedule.scheduleGroup;
        existingGuiSchedules[0].newDate = dbSchedule.newDate,
          existingGuiSchedules[0].dob = dbSchedule.dob,
          existingGuiSchedules[0].required = dbSchedule.required,
          existingGuiSchedules[0].userAvailability = dbSchedule.userAvailability,
          existingGuiSchedules[0].scheduleGroup = dbSchedule.scheduleGroup,
          existingGuiSchedules[0].userFunction = dbSchedule.userFunction,
          existingGuiSchedules[0].newUserFunction = dbSchedule.userFunction,
          schedules.push(existingGuiSchedules[0]);
        if (existingGuiSchedules[0].highlighted) {
          console.log("We have found highlighted item: " + existingGuiSchedules[0]);
        }
      } else {
        var guiSchedule: Schedule = {
          accountId: account.id,
          scheduleId: dbSchedule.scheduleId,
          date: dbSchedule.date,
          newDate: dbSchedule.date,
          dob: dbSchedule.dob,
          required: true,
          userAvailability: true,
          scheduleGroup: dbSchedule.scheduleGroup,
          userFunction: dbSchedule.userFunction,
          newUserFunction: dbSchedule.userFunction,
          deleting: false,
          highlighted: false,
          hovered: false
        }
        schedules.push(guiSchedule);
      }
    }
    this.schedules = schedules;
    this.dataSource.data = this.schedules;

    this.sortInAscDateOrder();

  }

  private sortInAscDateOrder() {
    const sortState: Sort = { active: 'Date', direction: 'asc' };
    this.sort.active = sortState.active;
    this.sort.direction = sortState.direction;
    this.sort.sortChange.emit(sortState);
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

  // convenience getter for easy access to form fields
  get f() { return this.form.controls; }

  onAddSchedule() {

    this.submitted = true;

    // reset alerts on submit
    this.alertService.clear();

    // stop here if form is invalid
    if (this.form.invalid) {
      var scheduledDateCtrl = this.f['scheduledDate'].valid;
      var groupTaskCtrl = this.f['groupTask'].valid;
      var functionCtrl = this.f['function'].valid;

      this.form.markAsTouched(); //markAllAsTouched();
      this.f['groupTask'].markAsTouched();
      return;
    }

    var newSchedule = this.createSchedule();
    if (newSchedule == null) {
      return; // Already exists
    }

    this.isAdding = true;
    this.accountService.addSchedule(this.account.id, newSchedule)
      .pipe(first())
      .subscribe({
        next: (account) => {
          this.account = account;
          this.initSchedules(account);
        },
        complete: () => {
          this.isAdding = false;
          // We have just succesfuly added a new schedule
          var schedules = this.schedules.filter(s => this.isSameSchedule(s, newSchedule));
          console.assert(schedules.length == 1, "Schedule  just created not found");
          this.selectRow(schedules[0]);
        },
        error: error => {
          this.alertService.error(error);
          this.scroller.scrollToAnchor("pageStart");
          this.isAdding = false;
        }
      });
  }

  createSchedule(): Schedule {
    var formDate = new Date(this.form.controls['scheduledDate'].value);
    formDate.setSeconds(0); // Re-set seconds to zero

    var formTimeStr = moment(formDate).format(Constants.dateTimeFormat);
    var formFunctionStr = this.form.controls['function'].value;
    var formGroup = this.form.controls['groupTask'].value;

    for (let index = 0; index < this.schedules.length; index++) {
      var scheduleTimeStr = this.schedules[index].date;
      var scheduleFunction = this.schedules[index].userFunction;
      var scheduleGroup = this.schedules[index].scheduleGroup;

      if (scheduleTimeStr == formTimeStr && scheduleFunction == formFunctionStr && scheduleGroup == formGroup) {
        var GroupStr = scheduleGroup.length > 0 ? "/" + formGroup : "";
        this.alertService.info("The user is already " + scheduleFunction + GroupStr + " for that date/time");
        this.scroller.scrollToAnchor("pageStart");

        // Select the existing one
        this.selectRow(this.schedules[index]);
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
      scheduleGroup: this.isGroupTaskSelected ? formGroup : "",
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
        }
      });
  }

  private updateSchedulesFromServer() {
    this.accountService.getById(this.id)
      .pipe(first())
      .subscribe(account => {

        this.accountService.getAllAgentTaskConfigs()
          .pipe(first())
          .subscribe({
            next: (value) => {
              this.agentTaskConfigs.set(value);
              this.initSchedules(account);
            },
            error: error => {
              this.alertService.error(error);
            }
          });
      });
  }

  onDateChanged(event: any) {
    var dateTime = event.value;
    var t = typeof (dateTime === 'Date');
  }
  onUserFunctionChanged(event: any) {
    this.setupGroupTaskCtrl();
  }

  private setupGroupTaskCtrl() {
    this.isGroupTaskSelected ? this.f['groupTask'].enable() : this.f['groupTask'].disable();
    this.uniqueGroups = [...new Set(this.account.userFunctions.slice().filter((f) => { return f.isGroup && f.userFunction == this.form.get('function').value; }).map((f) => {
      return f.group;
    }))];
    if (this.uniqueGroups.length > 0) {
      this.form.get('groupTask').setValue(this.uniqueGroups[0]);
    }
  }

  onGroupButtonEntered(event: any) {
    console.log("You entered: ", event.target.value);
  }

  onRowSelected(schedule: Schedule, tr: any, index: number, event: any) {
    if (event.ctrlKey) {
      if (schedule.highlighted) {
        schedule.highlighted = false;
        return;
      }
    }
    this.selectRow(schedule);
  }

  private selectRow(schedule: Schedule) {
    for (let index = 0; index < this.schedules.length; index++) {
      const element = this.schedules[index];
      if (element.highlighted)
        element.highlighted = false;

      if (this.isSameSchedule(schedule, element)) {
        var pageNumber = Math.floor(index / this.paginator.pageSize);
        this.paginator.pageIndex = pageNumber;

        this.paginator.page.next({
          pageIndex: pageNumber,
          pageSize: this.paginator.pageSize,
          length: this.paginator.length
        });
      }
    }
    schedule.highlighted = true;
    if (!schedule.deleting) {
      var date = moment(schedule.date, Constants.dateTimeFormat).toDate();
      this.form.get('scheduledDate').setValue(date);
      this.form.get('function').setValue(schedule.userFunction);
      this.setupGroupTaskCtrl();
      this.form.get('groupTask').setValue(schedule.scheduleGroup);
    }
  }

  private isSameSchedule(s1: Schedule, s2: Schedule) : boolean {
    console.assert(s1 != null && s2 != null, "One of schedules is null");
    return s1.date == s2.date && s1.userFunction == s2.userFunction && s1.scheduleGroup == s2.scheduleGroup;
  }

  sortData(sort: Sort) {
    TimeHandler.sortData(this.schedules, sort);
    this.dataSource.data = this.schedules.slice();
  }

  get isAdmin() {
    return this.account.role == Role.Admin;
  }
  get isGroupTaskSelected() {
    if (this.form == undefined)
      return false;
    for (let index = 0; index < this.agentTaskConfigs().length; index++) {
      const possibleTask = this.agentTaskConfigs()[index];
      if (possibleTask.agentTaskStr === this.form.get('function').value) {
        console.log("task" + possibleTask.isGroup)
        return possibleTask.isGroup;
      }
    }
    return false;
  }
}
