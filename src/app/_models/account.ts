import { Role } from './role';
import { Schedule } from './schedule';
import { Task } from './task';

export class Account {
    id: string;
    title: string;
    firstName: string;
    lastName: string;
    email: string;
    phoneNumber:string;
    role: Role;
    schedules: Schedule[] = [];
    userFunctions: Task[] = [];
    jwtToken?: string;
    dob: string;
    availability: boolean;
    password: string;
    confirmPassword : string
    isVerified : boolean
    isDeleting : boolean
    highlighted: boolean
    acceptTerms : boolean
    scheduleGroup : string
}