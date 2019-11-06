import { MessageDialogComponent } from './../../features/message-dialog/message-dialog.component';

import { OverlayRef, Overlay } from '@angular/cdk/overlay';
import { SettingboardComponent } from './../../features/settingboard/settingboard.component';
import { Component, OnInit, ChangeDetectorRef, OnDestroy, ViewChild, ElementRef, AfterViewInit, TemplateRef, ViewContainerRef } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { MediaMatcher, BreakpointObserver } from '@angular/cdk/layout';
import { MatButton } from '@angular/material/button';
import { TranslateService } from '@ngx-translate/core';
import { TemplatePortal, ComponentPortal } from '@angular/cdk/portal';
import { MatIcon } from '@angular/material/icon';

@Component({
    selector: 'app-dashboard',
    templateUrl: './dashboard.component.html',
    styleUrls: ['./dashboard.component.scss']
})
export class DashboardComponent implements OnInit, OnDestroy, AfterViewInit {

    mobileQuery: MediaQueryList;

    @ViewChild('settingButton', { static: false }) settingButton: MatButton;
    @ViewChild('languageBtn', { static: false }) languageBtn: MatIcon;
    @ViewChild('personInfo', { static: false }) personInfo: MatIcon;
    @ViewChild('messageBtn', { static: false }) messageBtn: MatIcon;

    @ViewChild('multipleLang', { static: false }) multipleLang: TemplateRef<ElementRef>;
    @ViewChild('personInforTemp', { static: false }) personInforTemp: TemplateRef<ElementRef>;

    private _mobileQueryListener: () => void;

    shouldRun = true;//[/(^|\.)plnkr\.co$/, /(^|\.)stackblitz\.io$/].some(h => h.test(window.location.host));
    overlayRef: OverlayRef;
    isSmallScreen = this.breakpointObserver.isMatched('(max-width: 599px)');

    constructor(private dialog: MatDialog, changeDetectorRef: ChangeDetectorRef,
        media: MediaMatcher,
        private overlay: Overlay,
        private breakpointObserver: BreakpointObserver,
        private translate: TranslateService, private viewContainerRef: ViewContainerRef) {

        this.mobileQuery = media.matchMedia('(max-width: 600px)');
        this._mobileQueryListener = () => changeDetectorRef.detectChanges();
        this.mobileQuery.addListener(this._mobileQueryListener);
        console.log(this.mobileQuery, '0.0')

        const layoutChanges = breakpointObserver.observe([
            '(orientation: portrait)',
            '(orientation: landscape)',
        ]);

        layoutChanges.subscribe(result => {
            console.log('detect the windows change.')
        });
    }

    ngOnInit() {

    }

    ngOnDestroy(): void {
        this.mobileQuery.removeListener(this._mobileQueryListener);
    }

    ngAfterViewInit(): void {

    }

    openSetting(): void {

        const dialogRef = this.dialog.open(SettingboardComponent, {
            width: '75%',
            height: '75%'
        });

        dialogRef.afterClosed().subscribe(result => {
            console.log('The dialog was closed');
        });

    }

    openLangOption() {

        // Setting the overlay position policy.
        const strategy = this.overlay
            .position()
            .flexibleConnectedTo(this.languageBtn._elementRef).withPositions([{
                originX: 'start',
                originY: 'top',
                overlayX: 'start',
                overlayY: 'top'
            }]);

        const overlayRef = this.overlay.create({
            positionStrategy: strategy,
            hasBackdrop: true,
            backdropClass: 'opacitybackdrop'
        });

        overlayRef.backdropClick().subscribe(() => {
            overlayRef.dispose();
        });

        overlayRef.overlayElement.addEventListener('click', () => {
            overlayRef.dispose();
        });

        const optionElement = new TemplatePortal(this.multipleLang, this.viewContainerRef);

        overlayRef.attach(optionElement);
    }

    openPersonInfo() {

        // Setting the overlay position policy.
        const strategy = this.overlay
            .position()
            .flexibleConnectedTo(this.personInfo._elementRef).withPositions([{
                originX: 'start',
                originY: 'center',
                overlayX: 'end',
                overlayY: 'top'
            }]);

        const overlayRef = this.overlay.create({
            positionStrategy: strategy,
            hasBackdrop: true,
            backdropClass: 'opacitybackdrop'
        });

        overlayRef.backdropClick().subscribe(() => {
            overlayRef.dispose();
        });

        overlayRef.overlayElement.addEventListener('click', () => {
            overlayRef.dispose();
        });

        const optionElement = new TemplatePortal(this.personInforTemp, this.viewContainerRef);

        overlayRef.attach(optionElement);
    }

    openMessageDialog() {
        const dialogRef = this.dialog.open(MessageDialogComponent, {
            width: '75%',
            height: '75%',
            maxHeight: '90%',
            data: {
                test: 'pass data success.'
            }
        });

        dialogRef.afterClosed().subscribe(result => {
            console.log('The dialog was closed');
        });
    }

    changeLang(lang) {

        if (lang == this.translate.currentLang) {
            return true;
        }

        // let lang = event.target.value;
        // this language will be used as a fallback when a translation isn't found in the current language
        this.translate.setDefaultLang(lang);
        // the lang to use, if the lang isn't available, it will use the current loader to get them
        this.translate.use(lang);
        // Change document language.
        document.documentElement.lang = lang;
    }

}
