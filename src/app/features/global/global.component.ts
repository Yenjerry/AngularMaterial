import { Subject } from 'rxjs';
import { Overlay } from '@angular/cdk/overlay';
import { HttpClient } from '@angular/common/http';

import { Component, OnInit, AfterViewInit, ViewContainerRef, ViewChild, ElementRef, AfterContentInit, AfterViewChecked, NgZone, TemplateRef, Input } from '@angular/core';
import * as THREE from 'three';
import { Vector3, CubicBezierCurve3 } from 'three';
import ThreeGlobe from 'three-globe';
import * as  TrackballControls from 'three-trackballcontrols';
import { TemplatePortal } from '@angular/cdk/portal';


@Component({
    selector: 'app-global',
    templateUrl: './global.component.html',
    styleUrls: ['./global.component.scss']
})
export class GlobalComponent implements OnInit, AfterViewInit {

    @ViewChild('webglEl', { static: false }) webglEl: ElementRef
    @ViewChild('conturyDetail', { static: false }) conturyTemplate: TemplateRef<ElementRef>;

    resizeSubject: Subject<any>;

    constructor(private http: HttpClient, private viewContainerRef: ViewContainerRef, private overlay: Overlay) {

      

    }

    ngOnInit() {
        this.resizeSubject.subscribe((e) => {
            this.windowResize();
        })
    }

    globeType: number;
    focusCountry: any;
    globe;
    renderer;
    scene;
    camera;
    control;
    sphere;
    clouds;
    light;
    container;

    ngAfterViewInit(): void {

        let globalContainer = this.viewContainerRef.element.nativeElement.querySelector('.global-conatiner');
        this.container = globalContainer;

        // Wait next draw to get new reponsive height.
        setTimeout(() => {
            var width = globalContainer.clientWidth,
                height = globalContainer.clientHeight;

            // console.dir(globalContainer);

            // console.log(width, globalContainer.clientHeight, globalContainer.offsetHeight);

            // Earth params
            var radius = 0.5,
                segments = 32,
                rotation = 0;
            const N = 10;

            const arcsData = [...Array(N).keys()].map(() => ({
                startLat: (Math.random() - 0.5) * 180,
                startLng: (Math.random() - 0.5) * 360,
                endLat: 25.0169638,
                endLng: 121.226181,
                color: ['#3f51b5', 'blue']
            }));


            this.renderer = new THREE.WebGLRenderer();
            this.renderer.setSize(width, height);
            this.renderer.setPixelRatio(window.devicePixelRatio);
            this.webglEl.nativeElement.appendChild(this.renderer.domElement);

            const Globe = new ThreeGlobe()
                .globeImageUrl('/assets/images/2_no_clouds_4k.jpg')
                .bumpImageUrl('/assets/images/elev_bump_4k.jpg')
                .showAtmosphere(false)
                // .globeImageUrl('//unpkg.com/three-globe/example/img/earth-night.jpg')
                .arcsData(arcsData)
                .showGraticules(true)
                .arcStroke(1)
                .arcCurveResolution(200)
                .arcDashAnimateTime(500)
                .arcsTransitionDuration(0)
                .arcDashGap(2)
                .arcColor('color');

            this.globe = Globe;

            Globe.rotation.y = -Math.PI / 1.45;

            this.scene = new THREE.Scene();
            this.sphere = Globe;
            this.scene.add(Globe);
            this.scene.add(new THREE.AmbientLight(0xbbbbbb, .1));

            this.light = new THREE.DirectionalLight(0xffffff, 1);
            this.light.position.x = -90;
            this.light.position.z = 270;
            this.scene.add(this.light);


            arcsData.forEach(o => {
                this.drawCubicBezierCurve3([o.startLng, o.startLat], [o.endLng, o.endLat]);
            })


            // var loader = new THREE.ObjectLoader();

            // loader.load(
            //     // resource URL
            //     "/assets/objects/model.json",

            //     // onLoad callback
            //     // Here the loaded data is assumed to be an object
            //     function (obj) {
            //         obj.rotation.z = Math.PI / 3;
            //         obj.rotation.y = Math.PI / 6;
            //         obj.userData = {
            //             name: 'Taipei'
            //         }
            //         obj.position.copy(point);

            //         console.log(obj)
            //         // Add the loaded object to the scene
            //         Globe.add(obj);
            //     },

            //     // onProgress callback
            //     function (xhr) {
            //         console.log((xhr.loaded / xhr.total * 100) + '% loaded');
            //     },

            //     // onError callback
            //     function (err) {
            //         console.error('An error happened');
            //     }
            // );

            var raycaster = new THREE.Raycaster(); // create once
            var mouse = new THREE.Vector2(); // create once

            // globalContainer.addEventListener('click', (event) => {
            //     mouse.x = (event.offsetX / this.renderer.domElement.clientWidth) * 2 - 1;
            //     mouse.y = - (event.offsetY / this.renderer.domElement.clientHeight) * 2 + 1;

            //     console.log(event.clientX, this.renderer.domElement.clientWidth)
            //     raycaster.setFromCamera(mouse, this.camera);

            //     var intersects = raycaster.intersectObjects(this.scene.children, true);
            //     console.log(intersects)
            //     intersects.forEach(o => {
            //         if (o.object.hasOwnProperty('userData')) {
            //             if (o.object.userData.hasOwnProperty('name')) {
            //                 if (o.object.userData.already) {
            //                     return;
            //                 }
            //                 o.object.scale.set(5, 5, 5);
            //                 this.focusCountry = o.object.userData;
            //                 o.object.userData.already = true;
            //                 this.showCountryDetail();
            //             }
            //         }
            //     })
            // })


            var stars = this.createStars(200, 64);
            this.scene.add(stars);

            // Setup camera
            this.camera = new THREE.PerspectiveCamera(45, width / height, 1, 10000);
            // this.camera.aspect = width / height;
            this.camera.updateProjectionMatrix();
            this.camera.position.z = 500;

            this.control = new TrackballControls(this.camera, globalContainer);
            // The control camera setting.
            this.control.rotateSpeed = 2;
            this.control.minDistance = 200;
            this.control.maxDistance = 1000;
            this.control.noPan = true;
            // End control camera setting.

            // var axesHelper = new THREE.AxesHelper(200);
            // this.scene.add(axesHelper);

            console.log(this.scene)

            this.play();
            // Watch windows resize event.
            globalContainer.addEventListener('resize', () => {
                this.windowResize();
            });
        });
    }

