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

            // var erro = (err && err.error) || err.statusText;
            var erro = "OK";
            if (err) {
                if (err.error) {
                    if (err.error.error) {
                        erro = err.error.error;
                        /* It's not an error but some JSON parsing problem
                        //return EMPTY;
                        */
                    } else {
                        erro = err.error;
                    } 
                } else {
                    erro = err.message;
                }
            } else {
                erro = "OK"
            }
            console.error("ErrorInterceptor: " + erro);
            return throwError(() => erro);
        }))
    }
}