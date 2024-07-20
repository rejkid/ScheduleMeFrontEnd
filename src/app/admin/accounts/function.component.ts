import { AfterViewInit, Component, Injector, OnInit, ViewChild, inject, signal } from '@angular/core';
import { toObservable } from '@angular/core/rxjs-interop';
import { AbstractControl, FormBuilder, FormControl, FormGroup, ValidationErrors, Validators } from '@angular/forms';
import { MatPaginator, PageEvent } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table';
import { ActivatedRoute, Router } from '@angular/router';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { first } from 'rxjs/operators';
import { Account, Role } from 'src/app/_models';
import { AgentTaskConfig } from 'src/app/_models/agenttaskconfig';
import { Task } from 'src/app/_models/task';
import { AccountService, AlertService } from 'src/app/_services';
import { NgbdModalConfirmComponent } from './ngbd-modal-confirm/ngbd-modal-confirm.component';
import { NgxTimepickerFieldComponent } from 'ngx-material-timepicker';
import * as moment from 'moment';
import { NgbdModalOptionsComponent } from './ngbd-modal-options/ngbd-modal-options.component';

const COLUMNS_SCHEMA = [
  {
    key: "task",
    type: "text",
    label: "Task"
  },
  {
    key: "preferredTime",
    type: "text",
    label: "Preferred Time"
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

@Component({
  templateUrl: 'function.component.html', styleUrls: ['./function.component.less'],
  host: {
    "(click)": "onToObservable($event)"
  }
})
export class FunctionComponent implements OnInit, AfterViewInit {
  @ViewChild('paginator') paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;
  @ViewChild('openTime') openTime: NgxTimepickerFieldComponent;
  
  private modalService = inject(NgbModal);
  
  id: string;
  account: Account;
  form: FormGroup;
  userFunctionIndexer: number = 0;

  dataSource: MatTableDataSource<Task>;
  displayedColumns: string[] = COLUMNS_SCHEMA.map((col) => col.key);
  labeledColumns: string[] = COLUMNS_SCHEMA.map((col) => col.label);
  columnsSchema: any = COLUMNS_SCHEMA;


  userTasks = signal<Task[]>([]);
  possibleTasks: AgentTaskConfig[] = [];
  submitted = false;
  isLoggedAsAdmin: boolean = false;
  loading = false;
  accountService: AccountService;

  currentSelectedContact: Task = null;
  lastSelectedContact: Task = null;
  highlighted: boolean;
  
  isLoaded: boolean = false;
  preferredTimeInitialized: boolean = false;;

  // JD Test
  injector: Injector = inject(Injector);
  // JD Test    

  constructor(accountService: AccountService,
    private alertService: AlertService,
    private formBuilder: FormBuilder,
    private route: ActivatedRoute,
    private router: Router) {
    this.accountService = accountService;
    this.isLoggedAsAdmin = this.accountService.isAdmin();
    this.form = this.formBuilder.group({
      function: ['', [Validators.required, this.functionValidator]],
      groupTask: ['', [this.groupValidator.bind(this)]],
      preferredTime: ['9:00 am', [Validators.required]]
    });

  }
  ngAfterViewInit(): void {
  }

  ngDoCheck(): void {
    if(this.openTime != undefined && !this.preferredTimeInitialized) {
      var date = new Date();
      this.preferredTimeInitialized = true;

      this.openTime.changeHour(date.getHours());
      this.openTime.changeMinute(date.getMinutes());
    }
  }
  // JD Test
  onToObservable(e: any) {
    const numbers = signal(0);
    numbers.set(1);
    numbers.set(2);
    numbers.set(3);

    var numbers$ = toObservable(numbers, { injector: this.injector });
    numbers.set(4);

    numbers$.subscribe({
      next: (value) => {
        console.log('numbrs$: ', value);
      },
      error: (error) => { }
    });
    numbers.set(5);
  }
  // JD Test

  ngOnInit(): void {
    this.id = this.route.snapshot.params['id'];
    this.accountService.getById(this.id)
      .pipe(first())
      .subscribe({
        next: (account) => {
          this.accountService.getAllAgentTaskConfigs()
            .pipe(first())
            .subscribe({
              next: (value) => {
                this.possibleTasks = value;

                this.account = account;
                account.userFunctions.forEach(element => {
                  var task : Task = {
                    group: element.group,
                    userFunction : element.userFunction,
                    preferredTime : element.preferredTime,
                    highlighted : false,
                    isDeleting: false,
                    id : element.id,
                    isGroup : element.isGroup
                  }
                  this.userTasks().push(task);
                });
                this.dataSource = new MatTableDataSource(this.userTasks());
                this.dataSource.paginator = this.paginator;
                this.dataSource.sort = this.sort;

                console.log(this.account + this.id);

                this.form.get('function').setValue(this.possibleTasks[0].agentTaskStr);
                this.form.setValidators(this.validateForm.bind(this));

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
  validateForm(control: AbstractControl): ValidationErrors | null {
    var group = (control as FormGroup);
    if (this.isGroupTaskAsString(group.controls['function'].value)) {
      var retVal: ValidationErrors = Validators.required(group.controls['groupTask'])
      return retVal;
    }
    return null;
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
    if (this.isGroupTaskSelected && control.value === '') {
      return { invalidGroup: true };
    }
    return null;
  }
  get isValid() {
    var funcValid = this.f['function'].valid;
    var preferredTimeValid = this.f['preferredTime'].valid;
    var groupValid = this.f['groupTask'].valid;
    var formValid = this.form.valid;
    return this.form.valid;

  }
  onAddTask() {
    // Reset alerts on submit
    this.alertService.clear();

    this.submitted = true;

    this.executeAddTask();
  }
  private executeAddTask() {
    var currentValue = this.f['function'].value;
    var currentGroupTask = this.f['groupTask'].value;
    var preferredTime = this.f['preferredTime'].value;

    /* Sanity check */
    var existing: Task[] = this.userTasks().filter((f) => {
      return (f.userFunction === currentValue && f.group === currentGroupTask);
    });
    console.assert(existing.length <= 1, "We have double " + currentValue + " task for the same user: " + this.account.email);
    if (this.form.invalid) {
      return;
    }

    var task: Task = {
      id: (++this.userFunctionIndexer).toString(),
      preferredTime: preferredTime,
      userFunction: currentValue,
      group: this.isGroupTaskSelected ? currentGroupTask : "",
      isGroup: this.isGroupTaskSelected,
      isDeleting: false,
      highlighted: false
    };
    this.accountService.testAddFunction(this.id, task)
      .pipe(first())
      .subscribe({
        next: (accounts) => {
          if (accounts != null && accounts.length > 0) {
            // It's group agent
            var bodyStr : string[] = [];

            accounts.forEach(element => {
              bodyStr.push("<div>" + element.firstName + " " + element.lastName + " " + element.email + "</div>");
            });

            const modalRef = this.modalService.open(NgbdModalConfirmComponent, { scrollable: true });
            modalRef.componentInstance.titleStr = "User Task Update";
            modalRef.componentInstance.bodyQuestionStr = "The following existing members of group agent '" + task.group+ "' will also be updated:";
            modalRef.componentInstance.bodyInfoStr = bodyStr.join("");
            modalRef.result.then((data) => {
              this.userTasks().push(task);
              this.addFunction4Account(task);
    
            }).catch((error) => {
            });
          } else {
            // It's an agent or group agent with just one member
            this.userTasks().push(task);
            this.addFunction4Account(task);
  
          }
        },
        complete: () => {
        },
        error: error => {
          this.alertService.error(error);
        }
      });

  }

  private addFunction4Account(task: Task) {

    this.accountService.addFunction(this.id, task)
      .pipe(first())
      .subscribe({
        next: (account) => {
          this.userTasks.set(account.userFunctions.slice());
          this.dataSource.data = this.userTasks();
        },
        complete: () => {
          // We have just succesfuly added a new schedule
          var tasks = this.userTasks().filter(s => this.isSameTask(s, task));
          console.assert(tasks.length == 1, "Task  just created not found or multiple tasks found");
          this.selectRow(tasks[0]);
          //this.alertService.info("Data Saved");
        },
        error: error => {
          this.alertService.error(error);
          this.loading = false;
        }
      });
    
  }

  onDeleteTask(task: Task) {
    task.isDeleting = true;
    // Reset alerts on submit
    this.alertService.clear();

    this.deleteFunction4Account(task);
  }
  private deleteFunction4Account(task: Task) {

    const modalRef = this.modalService.open(NgbdModalConfirmComponent);
    modalRef.componentInstance.titleStr = "Task Deletion";
    modalRef.componentInstance.bodyQuestionStr = "Are you sure you want to delete task profile?";
    modalRef.componentInstance.bodyInfoStr = "All information associated with the task profile will be permanently deleted.";
    modalRef.result.then((data) => {
      task.isDeleting = true;
      this.accountService.deleteFunction(this.id, task)
        .pipe(first())
        .subscribe({
          next: (account) => {
            this.userTasks.set(account.userFunctions.slice());
            this.dataSource.data = this.userTasks();
            //this.alertService.info("Data Saved");
          },
          error: error => {
            task.isDeleting = false;
            this.alertService.error(error);
          }
        });
    }).catch((error) => {
      task.isDeleting = false;

    });
  }

  get isAdmin() {
    return this.account.role == Role.Admin;
  }
  public isGroupTaskAsString(f: string): boolean {
    if (this.form == undefined)
      return false;
    for (let index = 0; index < this.possibleTasks.length; index++) {
      const possibleTask = this.possibleTasks[index];
      if (possibleTask.agentTaskStr === f) {
        return possibleTask.isGroup;
      }
    }
    return false;
  }
  public isGroupTask(f: Task): boolean {
    if (this.form == undefined)
      return false;
    for (let index = 0; index < this.possibleTasks.length; index++) {
      const possibleTask = this.possibleTasks[index];
      if (possibleTask.agentTaskStr === f.userFunction) {
        return possibleTask.isGroup;
      }
    }
    return false;
  }
  get isGroupTaskSelected() {
    if (this.form == undefined)
      return false;
    for (let index = 0; index < this.possibleTasks.length; index++) {
      const possibleTask = this.possibleTasks[index];
      if (possibleTask.agentTaskStr === this.form.get('function').value) {
        return possibleTask.isGroup;
      }
    }
    return false;
  }
  get assignedGroup(): string {
    const taskSelected = this.f['function'].value;
    var task = this.account.userFunctions.find((f) => {
      return f.userFunction === taskSelected;
    });
    return (task != null && task != undefined) ? task.group : "";
  }
  onTaskChanged(event: Event) {
    var valueSelected = (event.target as HTMLInputElement).value;
    if (this.isGroupTaskSelected) {
      this.f["groupTask"].setValue(this.assignedGroup);
    } else {
      this.f["groupTask"].setValue("");
    }
  }
  onRowSelected(contact: Task, input: any, index: number, event: MouseEvent) {
    if (event.ctrlKey) {
      if (contact.highlighted) {
          contact.highlighted = false;
          return;
      }
  }
  this.selectRow(contact);
  }
  private selectRow(contact: Task) {
    for (let index = 0; index < this.userTasks().length; index++) {
      const element = this.userTasks()[index];
      if (element.highlighted)
        element.highlighted = false;

      if (this.isSameTask(contact, element)) {
        var pageNumber = Math.floor(index / this.paginator.pageSize);
        this.paginator.pageIndex = pageNumber;

        this.paginator.page.next({
          pageIndex: pageNumber,
          pageSize: this.paginator.pageSize,
          length: this.paginator.length
        } as PageEvent);
      }
    }
    contact.highlighted = true;
    if (!contact.isDeleting) {
      this.form.get('function').setValue(contact.userFunction);
      this.form.get('groupTask').setValue(contact.group);

      let date = moment(contact.preferredTime, "HH:mm").toDate();
      this.openTime.changeHour(date.getHours());
      this.openTime.changeMinute(date.getMinutes());

    }
  }

  isSameTask(t1: Task, t2: Task): boolean {
    console.assert(t1 != null && t2 != null, "One of the tasks is null");
    return t1.userFunction == t2.userFunction && t1.group == t2.group && t1.preferredTime == t2.preferredTime;
  }
  onChangeHour(event : any){
    console.log(event);
  }
}
