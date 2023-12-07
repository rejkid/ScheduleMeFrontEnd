import { AfterViewInit, Component, EventEmitter, Input, OnInit, Output, ViewChild } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table';
import { ActivatedRoute, Router } from '@angular/router';
import * as moment from 'moment';
import { first } from 'rxjs';
import { Account } from 'src/app/_models';
import { FunctionScheduleData } from 'src/app/_models/functionscheduledata';
import { Schedule } from 'src/app/_models/schedule';
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
  accountsAvailable4Function: Account[] = [];
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

  private _accounts4DateAndFunction: Account[] = [];
  titlePrefix: string = "";

  public get accounts4DateAndFunction(): Account[] {
    return this._accounts4DateAndFunction;
  }
  public set accounts4DateAndFunction(value: Account[]) {
    this._accounts4DateAndFunction = value;
  }

  constructor(private accountService: AccountService,
    private route: ActivatedRoute,
    private router: Router,
    private formBuilder: FormBuilder,
    private alertService: AlertService) {
    this.schedulesUpdatedEmitter = new EventEmitter<FunctionScheduleData>();
  }

  ngOnInit(): void {
    this.form = this.formBuilder.group({
      selectedUser: ['', [Validators.required]],
    });

  }
  setCurrentDate(dateTime: string) {
    this.dateTimeStr = dateTime;
    console.log("Called for: for:" + this.functionStr + " New datetime is:" + dateTime);
    this.loadAccounts4DateAndFunction();
  }
  ngAfterViewInit(): void {
    this.dataSource.paginator = this.paginator;
    this.dataSource.sort = this.sort;
    this.dataSource = new MatTableDataSource();
    this.refreshAccounts();
  }
  private refreshAccounts() {
    this.accountsLoaded = false;
    this.accountService.getAll()
      .pipe(first())
      .subscribe({
        next: (accounts: Account[]) => {
          this.accountsAvailable4Function = [];
          this.accounts = accounts;
          accounts.forEach(account => {
            account.isDeleting = false;
            account.userFunctions.forEach(userFunc => {
              if (userFunc.userFunction == this.functionStr) {
                this.accountsAvailable4Function.push(account);
              }
            });
          });
          /* Select first account as the default one*/
          if (this.selectedAccount4Function !== undefined) {
            var selected = this.selectedAccount4Function.lastName + "/"
              + this.selectedAccount4Function.firstName + "/"
              + this.selectedAccount4Function.email + "/"
              + this.selectedAccount4Function.dob + "/"
              + this.selectedAccount4Function.scheduleGroup;
            this.f['selectedUser'].setValue(selected);
          } else if (this.accountsAvailable4Function.length > 0) {
            var selected = this.accountsAvailable4Function[0].lastName + "/"
              + this.accountsAvailable4Function[0].firstName + "/"
              + this.accountsAvailable4Function[0].email + "/"
              + this.accountsAvailable4Function[0].dob + "/"
              + this.accountsAvailable4Function[0].scheduleGroup;
            this.f['selectedUser'].setValue(selected);
            this.selectedAccount4Function = this.accountsAvailable4Function[0];
          }

          this.loadAccounts4DateAndFunction();

          /* Notify parent that we got data from server */
          var funcSchedData: FunctionScheduleData = {
            userFunction: this.functionStr,
            accounts: this.accounts4DateAndFunction
          }
          /* Notify parrent that the data has been updated */
          this.schedulesUpdatedEmitter.emit(funcSchedData);

          /* Check if we are group task */
          this.accountService.getGroupTasks()
            .pipe(first())
            .subscribe({
              next: (groupTasks : string[]) => {
                if(groupTasks.includes(this.functionStr))
                {
                  this.titlePrefix = "Group "
                }
                console.log(groupTasks);
              },
              complete: () => {
                this.isAdding = false;
              },
              error: error => {
                this.alertService.error(error);
                this.isAdding = false;
              }
            });

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

  private loadAccounts4DateAndFunction() {
    this.accounts4DateAndFunction = [];
    this.accounts.forEach(account => {
      account.schedules.forEach(schedule => {
        if (schedule.userFunction == this.functionStr
          && schedule.date == this.dateTimeStr
            /* && schedule.dob == account.dob */) {
          this.accounts4DateAndFunction.push(account);
        }
      });
    });
    this.dataSource = new MatTableDataSource(this.accounts4DateAndFunction);
    this.dataSource.paginator = this.paginator;
    this.dataSource.sort = this.sort;
  }

  // convenience getter for easy access to form fields
  get f() { return this.form.controls; }

  getGroup(account : Account) : string {
    return account.userFunctions.find(x => x.userFunction == this.functionStr).group;
  }

  onChangeUser(event: Event) {
    var valueSelected = (event.target as HTMLInputElement).value;
    var array = valueSelected.split("/");
    this.selectedAccount4Function = this.accountsAvailable4Function.find((item) => item.email === array[2] && item.dob === array[3])
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
      scheduleGroup: account.scheduleGroup,
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
          this.refreshAccounts();
          this.alertService.error(error);
          this.isAdding = false;
        }
      });
  }
  onDeleteSchedules(event: MouseEvent) { // rowIndex is table index
    this.accounts4DateAndFunction.forEach(account => {
      console.log("FunctionScheduleComponent deleting functionStr:" + this.functionStr + " dateStr:" + this.dateTimeStr);
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
