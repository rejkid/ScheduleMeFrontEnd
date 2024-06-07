import { group } from '@angular/animations';
import { DOCUMENT, ViewportScroller } from '@angular/common';
import { AfterViewInit, Component, ElementRef, EventEmitter, Inject, Input, OnInit, Output, QueryList, ViewChild, ViewChildren } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table';
import { ActivatedRoute, Router } from '@angular/router';
import * as moment from 'moment';
import { first } from 'rxjs/operators';
//import { first } from 'rxjs';
import { Account } from 'src/app/_models';
import { AccountsByDateAndTaskDTO } from 'src/app/_models/AccountsByDateAndTaskDTO';
import { FunctionScheduleData } from 'src/app/_models/functionscheduledata';
import { Schedule } from 'src/app/_models/schedule';
import { UserFunction } from 'src/app/_models/userfunction';
import { AccountService, AlertService } from 'src/app/_services';
import { Constants } from 'src/app/constants';

const COLUMNS_SCHEMA = [
  {
    key: "firstName",
    type: "text",
    label: "First Name"
  },
  {
    key: "secondName",
    type: "text",
    label: "SecondName"
  },
  {
    key: "email",
    type: "text",
    label: "E-mail"
  },
  {
    key: "dob",
    type: "text",
    label: "DateOfBirth"
  },
  {
    key: "group",
    type: "text",
    label: "ScheduleGroup"
  },
  {
    key: "action",
    type: "button",
    label: "Action"
  },
]

@Component({
  selector: 'app-function-schedule',
  templateUrl: './function-schedule.component.html',
  styleUrls: ['./function-schedule.component.less']
})
export class FunctionScheduleComponent implements OnInit, AfterViewInit {
  @ViewChild('paginator') paginator: MatPaginator;
  @ViewChild(MatSort) sort: MatSort;

  @Input() functionStr: string;
  @Input() dateTimeStr: string;

  @Output() schedulesUpdatedEmitter: EventEmitter<FunctionScheduleData>;

  dateFormat = Constants.dateFormat;
  dateTimeFormat = Constants.dateTimeFormat;
  form: FormGroup;
  displayedColumns: string[] = COLUMNS_SCHEMA.map((col) => col.key);
  columnsSchema: any = COLUMNS_SCHEMA;

  /* Busy cursor flags */
  isAdding: boolean = false;
  accountsLoaded: boolean = true;

  dataSource: MatTableDataSource<Account> = new MatTableDataSource([]);
  currentSelectedAccount: Account = null;
  lastSelectedAccount: Account = null;
  selectedAccount4Function: Account;
  accounts: Account[] = [];

  titlePrefix: string = "";
  thisTask: UserFunction = null;
  groupTasks: string[] = [];
  isInitializing: boolean = true;
  string2AccountMap: Map<string, Account> = new Map<string, Account>();

  constructor(private accountService: AccountService,
    private route: ActivatedRoute,
    private router: Router,
    private scroller: ViewportScroller,
    private formBuilder: FormBuilder,
    private alertService: AlertService) {
    this.schedulesUpdatedEmitter = new EventEmitter<FunctionScheduleData>();
  }

  ngOnInit(): void {
    this.isInitializing = true;

    this.form = this.formBuilder.group({
      selectedUser: ['', [Validators.required]],
    });
    this.f["selectedUser"].valueChanges.subscribe((value) => {
      console.log(value);
    });

    this.accountService.getGroupTasks()
      .pipe(first())
      .subscribe({
        next: (groupTasks: string[]) => {
          this.groupTasks = groupTasks;
          if (groupTasks.includes(this.functionStr)) {
            this.titlePrefix = "Group "
          }
          this.isInitializing = false;
        },
        complete: () => {
          this.isInitializing = false;
        },
        error: error => {
          this.alertService.error(error);
          this.isInitializing = false;
        }
      });
  }
  ngAfterViewInit(): void {
    this.dataSource.paginator = this.paginator;
    this.dataSource.sort = this.sort;
    this.dataSource = new MatTableDataSource();
    this.refreshAccounts();
  }
  get accounts4DateAndFunction(): Account[] {
    return Array.from(this.string2AccountMap.values());
  }

  private refreshAccounts() {
    this.accountsLoaded = false;
    var accountsByDateAndTaskDTO: AccountsByDateAndTaskDTO = {
      dateStr: this.dateTimeStr,
      task : this.functionStr
    }
    this.accountService.getByDateAndTask(accountsByDateAndTaskDTO)
      .pipe(first())
      .subscribe({
        next: (accounts: Account[]) => {
          this.accounts = accounts;
          this.accounts.forEach(account => {
            account.isDeleting = false;
          });

          /* Notify parent that we got data from server */
          var funcSchedData: FunctionScheduleData = {
            userFunction: this.functionStr,
            accounts: this.accounts4DateAndFunction
          }
          this.schedulesUpdatedEmitter.emit(funcSchedData);
        },
        complete: () => {
          this.initTaskScheduleComponent();
          this.createAccountStrings4Function();
          this.accountsLoaded = true;
        },
        error: error => {
          this.alertService.error(error);
          this.accountsLoaded = true;
        }
      });
  }

