import { signal, Component, OnInit, ViewChild } from '@angular/core';
import { FormArray, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort, Sort } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table';
import * as moment from 'moment';

import { first } from 'rxjs';
import { TimeHandler } from 'src/app/_helpers/time.handler';
import { AgentTaskConfig } from 'src/app/_models/agenttaskconfig';
import { TimeSlotsTasks } from 'src/app/_models/timeslotstasks';
import { TimeSlotsTasksDTO } from 'src/app/_models/timeslotstasksDTO';
import { AccountService, AlertService } from 'src/app/_services';
import { Constants } from 'src/app/constants';


const COLUMNS_SCHEMA = [
  {
    key: "Date",
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
export class TimeSlotTasksEditorComponent implements OnInit {
  @ViewChild('paginator') paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  dateFormat = Constants.dateTimeFormat;
  dateTimeFormat = Constants.dateTimeFormat;

  form: FormGroup;
  isLoaded: boolean = false;
  isAdding: boolean = false;

  currentSelectedAccount: TimeSlotsTasks = null;
  lastSelectedAccount: TimeSlotsTasks = null;


  dataSource: MatTableDataSource<TimeSlotsTasks>;
  displayedColumns: string[] = COLUMNS_SCHEMA.map((col) => col.key);
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
    this.refreshTaskCounters();
    this.refreshTimeSlotsTasks(null);
    this.isLoaded = true;
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
  private refreshTimeSlotsTasks(selectRow : TimeSlotsTasks) {
    this.timeSlots.set([]);
    var selectedRow : TimeSlotsTasks;
    this.accountService.getTimeSlotsTasks()
      .pipe(first())
      .subscribe({
        next: (value: TimeSlotsTasksDTO[]) => {
          value.forEach((element : TimeSlotsTasksDTO) => {
            var slot : TimeSlotsTasks = {
              date: element.date,
              tasks: element.tasks.split(" "),
              isDeleting: false,
              highlighted: false
            }
            this.timeSlots().push(slot);
            if(selectRow != null && selectRow.date == slot.date)
              selectedRow = slot;
          });

          this.dataSource = new MatTableDataSource(this.timeSlots());
          this.dataSource.paginator = this.paginator;
          this.dataSource.sort = this.sort;
        },
        complete: () => {
          if(selectRow != null)
              this.selectRow(selectedRow);

        },
        error: error => {
          this.alertService.error(error);

        }
      });
  }
  sortData(sort: Sort) {
    TimeHandler.sortData(this.timeSlots(), sort);
    this.dataSource.data = this.timeSlots();
  }
  onDeleteTimeSlotTasks(event: MouseEvent, tasks: TimeSlotsTasks) {
    console.log("MainSchedulerComponent deleting called");
    tasks.isDeleting = true;
    var timeslotsTasks : TimeSlotsTasksDTO = {
      date : tasks.date,
      tasks : tasks.tasks.join(" "),
      isDeleting : false,
      highlighted : false
    }
    this.accountService.deleteTimeSlotsTasks(timeslotsTasks)
      .pipe(first())
      .subscribe({
        next: () => {
        },
        complete: () => {
          tasks.isDeleting = false;
          this.refreshTimeSlotsTasks(null);
        },
        error: error => {
          this.alertService.error(error);
          tasks.isDeleting = false;
        }
      });
  }
  // convenience getter for easy access to form fields
  get f() {
    return this.form.controls;

  }

  onAddTask() {

    this.submitted = true;
    this.isAdding = true;

    // Reset alerts on submit
    this.alertService.clear();

    // Stop here if 'form' is invalid
    if (this.form.invalid) {
      this.form.markAsTouched(); //markAllAsTouched();
      this.f['groupTask'].markAsTouched();
      return;
    }

    var dateControl = this.f['scheduledDate'];
    var date = moment(dateControl.value).format(this.dateTimeFormat)
    var tasks: string = this.getTasksStr(date); 
   
    console.log(tasks);
    var timeslotsTasksDTO : TimeSlotsTasksDTO = {
      date : date,
      tasks : tasks,
      isDeleting : false,
      highlighted : false
    }
    this.writeTimeSlotsTasks(timeslotsTasksDTO);

    var timeslotsTasks : TimeSlotsTasks = {
      date : date,
      tasks : tasks.split(" "),
      isDeleting : false,
      highlighted : false
    }

    this.refreshTimeSlotsTasks(timeslotsTasks);
  }
  private getTasksStr(date: string) {
    var tasks: string = "";
    console.log(date);
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

  private writeTimeSlotsTasks(tasks : TimeSlotsTasksDTO) {
    this.accountService.setTimeSlotsTasks(tasks)
      .pipe(first())
      .subscribe({
        next: () => {
        },
        complete: () => {
          this.isAdding = false;
        },
        error: error => {
          this.alertService.error(error);
          this.isAdding = false;
        }
      });
  }
  splitArr(arr: AgentTaskConfig[], size: number) : AgentTaskConfig[][] {
    let newArr:AgentTaskConfig[][] = [];
    for (let i = 0; i < arr.length; i += size) {
      newArr.push(arr.slice(i, i + size));
    }
    return newArr;
  }
  onRowSelected(slot: TimeSlotsTasks, tr: any, index: number) {
    this.selectRow(slot);
  }

  private selectRow(slot: TimeSlotsTasks) {
    this.setTasksCounters(slot);
    slot.highlighted = !slot.highlighted;
    this.currentSelectedAccount = slot;

    if (this.lastSelectedAccount != null) {
      this.lastSelectedAccount.highlighted = false;
    }
    this.lastSelectedAccount = this.currentSelectedAccount;

    if (!slot.highlighted) {
      // If row is deselected mark both schedules as deselected(null);
      this.lastSelectedAccount = null;
      this.currentSelectedAccount = null;
    }
  }

  setTasksCounters(slot: TimeSlotsTasks) {
    var dateControl = this.f['scheduledDate'];
    dateControl.setValue(moment(slot.date, Constants.dateTimeFormat).toDate());

    var map = this.getWordCount(slot.tasks);
    this.agentTaskConfigs.forEach(task => {
      var control = this.f[task.agentTaskStr];
      if(map.get(task.agentTaskStr) == undefined)
        control.setValue(0);
      else
        control.setValue(map.get(task.agentTaskStr));
    });
  }

  getWordCount(array: string[]) {
    const map = new Map();
    for (let i = 0; i < array.length; i++) {
      let item = array[i];
      if(map.get(item) == undefined)
        map.set(item, 1);
      else
        map.set(item, map.get(item) + 1); 
    }
    return map;
  }
  onChangeDateTime(event: any) {
    var date = moment(event.value).format(this.dateTimeFormat)
    console.log(date);
  }
}
