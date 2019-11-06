import { GlobalComponent } from './features/global/global.component';
import { DashboardOverviewComponent } from './features/dashboard-overview/dashboard-overview.component';
import { StepperTestComponent } from './features/stepper-test/stepper-test.component';
import { DashboardContentComponent } from './features/dashboard-content/dashboard-content.component';
import { DashboardComponent } from './layout/dashboard/dashboard.component';
import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { LoginComponent } from './layout/login/login.component';
import { AuthGuard } from './auth/auth.guard';
import { MessageDialogComponent } from './features/message-dialog/message-dialog.component';


// If user agent is mobile device, the we will automatically navigate to mobile page.

const routes: Routes = [
    {
        path: 'dashboard',
        component: DashboardComponent,
        children: [
            {
                path: 'login',
                component: LoginComponent
            },
            {
                path: 'stepper',
                component: StepperTestComponent
            },
            {
                path: 'dashboard',
                component: DashboardContentComponent,
                children: [
                    {
                        path: ':id',
                        component: DashboardContentComponent
                        // redirectTo: '/login'
                    }
                ]
            },
            {
                path: 'message',
                component: MessageDialogComponent
            },
            {
                path: "global",
                component: GlobalComponent
            },
            {
                path: '**',
                component: DashboardOverviewComponent
            }]
        // canActivate: [AuthGuard]
    },
    {
        path: 'login',
        component: LoginComponent,
        // canActivate: [AuthGuard]
    },
    // {
    //     path: '',
    //     component: GlobalComponent
    // },
    {
        path: '**',
        component: DashboardComponent
    }
];

@NgModule({
    imports: [RouterModule.forRoot(routes)],
    exports: [RouterModule]
})
export class AppRoutingModule { }

// { path: '**', component: LoginComponent }