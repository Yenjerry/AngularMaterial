import Earcut from "earcut";
import { HttpClient } from '@angular/common/http';
import { Component, OnInit, ViewChild, ElementRef, AfterViewInit, ViewContainerRef } from '@angular/core';
import * as THREE from 'three';
import { Utility } from 'src/app/Common/utility';
import * as  TrackballControls from 'three-trackballcontrols';
import GLTFLoader from 'three-gltf-loader';
import TWEEN from '@tweenjs/tween.js';
import { geoInterpolate } from 'd3-geo';
import { EarthManagement } from 'src/app/Common/earth-utility';

@Component({
    selector: 'app-test-globe',
    templateUrl: './test-globe.component.html',
    styleUrls: ['./test-globe.component.scss']
})
export class TestGlobeComponent implements OnInit, AfterViewInit {

    @ViewChild('webGl', { static: false }) webglEl: ElementRef;
    controls;
    renderer;
    scene;
    camera;
    utility: EarthManagement;

    constructor(private viewContainerRef: ViewContainerRef, private http: HttpClient) {
        this.utility = new EarthManagement(http, 'sphere');
    }

    ngOnInit() {
    }

    ngAfterViewInit() {
        let globalContainer = this.viewContainerRef.element.nativeElement.querySelector('.global-conatiner');

        setTimeout(() => {
            var WIDTH = globalContainer.clientWidth,
                HEIGHT = globalContainer.clientHeight;


            var angle = 45,
                aspect = WIDTH / HEIGHT,
                near = 0.5,
                far = 1000;

            // Renderer the canvas
            this.renderer = new THREE.WebGLRenderer();
            this.scene = new THREE.Scene();

            this.camera = new THREE.PerspectiveCamera(angle, aspect, near, far);
            this.renderer.setSize(WIDTH, HEIGHT);
            globalContainer.appendChild(this.renderer.domElement);

            this.scene.add(new THREE.AmbientLight(0xFFFFFF));


            this.utility.fetchGeojson().subscribe(geoJson => {

                geoJson[0].features.forEach((o, i) => {

                    console.log(o)

                    this.scene.add(this.utility.createCounty(o));

                });


                // console.log(data1, triangles1, deviation1)

                /*
                     6----7
                    /|   /|
                   2----3 |
                   | |  | |
                   | 4--|-5
                   |/   |/
                   0----1
                */

                // geometry1.faces.push(
                //     // front
                //     new THREE.Face3(0, 3, 2),
                //     new THREE.Face3(0, 1, 3),
                //     // right
                //     new THREE.Face3(1, 7, 3),
                //     new THREE.Face3(1, 5, 7),
                //     // back
                //     new THREE.Face3(5, 6, 7),
                //     new THREE.Face3(5, 4, 6),
                //     // left
                //     new THREE.Face3(4, 2, 6),
                //     new THREE.Face3(4, 0, 2),
                //     // top
                //     new THREE.Face3(2, 7, 6),
                //     new THREE.Face3(2, 3, 7),
                //     // bottom
                //     new THREE.Face3(4, 1, 0),
                //     new THREE.Face3(4, 5, 1),
                // );

                // console.log('geometry1', geometry1)

                // const material1 = new THREE.MeshBasicMaterial({ color: 0x0000ff });

                // const cube = new THREE.Mesh(geometry1, material1);
                // this.scene.add(cube);



            });


            //Set the camera position
            this.camera.position.z = 120;

            //Enable controls
            this.controls = new TrackballControls(this.camera, globalContainer);
            this.controls.zoomSpeed = 0.01;
            // this.controls.rotationSpeed = 0.01;

            let raycaster = new THREE.Raycaster();

            ['click', 'touchend'].forEach(listenEvent => {
                this.renderer.domElement.addEventListener(listenEvent, (event) => {
                    let mouse = new THREE.Vector2();

                    mouse.x = (event.offsetX / this.renderer.domElement.clientWidth) * 2 - 1;
                    mouse.y = - (event.offsetY / this.renderer.domElement.clientHeight) * 2 + 1;

                    raycaster.setFromCamera(mouse, this.camera);
                    let intersects = raycaster.intersectObjects(this.scene.children, true);

                    console.log(intersects)


                })
            })



            this.render();

        });


    }

