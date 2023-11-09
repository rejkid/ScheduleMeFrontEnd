import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { AutoGeneratorComponent } from './auto-generator.component';



@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    RouterModule
  ],
  declarations: [
    AutoGeneratorComponent
  ],
  exports:[
    AutoGeneratorComponent,
  ],
  
})
export class AutoGeneratorModule { }
