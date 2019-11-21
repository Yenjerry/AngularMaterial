import { HttpClient } from '@angular/common/http';
import { ChartBase, ChartFetchConfig, AreaChartData } from './../Models/chart-base';
import { Component, OnInit, ViewChild, ElementRef, AfterViewInit, Input, ViewEncapsulation } from '@angular/core';
import * as d3 from 'd3';

@Component({
    selector: 'app-area',
    encapsulation: ViewEncapsulation.None,
    templateUrl: './area.component.html',
    styleUrls: ['./area.component.scss']
})
export class AreaComponent implements OnInit, AfterViewInit {

    // The container for this area chart.
    @ViewChild('areaChart', { static: false }) areaContainer: ElementRef;
    // The chart draw data.
    @Input() chratRawDatas?: Array<ChartBase[]>;


    chartMargin = { top: 10, right: 30, bottom: 30, left: 60 };
    svg;
    width;
    height;
    analysisData: Array<any>;
    dataInfo: Array<any>;
    chartDrawDatas: Array<any[]> = [];
    line;
    missingArea;
    focusPoint = {
        time: '',
        value: 0
    };

    xAxis = {
        x: null,
        axis: null,
        raw: null
    };
    yAxis = {
        y: null,
        axis: null,
        raw: null
    };


    constructor(private http: HttpClient) {


        let q = new AreaChartData();
        q.colors = [];
        q.colors.push(1);
        q.colors.push(1);

        console.log(q)

        this.chratRawDatas = [this.generateTestData(new Date(), 7)];
        this.analysisData = [this.sortChartData(this.chratRawDatas[0])];
        this.dataInfo = [this.recursiveCompute(this.analysisData[0])];

        let draws = []
        let s = new Date();

        this.analysisData[0].forEach(year => {
            year.forEach(month => {

                month.forEach(day => {

                    day.forEach(hour => {

                        // hour.forEach(min => {
                        let draw = { x: null, y: null, notContinuous: false }

                        let compute = this.recursiveCompute(hour);
                        draw.x = compute.datas[0].x;
                        draw.y = compute.max;
                        draw.notContinuous = compute.notContinuous;
                        draws.push(draw);
                        // })


                    });

                });

            });
        });

        let e = new Date();

        this.chartDrawDatas.push(draws);
        this.chartDrawDatas.push(draws);
        this.chartDrawDatas.push(draws);

        // console.log(this.chartDrawDatas)
        console.log(this.chratRawDatas, this.analysisData, this.dataInfo, `Init cost time: ${+e - +s} ms`)
        // console.log(`Init cost time: ${+e - +s}`)

    }

    ngOnInit() {
    }

