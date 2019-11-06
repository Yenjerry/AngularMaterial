
import { GlobalComponent } from './../global/global.component';
import { switchMap } from 'rxjs/operators';
import { Router, ActivatedRoute, ParamMap } from '@angular/router';
import { DynamicComponentLoadDirective } from './../../Directives/dynamic-component-load.directive';
import { PieChartComponent } from './../pie-chart/pie-chart.component';
import { Component, OnInit, ViewContainerRef, ComponentFactoryResolver, ViewChildren, ElementRef, AfterViewInit, QueryList, Output, EventEmitter, ComponentRef } from '@angular/core';
import { GridsterConfig, GridsterItem, GridsterItemComponent } from 'angular-gridster2';
import { ComponentPortal } from '@angular/cdk/portal';
import { ObservableInput, OperatorFunction, Subject } from 'rxjs';
import { GlobeEleComponent } from '../globe-ele/globe-ele.component';
import { TestGlobeComponent } from '../test-globe/test-globe.component';

@Component({
    selector: 'app-dashboard-content',
    templateUrl: './dashboard-content.component.html',
    styleUrls: ['./dashboard-content.component.scss']
})
export class DashboardContentComponent implements OnInit, AfterViewInit {

    options: GridsterConfig;
    dashboard: Array<GridsterItem>;

    @Output() resizeSubject: Subject<any> = new Subject();

    @ViewChildren(DynamicComponentLoadDirective) items: QueryList<DynamicComponentLoadDirective>

    itemChange(item, itemComponent) {
        console.info('itemChanged', item, itemComponent);
    }

    itemResize(item, itemComponent) {
        this.resizeSubject.next(true);
    }

    constructor(private viewContainerRef: ViewContainerRef,
        private factoryResolver: ComponentFactoryResolver,
        private route: ActivatedRoute,
        private router: Router) {
        // console.log(viewContainerRef.element, 'dashboard content constructor.')
    }

    ngOnInit() {
        this.options = {
            itemChangeCallback: this.itemChange.bind(this),
            itemResizeCallback: this.itemResize.bind(this),
            draggable: {
                enabled: true,
                // delayStart: 1000
            },
            resizable: {
                enabled: true
            },
            displayGrid: 'none',
            margin: 4
        };

        this.dashboard = [
            { cols: 2, rows: 2, y: 0, x: 0, component: GlobeEleComponent },
            // { cols: 2, rows: 2, y: 0, x: 2, component: TestGlobeComponent }
        ];

        // console.log(this.route.snapshot.paramMap.get('id'), '!!!!!!!!!!!!!!!!!!!!!!!!!!')
    }

    static ttt: Function;

    ngAfterViewInit(): void {
        console.log(this.items, 'dashboard content constructor.')

        this.items.forEach((element, i) => {

            const componentFactory = this.factoryResolver.resolveComponentFactory(element.extraData.component);
            const component = element.viewContainerRef.createComponent(componentFactory);
            if (component.componentType == GlobalComponent) {
                let q = component as ComponentRef<GlobalComponent>;
                q.instance.resizeSubject = element.resizeSubject;
            }
        });

    }

    changedOptions() {
        this.options.api.optionsChanged();
    }

    removeItem(item) {
        this.dashboard.splice(this.dashboard.indexOf(item), 1);
    }

    addItem() {
        // this.dashboard.push();
    }

    generateComponent() {
        let com = new ComponentPortal(PieChartComponent);
        // console.log(com)
    }
}
