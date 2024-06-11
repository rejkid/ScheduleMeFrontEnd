
import { Role } from './role';
import { Schedule } from './schedule';

export class User {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    function: string;
    scheduleGroup : string;
    date: string;
    dob: string;
    isDeleting : boolean;
    highlighted: boolean;

}