    ngAfterViewInit() {

        let _this = this;

        // If chart in the gridster then we need wait the gridster size ready.
        setTimeout(() => {

            this.width = this.areaContainer.nativeElement.clientWidth - this.chartMargin.left - this.chartMargin.right;
            this.height = this.areaContainer.nativeElement.clientHeight - this.chartMargin.top - this.chartMargin.bottom;

            console.dir(this.areaContainer.nativeElement)

            // Init the root svg.
            this.svg = d3.select(this.areaContainer.nativeElement)
                .append("svg")
                .attr("width", this.width + this.chartMargin.left + this.chartMargin.right)
                .attr("height", this.height + this.chartMargin.top + this.chartMargin.bottom)
                .append("g")
                .attr("transform",
                    "translate(" + this.chartMargin.left + "," + this.chartMargin.top + ")");

            let t = this.chartDrawDatas[0];

            this.DrawXAxis([t[0].x, t[t.length - 1].x]);
            this.DrawYAxis([0, 1000]);

            // console.log(this.width, this.height, this.dataInfo)

            var clip = this.svg.append("defs").append("svg:clipPath")
                .attr("id", "clip")
                .append("svg:rect")
                .attr("width", this.width)
                .attr("height", this.height)
                .attr("x", 0)
                .attr("y", 0);

            // Create the line variable: where both the line and the brush take place
            let line = this.svg.append('g')
            // .attr("clip-path", "url(#clip)")
            this.line = line;

            console.log(this.chartDrawDatas[0], 'befor draw', this.width, this.height)



            let area = d3.area<any>()
                .defined(d => !d.notContinuous)
                .x(function (d) { return _this.xAxis.x(d.x) })
                .y0(this.yAxis.y(0))
                .y1(function (d) { return _this.yAxis.y(d.y) });

            let def = this.svg.append('defs');
            let gradient = def.append("linearGradient")
                .attr("id", "temperature-gradient")
                // .attr("gradientUnits", "userSpaceOnUse")
                .attr("x1", "0%").attr("y1", "0%")
                .attr("x2", "0%").attr("y2", "100%");

            gradient.append("stop")
                .attr("offset", "0%")
                .attr("stop-color", "skyblue")
                .attr("stop-opacity", 1)

            gradient.append("stop")
                .attr("offset", "100%")
                .attr("stop-color", "white")
                .attr("stop-opacity", 0);;

            // this.chartDrawDatas.forEach(datas => {
            // Add the line

            // })

            // line.append("path")
            //     .datum(this.chartDrawDatas[0])
            //     .attr("class", "area")  // I add the class line to be able to modify this line later on.
            //     .style("fill", "red")
            //     .attr("stroke", "#69b3a2")
            //     .attr("stroke-width", 1.5)
            //     .attr("d", area);

            line.append("path")
                .datum(this.chartDrawDatas[0])
                .attr("class", "area")  // I add the class line to be able to modify this line later on.
                .style("fill", "url(#temperature-gradient)")
                .attr("stroke", "#69b3a2")
                .attr("stroke-width", 1.5)
                .attr('x', this.xAxis.x)
                .attr("d", area);

            this.DrawTooltips();
            // this.EnableBrush();
            this.EnableZoom();
        }, 100);
    }

    DrawLine(xPosition) {
        this.line.append("line")
            .attr('class', 'missingArea')
            .attr("x1", xPosition)
            .attr("x2", xPosition)
            .attr("y1", 0)
            .attr("y2", this.height)
            .attr("stroke-width", 1)
            .attr("stroke", "red")
    }

    // Draw the x axis
    DrawXAxis(domain: Array<number>) {

        // todo: if xaxis is already generate then just update data.

        let _this = this;
        domain = domain || [];

        // Add X axis --> it is a date format
        this.xAxis.x = d3.scaleLinear()
            .domain(domain)
            .range([0, this.width]);

        this.xAxis.raw = this.xAxis.x.copy();

        console.log(this.chartDrawDatas[0])


        this.xAxis.axis = this.svg.append("g")
            .attr('class', 'axis')
            .attr("transform", "translate(0," + this.height + ")")
            .attr("stroke", "red")
            .call(d3.axisBottom(_this.xAxis.x).tickFormat(
                d3.timeFormat("%m/%d %H:%M")
            ));


    }

    // Draw the y axis
    DrawYAxis(domain: Array<number>) {

        // todo: if yaxis is already generate then just update data.

        let _this = this;
        domain = domain || [];

        this.yAxis.y = d3.scaleLinear()
            .domain(domain)
            .range([this.height, 0]);

        this.yAxis.raw = this.yAxis.y.copy();

        this.yAxis.axis = this.svg.append("g")
            .attr('class', 'axis')
            .attr("stroke", "blue")
            .call(d3.axisLeft(_this.yAxis.y).tickValues([
                0,
                100,
                200,
                _this.dataInfo[0].max
            ]).tickFormat(d => {
                console.log(d);
                return d + '';
            }));
    }

