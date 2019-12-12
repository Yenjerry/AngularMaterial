import { Subject, forkJoin, Observable } from 'rxjs';
import TWEEN from '@tweenjs/tween.js';

import * as THREE from 'three';
import { geoDistance, geoInterpolate } from 'd3-geo';
import { CubicBezierCurve3 } from 'three';
import { MeshLine, MeshLineMaterial } from 'three.meshline';

export class Utility {
    
    static UUID() {
        var d = Date.now();
        if (typeof performance !== 'undefined' && typeof performance.now === 'function') {
            d += performance.now(); //use high-precision timer if available
        }
        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
            var r = (d + Math.random() * 16) % 16 | 0;
            d = Math.floor(d / 16);
            return (c === 'x' ? r : (r & 0x3 | 0x8)).toString(16);
        });
    }

    static drawThreeGeo(json, radius, shape, materalOptions, container) {
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

    static convertToPlaneCoords(coordinates_array, radius) {
        var lon = coordinates_array[0];
        var lat = coordinates_array[1];

        return [(lat / 180) * radius, (lon / 180) * radius];
    }
}

// const utilityGlobe = new ThreeGlobe();

// /**
//  * 
//  * @param startPoint [number, number, number], the first number is represented longitude, second is represented latitude, third is reperesented altitude.
//  * @param endPoint [number, number, number], the first number is represented longitude, second is represented latitude, third is reperesented altitude.
//  * @param config {json}, the config for curve.
//  * @param materialConfig {MeshLineMaterial} config for line material.
//  */
// export function drawCurveLine(startPoint, endPoint, config?, materialConfig?): THREE.Mesh {

//     const resolution = new THREE.Vector2(window.innerWidth, window.innerHeight);

//     config = Object.assign({
//         bezierControlPointPercents: [0.25, 0.75],
//         sphereRadius: 100,
//         altitudeRate: 1.1,
//         altAutoScale: 0.5
//     }, config);

//     // Load line texture.
//     var texture = new THREE.TextureLoader().load('/assets/images/stroke.png');

//     materialConfig = Object.assign({
//         map: texture,
//         useMap: true,
//         color: new THREE.Color(0xff0000),
//         opacity: 1,
//         resolution: resolution,
//         sizeAttenuation: 1,
//         lineWidth: 0.5,
//         near: 1,
//         far: 100000,
//         depthTest: false,
//         blending: THREE.AdditiveBlending,
//         transparent: false,
//         side: THREE.DoubleSide
//     }, materialConfig)

//     let altitude = geoDistance(startPoint, endPoint) / 2 * config.altAutoScale;

//     let bezierPoints = [startPoint];

//     const computeBezierControlPointFun = geoInterpolate(startPoint, endPoint);

//     Array.from(config.bezierControlPointPercents).forEach((o) => {
//         // The bezier control point.
//         let controlPoint = computeBezierControlPointFun(o as number);
//         // Set altitude to point.
//         controlPoint.push(altitude * config.altitudeRate);
//         bezierPoints.push(controlPoint);
//     });

//     bezierPoints.push(endPoint);

//     let fg = bezierPoints.map(o => {
//         let pt2 = utilityGlobe.getCoords(o[1], o[0], o[2]);
//         return new THREE.Vector3(pt2.x, pt2.y, pt2.z);
//     });

//     // Create bezier line
//     var curve = new CubicBezierCurve3(fg[0], fg[1], fg[2], fg[3]);
//     // Create geometry
//     const path = new THREE.Geometry();
//     const bezierTotalPoints = curve.getPoints(100);
//     let geometry = path.setFromPoints(bezierTotalPoints.slice(0, 10));

//     var line = new MeshLine();
//     line.setGeometry(geometry);

//     var material = new MeshLineMaterial(materialConfig);
//     var tween = new TWEEN.Tween({ count: 10 });
//     tween.to({
//         count: 101
//     }, 1000);

//     tween.onUpdate(function (object) {
//         geometry.dispose();
//         let count = Math.ceil(object.count);
//         geometry = path.setFromPoints(bezierTotalPoints.slice(count - 10 < 0 ? 0 : count - 10, count));
//         line.setGeometry(geometry);
//     });

//     tween.start();
//     tween.repeat(Infinity);

//     var curveObject = new THREE.Mesh(line.geometry, material); // this syntax could definitely be improved!

//     return curveObject;
// }

// /**
//  * 
//  * @param coordinate [number, number], the first number is represented longitude, second is represented latitude.
//  * @param sphereConfig {SphereGeometry}, reference THREE.SphereGeometry doc.
//  * @param sphereMaterialConfig {MeshBasicMaterial} , reference THREE.MeshBasicMaterial doc.
//  */
// export function drawPoint(coordinate, sphereConfig?, sphereMaterialConfig?) {

//     sphereConfig = Object.assign({
//         radius: 0.1,
//         widthSegments: 32,
//         heightSegments: 32
//     }, sphereConfig);

//     sphereMaterialConfig = Object.assign({
//         color: 0xffff00,
//         wireframe: true
//     }, sphereMaterialConfig);

//     let point = utilityGlobe.getCoords(coordinate[1], coordinate[0]);

//     var geometry = new THREE.SphereGeometry(sphereConfig.radius, sphereConfig.widthSegments, sphereConfig.heightSegments);
//     var material = new THREE.MeshBasicMaterial(sphereMaterialConfig);
//     var sphere = new THREE.Mesh(geometry, material);
//     sphere.position.copy(point);

//     return sphere;
// }

// /**
//  * Convert latitude and longitude to sphere point.
//  * @param coordinates_array [number, number] The first number is represented longitude, second is represented latitude.
//  * @param sphere_radius {number} ther sphere radius.
//  */
// export function convertToSphereCoords(coordinates_array, sphere_radius) {
//     let lon = coordinates_array[0];
//     let lat = coordinates_array[1];
//     let result = [];
//     result.push(Math.cos(lat * Math.PI / 180) * Math.cos(lon * Math.PI / 180) * sphere_radius);
//     result.push(Math.cos(lat * Math.PI / 180) * Math.sin(lon * Math.PI / 180) * sphere_radius);
//     result.push(Math.sin(lat * Math.PI / 180) * sphere_radius);

//     return result;
// }