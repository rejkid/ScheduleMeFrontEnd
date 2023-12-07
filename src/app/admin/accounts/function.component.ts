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
  functions: string[] = [];
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
                this.functions = value;

                this.account = account;
                this.userFunctions = account.userFunctions.slice();

                console.log(this.account + this.id);
                this.form = this.formBuilder.group({

                  function: ['', [Validators.required, this.functionValidator]],
                  cleanerGroup: ['', [this.groupValidator.bind(this)]] ,

                }, { validator: (group : FormGroup) => {
                  if (group.controls['function'].value == 'Cleaner') {
                    return Validators.required(group.controls['cleanerGroup']);
                  }
                  return null;
                }});
                this.form.get('function').setValue(this.functions[0]);

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
    if (this.isCleaner && control.value === '') {
      return { invalidGroup: true };
    }
    return null;
  }
  get isValid() {
    var funcValid = this.f['function'].valid; 
    var groupValid = this.f['cleanerGroup'].valid;
    var formValid = this.form.valid;
    return this.form.valid;

  }
  addFunction() {
    this.submitted = true;

    var currentValue = this.form.controls['function'].value;

    for (let index = 0; index < this.userFunctions.length; index++) {
      if (this.userFunctions[index].userFunction === currentValue) {
        this.alertService.error(currentValue + " already exists");
        return;
      }
    }

    // stop here if form is invalid
    if (this.form.invalid) {
      return;
    }

    var userFunction: UserFunction = {
      id: (++this.userFunctionIndexer).toString(),
      userFunction: this.form.controls['function'].value,
      group: this.f['cleanerGroup'].value
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
  get isCleaner() {
    if(this.form == undefined)
     return false;
    return this.form.get('function').value === Constants.CLEANER_STR;
  }
  get group() : string {
    var fun = this.account.userFunctions.find(f => {
      console.log(f);
      return f.group.length > 0
    });
    if (fun != null)
      return fun.group
    else
      return "";
  }
  onDutyChanged(event: Event) {
    var valueSelected = (event.target as HTMLInputElement).value;
    if(valueSelected == Constants.CLEANER_STR) {
      this.f["cleanerGroup"].setValue(this.group);
    } else {
    }
  }
}
