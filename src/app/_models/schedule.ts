export class Schedule {
    accountId: string;
    date: string;
    newDate: string;
    required: boolean;
    userAvailability: boolean;

    userFunction : string;
    scheduleGroup : string;
    newUserFunction : string;
    deleting : boolean;
    hovered?: boolean;
    highlighted?: boolean;
}