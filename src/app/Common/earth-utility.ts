import { MeshLine, MeshLineMaterial } from 'three.meshline';
import ThreeGlobe from 'three-globe';
import { HttpClient } from '@angular/common/http';
import { Observable, forkJoin } from 'rxjs';
import * as THREE from 'three';
import { geoDistance, geoInterpolate } from 'd3-geo';
import { CubicBezierCurve3, Vector3, Mesh } from 'three';
import TWEEN from '@tweenjs/tween.js';

export class EarthManagement {

    utilityGlobe = new ThreeGlobe();

    // Default earth mode.
    mode = 'sphere'
    radius = 100;

    constructor(private http: HttpClient, mode: 'sphereline' | 'sphere' | 'plane', radius = 100) {
        this.mode = mode;
        this.radius = radius;
    }

    /**
     * The create earth function have three mode for choice:
     *      1. 'sphereline': the sphere earth only line, no texture.
     *      2. 'sphere': the sphere earth with texture.
     *      3. 'plane': the plane earth.
     * @param mode {string}, 'sphereline' | 'sphere' | 'plane'
     * @param radius {number} the radius for earth, default value 100.
     */
    createEarth(): Observable<any> {

        const observable = new Observable(subscriber => {

            let group = new THREE.Group();

            this.fetchGeojson().subscribe((result) => {

                switch (this.mode) {
                    case 'plane':
                        group.rotateY(Math.PI);
                        group.rotateZ(Math.PI / 2);
                        break;
                    case 'sphere':

                        // load texture and generate globe mesh.
                        var globeMesh = new THREE.SphereGeometry(this.radius, 32, 32);
                        var cloudMesh = new THREE.SphereGeometry(this.radius, 32, 32);
                        var texture = new THREE.TextureLoader().load('/assets/images/2_no_clouds_4k.jpg');
                        var texturebump = new THREE.TextureLoader().load('/assets/images/elev_bump_4k.jpg');
                        var texturecloud = new THREE.TextureLoader().load('/assets/images/fair_clouds_4k.png');

                        // immediately use the texture for material creation
                        var material = new THREE.MeshPhongMaterial({
                            map: texture,
                            bumpMap: texturebump,
                            bumpScale: 0.005
                        });

                        var materialCloud = new THREE.MeshPhongMaterial({
                            map: texturecloud,
                            transparent: true
                        });

                        // var material = new THREE.MeshBasicMaterial({ color: 0xffff00 });
                        var sphere = new THREE.Mesh(globeMesh, material);
                        var cloud = new THREE.Mesh(cloudMesh, materialCloud);
                        sphere.rotation.x = Math.PI / 2;
                        cloud.rotation.x = Math.PI / 2;
                        group.add(sphere);
                        group.add(cloud);
                    // break;
                    case 'sphereline':
                        group.rotation.x = -Math.PI / 2;
                        group.rotation.z = -Math.PI / 2;
                        break;
                }

                this.drawThreeGeo(result[0], this.radius, this.mode, {
                    color: 0x489e77,
                    // skinning: true
                }, group);

                this.drawThreeGeo(result[1], this.radius, this.mode, {
                    color: 0x489e77,
                    // skinning: true
                }, group);

                subscriber.next(group);
                subscriber.complete();
            });
        });

        return observable;
    }

