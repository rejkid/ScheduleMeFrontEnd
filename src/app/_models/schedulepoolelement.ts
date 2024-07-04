import { Role } from './role';
import { Schedule } from './schedule';
import { Task } from './task';

export class SchedulePoolElement {
    id: string;
    email: string;
    date: string;
    required: Boolean;
    userAvailability: Boolean;
    userFunction: string;
    deleting : boolean;
    scheduleGroup : string;
}