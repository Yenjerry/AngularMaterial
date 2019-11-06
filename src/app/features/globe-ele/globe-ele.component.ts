import { HttpClient } from '@angular/common/http';
import { Component, OnInit, ViewChild, ElementRef, AfterViewInit, ViewContainerRef } from '@angular/core';
import * as THREE from 'three';
import ThreeGlobe from 'three-globe';
import * as  TrackballControls from 'three-trackballcontrols';
import { geoDistance, geoInterpolate } from 'd3-geo';
import { CubicBezierCurve3, Clock } from 'three';
import TWEEN from '@tweenjs/tween.js';
import { MeshLine, MeshLineMaterial } from 'three.meshline';
import Bird from 'src/app/Models/bird';
import status from 'stats.js';
import { EarthUtility } from 'src/app/Common/earth-utility';

@Component({
    selector: 'app-globe-ele',
    templateUrl: './globe-ele.component.html',
    styleUrls: ['./globe-ele.component.scss']
})
export class GlobeEleComponent implements OnInit, AfterViewInit {

    @ViewChild('webGl', { static: false }) webglEl: ElementRef;

    control;
    renderer;
    scene;
    camera;
    globe;
    composer;
    clock = new Clock();
    data;
    utility: EarthUtility;

    constructor(private viewContainerRef: ViewContainerRef, http: HttpClient) {
        this.utility = new EarthUtility(http);
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

    ngAfterViewInit() {

        let globalContainer = this.viewContainerRef.element.nativeElement.querySelector('.global-conatiner');

        // setInterval(() => {
        //     this.utility.foucsCameraToShperePoint(this.camera, [(Math.random() - 0.5) * 180, (Math.random() - 0.5) * 360]);
        // }, 5000);

        setTimeout(() => {
            var width = globalContainer.clientWidth,
                height = globalContainer.clientHeight;

            this.renderer = new THREE.WebGLRenderer();
            this.renderer.setSize(width, height);
            this.renderer.setPixelRatio(window.devicePixelRatio);
            // this.renderer.setClearColor( 0xffffff, 1 );
            globalContainer.appendChild(this.renderer.domElement);

            this.scene = new THREE.Scene();
            this.scene.add(new THREE.AmbientLight(0xbbbbbb, 1));
            this.globe = new ThreeGlobe();
            let point = this.utility.getCoords(121.5417977, 25.0601717);

            this.utility.createEarth('sphere').subscribe((globe) => {
                this.scene.add(globe);


                // var camDistance = this.camera.position.length();
                // this.camera.position.copy(point).normalize().multiplyScalar(camDistance);
                // this.camera.fov = 20;
                this.utility.foucsCameraToShperePoint(this.camera, [121.5417977, 25.0601717]);
                // this.camera.updateProjectionMatrix();
                // setTimeout(() => {
                //     this.utility.foucsCameraToShperePoint(this.camera, [-74.2598661, 40.6971494]);
                // }, 2000);
            });

            this.scene.add(this.utility.drawPoint([121.5417977, 25.0601717]))

            var globeGeometry = new THREE.SphereGeometry(100, 32, 32);
            var globeMaterial = new THREE.MeshBasicMaterial({
                color: 0x000000,
                // wireframe: true
            });

            var globeSphere = new THREE.Mesh(globeGeometry, globeMaterial);
            this.scene.add(globeSphere);

            Array.from({ length: 10 }).forEach(() => {
                // this.drawCubicBezierCurve3([(Math.random() - 0.5) * 180, (Math.random() - 0.5) * 360], [121.226181, 25.0169638])
                let fromPoint = [(Math.random() - 0.5) * 180, (Math.random() - 0.5) * 360];

                let qq = this.utility.drawCurveLine(fromPoint, [121.5417977, 25.0601717], this.scene);
                let qc = this.utility.drawPoint(fromPoint);

                this.scene.add(qq);
                this.scene.add(qc);
            });

            // let bird = new THREE.Mesh(new Bird(), new THREE.MeshBasicMaterial({ color: Math.random() * 0xffffff, side: THREE.DoubleSide }));

            // var geometry = new THREE.TorusGeometry(0.5, 0.1, 2, 32);
            // var material = new THREE.MeshBasicMaterial({ color: 0xffff00 });
            // var torus = new THREE.Mesh(geometry, material);
            // torus.position.copy(point);

            // var axesHelper = new THREE.AxesHelper(250);
            // torus.lookAt(0, 0, 0)
            // torus.add(axesHelper);

            // this.scene.add(torus);

            // createEarth('sphere');


            // console.log(q)
            // Setup camera
            this.camera = new THREE.PerspectiveCamera(45, width / height, 10, 1000);

            // this.camera.aspect = width / height;
            this.camera.updateProjectionMatrix();
            this.camera.position.z = 150;

            this.control = new TrackballControls(this.camera, globalContainer);
            this.control.zoomSpeed = 1;

            this.status = new status();

            // var axesHelper = new THREE.AxesHelper(250);
            // this.scene.add(axesHelper);

            document.body.appendChild(this.status.dom);
            this.play();
        });

    }

    t = 0;

    play = () => {
        requestAnimationFrame(this.play);
        // this.scene.rotation.y += 0.001;
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
            return this.globe.getCoords(o[1], o[0], o[2]);
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
