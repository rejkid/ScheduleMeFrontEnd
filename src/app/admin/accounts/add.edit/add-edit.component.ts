﻿import { AfterViewInit, Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { first } from 'rxjs/operators';
import { MustMatch } from 'src/app/_helpers';
import { TimeHandler } from 'src/app/_helpers/time.handler';

import * as moment from 'moment';
import { Account, Role } from 'src/app/_models';
import { UserFunction } from 'src/app/_models/userfunction';
import { AccountService, AlertService } from 'src/app/_services';
import { Constants } from 'src/app/constants';

@Component({ templateUrl: './add-edit.component.html',
styleUrls: ['./add-edit.component.less'], })
export class AddEditComponent implements OnInit, AfterViewInit {

    DATE_FORMAT = Constants.dateFormat;

    form: FormGroup;
    id: string;// =  this.route.snapshot.params['id'];;
    isAddMode: boolean;
    loading = false;
    submitted = false;
    roles: string[] = [];
    account: Account;
    userFunctions: UserFunction[] = [];
    isLoaded: boolean = false;
    countryCodes: number[] = [];

    constructor(
        private formBuilder: FormBuilder,
        private route: ActivatedRoute,
        private router: Router,
        private accountService: AccountService,
        private alertService: AlertService
    ) {
        this.roles = Object.values(Role).filter(value => typeof value === 'string') as string[]

    }
    ngAfterViewInit(): void {

    }

    ngOnInit() {
        this.id = this.route.snapshot.params['id'];
        this.isAddMode = !this.id;


        this.form = this.formBuilder.group({
            title: ['', Validators.required],
            firstName: ['', Validators.required],
            lastName: ['', Validators.required],
            email: ['', [Validators.required, Validators.email]],
            role: [this.roles[0], Validators.required],
            dob: ['', [Validators.required/* , TimeHandler.dateValidator */]],
            password: ['', [Validators.minLength(6), this.isAddMode ? Validators.required : Validators.nullValidator]],
            scheduleGroup: ['',[Validators.nullValidator]],
            confirmPassword: [''],
            phoneNumber: ["", []],
        }, {
            validator: [MustMatch('password', 'confirmPassword')]
        });

        if (!this.isAddMode) {
            this.accountService.getById(this.id)
                .pipe(first())
                .subscribe({
                    next: (x) => {
                        // Edit mode
                        this.account = x; // initial account
                        this.form.patchValue(x);
                        this.form.get('dob').setValue(moment(this.account.dob).format(Constants.dateFormat));
                    },
                    error: error => {
                        console.error(error);
                    }
                });
        } else {
        }
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

        if (this.isAddMode) {
            this.createAccount();
        } else {
            this.updateAccount();
        }
    }

    private createAccount() {

        var account : Account = new Account();
        account.title = this.f['title'].value; 
        account.firstName = this.f['firstName'].value;
        account.lastName = this.f['lastName'].value;
        account.email = this.f['email'].value;
        account.role = this.f['role'].value;
        account.dob = moment(this.f['dob'].value).format(Constants.dateFormat);
        account.password = this.f['password'].value; 
        account.confirmPassword = this.f['confirmPassword'].value; 
        account.phoneNumber = this.f['phoneNumber'].value;

        this.accountService.create(account)
            .pipe(first())
            .subscribe({
                next: () => {
                    this.alertService.success('Account created successfully', { keepAfterRouteChange: true });
                    this.router.navigate(['../'], { relativeTo: this.route });
                },
                error: error => {
                    this.alertService.error(error);
                    this.loading = false;
                }
            });
    }

    private updateAccount() {

        var account : Account = new Account();
        
        account.title = this.f['title'].value; 
        account.firstName = this.f['firstName'].value;
        account.lastName = this.f['lastName'].value;
        account.email = this.f['email'].value;
        account.role = this.f['role'].value;
        account.dob = moment(this.f['dob'].value).format(Constants.dateFormat);
        account.password = this.f['password'].value; 
        account.confirmPassword = this.f['confirmPassword'].value; 
        account.phoneNumber = this.f['phoneNumber'].value;

        this.accountService.update(this.id, account)
            .pipe(first())
            .subscribe({
                next: (value) => {
                    this.alertService.success('Update successful', { keepAfterRouteChange: true });
                    this.router.navigate(['../../'], { relativeTo: this.route });
                    this.loading = false;
                },
                error: error => {
                    this.alertService.error(error);
                    this.loading = false;
                }
            });
    }
}