﻿import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { first } from 'rxjs/operators';

import * as moment from 'moment';
import { CustomValidators } from '../_helpers/custom-validators';
import { TimeHandler } from '../_helpers/time.handler';
import { AccountService, AlertService } from '../_services';
import { Constants } from '../constants';

@Component(
    {
        templateUrl: 'login.component.html',
        styleUrls: ['login.component.less'],
    })
export class LoginComponent implements OnInit {
    DATE_FORMAT = Constants.dateFormat;

    form: FormGroup;
    loading = false;
    submitted = false;

    constructor(
        private formBuilder: FormBuilder,
        private route: ActivatedRoute,
        private router: Router,
        private accountService: AccountService,
        private alertService: AlertService
    ) { }

    ngOnInit() {
        this.form = this.formBuilder.group({
            email: ['', [Validators.required, Validators.email]],
            password: ['', [Validators.required, CustomValidators.createPasswordStrengthValidator()]],
            dob: ['', [Validators.required , TimeHandler.dateValidator]],
        });
        this.form.get('dob').setValue(moment(new Date()).format(Constants.dateFormat));
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
        this.accountService.login(this.f['email'].value, this.f['password'].value, moment(this.f['dob'].value).format(Constants.dateFormat))
            .pipe(first())
            .subscribe({
                next: () => {
                    // get return url from query parameters or default to home page
                    const returnUrl = this.route.snapshot.queryParams['returnUrl'] || '/';
                    this.router.navigateByUrl(returnUrl);
                },
                error: error => {
                    this.alertService.error(error);
                    this.loading = false;
                }
            });
    }
}