/**
 * The message center base object.
 */
export class SyscomMessage {
    // Message id.
    id: string;
    // The message level.
    level: MessageLevel;
    // Message content.
    content: string;
    // The message is read or not.
    isRead: boolean;
    // User can use this to redirect to detail page.
    redirectTo: string;
    // The message extra data for redirect uesd.
    extraData: any;
}

/**
 * The message level definition.
 */
export enum MessageLevel {
    error,
    warn,
    info,
    debug
}