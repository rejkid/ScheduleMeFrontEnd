import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { BehaviorSubject, Observable } from 'rxjs';
import { finalize, map } from 'rxjs/operators';

//import { environment } from '@environments/environment';
import { Account, Role } from '../_models';
//import { JwtHelperService } from '@auth0/angular-jwt';
import { CookieService } from 'ngx-cookie-service';

import { environment } from 'src/environments/environment';
import { AgentTaskConfig } from '../_models/agenttaskconfig';
import { Schedule } from '../_models/schedule';
import { ScheduleDateTimes } from '../_models/scheduledatetimes';
import { SchedulePoolElement } from '../_models/schedulepoolelement';
import { SchedulePoolElements } from '../_models/schedulepoolelements';
import { Task } from "../_models/task";
import { DateFunctionTeams } from '../_models/teams';
import { TimeSlotsTasksDTO } from '../_models/timeslotstasksDTO';


const baseUrl = `${environment.apiUrl}/accounts`;

@Injectable({ providedIn: 'root' })
export class AccountService {

    private accountSubject: BehaviorSubject<Account>;
    public account: Observable<Account>;

    constructor(
        private router: Router,
        private http: HttpClient,
        private cookieService: CookieService
    ) {
        this.accountSubject = new BehaviorSubject<Account>(null);
        this.account = this.accountSubject.asObservable();
    }

    public get accountValue(): Account {
        return this.accountSubject.value;
    }

    login(email: string, password: string, dob: string) {
        return this.http.post<Account>(`${baseUrl}/authenticate`, { email, password, dob }, { withCredentials: true })
            .pipe(map(account => {
                //const body = account.body;
                var cookieValue = this.cookieService.getAll(); // Just for experiment JD
                this.accountSubject.next(account);
                this.startRefreshTokenTimer();
                return account;
            }));
    }

    /* An alternate way*/
    /*     login(email: string, password: string, dob: string) {
            return this.http.post<Account>(`${baseUrl}/authenticate`, { email, password, dob }, { withCredentials: true })
                .pipe(tap(account => {
                    this.accountSubject.next(account);
                    this.startRefreshTokenTimer();
                    return account;
                }))
        }
     */
    logout() {
        this.http.post<any>(`${baseUrl}/revoke-token`, {}, { withCredentials: true }).subscribe();
        this.stopRefreshTokenTimer();
        this.accountSubject.next(null);
        this.router.navigate(['/account/login']);
    }

    refreshToken() {
        return this.http.post<any>(`${baseUrl}/refresh-token`, {/* headers: headers */ }, { withCredentials: true })
            .pipe(map((account) => {
                this.accountSubject.next(account);
                const cookie = document.cookie;
                this.startRefreshTokenTimer();
                return account;
            }));
    }

    register(account: Account) {
        return this.http.post(`${baseUrl}/register`, account);
    }

    verifyEmail(token: string, dob: string) {
        return this.http.post(`${baseUrl}/verify-email`, { token, dob });
    }

    forgotPassword(email: string, dob: string) {
        return this.http.post(`${baseUrl}/forgot-password`, { email, dob });
    }

    validateResetToken(token: string, dob: string) {
        return this.http.post(`${baseUrl}/validate-reset-token`, { token, dob });
    }

    resetPassword(token: string, password: string, confirmPassword: string) {
        return this.http.post(`${baseUrl}/reset-password`, { token, password, confirmPassword });
    }

    getAll() {
        return this.http.get<Account[]>(baseUrl);
    }

    getById(id: string) {
        return this.http.get<Account>(`${baseUrl}/${id}`);
    }

    getAllDates() {
        return this.http.get<ScheduleDateTimes>(`${baseUrl}/all-dates`);
    }
    getTeamsByFunctionForDate(dateStr: any) {
        return this.http.get<DateFunctionTeams>(`${baseUrl}/teams-for-date/${dateStr}`);
    }
    
    generateSchedules() {
        return this.http.post<Boolean>(`${baseUrl}/generate-schedules`, "");
    }

    getTimeSlotsTasks() {
        return this.http.get<TimeSlotsTasksDTO[]>(`${baseUrl}/timeslots-tasks`);
    }
    setTimeSlotsTasks(tasks : TimeSlotsTasksDTO) {
        return this.http.put(`${baseUrl}/timeslots-tasks`, tasks);
    }
    deleteTimeSlotsTasks(tasks : TimeSlotsTasksDTO) {
        return this.http.post(`${baseUrl}/timeslots-tasks`, tasks);
    }

    downloadSchedulesFile() {
        const headers = new HttpHeaders({
            'Content-Type': 'application/json',
        });
        return this.http.get<Blob>(`${baseUrl}/download-schedules-file`, {
            headers: headers, responseType:
                'blob' as 'json'
        })
    }
    getAvailablePoolElementsForAccount(id: any) {
        return this.http.get<SchedulePoolElements>(`${baseUrl}/available_pool-elements-for-account/${id}`);
    }
    GetAllAvailablePoolElements() {
        return this.http.get<SchedulePoolElements>(`${baseUrl}/all-available-pool-elements`);
    }
    addSchedule(id: any, schedule: any) {
        return this.http.put<Account>(`${baseUrl}/add-schedule/${id}`, schedule);
    }
    updateSchedule(id: any, schedule: Schedule) {
        return this.http.post(`${baseUrl}/update-schedule/${id}`, schedule)
            .pipe(map((account: any) => {
                // update the current account if it was updated
                if (account.id === this.accountValue.id) {
                    // publish updated account to subscribers
                    account = { ...this.accountValue, ...account };
                    this.accountSubject.next(account);
                }
                return account;
            }));
    }

    deleteSchedule(id: any, schedule: any) {
        return this.http.post<Account>(`${baseUrl}/delete-schedule/${id}`, schedule);
    }

