/**
 * The base object for chart used.
 * All chart data object must inherit this object for work success.
 */
export class ChartBase {
    // The x axis value, now only support number.
    x: number;
    // The y axis value, now only support number.
    y: number;
}


export class AreaChartConfig {
    // Draws area datas, one area one ChartBase[].
    areas: AreaChartData[];
    // The chart titile.
    title?: string;
    // The legend for area, order is by areas datas, if not specified then nothing to do,
    // if legend length is less areas, then show by order.
    legend?: string[];
    // The axis (x,y) config.
    axis?: AreaAxisConfig;
    // Enable brush function.
    enableBrush = false;
    // Enable zoom function.
    enableZoom = true;
}

export class AreaChartData {
    // Draw datas.
    datas: ChartBase[];
    // If not assign will auto generate color, if colors more than two then it will make gradient(if property enableOpacity is true).
    colors?: any[];
    // Enable gradient
    enableOpacity = true;
}

export class AxisConfig {
    // You can custom your own tick format.
    tickFormat?: Function;
    // You can custom witch tick you want to show. 
    tickValues?: number[];
    // The axis start number, if not assign then use min data in chartbase.
    begin: number;
    // The axis end number, if not assign then use max data in chartbase.
    end: number;
    // The axis show label.
    label: string;
}

export class AreaAxisConfig extends AxisConfig {
    xAxis: AxisConfig;
    yAxis: AxisConfig;
}


/**
 * The chart used configuration to fetch data from server.
 */
export class ChartFetchConfig {
    // Data request url.
    url: string;
    // Data request parameter.
    parameter: any;
    // The http request method, default: POST.
    method: string = 'POST';
    // Success callback.
    callback: Function;
    // Error callback.
    errCallback: Function;
}