    windowResize() {

        console.log('fire here', this.container)

        if (!this.viewContainerRef)
            return false;

        let globalContainer = this.viewContainerRef.element.nativeElement.querySelector('.global-conatiner');

        var width = globalContainer.clientWidth,
            height = globalContainer.clientHeight;

        // Update new width/height
        this.renderer.setSize(width, height, false);
        this.camera.aspect = width / height;
        this.camera.updateProjectionMatrix();

        console.log('fire')
    }


    drawCubicBezierCurve3(startPnt, endPnt) {

        return false;
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
            return this.globe.getCoords(o[1], o[0], o[2]);
        });

        var curve = new CubicBezierCurve3(fg[0], fg[1], fg[2], fg[3]);

        var points = curve.getPoints(50);
        var geometry = new THREE.BufferGeometry().setFromPoints(points);

        var material = new THREE.LineBasicMaterial({ color: 0xffffff });

        // Create the final object to add to the scene
        var curveObject = new THREE.Line(geometry, material);

        this.globe.add(curveObject)
    }


    showCountryDetail() {
        // Setting the overlay position policy.
        const strategy = this.overlay
            .position()
            .flexibleConnectedTo(this.webglEl).withPositions([{
                originX: 'start',
                originY: 'top',
                overlayX: 'start',
                overlayY: 'top'
            }]);

        const overlayRef = this.overlay.create({
            width: '30%',
            height: '30%',
            positionStrategy: strategy,
            // hasBackdrop: true,
            backdropClass: 'opacitybackdrop'
        });

        // overlayRef.backdropClick().subscribe(() => {
        //     overlayRef.dispose();
        // });

        overlayRef.overlayElement.addEventListener('click', () => {
            overlayRef.dispose();
        });

        const optionElement = new TemplatePortal(this.conturyTemplate, this.viewContainerRef);

        overlayRef.attach(optionElement);
        console.log('fire overlay')
    }

    generateLight(point) {

        // Light column
        let texture = new THREE.TextureLoader().load('/assets/images/lightray_yellow.jpg');
        // texture.repeat.set(0.3, 0.3);
        let material = new THREE.MeshBasicMaterial({
            map: texture,
            transparent: true,
            depthTest: false,
            side: THREE.DoubleSide,
            blending: THREE.AdditiveBlending
        });

        var _height = 15,
            geometry = new THREE.PlaneGeometry(1, _height),
            matrix1 = new THREE.Matrix4,
            plane1 = new THREE.Mesh(geometry, material)

        matrix1.makeRotationX(Math.PI / 2)
        matrix1.setPosition(new THREE.Vector3(0, 0, _height / -2 + 0.1))
        geometry.applyMatrix(matrix1)
        plane1.userData = {
            test: 'Is good for three js test.'
        }
        let plane2 = plane1.clone()
        plane2.rotation.z = Math.PI / 3;
        plane1.add(plane2)
        plane1.position.copy(point);
        plane1.lookAt(0, 0, 0)
        // this.scene.add(plane1)
        // End light column.
        plane1.rotation.y = Math.PI / 3;
        plane2.userData = {
            test: 'Is good for three js test.'
        }

        return plane1;
    }

    play = () => {
        this.control.update();
        // this.camera.rotation.y += 0.0005;
        // this.scene.rotation.y += 0.0005;
        // this.sphere.rotation.y += 0.001;
        requestAnimationFrame(this.play);
        this.renderer.render(this.scene, this.camera);
    }

    createSphere(radius, segments) {

        // let texture = new THREE.TextureLoader().load('/assets/images/2_no_clouds_4k.jpg');
        // texture.rotation = Math.PI / 2;


        let globeObj = new THREE.Mesh(
            new THREE.SphereGeometry(radius, segments, segments),
            new THREE.MeshPhongMaterial({
                map: THREE.ImageUtils.loadTexture('/assets/images/2_no_clouds_4k.jpg'),
                // bumpMap: THREE.ImageUtils.loadTexture('/assets/images/elev_bump_4k.jpg'),
                // bumpScale: 0.005,
                // specularMap: THREE.ImageUtils.loadTexture('/assets/images/water_4k.png'),
                // specular: new THREE.Color('grey')
            })
        );

        globeObj.rotation.y = -Math.PI / 2;
        return globeObj;
    }

    createClouds(radius, segments) {
        return new THREE.Mesh(
            new THREE.SphereGeometry(radius + 0.003, segments, segments),
            new THREE.MeshPhongMaterial({
                map: THREE.ImageUtils.loadTexture('/assets/images/fair_clouds_4k.png'),
                transparent: true
            })
        );
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

};