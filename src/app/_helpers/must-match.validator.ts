import { AbstractControl, FormGroup, ValidationErrors } from '@angular/forms';

// custom validator to check that two fields match
export function MustMatch(controlName: string, matchingControlName: string) {
    return (formGroup:AbstractControl)  : ValidationErrors | null => {
        let fg :FormGroup = formGroup as FormGroup;
        const control = fg.controls[controlName];
        const matchingControl = fg.controls[matchingControlName];

        /* JD Start */
        /*
        var title = formGroup.controls['title'];
        var firstName = formGroup.controls['firstName'];
        var lastName = formGroup.controls['lastName'];
        var email = formGroup.controls['email'];
        var phoneNumber = formGroup.controls['phoneNumber'];
        var role = formGroup.controls["role"];
        var dob = formGroup.controls['dob'];
        var scheduleGroup = formGroup.controls['scheduleGroup'];
        var password = formGroup.controls['password'];
        var confirmPassword = formGroup.controls['confirmPassword'];

        console.log("\n\n");

        if (title != null)
            console.log("title:" + title!.valid + "\ttouched:" + title!.touched + "\tdirty:" + title!.dirty);

        if (firstName != null)
            console.log("firstName:" + firstName!.valid + "\ttouched:" + firstName!.touched + "\tdirty:" + firstName!.dirty);

        if (lastName != null)
            console.log("lastName:" + lastName!.valid + "\ttouched:" + lastName!.touched + "\tdirty:" + lastName!.dirty);

        if (email != null)
            console.log("email:" + email!.valid + "\ttouched:" + email!.touched + "\tdirty:" + email!.dirty);

        if (phoneNumber != null)
            console.log("phoneNumber:" + phoneNumber!.valid + "\ttouched:" + phoneNumber!.touched + "\tdirty:" + phoneNumber!.dirty);

        if (role != null)
            console.log("role:" + role!.valid + "\ttouched:" + role!.touched + "\tdirty:" + role!.dirty);

        if (dob != null)
            console.log("dob:" + dob!.valid + "\ttouched:" + dob!.touched + "\tdirty:" + dob!.dirty);

        if (scheduleGroup != null)
            console.log("scheduleGroup:" + scheduleGroup!.valid + "\ttouched:" + scheduleGroup!.touched + "\tdirty:" + scheduleGroup!.dirty);

        if (password != null)
            console.log("password:" + password!.valid + "\ttouched:" + password!.touched + "\tdirty:" + password!.dirty);

        if (confirmPassword != null)
            console.log("confirmPassword:" + confirmPassword!.valid + "\ttouched:" + confirmPassword!.touched + "\tdirty:" + confirmPassword!.dirty);

        if (password != null && confirmPassword != null) {
            console.log("Passwords identical:" + (password!.value === confirmPassword!.value));
        }

        var success =
            title && title.valid
            && firstName && firstName.valid
            && lastName && lastName.valid
            && email && email.valid
            && (role == undefined || ( role && role.valid))
            && dob        && dob.valid
            && phoneNumber && phoneNumber.valid
            && scheduleGroup && scheduleGroup.valid
            && password && password.valid
            && confirmPassword && confirmPassword.valid
            && (password.value === confirmPassword.value);

        console.log("FormGroup STATE:" + success + " Valid:" + formGroup.valid);
        */
        /* JD End */

        if (matchingControl.errors && !matchingControl.errors['mustMatch']) {
            // return if another validator has already found an error on the matchingControl
            return null;
        }

        // set error on matchingControl if validation fails
        if (control.value !== matchingControl.value) {
            matchingControl.setErrors({ mustMatch: true });
            return { mustMatch: true };
        } else {
            matchingControl.setErrors(null);
            return null;
        }
    }
}