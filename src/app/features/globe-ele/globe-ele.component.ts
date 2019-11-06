import { Overlay } from '@angular/cdk/overlay';
import { HttpClient } from '@angular/common/http';
import { Component, OnInit, ViewChild, ElementRef, AfterViewInit, ViewContainerRef, TemplateRef } from '@angular/core';
import * as THREE from 'three';
import ThreeGlobe from 'three-globe';
import * as  TrackballControls from 'three-trackballcontrols';
import { geoDistance, geoInterpolate } from 'd3-geo';
import { CubicBezierCurve3, Clock } from 'three';
import TWEEN from '@tweenjs/tween.js';
import { MeshLine, MeshLineMaterial } from 'three.meshline';
import Bird from 'src/app/Models/bird';
import status from 'stats.js';
import { EarthManagement } from 'src/app/Common/earth-utility';
import { TemplatePortal } from '@angular/cdk/portal';

@Component({
    selector: 'app-globe-ele',
    templateUrl: './globe-ele.component.html',
    styleUrls: ['./globe-ele.component.scss']
})
export class GlobeEleComponent implements OnInit, AfterViewInit {

    @ViewChild('webgl', { static: false }) webglEl: ElementRef;
    @ViewChild('features', { static: false }) features: TemplateRef<ElementRef>;

    control;
    renderer;
    scene;
    camera;
    composer;
    clock = new Clock();
    data;
    utility: EarthManagement;

    constructor(private viewContainerRef: ViewContainerRef, http: HttpClient, private overlay: Overlay) {
        this.utility = new EarthManagement(http, 'sphere');
    }

    ngOnInit() {
        window.onresize = () => {
            this.responseive();
        }
    }


    responseive() {
        // let globalContainer = this.viewContainerRef.element.nativeElement.querySelector('.global-conatiner');

        // var width = globalContainer.clientWidth,
        //     height = globalContainer.clientHeight;

        // this.renderer.dispose();

        // this.ngAfterViewInit();
    }

    status;
    enableControl = false;

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

        console.log(strategy, this.webglEl, this.features, '!!!!!!!!!!!!!!!!!!!!!!!!!')

        const overlayRef = this.overlay.create({
            positionStrategy: strategy,
            hasBackdrop: true,
            backdropClass: 'opacitybackdrop'
        });

        overlayRef.backdropClick().subscribe(() => {
            overlayRef.dispose();
        });

        overlayRef.overlayElement.addEventListener('click', () => {

            let pointArr = [
                [121.5417977, 25.0601717],
                [139.6007829, 35.6681625],
                [-74.2598661, 40.6971494],
                [-0.2416812, 51.5285582],
                [120.9162945, 31.2231338]
            ];

            this.autoAroundPoint(pointArr);

            // overlayRef.dispose();
        });

        const optionElement = new TemplatePortal(this.features, this.viewContainerRef);

