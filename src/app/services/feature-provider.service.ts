import { Utility } from './../Common/utility';
import { Feature } from './../Models/feature';
import { Injectable } from '@angular/core';

@Injectable({
    providedIn: 'root'
})
export class FeatureProviderService {

    constructor() { }

    getFeatures(): Array<Feature> {
        return [{
            id: Utility.UUID(),
            name: 'content',
            navigate: "/dashboard/content"
        },
        {
            id: Utility.UUID(),
            name: 'message',
            navigate: "/dashboard/message"
        },
        {
            id: Utility.UUID(),
            name: 'dashboard',
            navigate: "/dashboard/dashboard/123"
        },
        {
            id: Utility.UUID(),
            name: 'global',
            navigate: "/dashboard/global"
        },
        {
            id: Utility.UUID(),
            name: 'login',
            navigate: "/dashboard/login"
        },
        {
            id: Utility.UUID(),
            name: 'stepper',
            navigate: "/dashboard/stepper"
        }];
    }
}
