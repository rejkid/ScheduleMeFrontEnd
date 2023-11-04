import { MatDatetimePickerInputEvent } from '@angular-material-components/datetime-picker';
import { AfterViewInit, Component, ElementRef, EventEmitter, OnInit, Output, QueryList, ViewChild, ViewChildren } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import * as moment from 'moment';
import { Subscription, first } from 'rxjs';
import { Account } from 'src/app/_models';
import { FunctionScheduleData } from 'src/app/_models/functionscheduledata';
import { ScheduleDateTimes } from 'src/app/_models/scheduledatetimes';
import { UserFunction } from 'src/app/_models/userfunction';
import { AccountService, AlertService } from 'src/app/_services';
import { Constants } from 'src/app/constants';
import { FunctionScheduleComponent } from '../function-schedule/function-schedule.component';
import { ScheduleDateTime } from 'src/app/_models/scheduledatetime';



@Component({
  selector: 'app-generate-schedules',
  templateUrl: './generate-schedules.component.html',
  styleUrls: ['./generate-schedules.component.less']
})
export class GenerateSchedulesComponent implements OnInit, AfterViewInit {
  @ViewChildren(`function`) functionComponents: QueryList<FunctionScheduleComponent>;
  @ViewChild(`ref`) dateCtrl: ElementRef;
  @Output() schedulesUpdatedEmitter: EventEmitter<FunctionScheduleData>;

  dateFormat = Constants.dateFormat;
  dateTimeFormat = Constants.dateTimeFormat;
  isBusy: boolean = false;
  form: FormGroup;
  uploadSub: Subscription;
  functions: UserFunction[] = [];
  isLoaded: boolean;
  fComponents: FunctionScheduleComponent[] = [];
  static functions2SchedulesMap: Map<FunctionScheduleComponent, Account[]> = new Map<FunctionScheduleComponent, Account[]>();

  functionsLoaded: boolean = true;
  enableCopyButton: boolean = false;
  enablePasteButton: boolean = false;

  constructor(private accountService: AccountService,
    private route: ActivatedRoute,
    private router: Router,
    private formBuilder: FormBuilder,
    private alertService: AlertService) {
      this.schedulesUpdatedEmitter = new EventEmitter<FunctionScheduleData>();
  }
  ngAfterViewInit(): void {
    this.functionComponents.changes.subscribe((comps: QueryList<FunctionScheduleComponent>) => {
      /* Load `fComponent` array with all `FunctionScheduleComponent` created by html template */
      comps.forEach(element => {
        this.fComponents.push(element);
      });
      var newMap = new Map<FunctionScheduleComponent, Account[]>(GenerateSchedulesComponent.functions2SchedulesMap);
      GenerateSchedulesComponent.functions2SchedulesMap.clear();
      for (let entry of newMap.entries()) {
        console.log("Key:" + entry[0].dateTimeStr);
        this.fComponents.forEach(element => {
          if (element.functionStr === entry[0].functionStr) {
            GenerateSchedulesComponent.functions2SchedulesMap.set(element, entry[1]);
          }
        });
      }
      /* All FunctionScheduleComponent are loaded */
    });
  }

  ngOnInit(): void {
    this.form = this.formBuilder.group({
      scheduledDateTime: [new Date(), Validators.required],
      information: [, Validators.required],

    });
    //this.getAllDates();
    this.functionsLoaded = false;
    this.accountService.getRoles()
      .pipe(first())
      .subscribe({
        next: (value: string[]) => {
          //value = ["Acolyte", "Cleaner"] ;
          /* Create `UserFunction` component for every function that was returned by server*/
          value.forEach(element => {
            var f: UserFunction = {
              id: '',
              userFunction: element
            }
            this.functions.push(f);
          });
          console.log();
        },
        complete: () => {
          this.functionsLoaded = true;
        },
        error: error => {
          this.alertService.error(error);
          this.functionsLoaded = false;
        }
      });
    this.setCopyPasteButtons();
  }

  onSchedulesUpdated(data: FunctionScheduleData) {
    this.setCopyPasteButtons();
    this.schedulesUpdatedEmitter.emit(data);
  }

  onChangeDateTime(event: MatDatetimePickerInputEvent<any>) {
    this.fComponents.forEach(element => {
      console.log("Changing time to: "+ this.getDateTimeStr());
      element.dateTimeChanged(this.getDateTimeStr());
    });
    this.setCopyPasteButtons();
  }
  // convenience getter for easy access to form fields
  get f() { return this.form.controls; }