    deleteSchedules4Date(date: string) {
        return this.http.delete(`${baseUrl}/delete-schedules_4_date/${date}`);
    }

    getSchedules4Date(dateStr: string) {
        return this.http.get<Account[]>(`${baseUrl}/get-schedule/${dateStr}`);
    }

    addFunction(id: any, userFunction: Task) {
        return this.http.put<Account>(`${baseUrl}/add-function/${id}`, userFunction);
    }

    deleteFunction(id: any, userFunction: Task) {
        return this.http.post<Account>(`${baseUrl}/delete-function/${id}`, userFunction);
    }

    deletePoolElement(id: string, email: string, userFunction: string) {
        return this.http.post<SchedulePoolElement>(`${baseUrl}/remove-pool-element/${id}/${email}/${userFunction}`, "");
    }

    moveSchedule2Pool(id: any, schedule: any) {
        return this.http.post<Account>(`${baseUrl}/move-schedule-to-pool/${id}`, schedule);
    }

    getScheduleFromPool(id: any, schedule: any) {
        return this.http.post<Account>(`${baseUrl}/get-schedule-from-pool/${id}`, schedule);
    }

    create(params: any) {
        return this.http.post(baseUrl, params);
    }

    update(id: any, params: any) {
        return this.http.put(`${baseUrl}/${id}`, params)
            .pipe(map((account: any) => {
                // update the current account if it was updated
                if (account.id === this.accountValue.id) {
                    // publish updated account to subscribers
                    account = { ...this.accountValue, ...account };
                    this.accountSubject.next(account);
                }
                return account;
            }));
    }
    delete(id: string) {
        return this.http.delete(`${baseUrl}/${id}`)
            .pipe(finalize(() => {
                // auto logout if the logged in account was deleted
                if (id === this.accountValue.id)
                    this.logout();
            }));
    }

    uploadAccountsFile(formData: FormData) {
        return this.http.post<Account[]>(`${baseUrl}/upload-accounts`, formData, {
            reportProgress: true,
            observe: 'events'
        });
    }
    uploadTimeSlotsFile(formData: FormData) {
        return this.http.post<Account[]>(`${baseUrl}/upload-timeslots`, formData, {
            reportProgress: true,
            observe: 'events'
        });
    }
    deleteAllUserAccounts() {
        return this.http.delete(`${baseUrl}/delete-all-user-accounts`);
    }
    getAutoEmail(): any {
        return this.http.get(`${baseUrl}/auto-email`);
    }
    setAutoEmail(autoEmail: Boolean) {
        return this.http.put<Boolean>(`${baseUrl}/auto-email`, autoEmail);
    }

    getAllAgentTaskConfigs() {
        return this.http.get<AgentTaskConfig[]>(`${baseUrl}/get-all-agent-task-configs`);
    }
    updateAgentTaskConfig(id: string, config : AgentTaskConfig) {
        return this.http.put(`${baseUrl}/create-agent-task-config/${id}`, config);
    }
    deleteAgentTaskConfig(id: string) {
        return this.http.delete(`${baseUrl}/delete-agent-task-config/${id}`);
    }

    isAdmin() {
        return this.accountValue && this.accountValue.role === Role.Admin;
    }
    // helper methods

    private refreshTokenTimeout: string | number | NodeJS.Timeout | undefined;

    private startRefreshTokenTimer() {
        // HEADER:ALGORITHM & TOKEN TYPE

        // parse json object from base64 encoded jwt token
        // var buf = Buffer.from(this.accountValue.jwtToken.split('.')[0], 'base64');
        // var header = JSON.parse(buf.toString('base64'));
        var header = JSON.parse(atob(this.accountValue.jwtToken.split('.')[0]));


        // PAYLOAD:DATA
        // parse json object from base64 encoded jwt token
        // var buf = Buffer.from(this.accountValue.jwtToken.split('.')[1], 'base64');
        // const payload = JSON.parse(buf.toString('base64'));
        const payload = JSON.parse(atob(this.accountValue.jwtToken.split('.')[1]));

        // VERIFY SIGNATURE
        // parse json object from base64 encoded jwt token
        const signature = this.accountValue.jwtToken.split('.')[2];


        // VERIFY SIGNATURE
        // parse json object from base64 encoded jwt token
        //const jwtSignature = JSON.parse(atob(this.accountValue.jwtToken.split('.')[2]));


        // parse json object from base64 encoded jwt token
        const jwtToken = JSON.parse(atob(this.accountValue.jwtToken.split('.')[1]));

        // set a timeout to refresh the token a minute before it expires
        const expires = new Date(jwtToken.exp * 1000);
        const timeout = expires.getTime() - Date.now() - (60 * 1000);
        this.refreshTokenTimeout = setTimeout(() => this.refreshToken().subscribe(), timeout);
    }

    // private string hmacSha256(string data, string secret) {
    //     try {

    //         byte[] hash = secret.getBytes(StandardCharsets.UTF_8);
    //         Mac sha256Hmac = Mac.getInstance("HmacSHA256");
    //         SecretKeySpec secretKey = new SecretKeySpec(hash, "HmacSHA256");
    //         sha256Hmac.init(secretKey);

    //         byte[] signedBytes = sha256Hmac.doFinal(data.getBytes(StandardCharsets.UTF_8));
    //         return encode(signedBytes);
    //     } catch (NoSuchAlgorithmException | InvalidKeyException ex) {
    //         Logger.getLogger(JWebToken.class.getName()).log(Level.SEVERE, ex.getMessage(), ex);
    //         return null;
    //     }
    // }
    private stopRefreshTokenTimer() {
        clearTimeout(this.refreshTokenTimeout);
    }

}