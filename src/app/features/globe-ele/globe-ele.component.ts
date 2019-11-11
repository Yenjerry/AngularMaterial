import { FlowServiceService } from './../../services/flow-service.service';
import { FlowVisualizationMesh } from './../../Models/flow-base';
import { Overlay } from '@angular/cdk/overlay';
import { HttpClient } from '@angular/common/http';
import { Component, OnInit, ViewChild, ElementRef, AfterViewInit, ViewContainerRef, TemplateRef, OnDestroy } from '@angular/core';
import * as THREE from 'three';
import * as  TrackballControls from 'three-trackballcontrols';
import { Clock } from 'three';
import TWEEN from '@tweenjs/tween.js';
import status from 'stats.js';
import { EarthManagement } from 'src/app/Common/earth-utility';
import { TemplatePortal } from '@angular/cdk/portal';
import { FlowBase, LocationPoint } from 'src/app/Models/flow-base';

@Component({
    selector: 'app-globe-ele',
    templateUrl: './globe-ele.component.html',
    styleUrls: ['./globe-ele.component.scss']
})
export class GlobeEleComponent implements OnInit, AfterViewInit, OnDestroy {
    ngOnDestroy(): void {
        this.stopRender = true;
        this.featureOverlayRef.dispose();
    }

    @ViewChild('webgl', { static: false }) webglEl: ElementRef;
    @ViewChild('features', { static: false }) features: TemplateRef<ElementRef>;
    @ViewChild('countyDetail', { static: false }) countyDetail: TemplateRef<ElementRef>;
    @ViewChild('flowList', { static: false }) flowListTemplate: TemplateRef<ElementRef>;
    @ViewChild('warringTemplate', { static: false }) warringTemplate: TemplateRef<ElementRef>;

    mode: 'sphere' | 'plane' = 'sphere';
    control;
    renderer;
    scene;
    sunlight;
    camera;
    clock = new Clock();
    data;
    globe;
    utility: EarthManagement;
    focusCounty: FlowBase;
    flowDatas: FlowBase[] = [];
    enableAutoRotation = false;
    earthReady = false;

    constructor(private viewContainerRef: ViewContainerRef, private http: HttpClient, private overlay: Overlay, private flowService: FlowServiceService) {

        this.utility = new EarthManagement(http, this.mode);
        this.flowDatas = flowService.getFlowDatas();

        // Register handle new data add event.
        this.flowService.registerEvent().subscribe(() => {

            // this.clearAllLine();
            let newFlows = this.flowService.getFlowDatas().filter(o =>
                !this.flowDatas.find(j => j.id == o.id)
            );
            this.flowDatas.push(...newFlows);

            if (!this.earthReady) {
                return;
            }

            this.generateVisualization(newFlows);
        });
    }

    private convertGeoToLocationPoint(geoData): LocationPoint {
        return Object.assign(new LocationPoint(), {
            longitude: geoData.properties.longitude,
            // Latidute.
            latitude: geoData.properties.latitude,
            county: geoData.properties.name
        } as LocationPoint);
    }

    ngOnInit() {
        this.status = new status();

        let statusContainer = document.getElementById('status');

        if (statusContainer.childNodes.length == 0) {
            statusContainer.appendChild(this.status.dom);
            this.statusUpdate();
        }
    }

    status;
    enableControl = false;
    featureOverlayRef;
    openFeatureOverlay() {

        // return;
        const strategy = this.overlay
            .position()
            .flexibleConnectedTo(this.webglEl.nativeElement).withPositions([{
                originX: 'start',
                originY: 'top',
                overlayX: 'start',
                overlayY: 'top'
            }]);

        const overlayRef = this.overlay.create({
            positionStrategy: strategy,
            // hasBackdrop: true,
            // backdropClass: 'opacitybackdrop'
        });

        // overlayRef.backdropClick().subscribe(() => {
        //     overlayRef.dispose();
        // });
        this.featureOverlayRef = overlayRef;
        overlayRef.overlayElement.addEventListener('click', () => {
            // this.autoAroundPoint();
            // overlayRef.dispose();
        });

        const optionElement = new TemplatePortal(this.features, this.viewContainerRef);

        overlayRef.attach(optionElement);
    }