    /**
     * Fetch Geojson data.
     */
    fetchGeojson(): Observable<any[]> {
        let response1 = this.http.get('/assets/twCounty2010.geo.json');
        let response2 = this.http.get('/assets/custom.geo.json');

        return forkJoin([response1, response2]);
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
        var texture = new THREE.TextureLoader().load('/assets/images/stroke.png');

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
            depthTest: false,
            blending: THREE.AdditiveBlending,
            transparent: false,
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
                console.log(Math.abs(i * 1.5 - percent), (1 - percent))
                bezierPoints.push([
                    (startCoord[0] * Math.abs(i * 1.5 - percent) + endCoord[0] * (1 - percent)),
                    (startCoord[1] * Math.abs(i * 1.5 - percent) + endCoord[1] * (1 - percent)),
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
        var curve = new CubicBezierCurve3(fg[0], fg[1], fg[2], fg[3]);
        // Create geometry
        const path = new THREE.Geometry();
        const bezierTotalPoints = curve.getPoints(100);
        // let geometry = path.setFromPoints(bezierTotalPoints.slice(0, 10));
        let geometry = path.setFromPoints(bezierTotalPoints);

        var line = new MeshLine();
        line.setGeometry(geometry);

        var material = new MeshLineMaterial(materialConfig);
        var tween = new TWEEN.Tween({ count: 0.5 });
        tween.to({
            count: 0
        }, 1000);

        // tween.easing(TWEEN.Easing.Exponential.In);

        tween.onUpdate(function (object) {
            material.dashOffset = object.count;
            material.needsUpdate = true;
        });

        let result = new THREE.Group();

        tween.onRepeat(() => {
            this.generateAttackLight(fg[3], result);
        });

        tween.start();
        tween.repeat(Infinity);

        var curveObject = new THREE.Mesh(line.geometry, material); // this syntax could definitely be improved!
        result.add(curveObject);

        return result;
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

        var geometry = new THREE.SphereGeometry(sphereConfig.radius, sphereConfig.widthSegments, sphereConfig.heightSegments);
        var material = new THREE.MeshBasicMaterial(sphereMaterialConfig);
        var sphere = new THREE.Mesh(geometry, material);
        sphere.position.copy(point);

        return sphere;
    }

    /**
     * 
     * @param json {GeoJson}, the geojson object.
     * @param radius {number}, the sphere radiuds
     * @param shape {string}, mode for 'plane', 'sphere'
     * @param materalOptions {material} the meaterial setting.
     * @param container scene for add globe.
     */
    drawThreeGeo(json, radius, shape, materalOptions, container) {
        container = container;

        var x_values = [];
        var y_values = [];
        var z_values = [];

        var json_geom = createGeometryArray(json);
        //An array to hold the feature geometries.
        var convertCoordinates = getConversionFunctionName(shape);
        //Whether you want to convert to spherical or planar coordinates.
        var coordinate_array = [];
        //Re-usable array to hold coordinate values. This is necessary so that you can add
        //interpolated coordinates. Otherwise, lines go through the sphere instead of wrapping around.

        for (var geom_num = 0; geom_num < json_geom.length; geom_num++) {

            if (json_geom[geom_num].type == 'Point') {
                convertCoordinates(json_geom[geom_num].coordinates, radius);
                drawParticle(x_values[0], y_values[0], z_values[0], materalOptions);

            } else if (json_geom[geom_num].type == 'MultiPoint') {
                for (var point_num = 0; point_num < json_geom[geom_num].coordinates.length; point_num++) {
                    convertCoordinates(json_geom[geom_num].coordinates[point_num], radius);
                    drawParticle(x_values[0], y_values[0], z_values[0], materalOptions);
                }

            } else if (json_geom[geom_num].type == 'LineString') {
                coordinate_array = createCoordinateArray(json_geom[geom_num].coordinates);

                for (var point_num = 0; point_num < coordinate_array.length; point_num++) {
                    convertCoordinates(coordinate_array[point_num], radius);
                }
                drawLine(x_values, y_values, z_values, materalOptions);

            } else if (json_geom[geom_num].type == 'Polygon') {
                for (var segment_num = 0; segment_num < json_geom[geom_num].coordinates.length; segment_num++) {
                    coordinate_array = createCoordinateArray(json_geom[geom_num].coordinates[segment_num]);

                    for (var point_num = 0; point_num < coordinate_array.length; point_num++) {
                        convertCoordinates(coordinate_array[point_num], radius);
                    }
                    drawLine(x_values, y_values, z_values, materalOptions);
                }

            } else if (json_geom[geom_num].type == 'MultiLineString') {
                for (var segment_num = 0; segment_num < json_geom[geom_num].coordinates.length; segment_num++) {
                    coordinate_array = createCoordinateArray(json_geom[geom_num].coordinates[segment_num]);

                    for (var point_num = 0; point_num < coordinate_array.length; point_num++) {
                        convertCoordinates(coordinate_array[point_num], radius);
                    }
                    drawLine(x_values, y_values, z_values, materalOptions);
                }

            } else if (json_geom[geom_num].type == 'MultiPolygon') {
                for (var polygon_num = 0; polygon_num < json_geom[geom_num].coordinates.length; polygon_num++) {
                    for (var segment_num = 0; segment_num < json_geom[geom_num].coordinates[polygon_num].length; segment_num++) {
                        coordinate_array = createCoordinateArray(json_geom[geom_num].coordinates[polygon_num][segment_num]);

                        for (var point_num = 0; point_num < coordinate_array.length; point_num++) {
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
            var geometry_array = [];

            if (json.type == 'Feature') {
                geometry_array.push(json.geometry);
            } else if (json.type == 'FeatureCollection') {
                for (var feature_num = 0; feature_num < json.features.length; feature_num++) {
                    geometry_array.push(json.features[feature_num].geometry);
                }
            } else if (json.type == 'GeometryCollection') {
                for (var geom_num = 0; geom_num < json.geometries.length; geom_num++) {
                    geometry_array.push(json.geometries[geom_num]);
                }
            } else {
                throw new Error('The geoJSON is not valid.');
            }
            //alert(geometry_array.length);
            return geometry_array;
        }

        function getConversionFunctionName(shape) {
            var conversionFunctionName;

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
            var temp_array = [];
            var interpolation_array = [];

            for (var point_num = 0; point_num < feature.length; point_num++) {
                var point1 = feature[point_num];
                var point2 = feature[point_num - 1];

                if (point_num > 0) {
                    if (needsInterpolation(point2, point1)) {
                        interpolation_array = [point2, point1];
                        interpolation_array = interpolatePoints(interpolation_array);

                        for (var inter_point_num = 0; inter_point_num < interpolation_array.length; inter_point_num++) {
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
            var lon1 = point1[0];
            var lat1 = point1[1];
            var lon2 = point2[0];
            var lat2 = point2[1];
            var lon_distance = Math.abs(lon1 - lon2);
            var lat_distance = Math.abs(lat1 - lat2);

            if (lon_distance > 5 || lat_distance > 5) {
                return true;
            } else {
                return false;
            }
        }

        function interpolatePoints(interpolation_array) {
            //This function is recursive. It will continue to add midpoints to the 
            //interpolation array until needsInterpolation() returns false.
            var temp_array = [];
            var point1, point2;

            for (var point_num = 0; point_num < interpolation_array.length - 1; point_num++) {
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
            var midpoint_lon = (point1[0] + point2[0]) / 2;
            var midpoint_lat = (point1[1] + point2[1]) / 2;
            var midpoint = [midpoint_lon, midpoint_lat];

            return midpoint;
        }

        function convertToSphereCoords(coordinates_array, sphere_radius) {
            var lon = coordinates_array[0];
            var lat = coordinates_array[1];

            x_values.push(Math.cos(lat * Math.PI / 180) * Math.cos(lon * Math.PI / 180) * sphere_radius);
            y_values.push(Math.cos(lat * Math.PI / 180) * Math.sin(lon * Math.PI / 180) * sphere_radius);
            z_values.push(Math.sin(lat * Math.PI / 180) * sphere_radius);
        }

        function convertToPlaneCoords(coordinates_array, radius) {
            var lon = coordinates_array[0];
            var lat = coordinates_array[1];

            x_values.push((lat / 180) * radius);
            y_values.push((lon / 180) * radius);
        }

        function drawParticle(x, y, z, options) {
            var particle_geom = new THREE.Geometry();
            particle_geom.vertices.push(new THREE.Vector3(x, y, z));

            var particle_material = new THREE.PointsMaterial(options);

            var particle = new THREE.Points(particle_geom, particle_material);
            container.add(particle);

            clearArrays();
        }

        function drawLine(x_values, y_values, z_values, options) {
            var line_geom = new THREE.Geometry();
            createVertexForEachPoint(line_geom, x_values, y_values, z_values);

            var line_material = new THREE.LineBasicMaterial(options);
            var line = new THREE.Line(line_geom, line_material);
            container.add(line);

            clearArrays();
        }

        function createVertexForEachPoint(object_geometry, values_axis1, values_axis2, values_axis3) {
            for (var i = 0; i < values_axis1.length; i++) {
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

    /**
     * 
     * @param coordinates_array [number, number], the first number is represented longitude, second is represented latitude.
     * @param radius 
     */
    convertToPlaneCoords(coordinates_array, radius) {
        var lon = coordinates_array[0];
        var lat = coordinates_array[1];

        return [(lon / 180) * radius, (lat / 180) * radius]
    }

    /**
     * Convert longtitude/latitude to shpere coordinate.
     * @param longtitude
     * @param latitude
     * @param altidute  
     */
    convertToSphereCoords(longtitude, latitude, altidute?) {
        return this.utilityGlobe.getCoords(latitude, longtitude, altidute);
    }

    /**
     * 
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
     * The camera move to specified coordinate animate whit shpere earth.
     * @param camera 
     * @param targerPoint [number, number], the first number is represented longitude, second is represented latitude.
     */
    foucsCameraToSpherePoint(targerPoint, camera): Observable<any> {

        const observable = new Observable(subscriber => {
            let camDistance = camera.position.length();

            let point = this.convertToSphereCoords(targerPoint[0], targerPoint[1]);

            // backup original rotation
            var startPosition = camera.position.clone();

            // final rotation (with lookAt)
            camera.position.copy(point).normalize().multiplyScalar(camDistance);
            var endPosition = camera.position.clone();

            // revert to original rotation
            camera.position.copy(startPosition);

            var tween = new TWEEN.Tween(startPosition);
            tween.to(endPosition, 1500);
            tween.easing(TWEEN.Easing.Exponential.In);

            tween.onUpdate(function (object) {
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
    focusCameraToPlanePoint(targerPoint, camera, control): Observable<any> {

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

            tween.easing(TWEEN.Easing.Exponential.In);

            // Every frame update camera config.
            tween.onUpdate(function (object) {

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
    generateAttackLight(point: Vector3, container, duration = 150) {
        // debugger;
        var geometry = new THREE.TorusGeometry(0.5, 0.1, 2, 32);
        var material = new THREE.MeshBasicMaterial({ color: 0xffff00 });
        var torus = new THREE.Mesh(geometry, material);
        torus.position.copy(point);

        // If earth shape is sphere then the object need lookAt sphere center.
        if (this.mode !== 'plane')
            torus.lookAt(0, 0, 0);

        var tween = new TWEEN.Tween({ scale: 0.5 });
        tween.to({
            scale: 2
        }, duration);

        tween.onUpdate(function (object) {
            torus.scale.set(object.scale, object.scale, object.scale);
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
     * Generate dynamic point for [longitude, latitude]
     */
    generateDynamicPoint() {
        return [(Math.random() - 0.5) * 180, (Math.random() - 0.5) * 360];
    }

}
