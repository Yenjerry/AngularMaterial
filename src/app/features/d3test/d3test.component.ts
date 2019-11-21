import { Component, OnInit, ElementRef, ViewChild, AfterViewInit, ViewEncapsulation } from '@angular/core';
import * as d3 from "d3";
import dataString from "./testdata.js";
import { min } from 'd3';

@Component({
    selector: 'app-d3test',
    encapsulation: ViewEncapsulation.None,
    templateUrl: './d3test.component.html',
    styleUrls: ['./d3test.component.scss']
})
export class D3testComponent implements OnInit, AfterViewInit {


    @ViewChild('container', { static: false }) container: ElementRef;

    // The flow raw data.
    rawData;
    // The analysis flow data.
    analysisData;
    // Draw chart used data.
    draws: chartBaseObj[] = [];

    constructor() {

        // this.rawData = JSON.parse(dataString).devices[0].datas;
        this.rawData = this.generateTestData(new Date(), 1);

        console.log(this.rawData)
        // zoom by day > hour > min

        let
            startTime,
            endTime;

        startTime = new Date();
        this.analysisData = this.groupByDay();
        endTime = new Date();

        console.log(`Analysis Cost time: ${(+endTime - +startTime)} ms`)

        // Array.from({ length: 100 }).forEach(o => {
        startTime = new Date();
        let tmp = this.recursiveCompute(this.analysisData)

        endTime = new Date();

        console.log(`Compute total Cost time: ${(+endTime - +startTime)} ms`)
        // });

        // console.log(tmp.datas.filter(o => {
        //     return o.notContinuous;
        // }));


    }

    /**
     * 
     * @param mapObject the analysis map object.
     * @param computeObject store the recursive compute data.
     */
    recursiveCompute(mapObject, computeObject?) {

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
        let _this = this;

        // Default compute object.
        computeObject = computeObject || {
            RX: {
                max: 0,
                min: null,
                avg: 0,
                total: 0,
                count: 0
            },
            TX: {
                max: 0,
                min: null,
                avg: 0,
                total: 0,
                count: 0
            },
            datas: [],
            notContinuous: false
        };

        // Previous data for check data is continuous.
        let previous;

        mapObject.forEach((data, key, map) => {
            // If property type is Map then recoursive compute child data.
            if (data instanceof Map) {
                _this.recursiveCompute(data, computeObject);
            }
            else {

                // If have previous key then check current and previous time diff is in threshold.
                if (previous) {
                    // Over threshold, set property notContinuous for draw chart used.
                    if (data.rTime - previous.rTime > 5 * 60 * 1000) {
                        computeObject.notContinuous = true;
                        data.notContinuous = true;
                    }
                }

                // The -1 mean the AP no response or timeout.
                if (data.inter_inbound === -1)
                    return;
                if (data.inter_outbound === -1)
                    return;

                computeObject.RX.max = computeObject.RX.max > data.inter_inbound ? computeObject.RX.max : data.inter_inbound;
                computeObject.RX.min = computeObject.RX.min == null ? data.inter_inbound : computeObject.RX.min > data.inter_inbound ? data.inter_inbound : computeObject.RX.min;
                computeObject.RX.total += data.inter_inbound;
                computeObject.RX.count++;

                computeObject.TX.max = computeObject.TX.max > data.inter_outbound ? computeObject.TX.max : data.inter_outbound;
                computeObject.TX.min = computeObject.TX.min == null ? data.inter_outbound : computeObject.TX.min > data.inter_outbound ? data.inter_outbound : computeObject.TX.min;
                computeObject.TX.total += data.inter_outbound;
                computeObject.TX.count++;

                // Store raw data.
                computeObject.datas.push(data);
            }

            previous = data;
        });

        // Compute RX、TX avg.
        computeObject.RX.avg = computeObject.RX.total / computeObject.RX.count;
        computeObject.TX.avg = computeObject.TX.total / computeObject.TX.count;

        return computeObject;
    }

