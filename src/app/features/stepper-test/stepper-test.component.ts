import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ValidatorFn, AbstractControl } from '@angular/forms';
import { STEPPER_GLOBAL_OPTIONS } from '@angular/cdk/stepper';

@Component({
    selector: 'app-stepper-test',
    templateUrl: './stepper-test.component.html',
    styleUrls: ['./stepper-test.component.scss'],
    providers: [{
        provide: STEPPER_GLOBAL_OPTIONS, useValue: { showError: true }
    }]
})
export class StepperTestComponent implements OnInit {
    firstFormGroup: FormGroup;
    secondFormGroup: FormGroup;

    constructor(private _formBuilder: FormBuilder) { }

    ngOnInit() {
        this.firstFormGroup = this._formBuilder.group({
            firstCtrl: ['xyz', [Validators.required]]
        });

        // console.log(this.firstFormGroup)

        this.secondFormGroup = this._formBuilder.group({
            secondCtrl: ['', [this.CustomValidatorByParameter(5)]]
        });
    }

    CustomValidatorByParameter(maxLength: number): ValidatorFn {
        return (control: AbstractControl): { [key: string]: boolean | null } => {
            console.log(control)
            return control.value.length > maxLength ? { 'overlength': true } : null;
        }
    }

    CustomValidator(control: AbstractControl): { [key: string]: boolean | null } {
        console.log(control, 'custom Validators', control.value == 'hello')

        return control.value == 'hello' ? null : { 'secondCtrl': false };
    };

}
