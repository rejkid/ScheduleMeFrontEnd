import { Role } from './role';
import { Schedule } from './schedule';
import { AgentTask } from './userfunction';

export class Account {
    id: string;
    title: string;
    firstName: string;
    lastName: string;
    email: string;
    phoneNumber:string;
    role: Role;
    schedules: Schedule[] = [];
    userFunctions: AgentTask[] = [];
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