import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { AutoGeneratorComponent } from './auto-generator.component';
import { AutoGeneratorRoutingModule } from './auto-generator-routing.module';



@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    RouterModule,
    AutoGeneratorRoutingModule
  ],
  declarations: [
    AutoGeneratorComponent
  ],
  exports:[
    AutoGeneratorComponent,
  ],
  
})
export class AutoGeneratorModule { }