    DrawTooltips() {
        let _this = this;

        var focus = this.svg.append("g")
            .attr("class", "focus")
            .style("display", "none");

        focus.append("circle")
            .attr("r", 5);

        focus.append("text")
            .attr("x", 9)
            .attr("dy", ".35em")
            .style("font-size", 15);

        this.svg.append("rect")
            .attr("class", "overlay")
            .attr("width", this.width)
            .attr("height", this.height)

        this.svg.on("mouseover", function () {
            focus.style("display", null);
        })
            .on("mouseout", function () {
                focus.style("display", "none");
            })
            .on("mousemove", mousemove);

        var xline = this.svg.append("line")
            .attr("x1", 0)
            .attr("x2", 0)
            .attr("y1", 0)
            .attr("y2", this.height)
            .attr("stroke-width", 1)
            .attr("stroke", "red")

        let f = d3.timeFormat("%m/%d %H:%M");

        function mousemove() {

            let bisectDate = d3.bisector(function (d: any) {
                return d.x;
            }).left;

            // console.log(_this.draws)
            let x0 = _this.xAxis.x.invert(d3.mouse(this)[0]) as any,
                i = bisectDate(_this.chartDrawDatas[0], x0, 1),
                d0 = _this.chartDrawDatas[0][i - 1],
                d1 = _this.chartDrawDatas[0][i];

            if (i === _this.chartDrawDatas[0].length)
                return;
            // console.log(i, _this.chartDrawDatas[0].length)

            let d = x0 - d0.x > d1.x - x0 ? d1 : d0;

            if (d.notContinuous) {
                console.log(d, 'Missing data area');
                return true;
            }

            xline.attr("x1", _this.xAxis.x(d.x))
                .attr("x2", _this.xAxis.x(d.x));
            // console.log(height, parseInt(max), d.y)

            focus.attr("transform", "translate(" + _this.xAxis.x(d.x) + "," + (1 - d.y / 1000) * _this.height + ")");

            // console.log(_this.xAxis.x(d.x) + "," + (1 - d.y / _this.dataInfo[0].max) * _this.height)





            _this.focusPoint.time = f(new Date(d.x));
            _this.focusPoint.value = d.y;

            focus.select("text").text(d.y);
        }
    }

    EnableBrush() {
        var brush = d3.brushX()                   // Add the brush feature using the d3.brush function
            .extent([[0, 0], [this.width, this.height]])  // initialise the brush area: start at 0,0 and finishes at width,height: it means I select the whole graph area
            .on("end", updateChart)               // Each time the brush selection changes, trigger the 'updateChart' function

        this.svg
            .append("g")
            .attr("class", "brush")
            .call(brush);

        let idleTimeout,
            _this = this;
        function idled() { idleTimeout = null; }

        function updateChart() {

            if (d3.event.sourceEvent && d3.event.sourceEvent.type === "zoom") return; // ignore brush-by-zoom

            var s = d3.event.selection || _this.xAxis.raw.range();

            _this.xAxis.x.domain(s.map(_this.xAxis.raw.invert, _this.xAxis.raw));

            _this.xAxis.axis.transition().duration(1000).call(d3.axisBottom(_this.xAxis.x).tickFormat(
                d3.timeFormat("%m/%d %H:%M")
            ));

            _this.UpdateDataByTime();

            return;
            // What are the selected boundaries?
            let extent = d3.event.selection

            console.log('brush', extent)

            // If no selection, back to initial coordinate. Otherwise, update X axis domain
            if (!extent) {
                if (!idleTimeout) return idleTimeout = setTimeout(idled, 350); // This allows to wait a little bit
                _this.xAxis.x.domain([4, 8])
            } else {
                _this.xAxis.x.domain([_this.xAxis.x.invert(extent[0]), _this.xAxis.x.invert(extent[1])])
                _this.svg.select(".brush").call(brush.move, null) // This remove the grey brush area as soon as the selection has been done
            }

            // Update axis and line position
            _this.xAxis.axis.transition().duration(1000).call(d3.axisBottom(_this.xAxis.x).tickFormat(
                d3.timeFormat("%m/%d %H:%M")
            ));

            _this.line
                .select('.area')
                .transition()
                .duration(1000)
                .attr("d", d3.area<any>()
                    .x(function (d) { return _this.xAxis.x(d.x) })
                    .y0(_this.yAxis.y(0))
                    .y1(function (d) { return _this.yAxis.y(d.y) })
                )
        }
    }

