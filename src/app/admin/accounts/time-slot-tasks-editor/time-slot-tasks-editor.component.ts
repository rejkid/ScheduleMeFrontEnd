import { Component } from '@angular/core';

@Component({
  selector: 'app-time-slot-tasks-editor',
  standalone: true,
  imports: [],
  templateUrl: './time-slot-tasks-editor.component.html',
  styleUrl: './time-slot-tasks-editor.component.less'
})

const COLUMNS_SCHEMA = [
  {
    key: "date",
    type: "text",
    label: "Date"
  },
  {
    key: "secondtaskName",
    type: "text",
    label: "Task"
  },
]


export class TimeSlotTasksEditorComponent {
  displayedColumns: string[] = COLUMNS_SCHEMA.map((col) => col.key);
  columnsSchema: any = COLUMNS_SCHEMA;

}
