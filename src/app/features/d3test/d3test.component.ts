import { Component, OnInit, ElementRef, ViewChild, AfterViewInit, ViewEncapsulation } from '@angular/core';
import * as d3 from "d3";
import dataString from "./testdata.js";

@Component({
    selector: 'app-d3test',
    encapsulation: ViewEncapsulation.None,
    templateUrl: './d3test.component.html',
    styleUrls: ['./d3test.component.scss']
})
export class D3testComponent implements OnInit, AfterViewInit {


    @ViewChild('container', { static: false }) container: ElementRef;

    flowData;

    constructor() {

        this.flowData = JSON.parse(dataString);

        console.log(this.flowData)
    }

    ngOnInit() {
    }

    ngAfterViewInit(): void {

        // set the dimensions and margins of the graph
        var margin = { top: 10, right: 30, bottom: 30, left: 60 },
            width = 600 - margin.left - margin.right,
            height = 300 - margin.top - margin.bottom;

        // append the svg object to the body of the page
        var svg = d3.select("#my_dataviz")
            .append("svg")
            .attr("width", width + margin.left + margin.right)
            .attr("height", height + margin.top + margin.bottom)
            .append("g")
            .attr("transform",
                "translate(" + margin.left + "," + margin.top + ")");

        var formatTime = d3.timeFormat("%m/%d %H:%M");
        console.log(formatTime(new Date(0))); // "June 30, 2015"

        let datas = this.flowData.devices[0].datas;//.slice(0, 10000);
        console.log(datas);
        let max = d3.max<any>(datas, function (d) { return d.inter_inbound > d.inter_outbound ? d.inter_inbound : d.inter_outbound; })

        // Add X axis --> it is a date format
        var x = d3.scaleTime()
            .domain([datas[0].rTime, datas[datas.length - 1].rTime])
            .range([0, width]);

        let xAxis = svg.append("g")
            .attr("transform", "translate(0," + height + ")")
            .call(d3.axisBottom(x).tickFormat(
                d3.timeFormat("%m/%d %H:%M")
            ));

        // Add Y axis
        var y = d3.scaleLinear()
            .domain([0, parseInt(max)])
            .range([height, 0]);

        let yAxis = svg.append("g")
            .call(d3.axisLeft(y));

        // Add a clipPath: everything out of this area won't be drawn.
        var clip = svg.append("defs").append("svg:clipPath")
            .attr("id", "clip")
            .append("svg:rect")
            .attr("width", width)
            .attr("height", height)
            .attr("x", 0)
            .attr("y", 0);

        // Add brushing
        var brush = d3.brushX()                   // Add the brush feature using the d3.brush function
            .extent([[0, 0], [width, height]])  // initialise the brush area: start at 0,0 and finishes at width,height: it means I select the whole graph area
            .on("end", updateChart)               // Each time the brush selection changes, trigger the 'updateChart' function

        // Create the line variable: where both the line and the brush take place
        var line = svg.append('g')
            .attr("clip-path", "url(#clip)")

        // Add the line
        line.append("path")
            .datum(datas)
            .attr("class", "area")  // I add the class line to be able to modify this line later on.
            .attr("fill", "#cce5df")
            .attr("stroke", "#69b3a2")
            .attr("stroke-width", 1.5)
            .attr("d", d3.area<any>()
                .x(function (d) { return x(d.rTime) })
                .y0(y(0))
                .y1(function (d) { return y(d.inter_inbound) })
            )

        // line.append("path")
        //     .datum(datas)
        //     .attr("class", "area")  // I add the class line to be able to modify this line later on.
        //     .attr("fill", "none")
        //     .attr("stroke", "yellow")
        //     .attr('opacity', 0.4)
        //     .attr("stroke-width", 1.5)
        //     .attr("d", d3.line<any>()
        //         .x(function (d) { return x(d.rTime) })
        //         .y(function (d) { return y(d.inter_outbound) })
        //     )

        line
            .append("g")
            .attr("class", "brush")
            .call(brush);

        var idleTimeout
        function idled() { idleTimeout = null; }



        var zoom = d3.zoom()
            .scaleExtent([1, Infinity])
            .translateExtent([[0, 0], [width, height]])
            .extent([[0, 0], [width, height]])
            .on("zoom", zoomed);

        function zoomed() {
            // if (d3.event.sourceEvent && d3.event.sourceEvent.type === "brush") return; // ignore zoom-by-brush
            // var t = d3.event.transform;

            // x.domain(t.rescaleX(x2).domain());

            // svg.select(".line").attr("d", line);

            // focus.select(".axis--x").call(xAxis);
            // context.select(".brush").call(brush.move, x.range().map(t.invertX, t));
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
                line.select(".brush").call(brush.move, null) // This remove the grey brush area as soon as the selection has been done
            }

            // Update axis and line position
            xAxis.transition().duration(1000).call(d3.axisBottom(x).tickFormat(
                d3.timeFormat("%m/%d %H:%M")
            ))
            line
                .select('.area')
                .transition()
                .duration(1000)
                .attr("d", d3.area<any>()
                    .x(function (d) { return x(d.rTime) })
                    .y0(y(0))
                    .y1(function (d) { return y(d.inter_inbound) })
                )
        }

        // If user double click, reinitialize the chart
        svg.on("dblclick", function () {
            console.log('fire')

            x.domain([datas[0].rTime, datas[datas.length - 1].rTime])
            xAxis.transition().duration(1000).call(d3.axisBottom(x).tickFormat(
                d3.timeFormat("%m/%d %H:%M")
            ))

            line
                .select('.area')
                // .datum(datas)
                .transition()
                .duration(1000)
                .attr("d", d3.area<any>()
                    .x(function (d) { return x(d.rTime) })
                    .y0(y(0))
                    .y1(function (d) { return y(d.inter_inbound) })
                )
        });

    }
}
