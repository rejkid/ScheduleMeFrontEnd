import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { UploadTimeslotsTasksComponent } from './upload-timeslots-tasks.component';
import { UploadTimeslotsTasksRoutingModule } from './upload-timeslots-tasks-routing.module';



@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    RouterModule,
    UploadTimeslotsTasksRoutingModule
  ],
  declarations: [
    UploadTimeslotsTasksComponent
  ],
  exports:[
    UploadTimeslotsTasksComponent,
  ],
  
})
export class UploadTimeslotsTasksModule { }
