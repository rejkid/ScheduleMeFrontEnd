import { ValidationErrors, ValidatorFn, AbstractControl, FormControl, FormGroup } from '@angular/forms';
import { PhoneNumberUtil } from 'google-libphonenumber';

export class CustomValidators {

    static createPhoneNumberValidator(countryCode: string, phoneNumber: string) {
        return (formGroup: FormGroup) => {
            const phoneNumberCtrl = formGroup.controls[phoneNumber];
            const phoneNumberVal = phoneNumberCtrl.value;

            if (phoneNumberVal) {
                const phoneNumberUtil = PhoneNumberUtil.getInstance();
                const phoneNumberInput: string = phoneNumberCtrl.value;
                if ((phoneNumberInput || '').trim().length !== 0) {
                    try {
                        const fullPhoneNumber = phoneNumberUtil.parse(phoneNumberInput);
                        if (!phoneNumberUtil.isValidNumberForRegion(fullPhoneNumber, "61")) {
                            phoneNumberCtrl.setErrors({ 'phoneNumberInvalid': true });
                            return;
                        }
                    } catch (error) {
                        phoneNumberCtrl.setErrors({ 'phoneNumberInvalid': true });
                        return;
                    }
                }
            }
            phoneNumberCtrl.setErrors(null);
        }
    }
    static createPasswordStrengthValidator(): ValidatorFn {
        return (control:AbstractControl) : ValidationErrors | null => {
    
            const value = control.value;
    
            if (!value) {
                return null;
            }
    
            const hasUpperCase = /[A-Z]+/.test(value);
    
            const hasLowerCase = /[a-z]+/.test(value);
    
            const hasNumeric = /[0-9]+/.test(value);
    
            const passwordValid = hasUpperCase && hasLowerCase && hasNumeric;
    
            return !passwordValid ? {passwordStrength:true}: null;
        }
    }
    }
