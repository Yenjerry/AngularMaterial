import { MeshLine, MeshLineMaterial } from 'three.meshline';
import { HttpClient } from '@angular/common/http';
import { Observable, forkJoin } from 'rxjs';
import * as THREE from 'three';
import { geoDistance, geoInterpolate } from 'd3-geo';
import { CubicBezierCurve3, Vector3, Mesh, AdditiveBlending } from 'three';
import TWEEN from '@tweenjs/tween.js';
import { ResourceTracker } from './resource-tracker';
import Earcut from "earcut";

const Shaders = {
    'earth': {
        uniforms: {
            'texture': {
                type: 't',
                value: null
            }
        },
        vertexShader: [
            'varying vec3 vNormal;',
            'varying vec2 vUv;',
            'void main() {',
            'gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );',
            'vNormal = normalize( normalMatrix * normal );',
            'vUv = uv;',
            '}'
        ].join('\n'),
        fragmentShader: [
            'uniform sampler2D texture;',
            'varying vec3 vNormal;',
            'varying vec2 vUv;',
            'void main() {',
            'vec3 diffuse = texture2D( texture, vUv ).xyz;',
            'float intensity = 1.05 - dot( vNormal, vec3( 0.0, 0.0, 1.0 ) );',
            'vec3 atmosphere = vec3( 1.0, 1.0, 1.0 ) * pow( intensity, 3.0 );',
            'gl_FragColor = vec4( diffuse + atmosphere, 1.0 );',
            '}'
        ].join('\n')
    },
    'atmosphere': {
        uniforms: {},
        vertexShader: [
            'varying vec3 vNormal;',
            'void main() {',
            'vNormal = normalize( normalMatrix * normal );',
            'gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );',
            '}'
        ].join('\n'),
        fragmentShader: [
            'varying vec3 vNormal;',
            'void main() {',
            'float intensity = pow( 0.8 - dot( vNormal, vec3( 0, 0, 1.0 ) ), 12.0 );',
            'gl_FragColor = vec4( 1.0, 1.0, 1.0, 1.0 ) * intensity;',
            '}'
        ].join('\n')
    }
};

export class EarthManagement {

    resourceTracker = new ResourceTracker();

    isDispose = false;
    // Default earth mode.
    mode = 'sphere';
    // Default earth radius.
    radius = 100;

    constructor(private http: HttpClient, mode: 'sphereline' | 'sphere' | 'plane', radius = 100) {
        this.mode = mode;
        this.radius = radius;
    }

    /**
     * Release all three.js geometry 、 meterial object 、 texture resource.
     */
    dispose() {
        this.resourceTracker.dispose();
        this.isDispose = true;
    }

    /**
     * The create earth function have three mode for choice:
     *      1. 'sphereline': the sphere earth only line, no texture.
     *      2. 'sphere': the sphere earth with texture.
     *      3. 'plane': the plane earth.
     * @param mode {string}, 'sphereline' | 'sphere' | 'plane'
     * @param radius {number} the radius for earth, default value 100.
     */
    createEarth(segments = 64): Observable<any> {

        const observable = new Observable(subscriber => {

            let group = this.resourceTracker.track(new THREE.Group());

            this.fetchGeojson().subscribe((result) => {

                switch (this.mode) {
                    case 'plane':
                        group.rotateY(Math.PI);
                        group.rotateZ(Math.PI / 2);
                        break;
                    case 'sphere':

                        // load texture and generate globe mesh.
                        let globeMesh = this.resourceTracker.track(new THREE.SphereGeometry(this.radius, segments, segments));
                        let cloudMesh = this.resourceTracker.track(new THREE.SphereGeometry(this.radius, segments, segments));
                        let texture = this.resourceTracker.track(new THREE.TextureLoader().load('/assets/images/2_no_clouds_4k.jpg'));
                        let texturebump = this.resourceTracker.track(new THREE.TextureLoader().load('/assets/images/elev_bump_4k.jpg'));
                        let texturecloud = this.resourceTracker.track(new THREE.TextureLoader().load('/assets/images/fair_clouds_4k.png'));
                        let textureWater = this.resourceTracker.track(new THREE.TextureLoader().load('/assets/images/water_4k.png'));

                        // immediately use the texture for material creation
                        let material = this.resourceTracker.track(new THREE.MeshPhongMaterial({
                            map: texture,
                            bumpMap: texturebump,
                            bumpScale: 0.005,
                            specularMap: textureWater,
                            specular: new THREE.Color('grey')
                        }));

                        let materialCloud = this.resourceTracker.track(new THREE.MeshPhongMaterial({
                            map: texturecloud,
                            transparent: true
                        }));

                        // let material = new THREE.MeshBasicMaterial({ color: 0xffff00 });
                        let sphere = this.resourceTracker.track(new THREE.Mesh(globeMesh, material));
                        let cloud = this.resourceTracker.track(new THREE.Mesh(cloudMesh, materialCloud));

                        sphere.rotation.x = Math.PI / 2;
                        cloud.rotation.x = Math.PI / 2;
                        group.add(sphere);
                        group.add(cloud);
                        group.add(this.createAtmosphere());
                    // break;
                    case 'sphereline':
                        group.rotation.x = -Math.PI / 2;
                        group.rotation.z = -Math.PI / 2;
                        break;
                }

                console.log(result[1])

                // Draw taiwan detail county
                // result[0].features.forEach((o, i) => {
                //     group.add(this.createCounty(o));
                // });

                // Draw globa area exclude taiwan
                // result[1].features.forEach((o, i) => {

                //     if (o.properties.sovereignt == 'Taiwan')
                //         return true;

                //     group.add(this.createCounty(o));
                // });

                // // Draw taiwan area range.
                // this.drawThreeGeo(result[0], this.radius, this.mode, {
                //     color: 0x489e77,
                //     // skinning: true
                // }, group);

                // Draw globa area range.
                this.drawThreeGeo(result[1], this.radius, this.mode, {
                    color: 0x489e77,
                    // skinning: true
                }, group);

                let earth;
                if (this.mode == 'plane')
                    earth = group;
                else {
                    earth = this.resourceTracker.track(new THREE.Group());
                    earth.add(group);
                }

                subscriber.next(earth);
                subscriber.complete();
            });
        });

        return observable;
    }


