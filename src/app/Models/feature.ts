import { Utility } from './../Common/utility';
import { GridsterItem } from 'angular-gridster2';
import { Component } from '@angular/core';
/**
 * The feature object for dashboard used.
 */
export class Feature {
    id: string = Utility.UUID();
    name: string;
    navigate?: string;
    children?: Feature[];
}
