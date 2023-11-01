import { MatDatetimePickerInputEvent } from '@angular-material-components/datetime-picker';
import { AfterViewInit, Component, ElementRef, OnInit, QueryList, ViewChild, ViewChildren } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import * as moment from 'moment';
import { Subscription, first } from 'rxjs';
import { ScheduleDateTimes } from 'src/app/_models/scheduledatetimes';
import { AccountService, AlertService } from 'src/app/_services';
import { Constants } from 'src/app/constants';
import { FunctionScheduleComponent } from '../function-schedule/function-schedule.component';
import { Schedule } from 'src/app/_models/schedule';
import { Account } from 'src/app/_models';
import { FunctionScheduleData } from 'src/app/_models/functionscheduledata';
import { UserFunction } from 'src/app/_models/userfunction';



@Component({
  selector: 'app-generate-schedules',
  templateUrl: './generate-schedules.component.html',
  styleUrls: ['./generate-schedules.component.less']
})
export class GenerateSchedulesComponent implements OnInit, AfterViewInit {
  @ViewChildren(`function`) functionComponents: QueryList<FunctionScheduleComponent>;

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
  }
  ngAfterViewInit(): void {
    this.functionComponents.changes.subscribe((comps: QueryList<FunctionScheduleComponent>) => {
      comps.forEach(element => {
        this.fComponents.push(element);
      });

      // All FunctionScheduleComponent are loaded
      // const e = new Event("change");
      // this.calendar.nativeElement.dispatchEvent(e);;
      // const e = new Event("change");
      // const element = document.querySelector('#test')
      // element.dispatchEvent(e);

    });
  }

  onSchedulesLoaded(data: FunctionScheduleData) {
    this.setCopyPasteButtons();
  }

  ngOnInit(): void {
    this.form = this.formBuilder.group({
      scheduledDateTime: [new Date(), Validators.required],
      information: [, Validators.required],

    });
    this.getAllDates();
    this.functionsLoaded = false;
    this.accountService.getRoles()
      .pipe(first())
      .subscribe({
        next: (value : string[]) => {
          //value = ["Acolyte", "Cleaner"] ;
          value.forEach(element => {
            var f : UserFunction = {
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

  onChangeDateTime(event: MatDatetimePickerInputEvent<any>) {
    this.fComponents.forEach(element => {
      element.dateTimeChanged(this.getDateTimeStr());
    });
    this.setCopyPasteButtons();
  }
  // convenience getter for easy access to form fields
  get f() { return this.form.controls; }

  getDateTimeStr(): string {
    return moment(this.f['scheduledDateTime'].value).format(this.dateTimeFormat)
  }
  getAllDates() {
    this.accountService.getAllDates()
      .pipe(first())
      .subscribe({
        next: (value: ScheduleDateTimes) => {
          var list: Date[] = [];
          for (let index = 0; index < value.scheduleDateTimes.length; index++) {
            // Add server side dates
            list.push(moment(value.scheduleDateTimes[index].date).toDate())
          }
          list.sort(function (a, b) {
            if (a > b) return 1
            if (a < b) return -1
            return 0
          });


          // Convert dates to date strings and optionally filter out past date strings
          for (let index = 0; index < list.length; index++) {
            var nowMs = Date.now();
            const date = moment(list[index]).toDate();
            var dateStr = moment(date).format(Constants.dateTimeFormat);
            var scheduleMs = date.getTime();

            /* Pick the first date in future to show on startup*/
            if (scheduleMs > nowMs) {
              this.f['scheduledDateTime'].setValue(moment(dateStr, Constants.dateTimeFormat).toDate());
              break;
            }
          }
        },
        complete: () => {
        },
        error: error => {
          console.log();
        }
      });
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
        entry[0].addSchedule(entry[1][index]);
      }
    }
  }
  onClear(event: MouseEvent, button: any) {
    GenerateSchedulesComponent.functions2SchedulesMap.clear();
    this.setCopyPasteButtons();
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
  isChildrenEmpty(): boolean {
    return this.childrenData().size <= 0;
  }
  isClipboardEmpty(): boolean {
    return GenerateSchedulesComponent.functions2SchedulesMap.size <= 0;
  }
  private setCopyPasteButtons() {
    if (this.isClipboardEmpty())
      this.f['information'].setValue("There is no data in a buffer");
    else
      this.f['information'].setValue("There is data in a buffer");

    if (this.isChildrenEmpty()) {
      this.enableCopyButton = false;
      this.enablePasteButton = this.isClipboardEmpty() ? false : true;
    } else {
      this.enableCopyButton = true;
      this.enablePasteButton = false;
    }
  }
}
