import { FormGroup, ValidationErrors } from '@angular/forms';

// custom validator to check that two fields match
export function MustMatch(controlName: string, matchingControlName: string) {
    return (formGroup: FormGroup) => {
        const control = formGroup.controls[controlName];
        const matchingControl = formGroup.controls[matchingControlName];

        formGroup.setErrors(null);
        var success = true;
        const result = [];
        // Object.keys(formGroup.controls).forEach((key, ctrl) => {

        //     const controlErrors: ValidationErrors = formGroup.get(key).errors;
        //     console.log("\tcontrol:" + key + "\t\tvalid:" + formGroup.controls[key].valid 
        //         + "\ttouched:" + formGroup.controls[key].touched + "\tdirty:" + formGroup.controls[key].dirty 
        //         + "\tvalue:" + "'" + formGroup.controls[key].value + "'");
        //     if (controlErrors) {
        //         success = false;
        //         Object.keys(controlErrors).forEach(keyError => {
        //             result.push({
        //                 'control': key,
        //                 'error': keyError,
        //                 'value': controlErrors[keyError]
        //             });
        //             console.log("\tcontrol:" + key + " error:" + keyError + " value:" + controlErrors[keyError]);
        //         });
        //     }
        // });
        // console.log("FormGroup VALID STATE:" + formGroup.valid + " Success:" + success);
        
        if (matchingControl.errors && !matchingControl.errors['mustMatch']) {
            // return if another validator has already found an error on the matchingControl
            return;
        }

        // set error on matchingControl if validation fails
        if (control.value !== matchingControl.value) {
            matchingControl.setErrors({ mustMatch: true });
        } else {
            matchingControl.setErrors(null);
        }
    }
}
