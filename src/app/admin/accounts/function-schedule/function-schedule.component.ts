import { ViewportScroller } from '@angular/common';
import { AfterViewInit, Component, EventEmitter, Input, OnInit, Output, ViewChild } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table';
import { ActivatedRoute, Router } from '@angular/router';
import { first } from 'rxjs/operators';
import { Account } from 'src/app/_models';
import { AccountsByDateAndTaskDTO } from 'src/app/_models/AccountsByDateAndTaskDTO';
import { FunctionScheduleData } from 'src/app/_models/functionscheduledata';
import { Schedule } from 'src/app/_models/schedule';
import { User } from 'src/app/_models/user';
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

  dataSource: MatTableDataSource<User> = new MatTableDataSource([]);
  currentSelectedUser: User = null;
  lastSelectedUser: User = null;
  selectedUser4Function: User;
  
  titlePrefix: string = "";
  groupTasks: string[] = [];
  isInitializing: boolean = true;
  string2UserMap: Map<string, User> = new Map<string, User>();

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
  get accounts4DateAndFunction(): User[] {
    return Array.from(this.string2UserMap.values());
  }

  private refreshAccounts() {
    this.accountsLoaded = false;
    var accountsByDateAndTaskDTO: AccountsByDateAndTaskDTO = {
      dateStr: this.dateTimeStr,
      task: this.functionStr
    }
    this.string2UserMap.clear();
    this.accountService.getByDateAndTask(accountsByDateAndTaskDTO)
      .pipe(first())
      .subscribe({
        next: (accounts: Account[]) => {
          this.createAccountStrings4Function(accounts);

          /* Notify parent that we got data from server */
          var funcSchedData: FunctionScheduleData = {
            userFunction: this.functionStr,
            accounts: this.accounts4DateAndFunction
          }
          this.schedulesUpdatedEmitter.emit(funcSchedData);
        },
        complete: () => {
          this.accountsLoaded = true;
        },
        error: error => {
          this.alertService.error(error);
          this.accountsLoaded = true;
        }
      });
  }

  private createAccountStrings4Function(accounts: Account[]) {
    var selected: string = undefined;
    accounts.forEach(account => {
      account.userFunctions.forEach(userFunc => {
        account.schedules.forEach(schedule => {
          if (userFunc.userFunction == this.functionStr
            && schedule.date == this.dateTimeStr
          ) {
            var str = account.firstName + '/' + account.lastName + '/' + account.email + '/' + account.dob;
            if (schedule.scheduleGroup.length != 0) {
              str = str + '/' + schedule.scheduleGroup
            }
            var user: User = {
              id: account.id,
              firstName: account.firstName,
              lastName: account.lastName,
              email: account.email,
              function: this.functionStr,
              scheduleGroup: schedule.scheduleGroup,
              date: this.dateTimeStr,
              dob: account.dob,
              isDeleting: false,
              highlighted: false
            }

            if (!this.string2UserMap.has(str)) {
              this.string2UserMap.set(str, user);
              if (selected === undefined) {
                selected = str;
              }
            }
          }
        });
      });
    });

    console.log(this.string2UserMap);
    this.f['selectedUser'].setValue(selected);
    this.dataSource.data = [...this.string2UserMap.values()];
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
    this.selectedUser4Function = this.string2UserMap.get(valueSelected);
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
    this.addSchedule(this.selectedUser4Function);
  }
  public addSchedule(user: User) {
    var schedule2Add: Schedule = {
      accountId: user.id,
      date: this.dateTimeStr,
      newDate: this.dateTimeStr,
      dob: user.dob,
      required: true,
      deleting: false,
      userAvailability: true,
      scheduleGroup: user.scheduleGroup,
      userFunction: this.functionStr,
      newUserFunction: this.functionStr,
    };
    this.isAdding = true;
    this.accountService.addSchedule(user.id, schedule2Add)
      .pipe(first())
      .subscribe({
        next: (account) => {
          this.refreshAccounts();
        },
        complete: () => {
          this.isAdding = false;
        },
        error: error => {
          this.alertService.error(error);
          this.isAdding = false;
          this.scroller.scrollToAnchor("pageStart");

        }
      });
  }
  onDeleteSchedules(event: MouseEvent) { 
    // Reset alerts on submit
    this.alertService.clear();

    Array.from(this.string2UserMap.values()).forEach(user => {
      console.log("FunctionScheduleComponent deleting email:" + user.email + " functionStr:" + this.functionStr + " dateStr:" + this.dateTimeStr);
      this.onDeleteSchedule(event, user);
    });
  }

  onDeleteSchedule(event: MouseEvent, user: User) { // rowIndex is table index
    user.isDeleting = true;

    var schedule2Delete: Schedule = {
      accountId: user.id,
      date: this.dateTimeStr,
      newDate: this.dateTimeStr,
      dob: user.dob,
      required: true,
      deleting: false,
      userAvailability: true,
      scheduleGroup: user.scheduleGroup,
      userFunction: this.functionStr,
      newUserFunction: this.functionStr,
    };
    this.accountService.deleteSchedule(user.id, schedule2Delete)
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
  onRowSelected(user: User, tr: any, index: number) {
    user.highlighted = !user.highlighted;
    this.currentSelectedUser = user;

    if (this.lastSelectedUser != null) {
      this.lastSelectedUser.highlighted = false;
    }
    this.lastSelectedUser = this.currentSelectedUser;

    if (!user.highlighted) {
      // If row is deselected mark both schedules as deselected(null);
      this.lastSelectedUser = null;
      this.currentSelectedUser = null;
    }
  }
}
