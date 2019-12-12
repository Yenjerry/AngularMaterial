
import { Component, OnInit, ViewContainerRef, ElementRef, ViewChild, ComponentFactoryResolver, AfterViewInit, ChangeDetectionStrategy } from '@angular/core';
import { Overlay, OverlayRef } from '@angular/cdk/overlay';


@Component({
    selector: 'app-dashboard-overview',
    templateUrl: './dashboard-overview.component.html',
    styleUrls: ['./dashboard-overview.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DashboardOverviewComponent implements OnInit, AfterViewInit {


    // @ViewChild('tipsObj', { static: false }) obj: ElementRef;
    overlayRef: OverlayRef;
    items = Array.from({ length: 3 }).map((_, i) => `Item #${i}`);

    constructor(private viewContainerRef: ViewContainerRef, private overlay: Overlay, private factoryResolver: ComponentFactoryResolver) {

    }


    ngOnInit() {

    }

    ngAfterViewInit(): void {
        // const strategy = this.overlay
        //     .position()
        //     .flexibleConnectedTo(this.obj.nativeElement).withPositions([
        //         {
        //             originX: 'start',
        //             originY: 'bottom',
        //             overlayX: 'center',
        //             overlayY: 'top'
        //         }
        //     ]);

        // this.overlayRef = this.overlay.create({
        //     positionStrategy: strategy
        // });
    }

    // showtips(event) {
    //     this.overlayRef.attach(new ComponentPortal(CustomTipsComponent, this.viewContainerRef));
    //     // this.overlayRef.attach(new ComponentPortal(CustomTipsComponent, this.viewContainerRef));
    // }

    // hidetips(event) {
    //     this.overlayRef.detach();
    // }
}