import { Component, OnInit, ViewChild, ElementRef, AfterViewInit, Input } from '@angular/core';
import { Chart } from 'chart.js';

@Component({
    selector: 'app-pie-chart',
    templateUrl: './pie-chart.component.html',
    styleUrls: ['./pie-chart.component.scss']
})
export class PieChartComponent implements OnInit, AfterViewInit {

    @ViewChild('revenueLineChart', { static: false }) chart: ElementRef;

    @Input() chartData;

    data = {
        datasets: [{
            data: [],
            backgroundColor: ['#36a2eb', '#fe6383', '#ffcc56', '#b48e94', '#8e94b4']
        }],
        // These labels appear in the legend and in the tooltips when hovering different arcs
        labels: [
        ]
    };

    constructor() {



    }

    ngOnInit() {
    }

    ngAfterViewInit() {

        this.chartData = this.chartData || { t: 4 };
        console.log(this.chartData, 'this is test matrial portal append component test.');

        Array.from({ length: this.chartData.t }, (v, i) => {
            this.data.datasets[0].data.push(Math.floor(Math.random() * 25));
            this.data.labels.push('Random Data' + i);
        });

        this.createChart();
    }

    createChart() {
        const ctx = this.chart.nativeElement.getContext('2d');
        const revenueLineChart = new Chart(ctx, {
            type: 'pie',
            data: this.data,
            options: {
                // responsive: false
                maintainAspectRatio: false
            }
        });
        console.log('fire init chart.', revenueLineChart)
    }
}
