import { ValidationErrors, ValidatorFn, AbstractControl, FormControl, FormGroup } from '@angular/forms';
import { PhoneNumberUtil } from 'google-libphonenumber';

export class CustomValidators {

    static phoneNumberValidator(form: FormGroup) {
        if (form.controls['phoneNumber'].value) {
            const phoneNumberUtil = PhoneNumberUtil.getInstance();
            const phoneNumberInput: string = form.controls['phoneNumber'].value;
            if ((phoneNumberInput || '').trim().length !== 0) {
                try {
                    const phoneNumber = phoneNumberUtil.parse('+' + form.controls['countryCode'].value + phoneNumberInput);
                    if (!phoneNumberUtil.isValidNumber(phoneNumber)) {
                        form.controls['phoneNumber'].setErrors({ 'phoneNumberInvalid': true });
                        return;
                    }
                } catch (error) {
                    form.controls['phoneNumber'].setErrors({ 'phoneNumberInvalid': true });
                    return;
                }
            }
        }
        form.controls['phoneNumber'].setErrors(null);
    }
}