
import { MatTableDataSource } from '@angular/material/table';
import { MatPaginator } from '@angular/material/paginator';
import { Component, OnInit, ViewChild, AfterViewInit, ChangeDetectorRef } from '@angular/core';
import { MatSort } from '@angular/material/sort';
import { merge, of } from 'rxjs';
import { startWith, switchMap, map, catchError, delay } from 'rxjs/operators';
import { SelectionModel } from '@angular/cdk/collections';


/**
 * @title Table with pagination
 */
@Component({
    selector: 'app-tabletest',
    styleUrls: ['tabletest.component.scss'],
    templateUrl: 'tabletest.component.html',
})
export class TabletestComponent implements OnInit, AfterViewInit {

    displayedColumns: string[] = ['select', 'position', 'name', 'weight', 'symbol'];
    dataSource;
    resultsLength = 0;
    isLoadingResults: boolean = true;
    isRateLimitReached: boolean = false;
    testData: PeriodicElement[] = new Array<PeriodicElement>();
    selection = new SelectionModel<PeriodicElement>(true, []);
    
    @ViewChild(MatPaginator, { static: true }) paginator: MatPaginator;
    @ViewChild(MatSort, { static: false }) sort: MatSort;

    constructor(private cdRef: ChangeDetectorRef) {
        this.GenerateTestData();
        // console.log(this.testData)
        this.dataSource = new MatTableDataSource<PeriodicElement>(this.testData);
    }

    ngOnInit() {
        this.dataSource.paginator = this.paginator;
        console.log(this.dataSource.data.length)
    }

    GenerateTestData() {
        for (let i = 0; i < 1000; i++) {
            this.testData.push({
                position: i, name: 'Good' + i, weight: Math.random() * 1000, symbol: 'H'
            });
        }
    }
    /** Whether the number of selected elements matches the total number of rows. */
    isAllSelected() {
        const numSelected = this.selection.selected.length;
        const numRows = this.dataSource.data.length;
        return numSelected === numRows;
    }

    /** Selects all rows if they are not all selected; otherwise clear selection. */
    masterToggle() {
        this.isAllSelected() ?
            this.selection.clear() :
            this.dataSource.data.forEach(row => this.selection.select(row));
    }
    /** The label for the checkbox on the passed row */
    checkboxLabel(row?: PeriodicElement): string {
        if (!row) {
            return `${this.isAllSelected() ? 'select' : 'deselect'} all`;
        }
        return `${this.selection.isSelected(row) ? 'deselect' : 'select'} row ${row.position + 1}`;
    }

    jumpPage() {
        this.paginator.pageIndex = Math.floor(Math.random() * 100);
        this.paginator.page.emit();
    }

    projectContentChanged(){
        console.log('detecte content change.')
    }

    ngAfterViewInit(): void {
        // this.exampleDatabase = new ExampleHttpDatabase(this._httpClient);

        // If the user changes the sort order, reset back to the first page.
        this.sort.sortChange.subscribe(() => this.paginator.pageIndex = 0);
        this.isLoadingResults = false;
        this.cdRef.detectChanges();
        // this.dataSource.data = this.dataSource.data.sort((a, b) => (a.name > b.name) ? 1 : -1);

        merge(this.sort.sortChange, this.paginator.page)
            .pipe(
                startWith({}),
                switchMap(() => {
                    this.isLoadingResults = true;
                    this.cdRef.detectChanges();
                    console.log(this.sort)

                    if (this.sort.direction == 'asc')
                        return of(this.testData.sort((a, b) => (a.name > b.name) ? 1 : -1));

                    return of(this.testData.sort((a, b) => (a.name < b.name) ? 1 : -1));
                }),
                delay(300),
                // map(data => {

                //     // Flip flag to show that loading has finished.
                //     this.isLoadingResults = false;
                //     this.isRateLimitReached = false;
                //     // this.resultsLength = data.length;

                //     return data;
                // }),
                catchError(() => {
                    this.isLoadingResults = false;
                    // Catch if the GitHub API has reached its rate limit. Return empty data.
                    this.isRateLimitReached = true;
                    this.cdRef.detectChanges();
                    return of([]);
                })
            ).subscribe(data => {
                console.log(data, 'cc');
                this.isLoadingResults = false;
                this.cdRef.detectChanges();
                this.dataSource.data = data;
            });
    }
}

export interface PeriodicElement {
    name: string;
    position: number;
    weight: number;
    symbol: string;
}


const ELEMENT_DATA: PeriodicElement[] =
    [
        { position: 1, name: 'Hydrogen', weight: 1.0079, symbol: 'H' },
        { position: 2, name: 'Helium', weight: 4.0026, symbol: 'He' },
        { position: 3, name: 'Lithium', weight: 6.941, symbol: 'Li' },
        { position: 4, name: 'Beryllium', weight: 9.0122, symbol: 'Be' },
        { position: 5, name: 'Boron', weight: 10.811, symbol: 'B' },
        { position: 6, name: 'Carbon', weight: 12.0107, symbol: 'C' },
        { position: 7, name: 'Nitrogen', weight: 14.0067, symbol: 'N' },
        { position: 8, name: 'Oxygen', weight: 15.9994, symbol: 'O' },
        { position: 9, name: 'Fluorine', weight: 18.9984, symbol: 'F' },
        { position: 10, name: 'Neon', weight: 20.1797, symbol: 'Ne' },
        { position: 11, name: 'Sodium', weight: 22.9897, symbol: 'Na' },
        { position: 12, name: 'Magnesium', weight: 24.305, symbol: 'Mg' },
        { position: 13, name: 'Aluminum', weight: 26.9815, symbol: 'Al' },
        { position: 14, name: 'Silicon', weight: 28.0855, symbol: 'Si' },
        { position: 15, name: 'Phosphorus', weight: 30.9738, symbol: 'P' },
        { position: 16, name: 'Sulfur', weight: 32.065, symbol: 'S' },
        { position: 17, name: 'Chlorine', weight: 35.453, symbol: 'Cl' },
        { position: 18, name: 'Argon', weight: 39.948, symbol: 'Ar' },
        { position: 19, name: 'Potassium', weight: 39.0983, symbol: 'K' },
        { position: 20, name: 'Calcium', weight: 40.078, symbol: 'Ca' },
        { position: 25, name: 'Calcium', weight: 40.078, symbol: 'Ca' },
    ];
