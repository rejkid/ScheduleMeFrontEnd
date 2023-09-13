import { Injectable } from '@angular/core';
import { HttpRequest, HttpHandler, HttpEvent, HttpInterceptor, HttpContextToken } from '@angular/common/http';
import { EMPTY, Observable, of, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';

import { AccountService } from '../_services';

@Injectable()
export class ErrorInterceptor implements HttpInterceptor {
    constructor(private accountService: AccountService) { }

    intercept(request: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
        return next.handle(request).pipe(catchError(err => {
            if ([401, 403].includes(err.status) && this.accountService.accountValue) {
                // auto logout if 401 or 403 response returned from api
                this.accountService.logout();
            }
            var erro = this.error(err);
            console.error("ErrorInterceptor: " + erro);
            return throwError(() => erro);
        }))
    }
    error(e: any): any {
        if (this.isPrimitive(e)) {
            return e;
        } else if (e.error) {
            // If e.error is an object error
            return this.error(e.error);
        } else if (e.message) {
            return e.message
        } else {
            return "Unknown Error";
        }
    }
    isPrimitive(test : any) {
        return test !== Object(test);
    }
}