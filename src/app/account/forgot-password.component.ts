import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import * as moment from 'moment';
import { finalize, first } from 'rxjs/operators';
import { TimeHandler } from '../_helpers/time.handler';
import { AccountService, AlertService } from '../_services';
import { Constants } from '../constants';


@Component({ templateUrl: 'forgot-password.component.html' })
export class ForgotPasswordComponent implements OnInit {
    DATE_FORMAT = Constants.dateFormat;

    form: FormGroup;
    loading = false;
    submitted = false;

    constructor(
        private formBuilder: FormBuilder,
        private accountService: AccountService,
        private alertService: AlertService
    ) { }

    ngOnInit() {
        this.form = this.formBuilder.group({
            email: ['', [Validators.required, Validators.email]],
            dob: ['', [Validators.required, TimeHandler.dateValidator]],
        });
        this.form.get('dob').setValue(new Date());
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
        this.alertService.clear();
        this.accountService.forgotPassword(this.f['email'].value, moment(this.f['dob'].value).format(Constants.dateFormat))
            .pipe(first())
            .pipe(finalize(() => this.loading = false))
            .subscribe({
                next: () => this.alertService.success('Please check your email for password reset instructions'),
                error: error => this.alertService.error(error)
            });
    }
}