    /**
     * Generate flow test data.
     */
    generateTestData(endDate: Date, dayCounts = 7) {
        let timeFormat = d3.timeFormat("%Y %m %d %H %M");

        endDate = endDate || new Date();

        let beginDate = new Date(),
            result = [];
        beginDate.setDate(endDate.getDate() - dayCounts);

        let count = 0;

        while (timeFormat(beginDate) < timeFormat(endDate)) {
            // count++;

            // console.log(timeFormat(beginDate), timeFormat(endDate))

            // if (count > 20000)
            //     break;

            beginDate.setMinutes(beginDate.getMinutes() + 1);

            if (Math.random() > 0.999) {
                beginDate.setMinutes(beginDate.getMinutes() + 10);
                // console.log('fire missing')
                continue;
            }

            result.push({
                eTime: beginDate.getTime(),
                elapsed_Time: 206,
                ifIndex: 3,
                ifName: "Gi1/0/1",
                inbound: 33904167537,
                indiscard: 0,
                inerror: 0,
                inter_inbound: Math.random() * 1000 + Math.random() * (beginDate.getMinutes() + 100),
                inter_indiscard: 0,
                inter_inerror: 0,
                inter_outbound: 26,
                inter_outdiscard: 0,
                inter_outerror: 0,
                is_ConnLost: 0,
                is_Overflow: 0,
                outbound: 33278368227,
                outdiscard: 0,
                outerror: 0,
                peak_threshold: 0,
                rTime: beginDate.getTime(),
                sTime: beginDate.getTime(),
                speed: 0,
                target_Host: "172.25.10.254",
                threshold: 0,
                threshold_Time_Range: 3600000,
                utility: 0
            });
        }

        return result;
    }

    ngOnInit() {
    }

