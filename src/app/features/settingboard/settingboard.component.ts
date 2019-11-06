import { Router } from '@angular/router';
import { Component, OnInit } from '@angular/core';

@Component({
    selector: 'app-settingboard',
    templateUrl: './settingboard.component.html',
    styleUrls: ['./settingboard.component.scss']
})
export class SettingboardComponent implements OnInit {

    constructor(private router: Router) { }

    ngOnInit() {
    }

    testClick() {
        this.router.navigate(['/dashboard/login']);
    }
}
