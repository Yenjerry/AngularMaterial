import { MeshLine, MeshLineMaterial } from 'three.meshline';
import ThreeGlobe from 'three-globe';
import { HttpClient } from '@angular/common/http';
import { Observable, forkJoin } from 'rxjs';
import * as THREE from 'three';
import { geoDistance, geoInterpolate } from 'd3-geo';
import { CubicBezierCurve3, Vector3, Mesh } from 'three';
import TWEEN from '@tweenjs/tween.js';

export class EarthUtility {

    utilityGlobe = new ThreeGlobe();

    constructor(private http: HttpClient) {
        // this.createEarth('sphere');
    }

    /**
     * The create earth function have three mode for choice:
     *      1. 'sphereline': the sphere earth only line, no texture.
     *      2. 'sphere': the sphere earth with texture.
     *      3. 'plane': the plane earth.
     * @param mode {string}, 'sphereline' | 'sphere' | 'plane'
     * @param radius {number} the radius for earth, default value 100.
     */
    createEarth(mode: 'sphereline' | 'sphere' | 'plane', radius = 100): Observable<any> {
        console.log(mode)

        const observable = new Observable(subscriber => {

            let group = new THREE.Group();

            this.fetchGeojson().subscribe((result) => {

                console.log(result)

                switch (mode) {
                    case 'plane':
                        break;
                    case 'sphere':
                        break;
                    case 'sphereline':
                        break;
                }

                this.drawThreeGeo(result[0], radius, mode, {
                    color: 0x489e77,
                    // skinning: true
                }, group);

                this.drawThreeGeo(result[1], radius, mode, {
                    color: 0x489e77,
                    // skinning: true
                }, group);

                group.rotation.x = -Math.PI / 2;
                group.rotation.z = -Math.PI / 2;

                subscriber.next(group);
                subscriber.complete();
            });
        });

        return observable;
    }

    fetchGeojson(): Observable<any[]> {
        let response1 = this.http.get('/assets/twCounty2010.geo.json');
        let response2 = this.http.get('/assets/custom.geo.json');
        // Observable.forkJoin (RxJS 5) changes to just forkJoin() in RxJS 6
        return forkJoin([response1, response2]);
    }

    /**
     * 
     * @param startPoint [number, number, number], the first number is represented longitude, second is represented latitude, third is reperesented altitude.
     * @param endPoint [number, number, number], the first number is represented longitude, second is represented latitude, third is reperesented altitude.
     * @param config {json}, the config for curve.
     * @param materialConfig {MeshLineMaterial} config for line material.
     */
    drawCurveLine(startPoint, endPoint, container, config?, materialConfig?): THREE.Mesh {

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

        let altitude = geoDistance(startPoint, endPoint) / 2 * config.altAutoScale;

        let bezierPoints = [startPoint];

        const computeBezierControlPointFun = geoInterpolate(startPoint, endPoint);

        Array.from(config.bezierControlPointPercents).forEach((o) => {
            // The bezier control point.
            let controlPoint = computeBezierControlPointFun(o as number);
            // Set altitude to point.
            controlPoint.push(altitude * config.altitudeRate);
            bezierPoints.push(controlPoint);
        });

        bezierPoints.push(endPoint);

        let fg = bezierPoints.map(o => {
            let pt2 = this.utilityGlobe.getCoords(o[1], o[0], o[2]);
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
        var tween = new TWEEN.Tween({ count: 1 });
        tween.to({
            count: 0
        }, 3000);

        tween.onUpdate(function (object) {
            material.dashOffset = object.count;
            material.needsUpdate = true;
            // geometry.dispose();
            // let count = Math.ceil(object.count);
            // geometry = path.setFromPoints(bezierTotalPoints.slice(count - 10 < 0 ? 0 : count - 10, count));
            // line.setGeometry(geometry);
        });

        tween.onRepeat(() => {
            this.generateAttackLight(fg[3], container);
        });

        tween.start();
        tween.repeat(Infinity);

        var curveObject = new THREE.Mesh(line.geometry, material); // this syntax could definitely be improved!

        return curveObject;
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

        let point = this.utilityGlobe.getCoords(coordinate[1], coordinate[0]);

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

            if (shape == 'sphere') {
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
     * Convert longtitude/latitude to shpere coordinate.
     * @param longtitude
     * @param latitude
     * @param altidute  
     */
    getCoords(longtitude, latitude, altidute?) {
        return this.utilityGlobe.getCoords(latitude, longtitude, altidute);
    }

    /**
     * The camera move to specified coordinate animate.
     * @param camera 
     * @param targerPoint 
     */
    foucsCameraToShperePoint(camera, targerPoint) {

        let point = this.getCoords(targerPoint[0], targerPoint[1]);
        let camDistance = camera.position.length();

        // backup original rotation
        var startRotation = camera.position.clone();

        // final rotation (with lookAt)
        camera.position.copy(point).normalize().multiplyScalar(camDistance);
        var endRotation = camera.position.clone();

        // revert to original rotation
        camera.position.copy(startRotation);

        var tween = new TWEEN.Tween(startRotation);
        tween.to(endRotation, 1000);

        tween.onUpdate(function (object) {
            camera.position.copy(object);
            // console.log('fire', object)
        });
        tween.start();
    }

    generateAttackLight(point: Vector3, container) {
        // debugger;
        var geometry = new THREE.TorusGeometry(0.5, 0.1, 2, 32);
        var material = new THREE.MeshBasicMaterial({ color: 0xffff00 });
        var torus = new THREE.Mesh(geometry, material);
        torus.position.copy(point);

        // var axesHelper = new THREE.AxesHelper(250);
        torus.lookAt(0, 0, 0)
        // torus.add(axesHelper);

        var tween = new TWEEN.Tween({ scale: 0.5 });
        tween.to({
            scale: 2
        }, 100);

        tween.onUpdate(function (object) {
            torus.scale.set(object.scale, object.scale, object.scale);
        });
        tween.onComplete(() => {
            container.remove(torus);
            // torus.remove();
            geometry.dispose();
            material.dispose();
        });
        tween.start();

        console.log(torus)

        container.add(torus)
    }

}
