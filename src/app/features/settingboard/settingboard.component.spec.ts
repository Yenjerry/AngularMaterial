import { MatTabsModule } from '@angular/material/tabs';
import { GridsterModule } from 'angular-gridster2';
import { MatTooltipModule } from '@angular/material/tooltip';
import { SatDatepickerModule } from 'saturn-datepicker';
import { StepperTestComponent } from './../stepper-test/stepper-test.component';
import { LoginComponent } from './../../layout/login/login.component';
import { DashboardComponent } from './../../layout/dashboard/dashboard.component';
import { AppRoutingModule } from './../../app-routing.module';
import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { SettingboardComponent } from './settingboard.component';
import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { AuthGuard } from 'src/app/auth/auth.guard';
import { DashboardContentComponent } from '../dashboard-content/dashboard-content.component';
import { MatFormFieldModule } from '@angular/material/form-field';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatInputModule } from '@angular/material/input';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';

describe('SettingboardComponent', () => {
    let component: SettingboardComponent;
    let fixture: ComponentFixture<SettingboardComponent>;

    beforeEach(async(() => {
        TestBed.configureTestingModule({
            schemas: [CUSTOM_ELEMENTS_SCHEMA],
            declarations: [
                SettingboardComponent,
                DashboardComponent,
                LoginComponent,
                StepperTestComponent,
                DashboardContentComponent
            ],
            imports: [
                BrowserAnimationsModule,
                AppRoutingModule,
                MatFormFieldModule,
                MatTabsModule,
                FormsModule,
                ReactiveFormsModule,
                SatDatepickerModule,
                MatTooltipModule,
                GridsterModule,
                MatInputModule
            ],
            providers: [
                AuthGuard,

            ]
        })
            .compileComponents();
    }));

    beforeEach(() => {
        fixture = TestBed.createComponent(SettingboardComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    it('should render tab', () => {
        const fixture = TestBed.createComponent(SettingboardComponent);
        fixture.detectChanges();
        const compiled = fixture.debugElement.nativeElement;
        console.log(compiled)
        expect(compiled.querySelectorAll('.mat-tab-label').length).toBe(3);
    });
});