    test() {

        var geom = new THREE.SphereBufferGeometry(this.radius + 1, 360, 360);
        var colors = [];
        var color = new THREE.Color();
        var q = 0xffffff * 0.25;
        for (let i = 0; i < geom.attributes.position.count; i++) {
            color.set(0x479C76);
            color.toArray(colors, i * 3);
        }
        geom.addAttribute('color', new THREE.BufferAttribute(new Float32Array(colors), 3));

        var loader = new THREE.TextureLoader();
        loader.setCrossOrigin('');
        var texture = loader.load('/assets/images/water_4k.png');
        texture.wrapS = THREE.RepeatWrapping;
        texture.wrapT = THREE.RepeatWrapping;
        texture.repeat.set(1, 1);
        var disk = loader.load('/assets/images/circle.png');
 
        var points = new THREE.Points(geom, new THREE.ShaderMaterial({
            vertexColors: THREE.VertexColors,
            uniforms: {
                visibility: {
                    value: texture
                },
                shift: {
                    value: 0
                },
                shape: {
                    value: disk
                },
                size: {
                    value: 1
                },
                scale: {
                    value: window.innerHeight / 2
                }
            },
            vertexShader: `

                  uniform float scale;
                  uniform float size;

                  varying vec2 vUv;
                  varying vec3 vColor;

                  void main() {

                    vUv = uv;
                    vColor = color;
                    vec4 mvPosition = modelViewMatrix * vec4( position, 1.0 );
                    gl_PointSize = size * ( scale / length( mvPosition.xyz ) );
                    gl_Position = projectionMatrix * mvPosition;

                  }
              `,
            fragmentShader: `
                  uniform sampler2D visibility;
                  uniform float shift;
                  uniform sampler2D shape;

                  varying vec2 vUv;
                  varying vec3 vColor;


                  void main() {

                    vec2 uv = vUv;
                    uv.x += shift;
                    vec4 v = texture2D(visibility, uv);
                    if (length(v.rgb) > 1.0) discard;

                    gl_FragColor = vec4( vColor, 1.0 );
                    vec4 shapeData = texture2D( shape, gl_PointCoord );
                    if (shapeData.a < 0.5) discard;
                    gl_FragColor = gl_FragColor * shapeData;

                  }
              `,
            transparent: true
        }));

        var blackGlobe = new THREE.Mesh(geom, new THREE.MeshBasicMaterial({
            color: 0x000000,
            opacity: 0.7,
            transparent: true
        }));

        blackGlobe.scale.setScalar(0.99);

        points.add(blackGlobe);

        return points;
    }

    /**
     * Create mesh by geojson county data.
     */
    createCounty(countyFeature) {
        let
            totalCoordinates = countyFeature.geometry.coordinates,
            mesh;

        if (countyFeature.geometry.type == 'MultiPolygon') {
            let group = new THREE.Group();
            mesh = group;
            let color = this.getRandomColor();

            totalCoordinates.forEach((areaCoordinates) => {

                areaCoordinates.forEach(coords => {

                    let sphereCoords = this.convertGeoJSONCoordinateToPlane(coords),
                        positionCoords = this.convertGeoJSONCoordinateToSphere(coords);

                    let m;
                    if (this.mode == 'plane')
                        m = this.generateCountyMesh([sphereCoords], [sphereCoords], color);
                    else if (countyFeature.properties.sovereignt == 'Russia')
                        m = this.generateCountyMesh([positionCoords], [positionCoords], color);
                    else
                        m = this.generateCountyMesh([sphereCoords], [positionCoords], color);

                    m.userData = countyFeature;
                    group.add(m);
                });

            });
        }
        else {

            let sphereCoords = [],
                positionCoords = [];
            totalCoordinates.forEach(coords => {

                let sCoords = this.convertGeoJSONCoordinateToPlane(coords),
                    pCoords = this.convertGeoJSONCoordinateToSphere(coords);

                sphereCoords.push(sCoords);
                positionCoords.push(pCoords);
            });

            if (this.mode == 'plane')
                mesh = this.generateCountyMesh(sphereCoords, sphereCoords);
            else
                mesh = this.generateCountyMesh(sphereCoords, positionCoords);

        }

        mesh.userData = countyFeature.properties;

        // The sphere mode need rotation the mesh object to match image.
        if (this.mode != 'plane') {
            // mesh.rotation.x = Math.PI / 2;
            // mesh.rotation.y = Math.PI / 2;
        }
        else {
            mesh.rotation.x = Math.PI;
            mesh.rotation.z = -Math.PI / 2;
        }

        return mesh;
    }

