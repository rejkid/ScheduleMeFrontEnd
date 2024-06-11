import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { UploadTimeslotsTasksComponent } from './upload-timeslots-tasks.component';

const routes: Routes = [
  { path: 'import',  component: UploadTimeslotsTasksComponent  },
  
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class UploadTimeslotsTasksRoutingModule { }