    EnableZoom() {

        let _this = this;
        var zoomFactor = (d3.event != null ? d3.event.transform.k : 1);


        // generate d3 zoom event register.
        var zoom = d3.zoom()
            // .x(this.xAxis.x)
            .scaleExtent([1, Infinity])
            // .translateExtent([[-this.chartMargin.left, 0], [this.width + ((2 * this.chartMargin.left) / zoomFactor), 0]])
            .translateExtent([[0, 0], [this.width, this.height]])
            .extent([[0, 0], [this.width, this.height]])
            .on("zoom", zoomed)
            .on('end', handleZoomEnd);

        // Register zoom event to svg.
        this.svg.call(zoom)

        function handleZoomEnd() {
            // _this.UpdateDataByTime();

            // console.log(_this.line.invert())



        }

        let test = false;

        function zoomed() {
            if (d3.event.sourceEvent && d3.event.sourceEvent.type === "brush") return; // ignore zoom-by-brush

            var t = d3.event.transform;

            _this.xAxis.x = t.rescaleX(_this.xAxis.raw);

            let newRange = _this.xAxis.x.domain().map(o => Math.ceil(o));




            _this.xAxis.axis.transition().duration(300).call(d3.axisBottom(_this.xAxis.x).tickFormat(
                d3.timeFormat("%m/%d %H:%M")
            ));

            let area = d3.area<any>()
                .defined(d => !d.notContinuous)
                .x(function (d) { return _this.xAxis.x(d.x) })
                .y0(_this.yAxis.y(0))
                .y1(function (d) { return _this.yAxis.y(d.y) });

            _this.line.select(".area")
                .attr("d", area);

        }
    }

    zoom = false;

    tmpXaxis;

    UpdateDataByTime() {
        let timeRange = this.xAxis.x.domain(),
            timeDiff = timeRange[1] - timeRange[0],
            timeThreshold = 2 * 24 * 60 * 60 * 1000;
        let _this = this;

        // console.log('fire', timeRange)
        let draws = [],
            datas;


        datas = this.chratRawDatas[0].filter(o => {
            return o.x >= timeRange[0] && o.x <= timeRange[1];
        });

        console.log(datas)


        // return false;

        // if (timeDiff < timeThreshold) {

        //     if (this.zoom)
        //         return false;

        //     datas = this.chratRawDatas[0].filter(o => {
        //         return o.x >= timeRange[0] && o.x <= timeRange[1];
        //     });


        //     this.tmpXaxis = this.xAxis.x.copy();
        //     console.log('fire copy tmp');

        //     this.zoom = true;
        // }
        // else {
        //     return false;
        //     datas = this.chratRawDatas[0];
        //     // No trigger zoom nothing to do.
        //     if (!this.zoom)
        //         return false;

        //     this.zoom = false;
        // }

        let analysis = this.sortChartData(datas);

        analysis.forEach(year => {
            year.forEach(month => {

                month.forEach(day => {

                    day.forEach(hour => {

                        if (this.zoom) {
                            let prev;
                            hour.forEach((min) => {
                                let draw = { x: null, y: null, notContinuous: false }


                                if (prev && min.x - prev.x > 5 * 60 * 1000) {
                                    draws.push({
                                        x: Math.ceil((prev.x + min.x) / 2),
                                        y: 0,
                                        notContinuous: true
                                    });
                                }


                                let compute = this.recursiveCompute(min);
                                draw.x = compute.datas[0].x;
                                draw.y = compute.max;

                                draws.push(draw);

                                prev = min;
                            })
                        }
                        else {
                            let draw = { x: null, y: null, notContinuous: false }

                            let compute = this.recursiveCompute(hour);
                            draw.x = compute.datas[0].x;
                            draw.y = compute.max;
                            draw.notContinuous = compute.notContinuous;
                            draws.push(draw);
                        }
                    });

                });

            });
        });

        _this.chartDrawDatas[0] = draws;

        // console.log(_this.chartDrawDatas[0])
        let area = d3.area<any>()
            .defined(d => !d.notContinuous)
            .x(function (d) { return _this.xAxis.x(d.x) })
            .y0(_this.yAxis.y(0))
            .y1(function (d) { return _this.yAxis.y(d.y) });

        this.line.select(".area")
            .datum(this.chartDrawDatas[0])
            .attr("d", area);


    }