    private convertGeoJSONCoordinateToPlane(coordinates) {
        return coordinates.map(coor => {
            let sphereCoordinate = this.convertToPlaneCoords([coor[0], coor[1]], this.radius);
            sphereCoordinate.push(0);

            return sphereCoordinate;
        });
    }

    private convertGeoJSONCoordinateToSphere(coordinates) {
        return coordinates.map((coor) => {
            let sphereCoordinate = this._convertToSphereCoords(coor[0], coor[1]);

            return [sphereCoordinate.x, sphereCoordinate.y, sphereCoordinate.z];
        })
    }

    /**
     * Use geoJson county feature coordinats to generate mesh.
     * @param shapeCoordinates the county coordinates in plane.
     * @param positionCoordinates the county draw place coordinates.
     * @param color the county mesh color.
     */
    private generateCountyMesh(shapeCoordinates, positionCoordinates, color?) {

        let shapeData = Earcut.flatten(shapeCoordinates);
        let shapeTriangles = Earcut(shapeData.vertices, shapeData.holes, shapeData.dimensions);

        // This is for test the triangles is correct, if  value infinity approaches zero or zero, then the answer is correct.
        let deviation = Earcut.deviation(shapeData.vertices, shapeData.holes, shapeData.dimensions, shapeTriangles);

        color = color || this.getRandomColor();
        let positionData = Earcut.flatten(positionCoordinates);
        // let triangles = Earcut(positionData.vertices, positionData.holes, positionData.dimensions);

        let geometry = new THREE.BufferGeometry();
        // Create veritices array
        let vertices = new Float32Array(positionData.vertices);
        // Create attribute buffer object
        let attribue = new THREE.BufferAttribute(vertices, 3); // 
        // Set geometry attributes position property
        geometry.attributes.position = attribue;

        let indexes = new Uint16Array(shapeTriangles)
        geometry.index = new THREE.BufferAttribute(indexes, 1);
        // Not execute computeVertexNormals, because we don't has face UV.
        // geometry.computeVertexNormals();


        let materialConfig = {
            color: color,
            side: THREE.DoubleSide, // two face can see.
            // wireframe: true
            // opacity: 0,
            // transparent: true
        };

        if (this.mode != 'plane') {
            Object.assign(materialConfig, {
                opacity: 0,
                transparent: true
            });
        }

        let material = new THREE.MeshLambertMaterial(materialConfig);

        return new THREE.Mesh(geometry, material);
    }

    /**
     * For sphere mode used, the earth atmosphere.
     */
    createAtmosphere(radius?) {

        radius = radius || this.radius + 5;

        const atmosgeometry = this.resourceTracker.track(new THREE.SphereGeometry(radius, 60, 30));
        const atmosphereMaterial = this.resourceTracker.track(new THREE.ShaderMaterial({
            uniforms: THREE.UniformsUtils.clone(Shaders['atmosphere'].uniforms),
            vertexShader: Shaders['atmosphere'].vertexShader,
            fragmentShader: Shaders['atmosphere'].fragmentShader,
            side: THREE.BackSide,
            blending: THREE.AdditiveBlending,
            transparent: true
        }));

        const atm = this.resourceTracker.track(new THREE.Mesh(atmosgeometry, atmosphereMaterial));
        atm.scale.set(1.1, 1.1, 1.1);

        return atm;
    }

    /**
     * Create the star sphere for background.
     * @param radius the star sphere radius.
     * @param segments the star sphere segments.
     */
    createStars(radius, segments) {
        return this.resourceTracker.track(new THREE.Mesh(
            new THREE.SphereGeometry(radius, segments, segments),
            new THREE.MeshBasicMaterial({
                map: THREE.ImageUtils.loadTexture('/assets/images/galaxy_starfield.png'),
                side: THREE.BackSide
            })
        ));
    }

    /**
     * Draw the column for visualization the number for point.
     * @param point , the column position point.
     * @param columnHeight , the column height.
     * @param columnWidth , the column width.
     * @param columnDepth , the column depth.
     */
    drawColumn(point, columnHeight = 5, columnWidth = 0.25, columnDepth = 0.25) {

        let
            colors = [0x009A66, 0x3566CD, 0xFDE101, 0xFF6500, 0xCB0032],
            position,
            group = new THREE.Group();
        const cube = this.makeGradientCylinder(columnWidth, columnDepth, columnHeight);

        if (this.mode == 'plane') {
            let pt = this.convertToPlaneCoords(point, this.radius);
            position = new THREE.Vector3(...pt);
            position.z += columnHeight / 2;
        }
        else {
            position = this.convertToSphereCoords(point[0], point[1], columnHeight / 2 / this.radius);
        }

        cube.rotation.x = Math.PI / 2;
        group.add(cube);
        group.position.copy(position);

        // Mesh look at sphere center.
        if (this.mode == 'sphere') {
            group.lookAt(0, 0, 0);
        }

        return group;
    }