    openFlowOverlay() {

        // return;
        const strategy = this.overlay
            .position()
            .flexibleConnectedTo(this.webglEl.nativeElement).withPositions([{
                originX: 'end',
                originY: 'top',
                overlayX: 'end',
                overlayY: 'top'
            }]);

        const overlayRef = this.overlay.create({
            positionStrategy: strategy,
            height: '100%'
            // hasBackdrop: true,
            // backdropClass: 'opacitybackdrop'
        });

        // overlayRef.backdropClick().subscribe(() => {
        //     overlayRef.dispose();
        // });

        overlayRef.overlayElement.addEventListener('click', () => {
            // this.autoAroundPoint();
            overlayRef.dispose();
        });

        const optionElement = new TemplatePortal(this.flowListTemplate, this.viewContainerRef);

        overlayRef.attach(optionElement);
    }

    toggleAlertOverlay() {

        // return;
        const strategy = this.overlay
            .position()
            .flexibleConnectedTo(this.webglEl.nativeElement).withPositions([{
                originX: 'start',
                originY: 'top',
                overlayX: 'start',
                overlayY: 'top'
            }]);

        const overlayRef = this.overlay.create({
            positionStrategy: strategy,
            height: '100%',
            width: '100%'
            // hasBackdrop: true,
            // backdropClass: 'opacitybackdrop'
        });

        // overlayRef.backdropClick().subscribe(() => {
        //     overlayRef.dispose();
        // });

        overlayRef.overlayElement.addEventListener('click', () => {
            // this.autoAroundPoint();
            overlayRef.dispose();
        });

        const optionElement = new TemplatePortal(this.warringTemplate, this.viewContainerRef);

        overlayRef.attach(optionElement);
    }

