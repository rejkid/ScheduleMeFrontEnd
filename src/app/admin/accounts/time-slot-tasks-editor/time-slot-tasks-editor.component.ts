import { signal, Component, OnInit, ViewChild, AfterViewInit, inject, TemplateRef, ElementRef } from '@angular/core';
import { FormArray, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort, Sort } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import * as moment from 'moment';

import { first } from 'rxjs';
import { TimeHandler } from 'src/app/_helpers/time.handler';
import { AgentTaskConfig } from 'src/app/_models/agenttaskconfig';
import { TimeSlotsTasks } from 'src/app/_models/timeslotstasks';
import { TimeSlotsTasksDTO } from 'src/app/_models/timeslotstasksDTO';
import { AccountService, AlertService } from 'src/app/_services';
import { Constants } from 'src/app/constants';
import { NgbdModalConfirmComponent } from '../ngbd-modal-confirm/ngbd-modal-confirm.component';
import { ThemePalette } from '@angular/material/core';


const COLUMNS_SCHEMA = [
  {
    key: "timeSlotDate",
    type: "text",
    label: "Date"
  },
  {
    key: "Tasks",
    type: "text",
    label: "Tasks"
  }, {
    key: "delete",
    type: "text",
    label: "Delete"
  },
]
@Component({
  selector: 'app-time-slot-tasks-editor',
  templateUrl: './time-slot-tasks-editor.component.html',
  styleUrl: './time-slot-tasks-editor.component.less'
})
export class TimeSlotTasksEditorComponent implements OnInit, AfterViewInit {
  @ViewChild('paginator') paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;
  
  public color: ThemePalette = 'primary';
  private modalService = inject(NgbModal);

  dateFormat = Constants.dateTimeFormat;
  dateTimeFormat = Constants.dateTimeFormat;

  form: FormGroup;
  isLoaded: boolean = false;
  isAdding: boolean = false;

  static pageSize: number;

  dataSource: MatTableDataSource<TimeSlotsTasks>;
  displayedColumns: string[] = COLUMNS_SCHEMA.map((col) => col.key);
  displayedLabels: string[] = COLUMNS_SCHEMA.map((col) => col.label);
  columnsSchema: any = COLUMNS_SCHEMA;

  timeSlots = signal<TimeSlotsTasks[]>([]);
  agentTaskConfigs: AgentTaskConfig[] = [];
  submitted: boolean = false;
  newTasksArr: (AgentTaskConfig[])[];
  constructor(private accountService: AccountService, private alertService: AlertService,
    private formBuilder: FormBuilder
  ) {
    /* This form ... */
    this.form = this.formBuilder.group({
      scheduledDate: [new Date(), Validators.required],
    });
  }
  ngOnInit(): void {
  }

  ngAfterViewInit(): void {
    this.dataSource = new MatTableDataSource();
    this.dataSource.paginator = this.paginator;
    this.dataSource.sort = this.sort;

    this.refreshTaskCounters();
    this.refreshTimeSlotsTasks(null);
    this.isLoaded = true;
    //this.f['scheduledDate'].disable();
  }

  private refreshTaskCounters() {
    this.accountService.getAllAgentTaskConfigs()
      .pipe(first())
      .subscribe({
        next: (groupTasks: AgentTaskConfig[]) => {
          this.agentTaskConfigs = groupTasks;
          this.newTasksArr = this.splitArr(this.agentTaskConfigs, 3)

          this.agentTaskConfigs.forEach(cfg => {
            this.addFormControl(cfg.agentTaskStr, [Validators.required]);
            this.f[cfg.agentTaskStr].setValue(0);
          });
        },
        complete: () => {
        },
        error: error => {
          this.alertService.error(error);

        }
      });
  }
  addFormControl(fieldName: string, validators: any[] = []) {
    this.form.addControl(fieldName, this.formBuilder.control(fieldName, validators));
  }
  private refreshTimeSlotsTasks(selectRow: TimeSlotsTasks) {
    this.timeSlots.set([]);
    var selectedRow: TimeSlotsTasks;
    this.accountService.getTimeSlotsTasks()
      .pipe(first())
      .subscribe({
        next: (value: TimeSlotsTasksDTO[]) => {
          value.forEach((element: TimeSlotsTasksDTO) => {
            var slot: TimeSlotsTasks = {
              date: element.date,
              tasks: element.tasks.split(" "),
              isDeleting: false,
              highlighted: false
            }
            this.timeSlots().push(slot);
            if (selectRow != null && selectRow.date == slot.date)
              selectedRow = slot;
          });

          this.dataSource.data = this.timeSlots();
        },
        complete: () => {
          this.sortInAsccDateOrder();
          //this.sortInDescDateOrder();
          if (selectRow != null)
            this.selectRow(selectedRow);
        },
        error: error => {
          this.alertService.error(error);
        }
      });
  }
  private sortInDescDateOrder() {
    const sortState: Sort = { active: 'timeSlotDate', direction: 'desc' };
    this.sort.active = sortState.active;
    this.sort.direction = sortState.direction;
    this.sort.sortChange.emit(sortState);
  }

