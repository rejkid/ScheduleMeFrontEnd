import { AfterViewInit, Component, ElementRef, OnInit, QueryList, ViewChild, ViewChildren } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import * as moment from 'moment';
import { Subscription, finalize, first } from 'rxjs';
import { Account } from 'src/app/_models';
import { AccountService, AlertService } from 'src/app/_services';
import { Constants } from 'src/app/constants';
import { FunctionScheduleComponent } from '../function-schedule/function-schedule.component';
import { Schedule } from 'src/app/_models/schedule';
import { Schedules4Role as Schedules4Function } from 'src/app/_models/schedules4Role';



@Component({
  selector: 'app-generate-schedules',
  templateUrl: './generate-schedules.component.html',
  styleUrls: ['./generate-schedules.component.less']
})
export class GenerateSchedulesComponent implements OnInit, AfterViewInit {
  @ViewChildren(`generateSchedules`) generateSchedulesProgress: QueryList<ElementRef>;
  //@ViewChild(`Acolyte`) acolyteComponent: FunctionScheduleComponent;
  @ViewChildren(`function`) functionComponents: QueryList<FunctionScheduleComponent>;

  dateFormat = Constants.dateFormat;
  dateTimeFormat = Constants.dateTimeFormat;
  isGenerating: boolean = false;
  form: FormGroup;
  uploadSub: Subscription;
  functions: string[];
  isLoaded: boolean;
  fComponents : FunctionScheduleComponent[] = [];

  functionsLoaded: boolean = true;

  constructor(private accountService: AccountService,
    private route: ActivatedRoute,
    private router: Router,
    private formBuilder: FormBuilder,
    private alertService: AlertService) {
  }
  ngAfterViewInit(): void {
    this.generateSchedulesProgress.changes.subscribe((comps: QueryList<ElementRef>) => {
      if (comps.first != undefined)
        comps.first.nativeElement.removeAttribute("value")
    });
    this.functionComponents.changes.subscribe((comps: QueryList<FunctionScheduleComponent>) => {
      comps.forEach(element => {
        this.fComponents.push(element);
      });
    });

    this.functionsLoaded = false;
    this.accountService.getRoles()
      .pipe(first())
      .subscribe({
        next: (value) => {
          this.functions = ["Acolyte", "Cleaner"];//value;
        },
        complete: () => {
          this.functionsLoaded = true;
        },
        error: error => {
          this.alertService.error(error);
          this.functionsLoaded = false;
        }
      });
  }

  ngOnInit(): void {
    this.form = this.formBuilder.group({
      scheduledDateTime: [new Date(), Validators.required],

    });
  }

  onClickEndDate(event: MouseEvent, calendar: any) {
    calendar.open();
    //event.preventDefault();
  }
  // convenience getter for easy access to form fields
  get f() { return this.form.controls; }

  onGenerateSchedules(event: MouseEvent) {

    /* Build an array of schedules to be created*/
    var schedules2BeCreated : Schedule[] = [];
    this.fComponents.forEach(element => {
      schedules2BeCreated  = schedules2BeCreated.concat(element.generateSchedules());
    });

    var schedule : Schedules4Function ={
      schedules: schedules2BeCreated,
    }
    const upload$ = this.accountService.generateSchedules(schedule)
      .pipe(
        finalize(() => {
          this.reset();
        })
      );

    this.isGenerating = true;
    this.uploadSub = upload$.pipe(first())
      .subscribe({
        next: (value: any) => {
          this.isGenerating = false;
        },
        complete: () => {
          this.isGenerating = false;
          this.alertService.info("Done");
        },
        error: error => {
          this.alertService.error(error);
          this.isGenerating = false;
        }
      });
  }
  reset() {

    this.uploadSub = null;
  }
  getDateTimeStr(): string {
    return moment(this.f['scheduledDateTime'].value).format(this.dateTimeFormat)
  }
}
