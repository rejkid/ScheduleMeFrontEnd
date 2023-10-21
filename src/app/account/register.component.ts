import { Component, OnInit } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { first } from 'rxjs/operators';

import { AccountService, AlertService } from '../_services';
import { MustMatch } from '../_helpers';
import { TimeHandler } from '../_helpers/time.handler';
import * as moment from 'moment';
import { environment } from 'src/environments/environment';
import { DatePipe } from '@angular/common';
import { Account } from '../_models';
import { Constants } from '../constants';

@Component({ templateUrl: 'register.component.html' })
export class RegisterComponent implements OnInit {
    DATE_FORMAT = Constants.dateFormat;
    
    form: FormGroup;
    loading = false;
    submitted = false;

    constructor(
        private formBuilder: FormBuilder,
        private route: ActivatedRoute,
        private router: Router,
        private accountService: AccountService,
        private alertService: AlertService,
        private datePipe: DatePipe
    ) { }

    ngOnInit() {
        this.form = this.formBuilder.group({
            title: ['', Validators.required],
            firstName: ['', Validators.required],
            lastName: ['', Validators.required],
            email: ['', [Validators.required, Validators.email]],
            dob: ['', [Validators.required]],
            password: ['', [Validators.required, Validators.minLength(6)]],
            confirmPassword: ['', Validators.required],
            acceptTerms: [false, Validators.requiredTrue]
        }, {
            validator: MustMatch('password', 'confirmPassword')
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

        var account : Account = new Account();
        
        account.title = this.f['title'].value; 
        account.firstName = this.f['firstName'].value;
        account.lastName = this.f['lastName'].value;
        account.email = this.f['email'].value;
        account.dob = this.datePipe.transform(this.f['dob'].value, Constants.pipeDateFormat);
        account.password = this.f['password'].value; 
        account.confirmPassword = this.f['confirmPassword'].value; 
        account.acceptTerms = this.f['acceptTerms'].value;
        
        this.accountService.register(account)
            .pipe(first())
            .subscribe({
                next: () => {
                    this.alertService.success('Registration successful, please check your email for verification instructions', { keepAfterRouteChange: true });
                    this.router.navigate(['../login'], { relativeTo: this.route });
                },
                error: error => {
                    this.alertService.error(error);
                    this.loading = false;
                }
            });
    }
}