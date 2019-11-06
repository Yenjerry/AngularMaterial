import { MatListModule } from '@angular/material/list';
import { MatTooltipModule } from '@angular/material/tooltip';
import { SatDatepickerModule } from 'saturn-datepicker';
import { MatStepperModule } from '@angular/material/stepper';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatDividerModule } from '@angular/material/divider';
import { MatFormFieldModule } from '@angular/material/form-field';
import { PieChartComponent } from './../features/pie-chart/pie-chart.component';
import { GridsterModule } from 'angular-gridster2';
import { SitebarfeaturesComponent } from './../features/sitebarfeatures/sitebarfeatures.component';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatIconModule } from '@angular/material/icon';
import { RouterTestingModule } from '@angular/router/testing';
import { DashboardComponent } from './../layout/dashboard/dashboard.component';
import { AppRoutingModule } from './../app-routing.module';
import { TestBed, async, inject } from '@angular/core/testing';

import { AuthGuard } from './auth.guard';
import { RouterModule } from '@angular/router';
import { LoginComponent } from '../layout/login/login.component';
import { StepperTestComponent } from '../features/stepper-test/stepper-test.component';
import { DashboardContentComponent } from '../features/dashboard-content/dashboard-content.component';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';

describe('AuthGuard', () => {
    beforeEach(() => {
        TestBed.configureTestingModule({
            providers: [AuthGuard],
            declarations: [
                DashboardComponent,
                DashboardContentComponent,
                LoginComponent,
                StepperTestComponent,
                SitebarfeaturesComponent,
                PieChartComponent
            ],
            imports: [
                AppRoutingModule,
                RouterTestingModule,
                MatIconModule,
                MatToolbarModule,
                MatSidenavModule,
                GridsterModule,
                MatFormFieldModule,
                FormsModule,
                ReactiveFormsModule,
                MatDividerModule,
                MatProgressBarModule,
                MatStepperModule,
                SatDatepickerModule,
                MatTooltipModule,
                MatListModule
            ]
        });
    });

    it('should ...', inject([AuthGuard], (guard: AuthGuard) => {
        expect(guard).toBeTruthy();
    }));
});
