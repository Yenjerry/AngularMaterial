import { HttpClient } from '@angular/common/http';
import { Component, OnInit, ViewChild, ElementRef, AfterViewInit, ViewContainerRef } from '@angular/core';
import * as THREE from 'three';
import { Utility } from 'src/app/Common/utility';
import * as  TrackballControls from 'three-trackballcontrols';
import GLTFLoader from 'three-gltf-loader';
import TWEEN from '@tweenjs/tween.js';
import { geoInterpolate } from 'd3-geo';

@Component({
    selector: 'app-test-globe',
    templateUrl: './test-globe.component.html',
    styleUrls: ['./test-globe.component.scss']
})
export class TestGlobeComponent implements OnInit, AfterViewInit {

    @ViewChild('webGl', { static: false }) webglEl: ElementRef;

    constructor(private viewContainerRef: ViewContainerRef, private http: HttpClient) { }

    ngOnInit() {
    }

    controls;
    renderer;
    scene;
    camera;

    ngAfterViewInit() {
        let globalContainer = this.viewContainerRef.element.nativeElement.querySelector('.global-conatiner');


        setTimeout(() => {
            var WIDTH = globalContainer.clientWidth,
                HEIGHT = globalContainer.clientHeight;


            var angle = 75,
                aspect = WIDTH / HEIGHT,
                near = 0.5,
                far = 1000;

            // Renderer the canvas
            this.renderer = new THREE.WebGLRenderer();
            this.scene = new THREE.Scene();

            this.camera = new THREE.PerspectiveCamera(angle, aspect, near, far);
            this.renderer.setSize(WIDTH, HEIGHT);
            // this.renderer.setClearColor(0xffffff, 1);
            globalContainer.appendChild(this.renderer.domElement);

            // create a point light (goes in all directions)
            this.scene.add(new THREE.AmbientLight(0x71ABEF));

            Array.from({ length: 5 }).forEach(() => { this.loadGltfModel(this.scene, true); });




            // Create a sphere to make visualization easier.
            var geometry = new THREE.SphereGeometry(1, 32, 32);
            var material = new THREE.MeshPhongMaterial({
                color: 0xDDDDDD,
                wireframe: false,
                transparent: true
            });

            let coords = Utility.convertToPlaneCoords([25.0169638, 121.226181], 100);
            let coords1 = Utility.convertToPlaneCoords([40.6971494, -74.2598655], 100);

            var sphere = new THREE.Mesh(geometry, material);
            sphere.position.x = coords[0];
            sphere.position.y = coords[1];

            var sphere1 = new THREE.Mesh(geometry, material);
            sphere1.position.x = coords1[0];
            sphere1.position.y = coords1[1];
            sphere.userData = {
                name: 'Taipei'
            };


            this.scene.add(sphere);
            this.scene.add(sphere1);

            var raycaster = new THREE.Raycaster(); // create once
            var mouse = new THREE.Vector2(); // create once

            globalContainer.addEventListener('click', (event) => {
                mouse.x = (event.offsetX / this.renderer.domElement.clientWidth) * 2 - 1;
                mouse.y = - (event.offsetY / this.renderer.domElement.clientHeight) * 2 + 1;

                // console.log(event.clientX, this.renderer.domElement.clientWidth)
                raycaster.setFromCamera(mouse, this.camera);

                var intersects = raycaster.intersectObjects(this.scene.children, true);
                // console.log(intersects)
                intersects.forEach(o => {
                    if (o.object.hasOwnProperty('userData')) {
                        if (o.object.userData.hasOwnProperty('name')) {
                            alert(o.object.userData.name)
                        }
                    }
                })
            });


            sphere.castShadow = true;
            sphere.receiveShadow = true;

            var group = new THREE.Group();

            // var textureLoader = new THREE.TextureLoader();
            // var textureFlare0 = textureLoader.load( '/assets/images/lensflare0.png' );

            //Draw the GeoJSON at THREE.ParticleSystemMaterial
            var countries = this.http.get("/assets/custom.geo_large.json").subscribe((result) => {
                Utility.drawThreeGeo(result, 100, 'plane', {
                    color: 0xffffff
                }, group);
            });

            // var rivers = this.http.get("https://s3-us-west-2.amazonaws.com/s.cdpn.io/230399/rivers.geojson").subscribe((result) => {
            //     Utility.drawThreeGeo(result, 10, 'plane', {
            //         color: '#4A90E2'
            //     }, group);
            // });
            group.rotation.z = Math.PI / 2;
            group.rotation.y = Math.PI;

            this.scene.add(group);

            //Set the camera position
            this.camera.position.z = 120;

            //Enable controls
            this.controls = new TrackballControls(this.camera, globalContainer);
            // this.controls.noRotate = true;
            // this.controls.updateMouseEvent({
            //     PAN: 0,
            //     ROTATE: 2
            // })
            // Slow down zooming
            // this.controls.zoomSpeed = 0.1;

            console.log(this.scene)

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
                pointLight.position.set(0,10,0);
                
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
