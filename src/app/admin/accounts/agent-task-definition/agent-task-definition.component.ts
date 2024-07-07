import { Component, OnInit, ViewChild, signal } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort, Sort, SortDirection } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table';
import { AgentTaskConfig } from 'src/app/_models/agenttaskconfig';
import { AccountService, AlertService } from 'src/app/_services';

const COLUMNS_SCHEMA = [
  {
    key: "taskName",
    type: "text",
    label: "Agent Task Name"
  },
  {
    key: "group",
    type: "text",
    label: "Agent Task Group"
  },
  {
    key: "action",
    type: "button",
    label: "Action"
  },
]

@Component({
  selector: 'app-agent-task-definition',
  templateUrl: './agent-task-definition.component.html',
  styleUrl: './agent-task-definition.component.less'
})
export class AgentTaskDefinitionComponent implements OnInit {
  @ViewChild('paginator') paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  form: FormGroup;
  isAdding: boolean = false;

  agentTaskConfigs = signal<AgentTaskConfig[]>([]);
  dataSource: MatTableDataSource<AgentTaskConfig> = new MatTableDataSource([]);
  isLoaded: boolean = false;

  displayedColumns: string[] = COLUMNS_SCHEMA.map((col) => col.label);
  columnsSchema: any = COLUMNS_SCHEMA;

  static pageSize: number = 10;
  selectedBySubmit: boolean = false;

  constructor(private alertService: AlertService, private accountService: AccountService, private fb: FormBuilder) {

  }
  ngOnInit(): void {
    this.form = this.fb.group({
      agentTaskName: ['', [Validators.required]],
      isGroupBox: [false, [Validators.required]]
    });
    this.f['agentTaskName'].valueChanges.subscribe({
      next: value => {
        console.log(value);
        if (value.length <= 0)
          this.f['isGroupBox'].disable();
        else
          this.f['isGroupBox'].enable();
      },
      complete: () => {
        console.log("Finished");
      },
      error: (error) => {
        console.log(error);
      }
    });
    this.accountService.getAllAgentTaskConfigs().subscribe({
      next: (tasks) => {
        this.isLoaded = false;
        this.alertService.clear();

        this.agentTaskConfigs.set(tasks);
        this.dataSource = new MatTableDataSource(this.agentTaskConfigs());
        this.dataSource.paginator = this.paginator;
        this.dataSource.sort = this.sort;
      },
      complete: () => {
        this.isLoaded = true;
        // if (AgentTaskDefinitionComponent.HighlightRow != -1) {
        //   for (let index = 0; index < this.agentTaskConfigs().length; index++) {
        //     const task = this.agentTaskConfigs()[index];
        //     if (index == AgentTaskDefinitionComponent.HighlightRow) {
        //       if (!task.isDeleting) {
        //         this.form.get('agentTaskName').setValue(task.agentTaskStr);
        //         this.form.get('isGroupBox').setValue(task.isGroup);
        //       }
        //     }
        //   }
        // }
        if (this.f['agentTaskName'].value.length <= 0) {
          this.f['isGroupBox'].disable();
        }
      },
      error: (error) => {
        this.isLoaded = true;
        this.alertService.error(error);
      }
    });
  }

  onAddUpdateTask() {
    var taskName = this.form.get('agentTaskName').value;
    var isGroup = this.form.get('isGroupBox').value;


    var element2Update: AgentTaskConfig = null;
    var existing = this.agentTaskConfigs().filter(function (item) {
      return item.agentTaskStr == taskName;
    });
    if (existing.length <= 0) {
      // New item to add, create one
      element2Update = {
        agentTaskStr: taskName,
        isGroup: isGroup,
        highlighted: true,
        isDeleting: false
      };
    } else {
      // Existing item
      console.assert(existing.length == 1, "Duplicate elements found");
      element2Update = existing[0];
      element2Update.isGroup = isGroup;
      element2Update.highlighted = true;
      element2Update.isDeleting = false;
    }
    // Reset alerts on submit
    this.alertService.clear();

    this.accountService.updateAgentTaskConfig(element2Update.agentTaskStr, element2Update).subscribe({
      next: (value) => {
        if (existing.length <= 0) {
          console.assert(element2Update != null, "AgentTaskConfig  is null");
          this.agentTaskConfigs().push(element2Update);
        }
        this.dataSource.data = this.agentTaskConfigs();
      },
      complete: () => {
        console.assert(element2Update != null, "AgentTaskConfig  is null");
        this.selectedBySubmit = true;
        this.selectRow(element2Update);
        this.alertService.info("Data Saved");
      },
      error: (error) => {
        this.alertService.error(error);
      }
    });
  }
  onDeleteAgentTaskConfig($event: MouseEvent, task: AgentTaskConfig) {
    // Reset alerts on submit
    this.alertService.clear();

    this.accountService.deleteAgentTaskConfig(task.agentTaskStr).subscribe({
      next: (value) => {
        this.agentTaskConfigs().splice(this.agentTaskConfigs().findIndex(t => t.agentTaskStr == task.agentTaskStr), 1);
        this.dataSource.data = this.agentTaskConfigs();
      },
      complete: () => {
        this.alertService.info("Data Saved");
      },
      error: (error) => {
        this.alertService.error(error);
      }
    });
  }
  onChangePageProperties(event: any) {
    AgentTaskDefinitionComponent.pageSize = event.pageSize;
  }
  sortData($event: Sort) {
    if ($event.active == this.displayedColumns[0]) {
      this.agentTaskConfigs().sort((a, b) => {
        if ($event.direction == 'asc' as SortDirection) {
          return a.agentTaskStr.localeCompare(b.agentTaskStr);
        } else {
          return b.agentTaskStr.localeCompare(a.agentTaskStr);
        }
      });
    } else if ($event.active == this.displayedColumns[1]) {
      this.agentTaskConfigs().sort((a, b) => {
        if ($event.direction == 'asc' as SortDirection) {
          return Number(a.isGroup) - Number(b.isGroup);
        } else {
          return Number(b.isGroup) - Number(a.isGroup);;
        }
      });
    }
  }
  onRowSelected(slot: AgentTaskConfig, tr: any, index: number, event: any) {
    if (event.ctrlKey) {
      if (slot.highlighted) {
        slot.highlighted = false;
        return;
      }
    }
    this.selectRow(slot);
  }
  private selectRow(slot: AgentTaskConfig) {
    for (let index = 0; index < this.agentTaskConfigs().length; index++) {
      const element = this.agentTaskConfigs()[index];
      if (element.highlighted)
        element.highlighted = false;

      if (this.isSameTaskConfig(slot, element)) {
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
      this.form.get('agentTaskName').setValue(slot.agentTaskStr);
      this.form.get('isGroupBox').setValue(slot.isGroup);
    }
  }
  isSameTaskConfig(s1: AgentTaskConfig, s2: AgentTaskConfig) : boolean{
    console.assert(s1 != null && s2 != null, "One or both of the time slots is null");
    return s1.agentTaskStr == s2.agentTaskStr && s1.isGroup == s2.isGroup;
  }

  get pageSize() {
    return AgentTaskDefinitionComponent.pageSize;
  }
  // convenience getter for easy access to form fields
  get f() { return this.form.controls; }
}
