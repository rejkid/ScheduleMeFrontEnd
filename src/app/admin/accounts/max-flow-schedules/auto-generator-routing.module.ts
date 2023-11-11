import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { AutoGeneratorComponent } from './auto-generator.component';

const routes: Routes = [
  { path: 'generate',  component: AutoGeneratorComponent  },
  
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class AutoGeneratorRoutingModule { }