    /**
     * Generate box with gradinet color.
     * @param c1 color 1 for gradient start.
     * @param c2 color 2 for gradient end.
     * @param w the box width.
     * @param d the box depth.
     * @param h the box height.
     * @param colors the box gradient colors.
     * @param opacity the box opacity.
     */
    makeGradientBox(c1, c2, w, d, h, colors?, opacity = 1) {

        if (typeof opacity === 'undefined') opacity = 1.0;
        if (typeof c1 === 'number') c1 = new THREE.Color(c1);
        if (typeof c2 === 'number') c2 = new THREE.Color(c2);

        colors = colors || [0x009A66, 0x3566CD, 0xFDE101, 0xFF6500, 0xCB0032];

        let gradientFaceCount = colors.length - 1,
            cubeGeometry = this.resourceTracker.track(new THREE.BoxGeometry(w, h, d, 1, 1, gradientFaceCount)),
            cubeMaterial = this.resourceTracker.track(new THREE.MeshPhongMaterial({
                vertexColors: THREE.VertexColors
            }));

        if (opacity < 1.0) {
            cubeMaterial.opacity = opacity;
            cubeMaterial.transparent = true;
        }

        cubeGeometry.faces.forEach((face, i) => {

            // top and bottm side only two face.
            // why 8, the box one side have 2 face, so here we have 4 side and each side is 2 face.
            if (i >= gradientFaceCount * 8) {

                let ct;
                if (i % 8 < 2) {
                    ct = new THREE.Color(colors[0]);
                    face.vertexColors = [ct, ct, ct];
                }
                else {
                    ct = new THREE.Color(colors[colors.length - 1]);
                    face.vertexColors = [ct, ct, ct];
                }

                return true;
            }

            let t = (i % 8),
                // 4 side 0,1,2,3
                faceSide = Math.floor(i / 8),
                c1, c2,
                // Current used color index.
                colorCount = Math.floor(t / 2);

            // Odd side.
            if (faceSide == 0 || faceSide == 3) {
                c1 = new THREE.Color(colors[colorCount]);
                c2 = new THREE.Color(colors[colorCount + 1]);
            }
            // Even side.
            else {
                c1 = new THREE.Color(colors[Math.abs(colorCount - 4)]);
                c2 = new THREE.Color(colors[Math.abs(colorCount - 3)]);
            }

            if (faceSide < 2) {
                // Even face
                if (i % 2 == 0) {
                    face.vertexColors = [c1, c1, c2];
                }
                // Odd face
                else {
                    face.vertexColors = [c1, c2, c2];
                }
            }
            else {
                // Even face
                if (i % 2 == 0) {
                    face.vertexColors = [c1, c2, c1];
                }
                // Odd face
                else {
                    face.vertexColors = [c2, c2, c1];
                }
            }

        });

        return this.resourceTracker.track(new THREE.Mesh(cubeGeometry, cubeMaterial));
    }

    makeGradientCylinder(radiusTop, radiusBottom, height, radialSegments = 16, heightSegments = 4, opacity = 1, openEnded = false, thetaStart?, thetaLength?) {

        let geometry = this.resourceTracker.track(new THREE.CylinderGeometry(radiusTop, radiusBottom, height, radialSegments, heightSegments, openEnded, thetaStart, thetaLength)),
            material = this.resourceTracker.track(new THREE.MeshPhongMaterial({
                vertexColors: THREE.VertexColors
            })),
            colors = [0x009A66, 0x3566CD, 0xFDE101, 0xFF6500, 0xCB0032],
            topColor = new THREE.Color(colors[0]),
            bottomColor = new THREE.Color(colors[colors.length - 1]);

        if (opacity < 1.0) {
            material.opacity = opacity;
            material.transparent = true;
        }

        geometry.faces.forEach((face, i) => {

            // top and bottom area.
            if (i >= geometry.faces.length - (radialSegments * 2)) {
                if (i < geometry.faces.length - radialSegments)
                    face.vertexColors = [topColor, topColor, topColor];
                else
                    face.vertexColors = [bottomColor, bottomColor, bottomColor];
                return true;
            }

            let colorCount = Math.floor(i % (heightSegments * 2) / 2);

            if (i % (heightSegments * 2) == 0) {
                colorCount = 0;
            }

            let c1 = new THREE.Color(colors[colorCount]);
            let c2 = new THREE.Color(colors[colorCount + 1]);

            if (i % 2 == 0)
                face.vertexColors = [c1, c2, c1];
            else
                face.vertexColors = [c2, c2, c1];

        });

        let cylinder = this.resourceTracker.track(new THREE.Mesh(geometry, material));

        return cylinder;
    }

