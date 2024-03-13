import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { Form, FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { first } from 'rxjs/operators';
import { Account, Role } from 'src/app/_models';
import { UserFunction } from 'src/app/_models/userfunction';
import { AccountService, AlertService } from 'src/app/_services';
import { Constants } from 'src/app/constants';

@Component({ templateUrl: 'function.component.html', styleUrls: ['./function.component.less'] })
export class FunctionComponent implements OnInit {
  id: string;
  account: Account;
  form: FormGroup;
  userFunctionIndexer: number = 0;

  userFunctions: UserFunction[] = [];
  possibleTasks: UserFunction[] = [];
  submitted = false;
  isLoggedAsAdmin: boolean = false;
  loading = false;
  accountService : AccountService; 

  isLoaded: boolean = false;
  constructor( accountService: AccountService,
    private alertService: AlertService,
    private formBuilder: FormBuilder,
    private route: ActivatedRoute,
    private router: Router) {
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
    this.submitted = true;

    var currentValue = this.form.controls['function'].value;

    /* Sanity check */
    for (let index = 0; index < this.userFunctions.length; index++) {
      if (this.userFunctions[index].userFunction === currentValue) {
        this.alertService.error(currentValue + " already exists");
        return;
      }
    }

    // Stop here if form is invalid
    if (this.form.invalid) {
      return;
    }

    var userFunction: UserFunction = {
      id: (++this.userFunctionIndexer).toString(),
      userFunction: this.form.controls['function'].value,
      group: this.isGroupTaskSelected ? this.f['groupTask'].value : "",
      isGroup: this.isGroupTaskSelected,
    }
    this.userFunctions.push(userFunction);
    this.addFunction4Account(userFunction);
  }
  deleteFunction(name: UserFunction) { 
    this.deleteFunction4Account(name);
  }
  private addFunction4Account(userFunction: UserFunction) {

    this.accountService.addFunction(this.id, userFunction)
      .pipe(first())
      .subscribe({
        next: (account) => {
          this.userFunctions = account.userFunctions.slice();
          //this.alertService.success('Update successful', { keepAfterRouteChange: true });
          //this.router.navigate(['../../'], { relativeTo: this.route });
        },
        error: error => {
          this.alertService.error(error);
          this.loading = false;
        }
      });
  }
   
  private deleteFunction4Account(userFunctions: UserFunction) {
    this.accountService.deleteFunction(this.id, userFunctions)
      .pipe(first())
      .subscribe({
        next: (account) => {
          this.userFunctions = account.userFunctions.slice();

          this.alertService.success('Update successful', { keepAfterRouteChange: true });
          //this.router.navigate(['../../'], { relativeTo: this.route });
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
    const taskSelected = this.form.controls['function'].value;
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
}
