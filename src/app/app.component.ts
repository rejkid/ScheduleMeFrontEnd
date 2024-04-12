import { Component, Inject } from '@angular/core';

import { AccountService } from './_services';
import { Account, Role } from './_models';
import { ColorConfig, TestService } from './_services/test.service';
import { USERS_SERVICE_CONFIG_TOKEN, USERS_SERVICE_TOKEN } from './app.module';

@Component({ selector: 'app', templateUrl: 'app.component.html' })
export class AppComponent {
    isLoaded: boolean = false;
    Role = Role;
    account: Account = null;

    constructor(private accountService: AccountService,
        /* @Inject(USERS_SERVICE_TOKEN) */ private usersService: TestService) {
        this.accountService.account.subscribe(x => {
            this.account = x
            this.isLoaded = true;
        });

        // TODO JD TEST
        console.log('usersService', usersService)
        usersService.getProductInfo();
        // TODO JD TEST END

    }

    logout() {
        this.accountService.logout();
    }
}