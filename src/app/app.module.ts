import { HTTP_INTERCEPTORS, provideHttpClient, withInterceptorsFromDi } from '@angular/common/http';
import { APP_INITIALIZER, InjectionToken, NgModule } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { BrowserModule } from '@angular/platform-browser';

// used to create fake backend
//import { fakeBackendProvider } from './_helpers';

import { CommonModule } from '@angular/common';
import { AlertComponent } from './_components';
import { ErrorInterceptor, JwtInterceptor, appInitializer } from './_helpers';
import { AccountService } from './_services';
import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { FloatingSchedulesComponent } from './floating-schedules/floating-schedules.component';
import { HomeComponent } from './home';
;

import { NgxMatDatetimePickerModule, NgxMatNativeDateModule, NgxMatTimepickerModule } from '@angular-material-components/datetime-picker';
import { MatButtonModule } from '@angular/material/button';
import { MatNativeDateModule } from '@angular/material/core';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatPaginatorModule } from '@angular/material/paginator';
import { MatSortModule } from '@angular/material/sort';
import { MatTableModule } from '@angular/material/table';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { MaterialModule } from './material/material.module';

import { RouterModule } from '@angular/router';
import { ColorConfig, TestService } from './_services/test.service';
import { ApplicationPipesModuleModule } from './application-pipes-module/application-pipes-module.module';
import { OrderByDateOrFunctionPipe } from './application-pipes-module/order-by-date-or-function.pipe';

// TODO JD TEST
export const USERS_SERVICE_TOKEN = new InjectionToken<TestService>('');
export const USERS_SERVICE_CONFIG_TOKEN = new InjectionToken<ColorConfig>(
  ''
);
// TODO JD TEST

@NgModule({ exports: [
        MaterialModule,
        MatSortModule,
        MatTableModule,
        MatPaginatorModule,
        MatButtonModule,
        MatInputModule,
        MatFormFieldModule
    ],
    declarations: [
        AppComponent,
        AlertComponent,
        HomeComponent,
        FloatingSchedulesComponent,
    ],
    bootstrap: [AppComponent], imports: [CommonModule,
        BrowserModule,
        FormsModule,
        ReactiveFormsModule,
        AppRoutingModule,
        RouterModule,
        BrowserAnimationsModule,
        MaterialModule,
        MatSortModule,
        MatTableModule,
        MatPaginatorModule,
        MatButtonModule,
        MatDatepickerModule,
        MatNativeDateModule,
        MatInputModule,
        MatFormFieldModule,
        NgxMatDatetimePickerModule,
        NgxMatTimepickerModule,
        ApplicationPipesModuleModule,
        OrderByDateOrFunctionPipe], providers: [
        { provide: APP_INITIALIZER, useFactory: appInitializer, multi: true, deps: [AccountService] },
        { provide: HTTP_INTERCEPTORS, useClass: JwtInterceptor, multi: true },
        { provide: HTTP_INTERCEPTORS, useClass: ErrorInterceptor, multi: true },
        // TODO JD TEST
        { provide: USERS_SERVICE_TOKEN, useClass: TestService },
        {
            provide: USERS_SERVICE_CONFIG_TOKEN,
            useValue: { apiUrl: 'http://localhost:3004/users' },
        },
        provideHttpClient(withInterceptorsFromDi()),
        // TODO JD TEST END

        
        //{provide: MAT_FORM_FIELD_DEFAULT_OPTIONS, useValue: {appearance: 'outline'}} ,   
        //{provide: MAT_FORM_FIELD_DEFAULT_OPTIONS, useValue: {floatLabel: 'always'}}    
        
        // provider used to create fake backend
        
        //fakeBackendProvider
        // ng build --configuration production  --aot --base-href="/scheduler/"

        // keytool -delete -alias tomcat -keystore localhost-rsa.jks
        // keytool -list -keystore localhost-rsa.jks
        // keytool -genkeypair -alias tomcat -keyalg RSA -keysize 4096 -validity 720 -keystore localhost-rsa.jks -storepass changeit -keypass changeit -ext SAN=dns:rejkid.hopto.org,ip:49.187.112.232
        // keytool -exportcert -keystore localhost-rsa.jks -alias tomcat -file localhost.crt
    ],
})
export class AppModule {
    constructor() {
        console.log('AppModule loaded.');
      }
 }