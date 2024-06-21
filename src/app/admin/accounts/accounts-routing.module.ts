import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

import { AddEditComponent } from './add.edit/add-edit.component';
import { FunctionComponent } from './function.component';
import { ListComponent } from './list.component';
import { MainSchedulerComponent } from './main-scheduler/main-scheduler.component';
import { ScheduleAllocatorComponent } from './schedule.allocator.component';
import { UploadAccountsComponent } from './upload-accounts/upload-accounts.component';
import { TimeSlotTasksEditorComponent } from './time-slot-tasks-editor/time-slot-tasks-editor.component';
import { AgentTaskDefinitionComponent } from './agent-task-definition/agent-task-definition.component';

const routes: Routes = [
    { path: '', component: ListComponent },
    { path: 'add-edit', loadChildren: () => import('./add.edit/add.edit.module').then(x => x.AddEditModule)/* component: AddEditComponent */ },
    { path: 'import-accounts', component: UploadAccountsComponent},
    { path: 'import-timeslots-tasks', loadChildren: () => import('./upload-timeslots-tasks/upload-timeslots-tasks.module').then(x => x.UploadTimeslotsTasksModule)},
    { path: 'function/:id', component: FunctionComponent },
    { path: 'schedule/:id', component: ScheduleAllocatorComponent },
    { path: 'schedule-modify', component: MainSchedulerComponent},
    { path: 'timeslotstasks-edit', component: TimeSlotTasksEditorComponent},  
    { path: 'agenttaskdefinition-edit', component: AgentTaskDefinitionComponent},  
];

@NgModule({
    imports: [RouterModule.forChild(routes)],
    exports: [RouterModule]
})
export class AccountsRoutingModule { }