import { ComponentPortal, TemplatePortal } from '@angular/cdk/portal';
import { MatDialog } from '@angular/material/dialog';
import { Router } from '@angular/router';
import { Feature } from './../../Models/feature';
import { Component, OnInit, ViewChildren, ViewContainerRef, ViewChild, ElementRef, TemplateRef } from '@angular/core';
import { FeatureProviderService } from 'src/app/services/feature-provider.service';
import { SettingboardComponent } from '../settingboard/settingboard.component';
import { Overlay, OverlayRef } from '@angular/cdk/overlay';

@Component({
    selector: 'app-sitebarfeatures',
    templateUrl: './sitebarfeatures.component.html',
    styleUrls: ['./sitebarfeatures.component.scss']
})
export class SitebarfeaturesComponent implements OnInit {

    features: Feature[];

    constructor(private featureProvider: FeatureProviderService,
        private router: Router,
        private dialog: MatDialog) {
        this.features = featureProvider.getFeatures();
    }

    ngOnInit() {

    }

    navigateTo(feature: Feature) {
        this.router.navigate([feature.navigate, { data: { nice: '123' } }]);
    }

    openSettingDialog() {
        const dialogRef = this.dialog.open(SettingboardComponent, {
            width: '80%',
            height: '80%'
        });

        dialogRef.afterOpened().subscribe(res => {

        });

        dialogRef.afterClosed().subscribe(result => {
            console.log('The dialog was closed');
        });

    }


}
