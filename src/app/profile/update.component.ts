import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { first } from 'rxjs/operators';

import { DatePipe } from '@angular/common';
import * as moment from 'moment';
import { MustMatch } from '../_helpers';
import { Schedule } from '../_models/schedule';
import { AccountService, AlertService } from '../_services';
import { Constants } from '../constants';

@Component({ templateUrl: 'update.component.html',
styleUrls: ['./update.component.less'], })
export class UpdateComponent implements OnInit {
    DATE_FORMAT = Constants.dateFormat;
    
    account = this.accountService.accountValue;
    form: FormGroup;
    loading = false;
    submitted = false;
    deleting = false;
    schedules: Schedule[] = [];
    id: string = this.account.id;
    countryCodes: number[] = [];

    constructor(
        private formBuilder: FormBuilder,
        private route: ActivatedRoute,
        private router: Router,
        private accountService: AccountService,
        private alertService: AlertService,
        private datePipe: DatePipe
    ) { }

    ngOnInit() {
        var test = moment(this.account.dob, Constants.dateFormat).toDate();
        this.form = this.formBuilder.group({
            title: [this.account.title, Validators.required],
            firstName: [this.account.firstName, Validators.required],
            lastName: [this.account.lastName, Validators.required],
            email: [this.account.email, [Validators.required, Validators.email]],
            dob: [moment(this.account.dob, Constants.dateFormat).toDate(), Validators.required],
            password: ['',  [Validators.minLength(6)]],
            confirmPassword: ['',  [Validators.minLength(6)]],
            phoneNumber: [this.account.phoneNumber ], // Phone number is optional

        }, {
            validator: [MustMatch('password', 'confirmPassword')]
        });
    }

    // convenience getter for easy access to form fields
    get f() { return this.form.controls; }

    onSubmit() {
        this.submitted = true;

        // reset alerts on submit
        this.alertService.clear();

        // stop here if form is invalid
        if (this.form.invalid) {
            return;
        }


        this.loading = true;

        // Update account from this controls
        this.account.title = this.form.controls['title'].value;
        this.account.firstName = this.form.controls['firstName'].value;
        this.account.lastName = this.form.controls['lastName'].value;
        this.account.email = this.form.controls['email'].value;

        this.account.phoneNumber = this.f['phoneNumber'].value;

        this.account.password = this.form.controls['password'].value;
        this.account.confirmPassword = this.form.controls['confirmPassword'].value;
        this.account.dob = this.datePipe.transform(this.f['dob'].value, Constants.pipeDateFormat); 
        this.account.schedules = this.schedules;


        this.accountService.update(this.account.id, this.account)
            .pipe(first())
            .subscribe({
                next: () => {
                    this.alertService.success('Update successful', { keepAfterRouteChange: true });
                    this.loading = false;
                    //this.router.navigate(['../'], { relativeTo: this.route });
                },
                error: error => {
                    this.alertService.error(error);
                    this.loading = false;
                }
            });
    }

    onDelete() {
        if (confirm('Are you sure?')) {
            this.deleting = true;
            this.accountService.delete(this.account.id)
                .pipe(first())
                .subscribe(() => {
                    this.alertService.success('Account deleted successfully', { keepAfterRouteChange: true });
                });
        }
    }
}