import { FlowVisualizationMesh } from './../Models/flow-base';
import { HttpClient } from '@angular/common/http';
import { Observable, Subject } from 'rxjs';
import { FlowBase, LocationPoint } from 'src/app/Models/flow-base';
import { Injectable } from '@angular/core';

@Injectable({
    providedIn: 'root'
})
export class FlowServiceService {

    flowDatas: FlowBase[] = [];

    hasChange: Subject<boolean> = new Subject<boolean>();

    countyInfos;

    constructor(private http: HttpClient) {
        this.http.get('/assets/ne_50m_populated_places_simple.geojson').subscribe((result: any) => {
            this.countyInfos = result;
            this.generateData();
        });
    }

    generateData(count = 50) {

        // Clear all data.
        this.flowDatas = [];

        Array.from({ length: count }).forEach(o => {
            this.flowDatas.push(this.getDynamicCounty());
        });

        this.EmitUpdate();
    }

    getFlowDatas(): FlowBase[] {
        return this.flowDatas.slice();
    }

    getDynamicCounty() {

        let pointfrom = this.countyInfos.features[Math.floor(Math.random() * this.countyInfos.features.length)];
        let pointdest = this.countyInfos.features[Math.floor(Math.random() * this.countyInfos.features.length)];
        let flow = new FlowBase();

        // The from and dest are same, pass this data.
        if (pointfrom.properties.name == pointdest.properties.name)
            return;

        flow.flow = Math.ceil(Math.random() * 100000);
        flow.fromLocation = this.convertGeoToLocationPoint(pointfrom);
        flow.destLocation = this.convertGeoToLocationPoint(pointdest);

        return flow;
    }

    addFlow(flow: FlowVisualizationMesh) {
        this.flowDatas.push(flow);
        this.EmitUpdate();
    }

    addDymicalFlow() {
        this.flowDatas.push(this.getDynamicCounty());
        this.EmitUpdate();
    }

    deleteFlow(flow) {
        this.flowDatas = this.flowDatas.filter(o =>
            o.id != flow.id);
        this.EmitUpdate();
    }

    registerEvent(): Observable<boolean> {
        return this.hasChange.asObservable();
    }

    private EmitUpdate() {
        this.hasChange.next(true);
    }

    private convertGeoToLocationPoint(geoData): LocationPoint {
        return Object.assign(new LocationPoint(), {
            longitude: geoData.properties.longitude,
            // Latidute.
            latitude: geoData.properties.latitude,
            county: geoData.properties.name
        } as LocationPoint);
    }
}