    /**
     * 
     * @param startPoint [number, number, number], the first number is represented longitude, second is represented latitude, third is reperesented altitude.
     * @param endPoint [number, number, number], the first number is represented longitude, second is represented latitude, third is reperesented altitude.
     * @param config {json}, the config for curve.
     * @param materialConfig {MeshLineMaterial} config for line material.
     */
    drawCurveLine(startPoint, endPoint, config?, materialConfig?) {

        const resolution = new THREE.Vector2(window.innerWidth, window.innerHeight);

        config = Object.assign({
            bezierControlPointPercents: [0.25, 0.75],
            sphereRadius: 100,
            altitudeRate: 1.1,
            altAutoScale: 0.5
        }, config);

        // Load line texture.
        let texture = this.resourceTracker.track(new THREE.TextureLoader().load('/assets/images/stroke.png'));

        materialConfig = Object.assign({
            map: texture,
            useMap: true,
            color: new THREE.Color(0xff0000),
            opacity: 1,
            resolution: resolution,
            sizeAttenuation: 1,
            lineWidth: 0.5,
            near: 1,
            dashArray: 0.5,
            dashOffset: 1,
            dashRatio: 0.5,
            // far: 100000,
            // depthTest: false,
            blending: THREE.AdditiveBlending,
            transparent: true,
            side: THREE.DoubleSide
        }, materialConfig)

        let bezierPoints = [startPoint];

        // The earth is sphere.
        if (this.mode !== 'plane') {
            let altitude = geoDistance(startPoint, endPoint) / 2 * config.altAutoScale;
            const computeBezierControlPointFun = geoInterpolate(startPoint, endPoint);

            Array.from(config.bezierControlPointPercents).forEach((o) => {
                // The bezier control point.
                let controlPoint = computeBezierControlPointFun(o as number);
                // Set altitude to point.
                controlPoint.push(altitude * config.altitudeRate);
                bezierPoints.push(controlPoint);
            });
        }
        // The earth is plane.
        else {
            let startCoord = this.convertToPlaneCoords(startPoint, this.radius);
            let endCoord = this.convertToPlaneCoords(endPoint, this.radius);
            Array.from(config.bezierControlPointPercents).forEach((o, i) => {
                let percent = o as number;
                bezierPoints.push([
                    (startCoord[0] * (1 - percent) + endCoord[0] * Math.abs(i * 1.5 - percent)),
                    (startCoord[1] * (1 - percent) + endCoord[1] * Math.abs(i * 1.5 - percent)),
                    5
                ]);
            });
        }

        bezierPoints.push(endPoint);

        let fg = bezierPoints.map(o => {
            let pt2;
            if (this.mode === 'plane') {
                pt2 = o[2] != 5 ? this.convertToPlaneCoords(o, this.radius) : o;
                pt2 = new THREE.Vector3(...pt2, o[2])
            }
            else
                pt2 = this.convertToSphereCoords(o[0], o[1], o[2]);
            return new THREE.Vector3(pt2.x, pt2.y, pt2.z);
        });

        // Create bezier line
        let curve = this.resourceTracker.track(new CubicBezierCurve3(fg[0], fg[1], fg[2], fg[3]));
        // Create geometry
        const path = this.resourceTracker.track(new THREE.Geometry());
        const bezierTotalPoints = curve.getPoints(100);
        // let geometry = path.setFromPoints(bezierTotalPoints.slice(0, 10));
        let geometry = path.setFromPoints(bezierTotalPoints);

        let line = this.resourceTracker.track(new MeshLine());
        line.setGeometry(geometry);

        let material = this.resourceTracker.track(new MeshLineMaterial(materialConfig));
        let tween = new TWEEN.Tween({ count: 0.5 });
        let lineDuration = 1000 + Math.random() * 3000;
        tween.to({
            count: 0
        }, lineDuration);

        // tween.easing(TWEEN.Easing.Exponential.In);

        tween.onUpdate(function (object) {
            if (this.isDispose) {
                tween.stop();
            }
            material.dashOffset = object.count;
            material.needsUpdate = true;
        });

        let result = new THREE.Group();

        tween.onRepeat(() => {
            if (this.isDispose) {
                tween.stop();
            }
            this.generateAttackLight(fg[3], result, lineDuration / 2);
        });

        tween.start();
        tween.repeat(Infinity);

        let curveObject = this.resourceTracker.track(new THREE.Mesh(line.geometry, material)); // this syntax could definitely be improved!
        result.add(curveObject);

        return {
            mesh: result,
            animation: tween
        };
    }

    /**
     * Remove curve line and release all resource.
     * @param curvObject 
     */
    removeCurveLine(curvObject) {

        if (curvObject.animation) {
            curvObject.animation.stop();
        }

        if (curvObject.mesh.type == 'Group') {
            curvObject.mesh.children.forEach((o) => {
                this.removePoint(o);
            });
        }

    }

    /**
     * 
     * @param coordinate [number, number], the first number is represented longitude, second is represented latitude.
     * @param sphereConfig {SphereGeometry}, reference THREE.SphereGeometry doc.
     * @param sphereMaterialConfig {MeshBasicMaterial} , reference THREE.MeshBasicMaterial doc.
     */
    drawPoint(coordinate, sphereConfig?, sphereMaterialConfig?) {

        sphereConfig = Object.assign({
            radius: 0.1,
            widthSegments: 32,
            heightSegments: 32
        }, sphereConfig);

        sphereMaterialConfig = Object.assign({
            color: 0xffff00,
            wireframe: true
        }, sphereMaterialConfig);

        let point;
        if (this.mode == 'plane') {
            point = this.convertToPlaneCoords(coordinate, this.radius);
            point = new THREE.Vector3(...point);
        }
        else
            point = this.convertToSphereCoords(coordinate[0], coordinate[1]);

        let geometry = this.resourceTracker.track(new THREE.SphereGeometry(sphereConfig.radius, sphereConfig.widthSegments, sphereConfig.heightSegments));
        let material = this.resourceTracker.track(new THREE.MeshBasicMaterial(sphereMaterialConfig));
        let sphere = this.resourceTracker.track(new THREE.Mesh(geometry, material));

        sphere.position.copy(point);

        return sphere;
    }

    /**
     * Remove mesh and release all resource.
     * @param mesh 
     */
    removePoint(mesh: THREE.Mesh) {

        this.resourceTracker.untrack(mesh);
        if (mesh.geometry)
            this.resourceTracker.untrack(mesh.geometry);
        if (mesh.material)
            this.resourceTracker.untrack(mesh.material);
        mesh.geometry.dispose();
        Array.prototype.forEach.call(mesh.material, element => {
            element.dispose();
        });
    }

