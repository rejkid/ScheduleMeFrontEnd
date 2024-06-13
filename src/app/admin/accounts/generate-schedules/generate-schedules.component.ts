import { AfterViewInit, Component, ElementRef, EventEmitter, OnInit, Output, QueryList, ViewChild, ViewChildren } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import * as moment from 'moment';
import { Subscription /* , first */ } from 'rxjs';
import { first } from 'rxjs/operators';
import { FunctionScheduleData } from 'src/app/_models/functionscheduledata';
import { ScheduleDateTime } from 'src/app/_models/scheduledatetime';
import { User } from 'src/app/_models/user';
import { UserFunction } from 'src/app/_models/userfunction';
import { UserFunctions } from 'src/app/_models/userfunctions';
import { AccountService, AlertService } from 'src/app/_services';
import { Constants } from 'src/app/constants';
import { FunctionScheduleComponent } from '../function-schedule/function-schedule.component';



@Component({
  selector: 'app-generate-schedules',
  templateUrl: './generate-schedules.component.html',
  styleUrls: ['./generate-schedules.component.less']
})
export class GenerateSchedulesComponent implements OnInit, AfterViewInit {
  @ViewChildren('functionSchedule') functionComponents: QueryList<FunctionScheduleComponent>;
  @ViewChild(`ref`) dateCtrl: ElementRef;
  @Output() schedulesUpdatedEmitter: EventEmitter<FunctionScheduleData>;
  @Output() dateTimeChangedEmitter: EventEmitter<string>;

  dateFormat = Constants.dateFormat;
  dateTimeFormat = Constants.dateTimeFormat;
  form: FormGroup;
  uploadSub: Subscription;
  functions: UserFunction[] = [];
  isLoaded: boolean;
  fComponents: FunctionScheduleComponent[] = [];
  static functions2SchedulesMap: Map<FunctionScheduleComponent, User[]> = new Map<FunctionScheduleComponent, User[]>();

  functionsLoaded: boolean = true;
  enableCopyButton: boolean = false;
  enablePasteButton: boolean = false;
  advancedButtonsVisibility: any = false;

  constructor(private accountService: AccountService,
    private route: ActivatedRoute,
    private router: Router,
    private formBuilder: FormBuilder,
    private alertService: AlertService) {
    this.schedulesUpdatedEmitter = new EventEmitter<FunctionScheduleData>();
    this.dateTimeChangedEmitter = new EventEmitter<string>();
  }
  ngAfterViewInit(): void {
    this.functionComponents.changes.subscribe((comps: QueryList<FunctionScheduleComponent>) => {
      /* Load `fComponent` array with all `FunctionScheduleComponent` created by html template */
      comps.forEach(element => {
        this.fComponents.push(element);
      });
      var newMap = new Map<FunctionScheduleComponent, User[]>(GenerateSchedulesComponent.functions2SchedulesMap);
      GenerateSchedulesComponent.functions2SchedulesMap.clear();

      Array.from(newMap.keys()).map(key => {
        console.log(key);
        this.fComponents.forEach(element => {
          if (element.functionStr === key.functionStr) {
            GenerateSchedulesComponent.functions2SchedulesMap.set(element, newMap.get(key));
          }
        });
      });
      /* All FunctionScheduleComponent are loaded */

      // for (let entry of newMap.entries()) {
      //   console.log("Key:" + entry[0].dateTimeStr);

      //   this.fComponents.forEach(element => {
      //     if (element.functionStr === entry[0].functionStr) {
      //       GenerateSchedulesComponent.functions2SchedulesMap.set(element, entry[1]);
      //     }
      //   });
      // }
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
    this.accountService.getTasks()
      .pipe(first())
      .subscribe({
        next: (value: UserFunctions) => {
          /* Test case */
          /*
          var fakeFunction: UserFunction = {
            id: '',
            userFunction: "Cleaner",
            group: '',
            isGroup : true,
            isDeleting : false,
            highlighted : false
          }
          this.functions.push(fakeFunction);
          */

          /* Create `UserFunction` component for every function that was returned by server*/
          value.functions.forEach(element => {
            var f: UserFunction = {
              id: '',
              userFunction: element.userFunction,
              group: '',
              isGroup : element.isGroup,
              isDeleting : false,
              highlighted : false
            }
            this.functions.push(f);
          });
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

  onChangeDateTime(event: any) {
    this.fComponents.forEach(element => {
      console.log("Changing time to: " + this.getDateTimeStr());
      element.setCurrentDate(this.getDateTimeStr());
    });
    this.setCopyPasteButtons();
    this.dateTimeChangedEmitter.emit(moment(event.value).format(this.dateTimeFormat));
  }
  // convenience getter for easy access to form fields
  get f() { return this.form.controls; }

  getDateTimeStr(): string {
    return moment(this.f['scheduledDateTime'].value).format(this.dateTimeFormat)
  }
  setCurrentDate(dateStr: string) {
    this.f['scheduledDateTime'].setValue(moment(dateStr, Constants.dateTimeFormat).toDate());
    // /* Trigger atrificially  `onChangeDateTime` */
    // const event = new CustomEvent("change", { detail: dateStr });
    // (this.dateCtrl.nativeElement as HTMLInputElement).dispatchEvent(
    //   event
    // );
    this.fComponents.forEach(element => {
      console.log("Changing time to: " + this.getDateTimeStr());
      element.setCurrentDate(this.getDateTimeStr());
    });
    this.setCopyPasteButtons();
    console.log("Generate changing date: " + dateStr);
  }

  onCopy(event: MouseEvent, button: any): Map<FunctionScheduleComponent, User[]> {
    /* Build an array of accounts schedules to be copied */
    var data = this.copyChildData();
    this.setCopyPasteButtons();
    return data;
  }
  onPaste(event: MouseEvent, button: any) {
    //this.functionsLoaded = false;
    this.setCopyPasteButtons();
    for (let entry of GenerateSchedulesComponent.functions2SchedulesMap.entries()) {
      console.log("Key:" + entry[0].dateTimeStr);
      for (let index = 0; index < entry[1].length; index++) {
        console.log("\tValue:" + entry[1][index].firstName);
        /* 
        The entry[1] is an array of Accounts[] for specific `FunctionScheduleComponent`(entry[0]) 
        */
        entry[0].addSchedule(entry[1][index]);
      }
    }
    //this.functionsLoaded = true;
  }
  onClear(event: MouseEvent, button: any) {
    GenerateSchedulesComponent.functions2SchedulesMap.clear();
    this.setCopyPasteButtons();
  }
  onDeleteSchedules(event: MouseEvent, data: ScheduleDateTime) {
    this.fComponents.forEach(element => {

      /* Make sure the row is selected first so the ``dateTimeStr`` is set up properly 
      `functionStr` is set on creation time by this class*/
      this.setCurrentDate(data.date)
      element.onDeleteSchedules(event);
      console.log("GenerateSchedulesComponent deleting functionStr:" + element.functionStr + " dateStr:" + element.dateTimeStr);
    });
  }

  private copyChildData(): Map<FunctionScheduleComponent, User[]> {
    GenerateSchedulesComponent.functions2SchedulesMap.clear();
    this.fComponents.forEach(element => {
      GenerateSchedulesComponent.functions2SchedulesMap.set(element, element.accounts4DateAndFunction);
    });
    return GenerateSchedulesComponent.functions2SchedulesMap;
  }
  private childrenData(): Map<string, User[]> {
    var array: Map<string, User[]> = new Map<string, User[]>();
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
