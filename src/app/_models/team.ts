import { Account } from "./account";
import { Role } from "./role";
import { User } from "./user";
import { Users } from "./users";


export class Team {
    id: string;
    function : string;
    string: Date;
    users: User[] = [];
}