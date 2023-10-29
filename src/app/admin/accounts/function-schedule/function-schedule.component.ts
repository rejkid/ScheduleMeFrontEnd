import { AfterViewInit, Component, Input, OnInit, ViewChild } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table';
import { ActivatedRoute, Router } from '@angular/router';
import * as moment from 'moment';
import { first } from 'rxjs';
import { Account } from 'src/app/_models';
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

  form: FormGroup;
  accountsAvailable4Function: Account[] = [];
  accountsSelected4Function: Account[] = [];
  displayedColumns: string[] = COLUMNS_SCHEMA.map((col) => col.key);
  columnsSchema: any = COLUMNS_SCHEMA;
  accountsLoaded: boolean = true;
  dataSource: MatTableDataSource<Account> = new MatTableDataSource([]);
  currentSelectedAccount: Account = null;
  lastSelectedAccount: Account = null;
  selectedAccount4Function: Account;

  constructor(private accountService: AccountService,
    private route: ActivatedRoute,
    private router: Router,
    private formBuilder: FormBuilder,
    private alertService: AlertService) {
  }

  ngOnInit(): void {
    this.form = this.formBuilder.group({
      selectedUser: ['', [Validators.required]],
    });

  }
  ngAfterViewInit(): void {
    this.dataSource.paginator = this.paginator;
    this.dataSource.sort = this.sort;
    this.dataSource = new MatTableDataSource();
    this.accountsLoaded = false;
    this.accountService.getAll()
      .pipe(first())
      .subscribe({
        next: (accounts: Account[]) => {
          accounts.forEach(account => {
            account.userFunctions.forEach(userFunc => {
              if (userFunc.userFunction == this.functionStr) {
                this.accountsAvailable4Function.push(account);
              }
            });
          });
          /* Select first account as the default one*/
          if (this.accountsAvailable4Function.length > 0) {
            var selected = this.accountsAvailable4Function[0].lastName + "/"
              + this.accountsAvailable4Function[0].firstName + "/"
              + this.accountsAvailable4Function[0].email
            this.f['selectedUser'].setValue(selected);
            this.selectedAccount4Function = this.accountsAvailable4Function[0];
          }
          this.dataSource = new MatTableDataSource(this.accountsSelected4Function);
          this.dataSource.paginator = this.paginator;

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
  // convenience getter for easy access to form fields
  get f() { return this.form.controls; }

  onChangeUser(event: Event) {
    var valueSelected = (event.target as HTMLInputElement).value;
    var array = valueSelected.split("/");
    this.selectedAccount4Function = this.accountsAvailable4Function.find((item) => item.email === array[2])
  }
  /* I am not sure if we need 'input' parameter - keep it for now*/
  onApplyFilter(t: any, input: any) {
    const target = t as HTMLTextAreaElement;
    var filterValue = target.value;
    filterValue = filterValue.trim(); // Remove whitespace
    filterValue = filterValue.toLowerCase(); // Datasource defaults to lowercase matches
    this.dataSource.filter = filterValue;
  }
  onAddAccount(event: MouseEvent, button: any) {
    var account = this.accountsSelected4Function.find(a => a.id == this.selectedAccount4Function.id);
    if (account == null) {
      this.accountsSelected4Function.push(this.selectedAccount4Function);
      this.dataSource = new MatTableDataSource(this.accountsSelected4Function);
    } else {
      this.alertService.error("Account already exists");
    }
  }

  onDeleteUser(event: MouseEvent, rowIndex: string, account: Account) { // rowIndex is table index
    account.isDeleting = true;
    this.accountsSelected4Function = this.accountsSelected4Function.filter(a => a.id != this.selectedAccount4Function.id);
    this.dataSource = new MatTableDataSource(this.accountsSelected4Function);
  }
  onRowSelected(account: Account, tr: any, index: number) {
    account.highlighted = !account.highlighted;
    this.currentSelectedAccount = account;

    if (!account.isDeleting) {
      var date = moment(account.date, Constants.dateTimeFormat).toDate();
    }
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
  generateSchedules(): Schedule[] {
    var retVal: Schedule[] = [];
    //const map = new Map<string, Schedule>();

    this.accountsSelected4Function.forEach(element => {
      var schedule: Schedule = {
        accountId: element.id,
        date: this.dateTimeStr,
        newDate: this.dateTimeStr,
        required: true,
        deleting: false,
        userAvailability: true,
        scheduleGroup: element.scheduleGroup,
        userFunction: this.functionStr,
        newUserFunction: this.functionStr,
      };
      //map.set(element.id, schedule);
      retVal.push(schedule);
    });
    return retVal;
  }
}