    //Render the image
    render = () => {
        this.controls.update();
        requestAnimationFrame(this.render);
        this.renderer.render(this.scene, this.camera);
        TWEEN.update();
    }


    private generateCoords() {
        return [(Math.random() - 0.5) * 180, (Math.random() - 0.5) * 360];
    }

    loadGltfModel(container, playAnimate = true) {
        // Instantiate a loader
        var loader = new GLTFLoader();
        var _this = this;
        // Optional: Provide a DRACOLoader instance to decode compressed mesh data
        // var dracoLoader = new THREE.DRACOLoader();
        // dracoLoader.setDecoderPath('/examples/js/libs/draco');
        // loader.setDRACOLoader(dracoLoader);

        // Load a glTF resource
        loader.load(
            // resource URL
            '/assets/objects/test_rocket/scene.gltf',
            // called when the resource is loaded
            function (gltf) {

                let coords = Utility.convertToPlaneCoords([25.0169638, 121.226181], 100);
                let coords1 = Utility.convertToPlaneCoords(_this.generateCoords(), 100);


                let interFn = geoInterpolate([coords[0], coords[1]], [coords1[0], coords1[1]]);

                let one = interFn(0.25);
                let two = interFn(0.5);
                let three = interFn(0.75);

                if (playAnimate) {

                    // Set animate for rocket.
                    var tween = new TWEEN.Tween({ x: coords[0], y: coords[1], z: 0 });
                    tween.to({
                        x: coords1[0],
                        y: coords1[1],
                        z: [10, 20, 10, 0]
                    }, 3000);

                    tween.start();
                    tween.repeat(Infinity);
                    // tween.easing(TWEEN.Easing.Cubic.Out);

                    tween.onUpdate(function (object) {
                        // console.log(object);
                        gltf.scene.position.x = object.x;
                        gltf.scene.position.y = object.y;
                        gltf.scene.position.z = object.z;
                    });
                }

                var angle = 60;//Math.atan2(coords1[1] - coords[1], coords1[0] - coords[0]);

                var rotateAngle = (angle * Math.PI / 160);
                console.log(angle, angle * 180 / Math.PI, rotateAngle);

                container.add(gltf.scene);
                gltf.scene.position.x = coords[0];
                gltf.scene.position.y = coords[1];

                var pointLight = new THREE.PointLight(0xff0000, 1, 100);
                pointLight.position.set(0, 10, 0);

                // gltf.scene.add(pointLight);

                // var sphereSize = 1000;
                // var pointLightHelper = new THREE.PointLightHelper(pointLight, sphereSize);
                // gltf.scene.add(pointLightHelper);

                gltf.scene.rotateX(rotateAngle);
                // gltf.scene.add(new THREE.AmbientLight(0xFFFFFF, 1));
                // var pointLight = new THREE.PointLight(0x0000ff, 1000, 20);
                // pointLight.castShadow = true;
                // pointLight.shadow.camera.near = 1;
                // pointLight.shadow.camera.far = 60;
                // pointLight.shadow.bias = - 0.005; // reduces self-shadowing on double-sided objects

                // gltf.scene.add(pointLight);
                var axesHelper = new THREE.AxesHelper(500);
                // gltf.scene.add(axesHelper);

                gltf.scene.scale.set(0.01, 0.01, 0.01);
                gltf.animations; // Array<THREE.AnimationClip>
                gltf.scene; // THREE.Scene
                gltf.scenes; // Array<THREE.Scene>
                gltf.cameras; // Array<THREE.Camera>
                gltf.asset; // Object

            },
            // called while loading is progressing
            function (xhr) {

                console.log((xhr.loaded / xhr.total * 100) + '% loaded');

            },
            // called when loading has errors
            function (error) {

                console.log('An error happened');

            }
        );
    }

}