    ngAfterViewInit(): void {

        setTimeout(() => {

            // set the dimensions and margins of the graph
            var margin = { top: 10, right: 30, bottom: 30, left: 60 },
                width = this.container.nativeElement.clientHeight - margin.left - margin.right,
                height = this.container.nativeElement.clientHeight - margin.top - margin.bottom;

            // append the svg object to the body of the page
            var svg = d3.select(this.container.nativeElement)
                .append("svg")
                .attr("width", width + margin.left + margin.right)
                .attr("height", height + margin.top + margin.bottom)
                .append("g")
                .attr("transform",
                    "translate(" + margin.left + "," + margin.top + ")");

            let datas = this.rawData;

            // console.log(datas);
            let max = d3.max<any>(datas, function (d) { return d.inter_inbound > d.inter_outbound ? d.inter_inbound : d.inter_outbound; })

            // Add X axis --> it is a date format
            var x = d3.scaleTime()
                .domain([datas[0].rTime, datas[datas.length - 1].rTime])
                .range([0, width]);

            let xAxis = svg.append("g")
                .attr("transform", "translate(0," + height + ")")
                .attr("stroke", "#69b3a2")
                .call(d3.axisBottom(x).tickFormat(
                    d3.timeFormat("%m/%d %H:%M")
                ));

            // Add Y axis
            var y = d3.scaleLinear()
                .domain([0, parseInt(max)])
                .range([height, 0]);

            let yAxis = svg.append("g")
                .attr("stroke", "#69b3a2")
                .call(d3.axisLeft(y));

            // Add a clipPath: everything out of this area won't be drawn.
            var clip = svg.append("defs").append("svg:clipPath")
                .attr("id", "clip")
                .append("svg:rect")
                .attr("width", width)
                .attr("height", height)
                .attr("x", 0)
                .attr("y", 0);


            // Create the line variable: where both the line and the brush take place
            var line = svg.append('g')
                .attr("clip-path", "url(#clip)")


            // ***************** test for compute data for chart used.
            this.analysisData.forEach(year => {
                year.forEach(month => {

                    month.forEach(day => {

                        day.forEach(hour => {

                            hour.forEach(min => {
                                let draw = new chartBaseObj();

                                let compute = this.recursiveCompute(min);
                                draw.x = compute.x;
                                draw.y = compute.y;

                                this.draws.push(draw);
                            });

                        });

                    });

                });
            });

            console.log(this.draws)


            var zoom = d3.zoom()
                // .x(this.xAxis.x)
                .scaleExtent([1, Infinity])
                // .translateExtent([[-this.chartMargin.left, 0], [this.width + ((2 * this.chartMargin.left) / zoomFactor), 0]])
                .translateExtent([[0, 0], [width, height]])
                .extent([[0, 0], [width, height]])
                .on("zoom", zoomed)

            svg.call(zoom)

            let xAxisTmp = x.copy();

            function zoomed() {
                if (d3.event.sourceEvent && d3.event.sourceEvent.type === "brush") return; // ignore zoom-by-brush

                var t = d3.event.transform;


                x = t.rescaleX(xAxisTmp);

                xAxis.transition().duration(300).call(d3.axisBottom(x).tickFormat(
                    d3.timeFormat("%m/%d %H:%M")
                ));

                let area = d3.area<any>()
                    .defined(d => !d.notContinuous)
                    .x(function (d) {
                        return x(d.x)
                    })
                    .y0(y(0))
                    .y1(function (d) { return y(d.y) });

                line.select(".area").attr("d", area)

            }

            // Add the line
            line.append("path")
                .datum(this.draws)
                .attr("class", "area")  // I add the class line to be able to modify this line later on.
                .attr("fill", "#cce5df")
                .attr("stroke", "#69b3a2")
                .attr("stroke-width", 1.5)
                .attr("d", d3.area<any>()
                    .x(function (d) { return x(d.x) })
                    .y0(y(0))
                    .y1(function (d) { return y(d.y) })
                )

            var idleTimeout
            function idled() { idleTimeout = null; }

            // Tooltip
            var focus = svg.append("g")
                .attr("class", "focus")
                .style("display", "none");

            focus.append("circle")
                .attr("r", 5);

            focus.append("text")
                .attr("x", 9)
                .attr("dy", ".35em")
                .style("font-size", 15);

            svg.append("rect")
                .attr("class", "overlay")
                .attr("width", width)
                .attr("height", height)
                .on("mouseover", function () {
                    focus.style("display", null);
                })
                .on("mouseout", function () {
                    focus.style("display", "none");
                })
                .on("mousemove", mousemove);


            var bisectDate = d3.bisector(function (d: any) {
                return d.x;
            }).left;


            var xline = svg.append("line")
                .attr("x1", 0)
                .attr("x2", 0)
                .attr("y1", 0)
                .attr("y2", height)
                .attr("stroke-width", 1)

                .attr("stroke", "white")
            // .attr("stroke-dasharray", "8,8");



            // Add brushing
            var brush = d3.brushX()                   // Add the brush feature using the d3.brush function
                .extent([[0, 0], [width, height]])  // initialise the brush area: start at 0,0 and finishes at width,height: it means I select the whole graph area
                .on("end", updateChart)               // Each time the brush selection changes, trigger the 'updateChart' function

            svg
                .append("g")
                .attr("class", "brush")
                .call(brush);

            svg.on('mouseover', () => {
                focus.style("display", null);
            });

            svg.on('mousemove', mousemove);

            svg.on('mouseout', () => {
                focus.style("display", "none");
            });

            let _this = this;

            function mousemove() {
                return;
                // console.log(_this.draws)
                var x0 = x.invert(d3.mouse(this)[0]) as any,
                    i = bisectDate(_this.draws, x0, 1),
                    d0 = _this.draws[i - 1],
                    d1 = _this.draws[i],
                    d = x0 - d0.x > d1.x - x0 ? d1 : d0;
                // var depl = parseFloat(d['Safari']) + parseFloat(d['Opera']) + parseFloat(d['Firefox']);
                xline.attr("x1", x(d.x))
                    .attr("x2", x(d.x));
                // console.log(height, parseInt(max), d.y)

                focus.attr("transform", "translate(" + x(d.x) + "," + (1 - d.y / parseInt(max)) * height + ")");

                focus.select("text").text(d.y);
            }
            function round(x, n) {
                return n == null ? Math.round(x) : Math.round(x * (n = Math.pow(10, n))) / n;
            }
            // A function that update the chart for given boundaries
            function updateChart() {
                // What are the selected boundaries?
                let extent = d3.event.selection

                // If no selection, back to initial coordinate. Otherwise, update X axis domain
                if (!extent) {
                    if (!idleTimeout) return idleTimeout = setTimeout(idled, 350); // This allows to wait a little bit
                    x.domain([4, 8])
                } else {
                    x.domain([x.invert(extent[0]), x.invert(extent[1])])
                    svg.select(".brush").call(brush.move, null) // This remove the grey brush area as soon as the selection has been done
                }

                // Update axis and line position
                xAxis.transition().duration(1000).call(d3.axisBottom(x).tickFormat(
                    d3.timeFormat("%m/%d %H:%M")
                ));

                line
                    .select('.area')
                    .transition()
                    .duration(1000)
                    .attr("d", d3.area<any>()
                        .x(function (d) { return x(d.x) })
                        .y0(y(0))
                        .y1(function (d) { return y(d.y) })
                    )
            }

            // If user double click, reinitialize the chart
            svg.on("dblclick", function () {

                x.domain([datas[0].rTime, datas[datas.length - 1].rTime])
                xAxis.call(d3.axisBottom(x).tickFormat(
                    d3.timeFormat("%m/%d %H:%M")
                ))

                line
                    .select('.area')
                    // .datum(datas)
                    // .transition()
                    // .duration(1000)
                    .attr("d", d3.area<any>()
                        .x(function (d) { return x(d.x) })
                        .y0(y(0))
                        .y1(function (d) { return y(d.y) })
                    )
            });
        });


    }

    // 6 min (1 min buffer)
    diffThreshold = 6 * 60 * 1000;

    private groupByDay(rawDatas?) {

        let years = new Map();

        rawDatas = rawDatas || this.rawData;

        rawDatas.forEach(data => {

            // The flow run time.
            let
                runTime = new Date(data.rTime),
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

}

class chartBaseObj {
    x;
    y;
    utility;
}