  getDateTimeStr(): string {
    return moment(this.f['scheduledDateTime'].value).format(this.dateTimeFormat)
  }
  // getAllDates() {
  //   this.accountService.getAllDates()
  //     .pipe(first())
  //     .subscribe({
  //       next: (value: ScheduleDateTimes) => {
  //         var list: Date[] = [];
  //         for (let index = 0; index < value.scheduleDateTimes.length; index++) {
  //           // Add server side dates
  //           list.push(moment(value.scheduleDateTimes[index].date).toDate())
  //         }
  //         list.sort(function (a, b) {
  //           if (a > b) return 1
  //           if (a < b) return -1
  //           return 0
  //         });


  //         // Convert dates to date strings and optionally filter out past date strings
  //         for (let index = 0; index < list.length; index++) {
  //           var nowMs = Date.now();
  //           const date = moment(list[index]).toDate();
  //           var dateStr = moment(date).format(Constants.dateTimeFormat);
  //           var scheduleMs = date.getTime();

  //           /* Pick the first date in future to show on startup*/
  //           if (scheduleMs > nowMs) {
  //             this.setCurrentDate(dateStr);
  //             break;
  //           }
  //         }
  //       },
  //       complete: () => {
  //       },
  //       error: error => {
  //         console.log();
  //       }
  //     });
  // }
  setCurrentDate(dateStr: string) {
    this.f['scheduledDateTime'].setValue(moment(dateStr, Constants.dateTimeFormat).toDate());
    //var event = new Event('change');
    
    const event = new CustomEvent("change", { detail: dateStr });
    (this.dateCtrl.nativeElement as HTMLInputElement).dispatchEvent(
      event
    );
    console.log("Generate changing date: " + dateStr);
  }

  onCopy(event: MouseEvent, button: any): Map<FunctionScheduleComponent, Account[]> {
    /* Build an array of accounts schedules to be copied */
    var data = this.copyChildData();
    this.setCopyPasteButtons();
    return data;
  }
  onPaste(event: MouseEvent, button: any) {
    this.setCopyPasteButtons();
    for (let entry of GenerateSchedulesComponent.functions2SchedulesMap.entries()) {
      console.log("Key:" + entry[0].dateTimeStr);
      for (let index = 0; index < entry[1].length; index++) {
        console.log("\tValue:" + entry[1][index].firstName);
        /* entry[1] = Accounts[] for specific `FunctionScheduleComponent`(entry[0]) */
        entry[0].addSchedule(entry[1][index]);
      }
    }
  }
  onClear(event: MouseEvent, button: any) {
    GenerateSchedulesComponent.functions2SchedulesMap.clear();
    this.setCopyPasteButtons();
  }
  onDeleteSchedules(event: MouseEvent, data : ScheduleDateTime) {
    this.fComponents.forEach(element => {

      /* Make sure the row is selected first so the ``dateTimeStr`` is set up properly 
      `functionStr` is set on creation time by this class*/
      this.setCurrentDate(data.date)
      

      element.onDeleteSchedules(event);
      console.log("GenerateSchedulesComponent deleting functionStr:"+element.functionStr+" dateStr:"+ element.dateTimeStr);
    });
  }

  private copyChildData(): Map<FunctionScheduleComponent, Account[]> {
    GenerateSchedulesComponent.functions2SchedulesMap.clear();
    this.fComponents.forEach(element => {
      GenerateSchedulesComponent.functions2SchedulesMap.set(element, element.accounts4DateAndFunction);
    });
    return GenerateSchedulesComponent.functions2SchedulesMap;
  }
  private childrenData(): Map<string, Account[]> {
    var array: Map<string, Account[]> = new Map<string, Account[]>();
    this.fComponents.forEach(element => {
      if (element.accounts4DateAndFunction.length > 0)
        array.set(element.functionStr, element.accounts4DateAndFunction);
    });
    return array;
  }
  areChildrenEmpty(): boolean {
    return this.childrenData().size <= 0;
  }
  isFunc2SchedMapdEmpty(): boolean {
    return GenerateSchedulesComponent.functions2SchedulesMap.size <= 0;
  }
  private setCopyPasteButtons() {
    if (this.isFunc2SchedMapdEmpty())
      this.f['information'].setValue("There is no data in a buffer");
    else
      this.f['information'].setValue("There is data in a buffer");

    if (this.areChildrenEmpty()) {
      this.enableCopyButton = false;
      this.enablePasteButton = this.isFunc2SchedMapdEmpty() ? false : true;
    } else {
      this.enableCopyButton = true;
      this.enablePasteButton = false;
    }
  }
}
