import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AgentTaskDefinitionComponent } from './agent-task-definition.component';

describe('AgentTaskDefinitionComponent', () => {
  let component: AgentTaskDefinitionComponent;
  let fixture: ComponentFixture<AgentTaskDefinitionComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [AgentTaskDefinitionComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AgentTaskDefinitionComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
