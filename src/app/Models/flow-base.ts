import { Utility } from 'src/app/Common/utility';
/**
 * The flow basic object.
 */
export class FlowBase {
    id: string = Utility.UUID();
    // The flow from where.
    fromLocation: LocationPoint;
    // The flow target destination.
    destLocation: LocationPoint;
    // The amount of this package.
    flow: number;
    extraData?: any;
}

export class FlowVisualizationMesh extends FlowBase {

    fromPointMesh;
    destPointMesh;
    curveLineMesh;

}

/**
 * The IP location in the word.
 */
export class LocationPoint {

    // Longitude.
    longitude: number;
    // Latidute.
    latitude: number;
    // Altitude.
    altitude?: number;
    // The location counrty name.
    country?: string;
    // The location county name.
    county?: string;

    // Return longitude and latitude coordinate.
    getCoordinate = () => {
        return [this.longitude, this.latitude];
    }
}
