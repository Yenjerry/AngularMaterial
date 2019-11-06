import { Router } from '@angular/router';
import { Component, OnInit, TemplateRef, ViewChild, ElementRef, AfterViewInit } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { FormGroup, FormBuilder, Validators } from '@angular/forms';
import { AuthService } from 'src/app/auth/auth.service';

@Component({
    selector: 'app-login',
    templateUrl: './login.component.html',
    styleUrls: ['./login.component.scss']
})
export class LoginComponent implements OnInit, AfterViewInit {

    @ViewChild('logincontainer', { static: false }) logincontainer: ElementRef;
    @ViewChild('loginprogress', { static: true }) progress: TemplateRef<ElementRef>;
    registerForm: FormGroup;
    loginProgress: boolean = false;
    loginFail: boolean = false;

    constructor(public dialog: MatDialog, private formBuilder: FormBuilder, private auth: AuthService, private router: Router) { }

    ngOnInit() {
        this.registerForm = this.formBuilder.group({
            account: ['', Validators.required],
            password: ['', [Validators.required, Validators.minLength(6)]]
        }, {
            validator: this.checkrequire
        });
    }

    get controls() {
        // console.log(this.registerForm.controls)
        return this.registerForm.controls;
    }

    ngAfterViewInit(): void {

    }

    checkrequire(group) {
        // console.log('fire custom validator', group)
    }

    login(): void {
        if (this.registerForm.status == "INVALID") {
            this.loginFail = true;
            return;
        }

        this.loginProgress = !this.loginProgress;
        this.auth.login(this.registerForm.value.account, this.registerForm.value.password).subscribe({
            next: (success) => {
                console.log(success)
                this.loginProgress = !this.loginProgress;
                this.loginFail = !success;
                if (success)
                    this.router.navigate(['/dashboard']);
            }
        });
    }

    openDialog(): void {


        // const dialogRef = this.dialog.open(this.progress, {
        //   width: '40vh',
        //   height: '40vh',
        //   data: {}
        // });

        // dialogRef.afterClosed().subscribe(result => {
        //   console.log('The dialog was closed');
        //   // this.animal = result;
        // });
    }
}
