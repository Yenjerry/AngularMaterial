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
import { BloomEffect, EffectComposer, EffectPass, RenderPass, KernelSize } from "postprocessing";
import { Clock } from 'three';

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
    composer;
    torus;
    constructor(private viewContainerRef: ViewContainerRef, private http: HttpClient) {
        this.utility = new EarthManagement(http, 'sphereline');
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
                far = 100000;

            // Renderer the canvas
            this.renderer = new THREE.WebGLRenderer();
            this.scene = new THREE.Scene();

            this.camera = new THREE.PerspectiveCamera(angle, aspect, near, far);

            this.renderer.setSize(WIDTH, HEIGHT);
            globalContainer.appendChild(this.renderer.domElement);

            // this.scene.add(new THREE.AmbientLight(0xFFFFFF, 1));

            let directionLight = new THREE.DirectionalLight(0xffffff, 0.75);
            directionLight.position.z = 150;
            var helper = new THREE.DirectionalLightHelper(directionLight, 5);
            directionLight.lookAt(0, 0, 0);
            // this.scene.add(helper);

            // let column = this.utility.makeGradientCylinder(0.1, 0.1, 5);
            // // column.rotation.y = Math.PI / 2;

            // this.scene.add(column);


            // this.camera.lookAt(column);

            var texture = new THREE.TextureLoader().load('/assets/images/contour1_1.png');
            var material = new THREE.MeshBasicMaterial({
                map: texture,
                color: 0x31b477,
                fog: false,
                transparent: true,
                blending: THREE.AdditiveBlending,
                depthWrite: false
            });

            // material.map.generateMipalphaMaps = false;
            material.map.magFilter = THREE.LinearFilter;
            material.map.minFilter = THREE.LinearFilter;
            // m1.needsUpdate = true;


            var geometry = new THREE.SphereBufferGeometry(100 * .995, 32, 32, 0, Math.PI);
            var sphere = new THREE.Mesh(geometry, material);


            var texture1 = new THREE.TextureLoader().load('/assets/images/contour2_1.png');
            var material1 = new THREE.MeshBasicMaterial({
                map: texture1,
                color: 0x31b477,
                fog: false,
                transparent: true,
                blending: THREE.AdditiveBlending,
                depthWrite: false
            });

            material1.map.magFilter = THREE.LinearFilter;
            material1.map.minFilter = THREE.LinearFilter;

            var geometry1 = new THREE.SphereBufferGeometry(100 * .995, 32, 32, 0, Math.PI);
            var sphere1 = new THREE.Mesh(geometry1, material1);

            sphere1.rotation.y = Math.PI;

            let gorup = new THREE.Group();
            gorup.rotation.y = -Math.PI / 2.3;
            // gorup.rotation.x = -Math.PI / 48;
            gorup.add(sphere);
            gorup.add(sphere1);
            // this.scene.add(gorup);


            let pointGroup = new THREE.Group();
            pointGroup.add(this.utility.test());
            pointGroup.rotation.y = -Math.PI / 180 * 90;
            pointGroup.rotation.x = Math.PI / 180 * 6;
            pointGroup.rotation.z = Math.PI / 180 * 6;

            this.utility.createEarth().subscribe(globe => {
                this.scene.add(globe);
                this.scene.add(pointGroup);
                this.scene.add(this.utility.drawPoint([121.5579448, 25.0340248]));
            });



            var cloudTexture = new THREE.TextureLoader().load('/assets/images/2k_earth_clouds.jpg');
            var cloudmaterial = new THREE.MeshBasicMaterial({
                map: cloudTexture,
                // color: 0x31b477,
                fog: false,
                transparent: true,
                blending: THREE.AdditiveBlending,
                depthWrite: false,
                opacity: 0.1
            });

            cloudmaterial.map.magFilter = THREE.LinearFilter;
            cloudmaterial.map.minFilter = THREE.LinearFilter;

            var cloudGeomerty = new THREE.SphereBufferGeometry(110 * .995, 32, 32);
            var cloud = new THREE.Mesh(cloudGeomerty, cloudmaterial);

            this.scene.add(cloud)

            // var pointLight = new THREE.PointLight(0xff0000, 30, 0);
            // pointLight.position.set(10, -110, 10);
            // this.scene.add(pointLight);

            // var sphereSize = 1;
            // var pointLightHelper = new THREE.PointLightHelper(pointLight, sphereSize);
            // this.scene.add(pointLightHelper);


            var geometrys = new THREE.SphereGeometry(80, 32, 32);
            var materials = new THREE.MeshLambertMaterial({
                color: 0xffff00,
                opacity: 0.1,
                depthWrite: false,
                transparent: true,
                side: THREE.FrontSide
            });
            var spheres = new THREE.Mesh(geometrys, materials);
            this.scene.add(spheres);


            let countys = [
                [121.5579448, 25.0340248],
                [121.4406349, 31.2631945],
                [139.6007829, 35.6681625],
                [150.651786, -33.847927],
                [-0.2416812, 51.5285582],
                [13.144554, 52.5065133],
                [-74.2598661, 40.6971494]
            ]

            countys.forEach(coountyPoint => {
                this.scene.add(this.generateShiningPoint(coountyPoint));
            });


            var geometrycc = new THREE.TorusGeometry(110, 0.16, 64, 100);
            var materialcc = new THREE.MeshBasicMaterial({
                color: 0x25472d,
                opacity: 0.75,
                transparent: true
            });

            var torus = new THREE.Mesh(geometrycc, materialcc);
            torus.rotation.x = Math.PI / 4;
            torus.rotation.y = Math.PI / 6;

            let torus1 = torus.clone();
            torus1.rotation.x = Math.PI;
            torus1.rotation.y = Math.PI / 12;
            this.torus = torus.clone();

            this.scene.add(torus);
            this.scene.add(torus1);
            this.scene.add(this.torus)




            this.scene.add(this.utility.createStars(300, 32));




            //Set the camera position
            this.camera.position.z = 300;

            //Enable controls
            this.controls = new TrackballControls(this.camera, globalContainer);
            // this.controls.zoomSpeed = 0.01;
            // this.controls.rotationSpeed = 0.01;

            let raycaster = new THREE.Raycaster();

            ['click', 'touchend'].forEach(listenEvent => {
                this.renderer.domElement.addEventListener(listenEvent, (event) => {
                    let mouse = new THREE.Vector2();

                    mouse.x = (event.offsetX / this.renderer.domElement.clientWidth) * 2 - 1;
                    mouse.y = - (event.offsetY / this.renderer.domElement.clientHeight) * 2 + 1;

                    raycaster.setFromCamera(mouse, this.camera);
                    let intersects = raycaster.intersectObjects(this.scene.children, true);

                    // console.log(intersects)


                })
            })



            this.render();

        });


    }


    generateShiningPoint(point) {
        var lightTexture = new THREE.TextureLoader().load('/assets/images/blue-light.png');
        var lightmaterial = new THREE.MeshBasicMaterial({
            map: lightTexture,
            // color: 0x31b477,
            transparent: true,
            // blending: THREE.AdditiveBlending,
            depthWrite: false,
            // opacity: 0.1,
            side: THREE.DoubleSide
        });

        lightmaterial.map.magFilter = THREE.LinearFilter;
        lightmaterial.map.minFilter = THREE.LinearFilter;
        lightmaterial.map.offset = new THREE.Vector2(0.03, -0.01);

        var lightGeomerty = new THREE.CircleGeometry(5, 32, 32);
        var sphereLight = new THREE.Mesh(lightGeomerty, lightmaterial);

        let position = this.utility.convertToSphereCoords(point[0], point[1]);

        sphereLight.position.copy(position as THREE.Vector3);

        sphereLight.lookAt(0, 0, 0);

        return sphereLight;
    }


    clock = new Clock();

    //Render the image
    render = () => {
        this.controls.update();
        requestAnimationFrame(this.render);
        this.renderer.render(this.scene, this.camera);
        // this.composer.render(this.clock.getDelta());
        TWEEN.update();
        this.torus.rotation.x += 0.01;
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