    /**
     * Fetch Geojson data.
     */
    fetchGeojson(): Observable<any[]> {
        let response1 = this.http.get('/assets/tw.json');
        let response2 = this.http.get('/assets/custom.geo.json');

        return forkJoin([response1, response2]);
    }

    /**
     * 
     * @param coordinates_array [number, number], the first number is represented longitude, second is represented latitude.
     * @param radius 
     */
    convertToPlaneCoords(coordinates_array, radius) {
        let lon = coordinates_array[0];
        let lat = coordinates_array[1];

        return [(lon / 180) * radius, (lat / 180) * radius]
    }

    /**
     * Convert longtitude/latitude to shpere coordinate.
     * @param longtitude
     * @param latitude
     * @param altidute 
     */
    _convertToSphereCoords(longtitude, latitude, altidute = 0) {

        let r = this.radius * (1 + altidute);
        return new THREE.Vector3(
            Math.cos(latitude * Math.PI / 180) * Math.cos(longtitude * Math.PI / 180) * r,
            Math.cos(latitude * Math.PI / 180) * Math.sin(longtitude * Math.PI / 180) * r,
            Math.sin(latitude * Math.PI / 180) * r
        );
    }

    convertToSphereCoords(longtitude, latitude, altidute = 0) {

        var relAltitude = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : 0;
        var phi = (90 - latitude) * Math.PI / 180;
        var theta = (90 - longtitude) * Math.PI / 180;
        var r = this.radius * (1 + relAltitude);
        return {
            x: r * Math.sin(phi) * Math.cos(theta),
            y: r * Math.cos(phi),
            z: r * Math.sin(phi) * Math.sin(theta)
        };
    }

    /**
     * Generate dynamic point for [longitude, latitude]
     */
    generateDynamicPoint() {
        return [(Math.random() - 0.5) * 180, (Math.random() - 0.5) * 360];
    }

    /**
     * Control three.js camera focus to specified coordinate with animate.
     * @param targerPoint [number, number], the first number is represented longitude, second is represented latitude.
     * @param camera {THREE.Camera}, the camera for control.
     * @param control {TrackballControls}, if mode is plane then this parameter is required.
     */
    foucsCameraToPoint(targerPoint, camera, control?): Observable<any> {

        switch (this.mode) {
            case 'plane':
                if (!control)
                    throw 'The plane mode need pass TrackballControls object.';
                return this.focusCameraToPlanePoint(targerPoint, camera, control);
            case 'sphere':
            case 'sphereline':
                return this.foucsCameraToSpherePoint(targerPoint, camera);
        }
    }

    /**
     * Dynamic generate color.
     */
    getRandomColor() {
        let letters = '0123456789ABCDEF';
        let color = '#';
        for (let i = 0; i < 6; i++) {
            color += letters[Math.floor(Math.random() * 16)];
        }
        return color;
    }

    // ############### Private function area ###############

    /**
     * The camera move to specified coordinate animate whit shpere earth.
     * @param camera 
     * @param targerPoint [number, number], the first number is represented longitude, second is represented latitude.
     */
    private foucsCameraToSpherePoint(targerPoint, camera): Observable<any> {

        const observable = new Observable(subscriber => {
            let camDistance = camera.position.length();

            let point = this.convertToSphereCoords(targerPoint[0], targerPoint[1]);

            // backup original rotation
            let startPosition = camera.position.clone();

            // final rotation (with lookAt)
            camera.position.copy(point).normalize().multiplyScalar(camDistance);
            let endPosition = camera.position.clone();

            // revert to original rotation
            camera.position.copy(startPosition);

            console.log(startPosition, endPosition, targerPoint)


            let tween = new TWEEN.Tween(startPosition);
            tween.to(endPosition, 1500);
            tween.easing(TWEEN.Easing.Back.In);

            tween.onUpdate(function (object) {
                if (this.isDispose) {
                    tween.stop();
                }
                camera.position.set(object.x, object.y, startPosition.z);
            });

            tween.onComplete(() => {
                subscriber.next(true);
                subscriber.complete();
            })

            tween.start();
        });

        return observable;
    }

    /**
     * The camera move to specified coordinate animate with plane earth.
     * @param targerPoint 
     * @param camera 
     * @param control 
     */
    private focusCameraToPlanePoint(targerPoint, camera, control): Observable<any> {

        const observable = new Observable(subscriber => {

            // Convert coordinate to plane coordinate.
            let point = this.convertToPlaneCoords(targerPoint, this.radius);
            // Create THREE Vector3
            const destPosition = new THREE.Vector3(...point);
            // Back orignal camera position.
            let startPosition = camera.position.clone();

            // Init animate data.
            let tween = new TWEEN.Tween(startPosition);
            tween.to({
                x: destPosition.x,
                y: destPosition.y,
                z: 30
            }, 1500);

            tween.easing(TWEEN.Easing.Back.In);//Exponential.In);

            // Every frame update camera config.
            tween.onUpdate(function (object) {
                if (this.isDispose) {
                    tween.stop();
                }
                // Set TrackballControls new position
                control.position0.set(object.x, object.y, object.z);

                // TrackballControls update position need call reset to init.
                control.reset();
                control.zoomSpeed = 0.5;
                control.rotateSpeed = 0.5;
                control.panSpeed = 0.1;

                // TrackballControls lookAt target.
                control.target.set(object.x, object.y, 0);
            });

            tween.onComplete(() => {
                subscriber.next(true);
                subscriber.complete();
            })

            // Play animate.
            tween.start();
        });

        return observable;
    }