  private sortInAsccDateOrder() {
    const sortState: Sort = { active: 'timeSlotDate', direction: 'asc' };
    this.sort.active = sortState.active;
    this.sort.direction = sortState.direction;
    this.sort.sortChange.emit(sortState);
  }

  sortData(sort: Sort) {
    TimeHandler.sortData(this.timeSlots(), sort);
    this.dataSource.data = this.timeSlots();
  }
  onDeleteTimeSlotTasks(event: MouseEvent, tasks: TimeSlotsTasks) {
    console.log("MainSchedulerComponent deleting called");
    // Reset alerts on submit
    this.alertService.clear();

    const modalRef = this.modalService.open(NgbdModalConfirmComponent);
    modalRef.componentInstance.titleStr = "Time Slot Deletion";
    modalRef.componentInstance.bodyQuestionStr = "Are you sure you want to delete time slot profile?";
    modalRef.componentInstance.bodyInfoStr = "All information associated with the time slot profile will be permanently deleted.";
    modalRef.result.then((data) => {
      tasks.isDeleting = true;
      var timeslotsTasks: TimeSlotsTasksDTO = {
        date: tasks.date,
        tasks: tasks.tasks.join(" "),
        isDeleting: false,
        highlighted: false
      }
      this.accountService.deleteTimeSlotsTasks(timeslotsTasks)
        .pipe(first())
        .subscribe({
          next: () => {
          },
          complete: () => {
            tasks.isDeleting = false;
            this.refreshTimeSlotsTasks(null);
            //this.alertService.info("Data Saved");
            tasks.isDeleting = false;
          },
          error: error => {
            this.alertService.error(error);
            tasks.isDeleting = false;
          }
        });
    }).catch((error) => {
    });

  }
  // convenience getter for easy access to form fields
  get f() {
    return this.form.controls;

  }

  onAddUpdateTimeSlot() {
    this.submitted = true;
    this.isAdding = true;

    // Reset alerts on submit
    this.alertService.clear();

    // Stop here if 'form' is invalid
    if (this.form.invalid) {
      this.form.markAsTouched(); //markAllAsTouched();
      this.f['groupTask'].markAsTouched();
      this.alertService.info("Data Invalid");
      return;
    }

    var dateControl = this.f['scheduledDate'];
    var date = moment(dateControl.value).format(this.dateTimeFormat);
    var tasks: string = this.getTasksStr();

    let timeslotsTasksDTO: TimeSlotsTasksDTO = {
      date: date,
      tasks: tasks,
      isDeleting: false,
      highlighted: false
    }

    this.writeTimeSlotsTasks(timeslotsTasksDTO);
  }
  private writeTimeSlotsTasks(task: TimeSlotsTasksDTO) {
    this.accountService.setTimeSlotsTasks(task)
      .pipe(first())
      .subscribe({
        next: (value: TimeSlotsTasksDTO[]) => {
          
          let slots = value.map((tst) => {
            let retVal : TimeSlotsTasks = {
              date: tst.date,
              tasks: tst.tasks.split(" "),
              isDeleting : false,
              highlighted : false,
            }
            return retVal;
            });
          this.timeSlots.set(slots);
          this.dataSource.data = this.timeSlots();
        },
        complete: () => {
          console.assert(task != null, "AgentTaskConfig  is null");
          let selected = this.timeSlots().filter(function (item) {
            return item.date == task.date;
          });
          console.assert(selected.length == 1, "Number of selected tasks:" + selected.length);

          this.sortInAsccDateOrder();
          //this.sortInDescDateOrder();

          this.selectRow(selected[0]);
          this.isAdding = false;
          //this.alertService.info("Data Saved");
        },
        error: error => {
          this.alertService.error(error);
          this.isAdding = false;
        }
      });
  }

