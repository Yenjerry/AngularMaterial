import { MatDatepickerModule } from '@angular/material/datepicker';

import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatToolbarModule } from '@angular/material/toolbar';
import { PlatformModule } from '@angular/cdk/platform';
import { FontAwesomeModule, FaIconLibrary } from '@fortawesome/angular-fontawesome';
import { faBars, faUserCircle } from '@fortawesome/free-solid-svg-icons';
import { GridsterModule } from 'angular-gridster2';
import { MatGridListModule } from '@angular/material/grid-list';
import { MatCardModule } from '@angular/material/card';
import { MatMenuModule } from '@angular/material/menu';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { LayoutModule } from '@angular/cdk/layout';
import { DashboardComponent } from './layout/dashboard/dashboard.component';
import { SidebarComponent } from './features/sidebar/sidebar.component';
import { MatDividerModule } from '@angular/material/divider';
import { MatListModule } from '@angular/material/list';
import { DragDropModule } from '@angular/cdk/drag-drop';
import { PageNotFoundComponent } from './page-not-found/page-not-found.component';
import { LoginComponent } from './layout/login/login.component';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatInputModule } from '@angular/material/input';
import { MatDialogModule } from '@angular/material/dialog';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { SettingboardComponent } from './features/settingboard/settingboard.component';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatTabsModule } from '@angular/material/tabs';
import { TabletestComponent } from './features/tabletest/tabletest.component';
import { MatPaginatorModule } from '@angular/material/paginator';
import { MatTableModule } from '@angular/material/table';
import { MatSortModule } from '@angular/material/sort';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { ObserversModule } from '@angular/cdk/observers';
import { HttpClientModule, HttpClientJsonpModule, HttpClient } from '@angular/common/http';
import { SitebarfeaturesComponent } from './features/sitebarfeatures/sitebarfeatures.component';
import { DashboardContentComponent } from './features/dashboard-content/dashboard-content.component';
import { PieChartComponent } from './features/pie-chart/pie-chart.component';
import { SitemenuComponent } from './features/sitemenu/sitemenu.component';
import { StepperTestComponent } from './features/stepper-test/stepper-test.component';
import { MatStepperModule } from '@angular/material/stepper';
import { DefaultUrlSerializer, UrlTree, UrlSerializer } from '@angular/router';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatTreeModule } from '@angular/material/tree';
import { ScrollingModule } from '@angular/cdk/scrolling';
import { MatBadgeModule } from '@angular/material/badge';

import { SatDatepickerModule, SatNativeDateModule } from "saturn-datepicker";
import { DynamicComponentLoadDirective } from './Directives/dynamic-component-load.directive';
import { OverlayContainer, FullscreenOverlayContainer } from '@angular/cdk/overlay';
import { CustomTipsComponent } from './features/custom-tips/custom-tips.component';
import { DashboardOverviewComponent } from './features/dashboard-overview/dashboard-overview.component';
import { TranslateModule, TranslateLoader } from '@ngx-translate/core';
import { TranslateHttpLoader } from '@ngx-translate/http-loader';
import { MessageDialogComponent } from './features/message-dialog/message-dialog.component';
import { GlobalComponent } from './features/global/global.component';
import { GlobeEleComponent } from './features/globe-ele/globe-ele.component';
import { TestGlobeComponent } from './features/test-globe/test-globe.component';


/**
 * Use for ignore url case.
 */
export class LowerCaseUrlSerializer extends DefaultUrlSerializer {
    parse(url: string): UrlTree {
        // Optional Step: Do some stuff with the url if needed.

        // If you lower it in the optional step 
        // you don't need to use "toLowerCase" 
        // when you pass it down to the next function
        return super.parse(url.toLowerCase());
    }
}

// AoT requires an exported function for factories
export function customTranslateLoader(http: HttpClient) {
    return new TranslateHttpLoader(http, './assets/i18n/', '.json');
}

@NgModule({
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
        StepperTestComponent,
        DynamicComponentLoadDirective,
        CustomTipsComponent,
        DashboardOverviewComponent,
        MessageDialogComponent,
        GlobalComponent,
        GlobeEleComponent,
        TestGlobeComponent
    ],
    imports: [
        BrowserModule,
        HttpClientModule,
        HttpClientJsonpModule,
        AppRoutingModule,
        BrowserAnimationsModule,
        MatSidenavModule,
        PlatformModule,
        MatToolbarModule,
        FontAwesomeModule,
        MatGridListModule,
        MatCardModule,
        MatMenuModule,
        MatIconModule,
        MatButtonModule,
        LayoutModule,
        MatDividerModule,
        MatListModule,
        DragDropModule,
        GridsterModule,
        MatFormFieldModule,
        MatSelectModule,
        MatInputModule,
        MatDialogModule,
        MatProgressSpinnerModule,
        FormsModule,
        ReactiveFormsModule,
        MatProgressBarModule,
        MatExpansionModule,
        MatTabsModule,
        MatTableModule,
        MatPaginatorModule,
        MatSortModule,
        MatCheckboxModule,
        ObserversModule,
        MatStepperModule,
        SatDatepickerModule,
        SatNativeDateModule,
        MatDatepickerModule,
        MatTooltipModule,
        MatBadgeModule,
        MatTreeModule,
        ScrollingModule,
        TranslateModule.forRoot({
            loader: {
                provide: TranslateLoader,
                useFactory: customTranslateLoader,
                deps: [HttpClient]
            }
        })
    ],
    entryComponents: [
        SettingboardComponent,
        PieChartComponent,
        CustomTipsComponent,
        MessageDialogComponent,
        GlobalComponent,
        GlobeEleComponent,
        TestGlobeComponent
    ],
    providers: [{
        provide: UrlSerializer,
        useClass: LowerCaseUrlSerializer
    }, { provide: OverlayContainer, useClass: FullscreenOverlayContainer }],
    bootstrap: [AppComponent]
})
export class AppModule {
    constructor(private iconLib: FaIconLibrary) {
        iconLib.addIcons(faBars);
        iconLib.addIcons(faUserCircle);
        document.documentElement.setAttribute('lang', 'en');
    }
}