    /**
  * 
  * @param point When the attack line animate is finish then play the highlight.
  * @param container 
  * @param duration {number} the attack light animate duration setting.
  */
    private generateAttackLight(point: Vector3, container, duration = 150) {
        // debugger;
        let geometry = new THREE.TorusGeometry(0.5, 0.1, 2, 32);
        let material = new THREE.MeshBasicMaterial({
            color: 0xffff00,
            blending: AdditiveBlending
        });
        let torus = new THREE.Mesh(geometry, material);
        torus.position.copy(point);

        // If earth shape is sphere then the object need lookAt sphere center.
        if (this.mode !== 'plane')
            torus.lookAt(0, 0, 0);

        let tween = new TWEEN.Tween({ scale: 0.5, opacity: 1 });
        tween.to({
            scale: 2,
            opacity: 0.5
        }, duration);

        tween.onUpdate(function (object) {
            if (this.isDispose) {
                tween.stop();
            }
            torus.scale.set(object.scale, object.scale, object.scale);
            (torus.material as THREE.MeshBasicMaterial).opacity = object.opacity;
        });

        // Animate finish then remove the object and release all resource.
        tween.onComplete(() => {
            container.remove(torus);
            geometry.dispose();
            material.dispose();
        });

        tween.start();

        container.add(torus);
    }