  private getTasksStr() {
    var tasks: string = "";
    for (let cfg of this.agentTaskConfigs) {
      const control = this.form.get(cfg.agentTaskStr); // 'control' is a FormControl
      for (var i = 0; i < control.value; i++) {
        if (i > 0 || tasks.length > 0)
          tasks = tasks.concat(" ").concat(cfg.agentTaskStr);
        else
          tasks = tasks.concat(cfg.agentTaskStr);
      }
      console.log(cfg);
    };
    return tasks;
  }

  splitArr(arr: AgentTaskConfig[], size: number): AgentTaskConfig[][] {
    let newArr: AgentTaskConfig[][] = [];
    for (let i = 0; i < arr.length; i += size) {
      newArr.push(arr.slice(i, i + size));
    }
    return newArr;
  }
  onRowSelected(slot: TimeSlotsTasks, tr: any, index: number, event: any) {
    if (event.ctrlKey) {
      if (slot.highlighted) {
        slot.highlighted = false;
        return;
      }
    }
    this.selectRow(slot);
  }

  private selectRow(slot: TimeSlotsTasks) {
    for (let index = 0; index < this.timeSlots().length; index++) {
      const element = this.timeSlots()[index];
      if (element.highlighted)
        element.highlighted = false;

      if (this.isSameTimeSlot(slot, element)) {
        var pageNumber = Math.floor(index / this.paginator.pageSize);
        this.paginator.pageIndex = pageNumber;

        this.paginator.page.next({
          pageIndex: pageNumber,
          pageSize: this.paginator.pageSize,
          length: this.paginator.length
        });
      }
    }

    slot.highlighted = true;
    if (!slot.isDeleting) {
      this.setTasksCounters(slot);
    }
  }
  isSameTimeSlot(s1: TimeSlotsTasks, s2: TimeSlotsTasks): boolean {
    console.assert(s1 != null && s2 != null, "One or both of the time slots is null");
    return s1.date == s2.date;
  }

  setTasksCounters(slot: TimeSlotsTasks) {
    var dateControl = this.f['scheduledDate'];
    dateControl.setValue(moment(slot.date, Constants.dateTimeFormat).toDate());

    var map = this.getWordCount(slot.tasks);
    this.agentTaskConfigs.forEach(task => {
      var control = this.f[task.agentTaskStr];
      if (map.get(task.agentTaskStr) == undefined)
        control.setValue(0);
      else
        control.setValue(map.get(task.agentTaskStr));
    });
  }

  getWordCount(array: string[]) {
    const map = new Map();
    for (let i = 0; i < array.length; i++) {
      let item = array[i];
      if (map.get(item) == undefined)
        map.set(item, 1);
      else
        map.set(item, map.get(item) + 1);
    }
    return map;
  }
  onChangeDateTime(event: any) {
    let day = moment(event.value).format(this.dateTimeFormat)
    console.log(day);
  }
  onChangePageProperties(event: any) {
    TimeSlotTasksEditorComponent.pageSize = event.pageSize;
  }
  get pageSize() {
    return TimeSlotTasksEditorComponent.pageSize;
  }
  get getDayStrFromDate(): string {
    return TimeHandler.getDayStrFromDate(moment(this.f['scheduledDate'].value).format(this.dateTimeFormat));
  }
  validateAddUpdateButton() : boolean {
    let retVal = this.timeSlots().find(function (item) {
      return item.highlighted == true;
    });
    return retVal != undefined;
  }
}
