import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { OrderByDateOrFunctionPipe } from './order-by-date-or-function.pipe';



@NgModule({
  declarations: [
    OrderByDateOrFunctionPipe
  ],
  exports: [
    OrderByDateOrFunctionPipe
  ],
  imports: [
    CommonModule
  ]
})
export class ApplicationPipesModuleModule { }
