import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

import { AddEditComponent } from './add.edit/add-edit.component';
import { FunctionComponent } from './function.component';
import { ListComponent } from './list.component';
import { MainSchedulerComponent } from './main-scheduler/main-scheduler.component';
import { AutoGeneratorComponent } from './max-flow-schedules/auto-generator.component';
import { ScheduleAllocatorComponent } from './schedule.allocator.component';
import { UploadAccountsComponent } from './upload-accounts/upload-accounts.component';

const routes: Routes = [
    { path: '', component: ListComponent },
    { path: 'add-edit', loadChildren: () => import('./add.edit/add.edit.module').then(x => x.AddEditModule)/* component: AddEditComponent */ },
    { path: 'upload', component: UploadAccountsComponent},
    { path: 'auto-generate-schedules', loadChildren: () => import('./max-flow-schedules/auto-generator.module').then(x => x.AutoGeneratorModule)/* component: AutoGeneratorComponent */},
    { path: 'function/:id', component: FunctionComponent },
    { path: 'schedule/:id', component: ScheduleAllocatorComponent },
    { path: 'schedule-generate', component: MainSchedulerComponent},
    
];

@NgModule({
    imports: [RouterModule.forChild(routes)],
    exports: [RouterModule]
})
export class AccountsRoutingModule { }