    /**
     * Sort the chart data to we need format.
     * @param rawDatas the chart base object array.
     */
    private sortChartData(rawDatas?) {

        let years = new Map();

        rawDatas = rawDatas || this.chratRawDatas;

        rawDatas.forEach(data => {

            // The flow run time.
            let
                runTime = new Date(data.x),
                months,
                days,
                hours,
                mins;

            // If no year key
            if (!years.has(runTime.getFullYear())) {
                months = new Map();
                years.set(runTime.getFullYear(), months);
            }
            else {
                months = years.get(runTime.getFullYear());
            }

            // If no month key
            if (!months.has(runTime.getMonth() + 1)) {
                days = new Map();
                months.set(runTime.getMonth() + 1, days);
            }
            else {
                days = months.get(runTime.getMonth() + 1);
            }

            // If no day key
            if (!days.has(runTime.getDate())) {
                hours = new Map();
                days.set(runTime.getDate(), hours);
            }
            else {
                hours = days.get(runTime.getDate());
            }

            // If no hour key
            if (!hours.has(runTime.getHours())) {
                mins = new Map();
                hours.set(runTime.getHours(), mins);
            }
            else {
                mins = hours.get(runTime.getHours());
            }

            mins.set(runTime.getMinutes(), data);

        });

        console.log(years);

        return years;
    }

    /**
     * Compute had sort data maximum, minimun, avg
     * @param mapObject the analysis map object.
     * @param computeObject store the recursive compute data.
     */
    private recursiveCompute(mapObject, computeObject?) {

        if (!(mapObject instanceof Map)) {
            return {
                max: mapObject.y,
                min: mapObject.y,
                avg: mapObject.y,
                total: 1,
                count: 1,
                datas: [mapObject],
                notContinuous: false
            };
        }

        // Default compute object.
        computeObject = computeObject || {
            max: 0,
            min: null,
            avg: 0,
            total: 0,
            count: 0,
            datas: [],
            notContinuous: false
        };

        // Previous data for check data is continuous.
        let previous;

        mapObject.forEach((data) => {
            // If property type is Map then recoursive compute child data.
            if (data instanceof Map) {
                this.recursiveCompute(data, computeObject);
            }
            else {

                // The -1 mean the AP no response or timeout, ignore it.
                if (data.y === -1)
                    return;

                // If have previous key then check current and previous time diff is in threshold.
                if (previous) {
                    // Over threshold, set property notContinuous for draw chart used.
                    if (data.x - previous.x > 5 * 60 * 1000) {
                        computeObject.notContinuous = true;
                        previous.notContinuous = true;
                    }
                }

                computeObject.max = computeObject.max > data.y ? computeObject.max : data.y;
                computeObject.min = computeObject.min == null ? data.y : computeObject.min > data.y ? data.y : computeObject.min;
                computeObject.total += data.y;
                computeObject.count++;

                // Store raw data.
                computeObject.datas.push(data);
            }

            previous = data;
        });

        // Compute RX、TX avg.
        computeObject.avg = computeObject.total / computeObject.count;

        return computeObject;
    }

    /**
     * Generate flow test data.
     */
    private generateTestData(endDate: Date, dayCounts = 7) {
        let timeFormat = d3.timeFormat("%Y %m %d %H %M");

        endDate = endDate || new Date();

        let beginDate = new Date(),
            result = [];
        beginDate.setDate(endDate.getDate() - dayCounts);

        while (timeFormat(beginDate) < timeFormat(endDate)) {

            beginDate.setMinutes(beginDate.getMinutes() + 1);

            if (Math.random() > 0.9999) {
                beginDate.setMinutes(beginDate.getMinutes() + 10);
                continue;
            }

            result.push({
                x: beginDate.getTime(),
                y: Math.random() * 10 + Math.random() * (beginDate.getMinutes() + 100)
            });
        }

        return result;
    }

}
