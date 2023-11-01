import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { OrderByDatePipe } from './order-by-date.pipe';



@NgModule({
  declarations: [
    OrderByDatePipe
  ],
  exports: [
    OrderByDatePipe
  ],
  imports: [
    CommonModule
  ]
})
export class ApplicationPipesModuleModule { }
