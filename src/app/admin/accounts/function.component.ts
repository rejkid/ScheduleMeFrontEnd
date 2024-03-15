import { ViewportScroller } from '@angular/common';
import { Component, EventEmitter, Input, OnInit, Output, ViewChild } from '@angular/core';
import { Form, FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table';
import { ActivatedRoute, Router } from '@angular/router';
import { first } from 'rxjs/operators';
import { Account, Role } from 'src/app/_models';
import { UserFunction } from 'src/app/_models/userfunction';
import { UserFunctionDTO } from 'src/app/_models/userfunctionDTO';
import { AccountService, AlertService } from 'src/app/_services';
import { Constants } from 'src/app/constants';

const COLUMNS_SCHEMA = [
  {
      key: "duty",
      type: "text",
      label: "Duty"
  },
  {
      key: "group",
      type: "text",
      label: "Group"
  },
  {
      key: "action",
      type: "text",
      label: "Action"
  },
]

@Component({ templateUrl: 'function.component.html', styleUrls: ['./function.component.less'] })
export class FunctionComponent implements OnInit {
  @ViewChild('paginator') paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  id: string;
  account: Account;
  form: FormGroup;
  userFunctionIndexer: number = 0;

  dataSource: MatTableDataSource<UserFunction>;
  displayedColumns: string[] = COLUMNS_SCHEMA.map((col) => col.key);
  labeledColumns: string[] = COLUMNS_SCHEMA.map((col) => col.label);
  columnsSchema: any = COLUMNS_SCHEMA;

  
  userFunctions: UserFunction[] = [];
  possibleTasks: UserFunction[] = [];
  submitted = false;
  isLoggedAsAdmin: boolean = false;
  loading = false;
  accountService : AccountService; 

  currentSelectedContact : UserFunction = null;
  lastSelectedContact : UserFunction = null;
  highlighted: boolean;
  static HighlightRow: Number = -1;

  isLoaded: boolean = false;
  constructor( accountService: AccountService,
    private alertService: AlertService,
    private formBuilder: FormBuilder,
    private route: ActivatedRoute,
    private router: Router,
    private scroller: ViewportScroller) {
    this.accountService = accountService;
    this.isLoggedAsAdmin = this.accountService.isAdmin();
  }

  ngOnInit(): void {
    this.id = this.route.snapshot.params['id'];
    this.accountService.getById(this.id)
      .pipe(first())
      .subscribe({
        next: (account) => {
          this.accountService.getTasks()
            .pipe(first())
            .subscribe({
              next: (value) => {
                this.possibleTasks = value.functions;

                this.account = account;
                this.userFunctions = account.userFunctions.slice();
                this.dataSource = new MatTableDataSource(this.userFunctions);
                this.dataSource.paginator = this.paginator;
                this.dataSource.sort = this.sort;

                console.log(this.account + this.id);
                this.form = this.formBuilder.group({

                  function: ['', [Validators.required, this.functionValidator]],
                  groupTask: ['', [this.groupValidator.bind(this)]] ,

                }, { validator: (group : FormGroup) => {
                  if (group.controls['function'].value == 'Cleaner') {
                    return Validators.required(group.controls['groupTask']);
                  }
                  return null;
                }});
                this.form.get('function').setValue(this.possibleTasks[0].userFunction);

                this.userFunctionIndexer = account.userFunctions.length > 0 ? parseInt(account.userFunctions[account.userFunctions.length - 1].id) : 0;

                this.isLoaded = true;

              },
              error: error => {
                this.alertService.error(error);
              }
            });
        },
        error: error => {
          this.alertService.error(error);
        }
      });
  }

  /* I am not sure if we need 'input' parameter - keep it for now*/
  applyFilter(t: any, input: any) {
    const target = t as HTMLTextAreaElement;
    var filterValue = target.value;
    filterValue = filterValue.trim(); // Remove whitespace
    filterValue = filterValue.toLowerCase(); // Datasource defaults to lowercase matches
    this.dataSource.filter = filterValue;
}
  // convenience getter for easy access to form fields
  get f() { return this.form.controls; }

  functionValidator(control: FormControl): { [s: string]: boolean } {
    if (control.value === '') {
      return { invalidFunction: true };
    }
    return null;
  }
  groupValidator(control: FormControl): { [s: string]: boolean } {
    if (this.isGroupTaskSelected &&  control.value === '') {
      return { invalidGroup: true };
    }
    return null;
  }
  get isValid() {
    var funcValid = this.f['function'].valid; 
    var groupValid = this.f['groupTask'].valid;
    var formValid = this.form.valid;
    return this.form.valid;

  }
  addFunction() {
    // reset alerts on submit
    this.alertService.clear();

    this.submitted = true;

    var currentValue = this.f['function'].value;

    /* Sanity check */
    for (let index = 0; index < this.userFunctions.length; index++) {
      if (this.userFunctions[index].userFunction === currentValue) {
        this.alertService.error(currentValue + " already exists");
        this.scroller.scrollToAnchor("pageStart");
        return;
      }
    }

    // Stop here if form is invalid
    if (this.form.invalid) {
      return;
    }

    var uFunction: UserFunction = {
      id: (++this.userFunctionIndexer).toString(),
      userFunction: this.f['function'].value,
      group: this.isGroupTaskSelected ? this.f['groupTask'].value : "",
      isGroup: this.isGroupTaskSelected,
      isDeleting : false,
      highlighted : false
    }
    var userFunctionDTO : UserFunctionDTO = {
      userFunction: uFunction,
    }
    this.userFunctions.push(uFunction);
    this.addFunction4Account(userFunctionDTO);
  }
  deleteFunction(uFunction: UserFunction) { 
    var userFunctionDTO : UserFunctionDTO = {
      userFunction: uFunction,
    }
    this.deleteFunction4Account(userFunctionDTO);
  }
  private addFunction4Account(userFunction: UserFunctionDTO) {

    this.accountService.addFunction(this.id, userFunction)
      .pipe(first())
      .subscribe({
        next: (account) => {
          this.userFunctions = account.userFunctions.slice();
          //this.alertService.success('Update successful', { keepAfterRouteChange: true });
          //this.router.navigate(['../../'], { relativeTo: this.route });
          this.dataSource.data = this.userFunctions;
          // this.dataSource.paginator = this.paginator;
          // this.dataSource.sort = this.sort;
        },
        error: error => {
          this.alertService.error(error);
          this.loading = false;
        }
      });
  }
  private deleteFunction4Account(userFunctionDTO: UserFunctionDTO) {
    this.accountService.deleteFunction(this.id, userFunctionDTO)
      .pipe(first())
      .subscribe({
        next: (account) => {
          this.userFunctions = account.userFunctions.slice();

          //this.alertService.success('Update successful', { keepAfterRouteChange: true });
          //this.router.navigate(['../../'], { relativeTo: this.route });
          this.dataSource.data = this.userFunctions;
          // this.dataSource.paginator = this.paginator;
          // this.dataSource.sort = this.sort;

        },
        error: error => {
          this.alertService.error(error);
          this.loading = false;
        }
      });
  }
   
  get isAdmin() {
    return this.account.role == Role.Admin;
  }
  public isGroupTask(f : UserFunction) : boolean { 
    if(this.form == undefined)
     return false;
    for (let index = 0; index < this.possibleTasks.length; index++) {
      const possibleTask = this.possibleTasks[index];
      if(possibleTask.userFunction === f.userFunction)
      {
        return possibleTask.isGroup;
      }
    }
    return false;
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
  get assignedGroup() : string {
    const taskSelected = this.f['function'].value;
    var task = this.account.userFunctions.find((f) => {
      return f.userFunction === taskSelected;
    });
    return (task != null && task != undefined) ? task.group : "";
  }
  onTaskChanged(event: Event) {
    var valueSelected = (event.target as HTMLInputElement).value;
    if(this.isGroupTaskSelected) {
      this.f["groupTask"].setValue(this.assignedGroup);
    } else {
      this.f["groupTask"].setValue("");
    }
  }
  onRowSelected(contact: UserFunction, input: any, index: number, event: MouseEvent) {

    if (event.ctrlKey) {
      FunctionComponent.HighlightRow = FunctionComponent.HighlightRow == index ? -1 : index;
    } else {
      FunctionComponent.HighlightRow = index;
    }

    contact.highlighted = !contact.highlighted;
    this.currentSelectedContact = contact;

    if (this.lastSelectedContact != null) {
      this.lastSelectedContact.highlighted = false;
    }
    this.lastSelectedContact = this.currentSelectedContact;

    if (!contact.highlighted) {
      // If row is deselected mark both contacts as deselected(null);
      this.lastSelectedContact = null;
      this.currentSelectedContact = null;
    }
    console.log("clickedRow: row == this.staticHighlightRow: " + (index == this.staticHighlightRow));
  }
  get staticHighlightRow() {
    return FunctionComponent.HighlightRow;
  }
}
