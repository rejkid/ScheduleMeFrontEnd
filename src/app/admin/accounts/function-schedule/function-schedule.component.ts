import { ViewportScroller } from '@angular/common';
import { AfterViewInit, Component, EventEmitter, Input, OnDestroy, OnInit, Output, ViewChild, signal } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table';
import { ActivatedRoute, Router } from '@angular/router';
import { first } from 'rxjs/operators';
import { Account } from 'src/app/_models';
import { AccountsByDateAndTaskDTO } from 'src/app/_models/AccountsByDateAndTaskDTO';
import { AgentTaskConfig } from 'src/app/_models/agenttaskconfig';
import { FunctionScheduleData } from 'src/app/_models/functionscheduledata';
import { Schedule } from 'src/app/_models/schedule';
import { User } from 'src/app/_models/user';
import { AgentTask } from 'src/app/_models/userfunction';
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
export class FunctionScheduleComponent implements OnInit, AfterViewInit, OnDestroy {
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
  users = signal<User[]>([]);
  selectedUser4Function: User;
  
  titlePrefix: string = "";
  groupTasks: AgentTaskConfig[] = [];
  isInitializing: boolean = true;
  string2UserMap: Map<string, User> = new Map<string, User>();
  possibleUsersMap: Map<string, User> = new Map<string, User>();

  static pageSize: number;
  
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

    this.accountService.getAllAgentTaskConfigs()
      .pipe(first())
      .subscribe({
        next: (groupTasks: AgentTaskConfig[]) => {
          this.groupTasks = groupTasks;
          var atc : AgentTaskConfig = this.groupTasks.find((tcs) => { return tcs.agentTaskStr == this.functionStr});
          console.assert(atc != undefined, "TaskConfig not found for task:"+ this.functionStr);
          if (atc.isGroup) {
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
  ngOnDestroy() {
    console.log("Called");
    
  }

  get accounts4DateAndFunction(): User[] {
    return Array.from(this.string2UserMap.values());
  }
  get possibleUsers(): User[] {
    return Array.from(this.possibleUsersMap.values());
  }

  private refreshAccounts() {
    this.accountsLoaded = false;
    var accountsByDateAndTaskDTO: AccountsByDateAndTaskDTO = {
      dateStr: this.dateTimeStr,
      task: this.functionStr
    }
    this.accountService.getByDateAndTask(accountsByDateAndTaskDTO)
      .pipe(first())
      .subscribe({
        next: (accounts: Account[]) => {
          this.createString2UserMap(accounts);
          this.accountService.getAll()
            .pipe(first())
            .subscribe({
              next: (accounts: Account[]) => {
                this.createPossibleUsersMap(accounts);
              },
              complete: () => {
                this.accountsLoaded = true;
                /* Notify parent that we got data from server - possibly from adding new schedule from this pannel */
                var funcSchedData: FunctionScheduleData = {
                  userFunction: this.functionStr,
                  date: this.dateTimeStr,
                  accounts: this.accounts4DateAndFunction
                }
                this.schedulesUpdatedEmitter.emit(funcSchedData);

              },
              error: (error) => {
                this.alertService.error(error);
                this.accountsLoaded = true;
              }
        });
        },
        complete: () => {
        },
        error: error => {
        }
      });
  }

  private createString2UserMap(accounts: Account[]) {
    this.string2UserMap.clear();

    var selected: string = undefined;
    accounts.map((a) => a.schedules.filter((s) => s.userFunction == this.functionStr && s.date == this.dateTimeStr).map((s) => {
      var str = a.firstName + '/' + a.lastName + '/' + a.email + '/' + a.dob;
      if (s.scheduleGroup.length != 0) {
        str = str + '/' + s.scheduleGroup
      }
      var user: User = {
        id: a.id,
        firstName: a.firstName,
        lastName: a.lastName,
        email: a.email,
        function: this.functionStr,
        scheduleGroup: s.scheduleGroup,
        date: this.dateTimeStr,
        dob: a.dob,
        isDeleting: false,
        highlighted: false
      }

      if (!this.string2UserMap.has(str)) {
        this.string2UserMap.set(str, user);
        if (selected === undefined) {
          selected = str;
        }
      }
    }))

    console.log("createAccountStrings4Function: " + this.string2UserMap);
    this.f['selectedUser'].setValue(selected);
    this.users.set([...this.string2UserMap.values()]);
    this.dataSource.data = this.users();
    this.dataSource.paginator = this.paginator;
    this.dataSource.sort = this.sort;
  }

  private createPossibleUsersMap(accounts: Account[]) {
    this.possibleUsersMap.clear();
    accounts.map((a) => a.userFunctions.filter((f) => f.userFunction == this.functionStr).map(f => {
      var user: User = {
        id: a.id,
        firstName: a.firstName,
        lastName: a.lastName,
        email: a.email,
        function: this.functionStr,
        scheduleGroup: f.group,
        date: this.dateTimeStr,
        dob: a.dob,
        isDeleting: false,
        highlighted: false
      }
      let str = user.firstName + '/' + user.lastName + '/' + user.email + '/' + user.dob;
      if (f.isGroup) {
        str = str + '/' + user.scheduleGroup
      }
      this.possibleUsersMap.set(str, user);
    }
    )
    );
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
    this.selectedUser4Function = this.possibleUsersMap.get(valueSelected);
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
  onRowSelected(user: User, tr: any, index: number, event: any) {
    if (event.ctrlKey) {
      if (user.highlighted) {
        user.highlighted = false;
        return;
      }
    }
    this.selectRow(user);
  }
  private selectRow(user: User) {
    for (let index = 0; index < this.users().length; index++) {
      const element = this.users()[index];
      if (element.highlighted)
        element.highlighted = false;

      if (this.isSameUser(user, element)) {
        var pageNumber = Math.floor(index / this.paginator.pageSize);
        this.paginator.pageIndex = pageNumber;

        this.paginator.page.next({
          pageIndex: pageNumber,
          pageSize: this.paginator.pageSize,
          length: this.paginator.length
        });
      }
    }
    user.highlighted = true;
  }
  isSameUser(u1: User, u2: User) : boolean {
    console.assert(u1 != null && u2 != null, "One or both of the user slots is/are null");
    return u1.date == u2.date && u1.function == u2.function && u1.scheduleGroup == u2.scheduleGroup && u1.email == u2.email;
  }

  onChangePageProperties(event: any) {
    FunctionScheduleComponent.pageSize = event.pageSize;
  }
  get pageSize() {
    return FunctionScheduleComponent.pageSize;
  }
}
