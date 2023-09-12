import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { ListComponent } from './list.component';
import { AddEditComponent } from './add-edit.component';
import { FunctionComponent } from './function.component';
import { ScheduleAllocatorComponent } from './schedule.allocator.component';
import { UploadAccountsComponent } from './upload-accounts/upload-accounts.component';

const routes: Routes = [
    { path: '', component: ListComponent },
    { path: 'add', component: AddEditComponent },
    { path: 'upload', component: UploadAccountsComponent},
    { path: 'edit/:id', component: AddEditComponent },
    { path: 'function/:id', component: FunctionComponent },
    { path: 'schedule/:id', component: ScheduleAllocatorComponent },
    
];

@NgModule({
    imports: [RouterModule.forChild(routes)],
    exports: [RouterModule]
})
export class AccountsRoutingModule { }