        overlayRef.attach(optionElement);
    }

    ngAfterViewInit() {

        let globalContainer = this.viewContainerRef.element.nativeElement.querySelector('.global-conatiner');
        setTimeout(() => {
            this.openFeatureOverlay();
        }, 3000);

        setTimeout(() => {

            var width = globalContainer.clientWidth,
                height = globalContainer.clientHeight;

            this.renderer = new THREE.WebGLRenderer();
            this.renderer.setSize(width, height);
            this.renderer.setPixelRatio(window.devicePixelRatio);
            // this.renderer.setClearColor( 0xffffff, 1 );
            globalContainer.appendChild(this.renderer.domElement);

            this.scene = new THREE.Scene();
            this.scene.add(new THREE.AmbientLight(0xbbbbbb, 0.3));

            let directionLight = new THREE.DirectionalLight(0xffffff);
            this.scene.add(directionLight);

            directionLight.position.z = Math.PI / 2;

            this.utility.createEarth().subscribe((globe) => {

                this.scene.add(globe);

                // Array.from({ length: 1 }).forEach(() => {
                //     // this.drawCubicBezierCurve3([(Math.random() - 0.5) * 180, (Math.random() - 0.5) * 360], [121.226181, 25.0169638])
                //     let fromPoint = this.utility.generateDymicalPoint();
                //     let endPoint = this.utility.generateDymicalPoint();
                //     let qq = this.utility.drawCurveLine(fromPoint, endPoint, this.scene);
                //     let qc = this.utility.drawPoint(fromPoint);

                //     this.scene.add(qq);
                //     this.scene.add(qc);
                //     this.scene.add(this.utility.drawPoint(endPoint));
                // });

                // Setup camera
                this.camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);

                this.camera.position.z = 200;
                var helper = new THREE.CameraHelper(this.camera);

                this.control = new TrackballControls(this.camera, globalContainer);
                this.control.zoomSpeed = 0.5;
                this.control.rotateSpeed = 0.5;
                this.control.panSpeed = 0.1;


                let pointArr = [
                    [121.5417977, 25.0601717],
                    [139.6007829, 35.6681625],
                    [-74.2598661, 40.6971494],
                    [-0.2416812, 51.5285582],
                    [120.9162945, 31.2231338]
                ];

                pointArr.forEach(o => {
                    let dyPoint = this.utility.generateDynamicPoint();
                    this.scene.add(this.utility.drawPoint(o));
                    this.scene.add(this.utility.drawPoint(dyPoint));
                    this.scene.add(this.utility.drawCurveLine(dyPoint, o));
                });

                // this.autoAroundPoint(pointArr);

                this.enableControl = true;
                this.status = new status();

                document.body.appendChild(this.status.dom);

                this.play();
            });

        });


    }

    autoAroundPoint(arr) {
        if (arr.length === 0)
            return
        this.utility.foucsCameraToPoint(arr.shift(), this.camera, this.control).subscribe(() => {
            this.autoAroundPoint(arr);
        });
    }

    t = 0;

    play = () => {
        requestAnimationFrame(this.play);
        // this.scene.rotation.y += 0.001;
        if (this.enableControl)
            this.control.update();
        this.renderer.render(this.scene, this.camera);
        this.status.update();
        // this.movingSphere.forEach(o => {
        //     // let t = this.clock.getElapsedTime() * 1000 / 5000;
        //     var pt = o.curve.getPoints(this.t);
        //     // console.log(pt)
        //     o.sphere.position.set(pt.x, pt.y, pt.z);
        //     // debugger;
        //     // console.log('cc')
        // });
        // console.log(this.camera)
    }

    movingSphere = [];

    maxDarwCount = 10;
    currentDrawCount = 0;
    drawPueue = [];


    drawCubicBezierCurve3(startPnt?, endPnt?) {
        this.currentDrawCount++;

        // Over max draw count.
        if (this.currentDrawCount > this.maxDarwCount) {
            // Wait next process to draw.
            this.drawPueue.push({
                start: startPnt,
                end: endPnt
            });
            this.currentDrawCount--;
            return;
        }

        // console.log(this.currentDrawCount, this.drawPueue)

        if (!startPnt && this.drawPueue.length === 0)
            return;

        if (!startPnt) {
            let t = this.drawPueue.shift();
            startPnt = t.start;
            endPnt = t.end;
        }

        this.HandeldrawCubicBezierCurve3(startPnt, endPnt);
    }

    HandeldrawCubicBezierCurve3(startPnt, endPnt) {

        let curves = [startPnt];
        // the three-globe default value.
        let altAutoScale = 0.5
        let altitude = geoDistance(startPnt as [number, number], endPnt as [number, number]) / 2 * altAutoScale;

        const fff = geoInterpolate(startPnt, endPnt);

        Array.from([0.25, 0.75]).forEach((o) => {
            // console.log(o, 'loop')
            let c = fff(o);
            // console.log(c)
            c.push(altitude * 1.5);
            curves.push(c);
            // console.log(this.polar2Cartesian(...c));
        });

        curves.push(endPnt);

        let fg = curves.map(o => {
            return this.utility.convertToSphereCoords(o[1], o[0], o[2]);
        });

        var curve = new CubicBezierCurve3(fg[0], fg[1], fg[2], fg[3]);

        const path = new THREE.Geometry();
        const geometry = path.setFromPoints(curve.getPoints(100));


        let curvePieces = curve.getPoints(100);

        const pathtest = new THREE.Geometry();
        let testPieces = curvePieces.slice(30, 40);
        const testGeometry = pathtest.setFromPoints(testPieces);

        var linetest = new MeshLine();
        linetest.setGeometry(testGeometry);
        var resolution = new THREE.Vector2(window.innerWidth, window.innerHeight);
        var texture = new THREE.TextureLoader().load('/assets/images/stroke.png');

        var materialtest = new MeshLineMaterial({
            map: texture,
            useMap: true,
            color: new THREE.Color(0x0000ff),
            opacity: 1,
            resolution: resolution,
            sizeAttenuation: 1,
            lineWidth: 1,
            near: 1,
            far: 100000,
            depthTest: false,
            blending: THREE.AdditiveBlending,
            transparent: false,
            side: THREE.DoubleSide
        });

        var testcurveObject = new THREE.Mesh(linetest.geometry, materialtest);
        this.scene.add(testcurveObject)
        // console.log(curve.getPoints(200));

        // const geometry = path.createPointsGeometry(100);

        // var points = curve.getPoints(50);
        // var geometry = new THREE.BufferGeometry().setFromPoints(points);
        // var geometry = new THREE.Geometry();
        // geometry.vertices = curve.getPoints(100);
        // Create the final object to add to the scene
        // var curveObject = new MeshLine(geometry, material);
        var line = new MeshLine();
        line.setGeometry(geometry);
        // line.setGeometry(geometry, function (p) { return 2; }); // makes width 2 * lineWidth


        var material = new MeshLineMaterial({
            color: new THREE.Color(0xffffff),
            opacity: 0.3,
            resolution: resolution,
            sizeAttenuation: 1,
            lineWidth: 0.3,
            near: 1,
            far: 100000,
            depthTest: false,
            blending: THREE.AdditiveBlending,
            transparent: false,
            side: THREE.DoubleSide
        });


        let group = new THREE.Group();
        // group.add(curveObject);

        var geometry1 = new THREE.SphereGeometry(1, 32, 32);
        var material1 = new THREE.MeshBasicMaterial({
            color: 0xff0000,
            opacity: 0.6,
            wireframe: true
        });

        var sphere = new THREE.Mesh(geometry1, material1);
        sphere.position.copy(fg[0]);
        // sphere.rotation.x = -Math.PI / 2;
        group.add(sphere);

        this.movingSphere.push({
            sphere: sphere,
            curve: curve
        });

        var tween = new TWEEN.Tween({ x: fg[0].x, y: fg[0].y, z: fg[0].z });
        tween.to({
            x: fg[3].x,
            y: fg[3].y,
            z: fg[3].z
        }, 1000);

        tween.start();
        tween.repeat(Infinity);
        let t = 0;
        tween.onUpdate(function () {
            // console.log(object);
            var pt = curve.getPoint(t);
            sphere.position.copy(pt);
            let speed = 0.01 + Math.random() / 50;
            t = (t >= 1) ? 0 : t += speed;
            // linetest.setGeometry(pathtest.setFromPoints(curvePieces.slice(30 + t * 10, 50 + t * 10)));
        });


        // console.log(curveObject, line, geometry.vertices.length)
        this.scene.add(group);

        setTimeout(() => {
            this.currentDrawCount--;
            this.drawCubicBezierCurve3();
        }, 200);

        return group;
    }

    createStars(radius, segments) {
        return new THREE.Mesh(
            new THREE.SphereGeometry(radius, segments, segments),
            new THREE.MeshBasicMaterial({
                map: THREE.ImageUtils.loadTexture('/assets/images/galaxy_starfield.png'),
                side: THREE.BackSide
            })
        );
    }


}
