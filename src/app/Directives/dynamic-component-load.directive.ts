import { GridsterItem } from 'angular-gridster2';
import { Directive, ViewContainerRef, AfterViewInit, Input, EventEmitter } from '@angular/core';
import { Subject } from 'rxjs';

@Directive({
    selector: '[appDynamicComponentLoad]'
})
export class DynamicComponentLoadDirective implements AfterViewInit {

    @Input() extraData: any;
    @Input() resizeSubject: Subject<any>;

    constructor(public viewContainerRef: ViewContainerRef) { }


    ngAfterViewInit(): void {
        console.log(this.extraData, 'grid item generate dynamic by directive.')
    }
}
