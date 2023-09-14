﻿import { Component, OnInit } from '@angular/core';
import { first } from 'rxjs/operators';
import { Account, Role } from 'src/app/_models';
import { AccountService, AlertService } from 'src/app/_services';

@Component({ templateUrl: 'list.component.html' })
export class ListComponent implements OnInit {
    accounts: Account[];
    autoEmail: Boolean;
    //alertService: any;

    constructor(private accountService: AccountService,
        private alertService: AlertService) { }

    ngOnInit() {
        this.accountService.getAll()
            .pipe(first())
            .subscribe(accounts => {
                this.accounts = accounts;
                this.accounts.sort(function (a, b) {
                    return a.role.localeCompare(b.role);
                });
            });
        this.accountService.getAutoEmail()
            .pipe(first())
            .subscribe((autoEmail: any) => {
                this.autoEmail = autoEmail;
            });

    }

    deleteAccount(id: string) {
        const account = this.accounts.find(x => x.id === id);
        account.isDeleting = true;
        this.accountService.delete(id)
            .pipe(first())
            .subscribe(() => {
                this.accounts = this.accounts.filter(x => x.id !== id)
            });
    }
    public get RoleAdminEnum() {
        return Role.Admin;
    }
    public onChangeHandler(event: any, tr: any) {
        this.accountService.setAutoEmail(new Boolean(event.target.checked))
            .pipe(first())
            .subscribe({
                next: (autoEmail: any) => {
                    //tr.click();
                    this.autoEmail = autoEmail;
                },
                complete: () => {
                    //this.alertService.info("Done");
                },
                error: error => {
                    this.alertService.error(error);
                }
            });
    }
}