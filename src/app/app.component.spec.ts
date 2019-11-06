import { MatTableModule } from '@angular/material/table';
import { StepperTestComponent } from './features/stepper-test/stepper-test.component';
import { LoginComponent } from './layout/login/login.component';
import { DashboardComponent } from './layout/dashboard/dashboard.component';
import { PieChartComponent } from './features/pie-chart/pie-chart.component';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { TestBed, async } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { AppComponent } from './app.component';
import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { AppRoutingModule } from './app-routing.module';
import { SidebarComponent } from './features/sidebar/sidebar.component';
import { PageNotFoundComponent } from './page-not-found/page-not-found.component';
import { SitemenuComponent } from './features/sitemenu/sitemenu.component';
import { SettingboardComponent } from './features/settingboard/settingboard.component';
import { TabletestComponent } from './features/tabletest/tabletest.component';
import { SitebarfeaturesComponent } from './features/sitebarfeatures/sitebarfeatures.component';
import { DashboardContentComponent } from './features/dashboard-content/dashboard-content.component';

describe('AppComponent', () => {
    beforeEach(async(() => {
        TestBed.configureTestingModule({
            schemas: [CUSTOM_ELEMENTS_SCHEMA, NO_ERRORS_SCHEMA],
            imports: [
                RouterTestingModule,
                AppRoutingModule,
                MatTableModule
            ],
            declarations: [
                AppComponent,
                DashboardComponent,
                SidebarComponent,
                PageNotFoundComponent,
                LoginComponent,
                SitemenuComponent,
                SettingboardComponent,
                TabletestComponent,
                SitebarfeaturesComponent,
                DashboardContentComponent,
                PieChartComponent,
                StepperTestComponent
            ],
        }).compileComponents();
    }));

    it('should create the app', () => {
        const fixture = TestBed.createComponent(AppComponent);
        const app = fixture.debugElement.componentInstance;
        expect(app).toBeTruthy();
    });

    // it(`should have as title 'material'`, () => {
    //     const fixture = TestBed.createComponent(AppComponent);
    //     const app = fixture.debugElement.componentInstance;
    //     // expect(app.title).toEqual('material');
    // });

    // it('should render title', () => {
    //     const fixture = TestBed.createComponent(AppComponent);
    //     fixture.detectChanges();
    //     const compiled = fixture.debugElement.nativeElement;
    //     // expect(compiled.querySelector('.content span').textContent).toContain('material app is running!');
    // });
});
