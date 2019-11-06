import { Utility } from './../Common/utility';
import { Injectable } from '@angular/core';
import { SyscomMessage } from '../Models/message';


@Injectable({
    providedIn: 'root'
})
export class MessageServiceService {

    messages: SyscomMessage[];

    constructor() {
        this.messages = this.fetchMessage();
    }

    fetchMessage(): SyscomMessage[] {

        const count = Math.floor(Math.random() * 100);

        const result = Array.from({ length: count }).map((_, i) => {
            return {
                id: Utility.UUID(),
                level: Math.floor(Math.random() * 4),
                content: `Test message ${i}`,
                isRead: false,
                redirectTo: '',
                extraData: Math.floor(Math.random() * 50)
            } as SyscomMessage
        });

        return result;
    }


}