    ngAfterViewInit() {

        let globalContainer = this.viewContainerRef.element.nativeElement.querySelector('.global-conatiner');

        setTimeout(() => {
            this.openFeatureOverlay();
            var width = globalContainer.clientWidth,
                height = globalContainer.clientHeight;

            this.renderer = new THREE.WebGLRenderer();
            this.renderer.setSize(width, height);
            this.renderer.setPixelRatio(window.devicePixelRatio);

            globalContainer.appendChild(this.renderer.domElement);

            this.scene = new THREE.Scene();
            this.scene.add(new THREE.AmbientLight(0xbbbbbb, 0.3));

            let directionLight = new THREE.DirectionalLight(0xffffff);
            this.sunlight = directionLight;
            this.scene.add(directionLight);

            directionLight.position.z = Math.PI / 2;

            this.utility.createEarth().subscribe((globe) => {

                if (this.mode == 'sphere')
                    this.globe = globe;
                else
                    this.globe = this.scene;

                this.scene.add(globe);

                // Setup camera
                this.camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);

                this.camera.position.z = 300;

                // Setup cameral control.
                this.control = new TrackballControls(this.camera, globalContainer);
                this.control.zoomSpeed = 0.5;
                this.control.rotateSpeed = 0.5;
                this.control.panSpeed = 0.1;
                this.control.noPan = this.mode == 'sphere' ? true : false;
                this.control.minDistance = this.mode == 'sphere' ? 120 : 10;
                this.control.maxDistance = 300;

                this.earthReady = true;
                this.generateVisualization();
                // The data update!
                this.enableControl = true;

                this.scene.add(this.utility.createStars(300, 32));

                if (this.mode == 'sphere')
                    this.scene.add(this.utility.createAtmosphere());

                this.play();
            });

            let raycaster = new THREE.Raycaster();

            ['click', 'touchend'].forEach(listenEvent => {
                this.renderer.domElement.addEventListener(listenEvent, (event) => {
                    let mouse = new THREE.Vector2();

                    mouse.x = (event.offsetX / this.renderer.domElement.clientWidth) * 2 - 1;
                    mouse.y = - (event.offsetY / this.renderer.domElement.clientHeight) * 2 + 1;

                    raycaster.setFromCamera(mouse, this.camera);
                    let intersects = raycaster.intersectObjects(this.scene.children, true);

                    console.log(intersects)

                    intersects.forEach(mesh => {
                        if (mesh.object.userData) {
                            // console.log(mesh.object.userData instanceof FlowBase, mesh.object.userData)
                            if (mesh.object.userData.hasOwnProperty('fromLocation')) {
                                this.focusCounty = mesh.object.userData as FlowBase;
                                this.showDetail();
                            }
                        }
                    });

                })
            })


        });

    }

    detailOverlay;
    stopRender = false;
    earthChange = false;

    changeEarth() {
        this.ngOnDestroy();

        setTimeout(() => {
            this.mode = this.mode == 'plane' ? 'sphere' : 'plane';

            this.utility = new EarthManagement(this.http, this.mode);
            this.stopRender = false;

            this.flowDatas = this.flowService.getFlowDatas();
            this.ngAfterViewInit();
        }, 100);
    }

    triggerDataUpdate() {
        this.flowService.generateData(Math.ceil(Math.random() * 50));
    }

    showDetail() {

        if (this.detailOverlay && this.detailOverlay.hasAttached()) {
            return;
        }

        const strategy = this.overlay
            .position()
            .flexibleConnectedTo(this.webglEl.nativeElement).withPositions([{
                originX: 'start',
                originY: 'bottom',
                overlayX: 'start',
                overlayY: 'bottom'
            }]);

        this.detailOverlay = this.overlay.create({
            positionStrategy: strategy,
            // hasBackdrop: true,
            // backdropClass: 'opacitybackdrop'
        });

        // overlayRef.backdropClick().subscribe(() => {
        //     overlayRef.dispose();
        // });

        this.detailOverlay.overlayElement.addEventListener('click', () => {
            // this.autoAroundPoint();
            this.detailOverlay.detach();
            this.detailOverlay.dispose();
        });

        const optionElement = new TemplatePortal(this.countyDetail, this.viewContainerRef);

        this.detailOverlay.attach(optionElement);
    }

    removePoint(flow: FlowBase) {

        this.globe.remove(flow.extraData.fromPointMesh);
        this.globe.remove(flow.extraData.destPointMesh);
        this.globe.remove(flow.extraData.curveLineMesh.mesh);

        this.utility.removePoint(flow.extraData.fromPointMesh);
        this.utility.removePoint(flow.extraData.destPointMesh);
        this.utility.removeCurveLine(flow.extraData.curveLineMesh);
    }

    clearAllLine() {
        this.flowDatas.forEach(o => {
            this.removePoint(o);
        });
        this.flowDatas = [];
    }

    generateVisualization(datas?) {
        datas = datas || this.flowDatas;

        datas.forEach(o => {

            o.extraData = new FlowVisualizationMesh();

            let fromPoint = this.utility.drawPoint(o.fromLocation.getCoordinate());
            fromPoint.userData = Object.assign({}, o);

            o.extraData.fromPointMesh = fromPoint;

            let destPoint = this.utility.drawPoint(o.destLocation.getCoordinate());
            destPoint.userData = Object.assign({}, o);

            o.extraData.destPointMesh = destPoint;

            let curve = this.utility.drawCurveLine(o.fromLocation.getCoordinate(), o.destLocation.getCoordinate())

            o.extraData.curveLineMesh = curve;

            this.globe.add(fromPoint);
            this.globe.add(destPoint);
            this.scene.add(curve.mesh);
            this.scene.add(this.utility.drawColumn(o.fromLocation.getCoordinate()));
            this.scene.add(this.utility.drawColumn(o.destLocation.getCoordinate()));
        });

    }

    generateTestFlow() {
        this.http.get('/assets/ne_50m_populated_places_simple.geojson').subscribe((result: any) => {

            Array.from({ length: 50 }).forEach(() => {

                let pointfrom = result.features[Math.floor(Math.random() * result.features.length)];
                let pointdest = result.features[Math.floor(Math.random() * result.features.length)];
                let flow = new FlowVisualizationMesh();

                // The from and dest are same, pass this data.
                if (pointfrom.properties.name == pointdest.properties.name)
                    return;

                flow.flow = Math.ceil(Math.random() * 100000);
                flow.fromLocation = this.convertGeoToLocationPoint(pointfrom);
                flow.destLocation = this.convertGeoToLocationPoint(pointdest);

                this.flowDatas.push(flow);
            });

            this.flowDatas.forEach(o => {
                o.extraData = new FlowVisualizationMesh();

                let fromPoint = this.utility.drawPoint(o.fromLocation.getCoordinate());
                fromPoint.userData = Object.assign({}, o);

                o.extraData.fromPointMesh = fromPoint;

                let destPoint = this.utility.drawPoint(o.destLocation.getCoordinate());
                destPoint.userData = Object.assign({}, o);

                o.extraData.destPointMesh = destPoint;

                let curve = this.utility.drawCurveLine(o.fromLocation.getCoordinate(), o.destLocation.getCoordinate())

                o.extraData.curveLineMesh = curve;

                this.scene.add(fromPoint);
                this.scene.add(destPoint);
                this.scene.add(curve.mesh);
            });

        });
    }

    autoAroundPoint(isFrom: boolean, arr?) {

        // disable auto rotation.
        this.enableAutoRotation = false;

        if (!arr) {
            arr = this.flowDatas.map(o => {
                if (isFrom)
                    return o.fromLocation.getCoordinate();
                return o.destLocation.getCoordinate();
            });
        }

        if (arr.length === 0)
            return;

        // Play tween to rotation to zero.
        if (this.globe.rotation.y !== 0) {
            let tween = new TWEEN.Tween({ rotation: this.globe.rotation.y });
            tween.to({ rotation: 0 }, 200)
                .onUpdate(o => {
                    this.globe.rotation.y = o.rotation;
                })
                .onComplete(() => {
                    this.utility.foucsCameraToPoint(arr.shift(), this.camera, this.control).subscribe(() => {
                        this.autoAroundPoint(isFrom, arr);
                    });
                })
                .start();
            return;
        }

        this.utility.foucsCameraToPoint(arr.shift(), this.camera, this.control).subscribe(() => {
            this.autoAroundPoint(isFrom, arr);
        });
    }

    t = 0;

    play = () => {

        if (this.stopRender) {

            this.scene.remove.apply(this.scene, this.scene.children);
            this.utility.dispose();
            this.scene.dispose();
            this.control.dispose();
            this.renderer.domElement.remove();
            this.renderer.dispose();
            this.flowDatas = [];
            this.enableAutoRotation = false;
            console.log('clear scene', this.scene)

            return;
        }

        // The earth circle is 0 ~ 2π 
        if (this.mode != 'plane' && this.enableAutoRotation) {
            this.globe.rotation.y += 0.001;
        }

        TWEEN.update();

        requestAnimationFrame(this.play);
        // this.scene.rotation.y += 0.001;
        if (this.enableControl)
            this.control.update();

        this.renderer.render(this.scene, this.camera);

    }

    statusUpdate = () => {
        requestAnimationFrame(this.statusUpdate);
        this.status.update();
    }


    movingSphere = [];
    maxDarwCount = 10;
    currentDrawCount = 0;
    drawPueue = [];


}