  /* Initialize `thisTask` representing this Task/Schedule component */
  initTaskScheduleComponent(): void {
    var task: UserFunction = {
      id: "",
      group: "",
      userFunction: this.functionStr,
      isGroup: this.groupTasks.includes(this.functionStr),
      isDeleting: false,
      highlighted: false
    }
    this.thisTask = task;

    for (var i = 0; i < this.accounts.length; i++) {
      var account = this.accounts[i];
      for (var j = 0; j < account.schedules.length; j++) {
        var schedule = account.schedules[j];
        if (schedule.userFunction == this.functionStr
          && schedule.date == this.dateTimeStr) {
          /* We have found schedule representing Task, let's find Task */
          for (var z = 0; z < account.userFunctions.length; z++) {
            var task = account.userFunctions[z];
            if (task.userFunction == schedule.userFunction
              && task.group == schedule.scheduleGroup) {
              this.thisTask = task;
              return;
            }
          }
        }
      }
    }
  }

  private createAccountStrings4Function() {
    var selected: string = undefined;
    this.string2AccountMap = new Map<string, Account>();
    this.accounts.forEach(account => {
      account.userFunctions.forEach(userFunc => {
        account.schedules.forEach(schedule => {
          if (userFunc.userFunction == this.functionStr
            && userFunc.group == this.thisTask.group
          ) {
            var str = account.firstName + '/' + account.lastName + '/' + account.email + '/' + account.dob;
            if (userFunc.isGroup) {
              str = str + '/' + userFunc.group
            }
            if (!this.string2AccountMap.has(str)) {
              this.string2AccountMap.set(str, account);
              if (selected === undefined) {
                selected = str;
              }
            }
          }
        });
      });
    });

    console.log(this.string2AccountMap);
    this.f['selectedUser'].setValue(selected);
    this.dataSource.data = [...this.string2AccountMap.values()];//Array.from( this.string2AccountMap.values() );
    this.dataSource.paginator = this.paginator;
    this.dataSource.sort = this.sort;

  }

  setCurrentDate(dateTime: string) {
    this.dateTimeStr = dateTime;
    this.refreshAccounts();
    console.log("Called for: for:" + this.functionStr + " New datetime is:" + dateTime);
  }

  get f() { return this.form.controls; }

  onModelChange(value: string) {
    console.log(value);
  }

  onChangeUser(event: Event) {
    var valueSelected = (event.target as HTMLInputElement).value;
    this.selectedAccount4Function = this.string2AccountMap.get(valueSelected);
  }
  /* I am not sure if we need 'input' parameter - keep it for now*/
  onApplyFilter(t: any, input: any) {
    const target = t as HTMLTextAreaElement;
    var filterValue = target.value;
    filterValue = filterValue.trim(); // Remove whitespace
    filterValue = filterValue.toLowerCase(); // Datasource defaults to lowercase matches
    this.dataSource.filter = filterValue;
  }
  onAddSchedule(event: MouseEvent, button: any) {
    // Reset alerts on submit
    this.alertService.clear();
    this.addSchedule(this.selectedAccount4Function);
  }
  public addSchedule(account: Account) {
    var schedule2Add: Schedule = {
      accountId: account.id,
      date: this.dateTimeStr,
      newDate: this.dateTimeStr,
      dob: account.dob,
      required: true,
      deleting: false,
      userAvailability: true,
      scheduleGroup: this.thisTask.group/* account.scheduleGroup */,
      userFunction: this.functionStr,
      newUserFunction: this.functionStr,
    };
    this.isAdding = true;
    this.accountService.addSchedule(account.id, schedule2Add)
      .pipe(first())
      .subscribe({
        next: (account) => {
          this.refreshAccounts();
        },
        complete: () => {
          this.isAdding = false;
        },
        error: error => {
          //this.refreshAccounts();
          this.alertService.error(error);
          this.isAdding = false;
          this.scroller.scrollToAnchor("pageStart");

        }
      });
  }
  onDeleteSchedules(event: MouseEvent) { // rowIndex is table index
    // Reset alerts on submit
    this.alertService.clear();

    Array.from(this.string2AccountMap.values()).forEach(account => {
      console.log("FunctionScheduleComponent deleting email:" + account.email +  " functionStr:" + this.functionStr + " dateStr:" + this.dateTimeStr);
      this.onDeleteSchedule(event, account);
    });
  }

  onDeleteSchedule(event: MouseEvent, account: Account) { // rowIndex is table index
    account.isDeleting = true;

    var schedule2Delete: Schedule = {
      accountId: account.id,
      date: this.dateTimeStr,
      newDate: this.dateTimeStr,
      dob: account.dob,
      required: true,
      deleting: false,
      userAvailability: true,
      scheduleGroup: account.scheduleGroup,
      userFunction: this.functionStr,
      newUserFunction: this.functionStr,
    };
    this.accountService.deleteSchedule(account.id, schedule2Delete)
      .pipe(first())
      .subscribe({
        next: (z) => {
          console.log("FunctionScheduleComponent functionStr:" + this.functionStr + " dateStr:" + this.dateTimeStr + " deleted");
          this.refreshAccounts();
        },
        complete: () => {
        },
        error: error => {
          this.alertService.error(error);
          this.refreshAccounts();
        }
      });
  }
  onRowSelected(account: Account, tr: any, index: number) {
    account.highlighted = !account.highlighted;
    this.currentSelectedAccount = account;

    if (this.lastSelectedAccount != null) {
      this.lastSelectedAccount.highlighted = false;
    }
    this.lastSelectedAccount = this.currentSelectedAccount;

    if (!account.highlighted) {
      // If row is deselected mark both schedules as deselected(null);
      this.lastSelectedAccount = null;
      this.currentSelectedAccount = null;
    }
  }
}