    /**
     * 
     * @param json {GeoJson}, the geojson object.
     * @param radius {number}, the sphere radiuds
     * @param shape {string}, mode for 'plane', 'sphere'
     * @param materalOptions {material} the meaterial setting.
     * @param container scene for add globe.
     */
    private drawThreeGeo(json, radius, shape, materalOptions, container) {
        container = container;
        let _this = this;
        let x_values = [];
        let y_values = [];
        let z_values = [];

        let json_geom = createGeometryArray(json);
        //An array to hold the feature geometries.
        let convertCoordinates = getConversionFunctionName(shape);
        //Whether you want to convert to spherical or planar coordinates.
        let coordinate_array = [];
        //Re-usable array to hold coordinate values. This is necessary so that you can add
        //interpolated coordinates. Otherwise, lines go through the sphere instead of wrapping around.

        for (let geom_num = 0; geom_num < json_geom.length; geom_num++) {

            if (json_geom[geom_num].type == 'Point') {
                convertCoordinates(json_geom[geom_num].coordinates, radius);
                drawParticle(x_values[0], y_values[0], z_values[0], materalOptions);

            } else if (json_geom[geom_num].type == 'MultiPoint') {
                for (let point_num = 0; point_num < json_geom[geom_num].coordinates.length; point_num++) {
                    convertCoordinates(json_geom[geom_num].coordinates[point_num], radius);
                    drawParticle(x_values[0], y_values[0], z_values[0], materalOptions);
                }

            } else if (json_geom[geom_num].type == 'LineString') {
                coordinate_array = createCoordinateArray(json_geom[geom_num].coordinates);

                for (let point_num = 0; point_num < coordinate_array.length; point_num++) {
                    convertCoordinates(coordinate_array[point_num], radius);
                }
                drawLine(x_values, y_values, z_values, materalOptions);

            } else if (json_geom[geom_num].type == 'Polygon') {
                for (let segment_num = 0; segment_num < json_geom[geom_num].coordinates.length; segment_num++) {

                    coordinate_array = createCoordinateArray(json_geom[geom_num].coordinates[segment_num]);

                    for (let point_num = 0; point_num < coordinate_array.length; point_num++) {
                        convertCoordinates(coordinate_array[point_num], radius);
                    }
                    Earcut
                    drawLine(x_values, y_values, z_values, materalOptions);
                }

            } else if (json_geom[geom_num].type == 'MultiLineString') {
                for (let segment_num = 0; segment_num < json_geom[geom_num].coordinates.length; segment_num++) {
                    coordinate_array = createCoordinateArray(json_geom[geom_num].coordinates[segment_num]);

                    for (let point_num = 0; point_num < coordinate_array.length; point_num++) {
                        convertCoordinates(coordinate_array[point_num], radius);
                    }
                    drawLine(x_values, y_values, z_values, materalOptions);
                }

            } else if (json_geom[geom_num].type == 'MultiPolygon') {
                for (let polygon_num = 0; polygon_num < json_geom[geom_num].coordinates.length; polygon_num++) {
                    for (let segment_num = 0; segment_num < json_geom[geom_num].coordinates[polygon_num].length; segment_num++) {
                        coordinate_array = createCoordinateArray(json_geom[geom_num].coordinates[polygon_num][segment_num]);

                        for (let point_num = 0; point_num < coordinate_array.length; point_num++) {
                            convertCoordinates(coordinate_array[point_num], radius);
                        }
                        drawLine(x_values, y_values, z_values, materalOptions);
                    }
                }
            } else {
                throw new Error('The geoJSON is not valid.');
            }
        }

        function createGeometryArray(json) {
            let geometry_array = [];

            if (json.type == 'Feature') {
                geometry_array.push(json.geometry);
            } else if (json.type == 'FeatureCollection') {
                for (let feature_num = 0; feature_num < json.features.length; feature_num++) {
                    geometry_array.push(json.features[feature_num].geometry);
                }
            } else if (json.type == 'GeometryCollection') {
                for (let geom_num = 0; geom_num < json.geometries.length; geom_num++) {
                    geometry_array.push(json.geometries[geom_num]);
                }
            } else {
                throw new Error('The geoJSON is not valid.');
            }
            //alert(geometry_array.length);
            return geometry_array;
        }

        function getConversionFunctionName(shape) {
            let conversionFunctionName;

            if (shape == 'sphere' || shape == 'sphereline') {
                conversionFunctionName = convertToSphereCoords;
            } else if (shape == 'plane') {
                conversionFunctionName = convertToPlaneCoords;
            } else {
                throw new Error('The shape that you specified is not valid.');
            }
            return conversionFunctionName;
        }

        function createCoordinateArray(feature) {
            //Loop through the coordinates and figure out if the points need interpolation.
            let temp_array = [];
            let interpolation_array = [];

            for (let point_num = 0; point_num < feature.length; point_num++) {
                let point1 = feature[point_num];
                let point2 = feature[point_num - 1];

                if (point_num > 0) {
                    if (needsInterpolation(point2, point1)) {
                        interpolation_array = [point2, point1];
                        interpolation_array = interpolatePoints(interpolation_array);

                        for (let inter_point_num = 0; inter_point_num < interpolation_array.length; inter_point_num++) {
                            temp_array.push(interpolation_array[inter_point_num]);
                        }
                    } else {
                        temp_array.push(point1);
                    }
                } else {
                    temp_array.push(point1);
                }
            }
            return temp_array;
        }

        function needsInterpolation(point2, point1) {
            //If the distance between two latitude and longitude values is 
            //greater than five degrees, return true.
            let lon1 = point1[0];
            let lat1 = point1[1];
            let lon2 = point2[0];
            let lat2 = point2[1];
            let lon_distance = Math.abs(lon1 - lon2);
            let lat_distance = Math.abs(lat1 - lat2);

            if (lon_distance > 5 || lat_distance > 5) {
                return true;
            } else {
                return false;
            }
        }

        function interpolatePoints(interpolation_array) {
            //This function is recursive. It will continue to add midpoints to the 
            //interpolation array until needsInterpolation() returns false.
            let temp_array = [];
            let point1, point2;

            for (let point_num = 0; point_num < interpolation_array.length - 1; point_num++) {
                point1 = interpolation_array[point_num];
                point2 = interpolation_array[point_num + 1];

                if (needsInterpolation(point2, point1)) {
                    temp_array.push(point1);
                    temp_array.push(getMidpoint(point1, point2));
                } else {
                    temp_array.push(point1);
                }
            }

            temp_array.push(interpolation_array[interpolation_array.length - 1]);

            if (temp_array.length > interpolation_array.length) {
                temp_array = interpolatePoints(temp_array);
            } else {
                return temp_array;
            }
            return temp_array;
        }

        function getMidpoint(point1, point2) {
            let midpoint_lon = (point1[0] + point2[0]) / 2;
            let midpoint_lat = (point1[1] + point2[1]) / 2;
            let midpoint = [midpoint_lon, midpoint_lat];

            return midpoint;
        }

        function convertToSphereCoords(coordinates_array, sphere_radius) {
            let lon = coordinates_array[0];
            let lat = coordinates_array[1];

            x_values.push(Math.cos(lat * Math.PI / 180) * Math.cos(lon * Math.PI / 180) * sphere_radius);
            y_values.push(Math.cos(lat * Math.PI / 180) * Math.sin(lon * Math.PI / 180) * sphere_radius);
            z_values.push(Math.sin(lat * Math.PI / 180) * sphere_radius);
        }

        function convertToPlaneCoords(coordinates_array, radius) {
            let lon = coordinates_array[0];
            let lat = coordinates_array[1];

            x_values.push((lat / 180) * radius);
            y_values.push((lon / 180) * radius);
        }

        function drawParticle(x, y, z, options) {
            let particle_geom = _this.resourceTracker.track(new THREE.Geometry());
            particle_geom.vertices.push(new THREE.Vector3(x, y, z));

            let particle_material = _this.resourceTracker.track(new THREE.PointsMaterial(options));

            let particle = _this.resourceTracker.track(new THREE.Points(particle_geom, particle_material));
            container.add(particle);

            clearArrays();
        }

        function drawLine(x_values, y_values, z_values, options) {
            let line_geom = _this.resourceTracker.track(new THREE.Geometry());
            createVertexForEachPoint(line_geom, x_values, y_values, z_values);

            let line_material = _this.resourceTracker.track(new THREE.LineBasicMaterial(options));
            let line = _this.resourceTracker.track(new THREE.Line(line_geom, line_material));
            container.add(line);

            clearArrays();
        }

        function createVertexForEachPoint(object_geometry, values_axis1, values_axis2, values_axis3) {
            for (let i = 0; i < values_axis1.length; i++) {
                object_geometry.vertices.push(new THREE.Vector3(values_axis1[i],
                    values_axis2[i], values_axis3[i]));
            }
        }

        function clearArrays() {
            x_values.length = 0;
            y_values.length = 0;
            z_values.length = 0;
        }
    }
}
