import { SyscomMessage, MessageLevel } from './../../Models/message';
import { MessageServiceService } from './../../services/message-service.service';
import { Component, OnInit, ViewChild, Input, Inject } from '@angular/core';
import { MatTableDataSource } from '@angular/material/table';
import { MatPaginator } from '@angular/material/paginator';
import { MatDialogRef } from '@angular/material/dialog';
import { MAT_DIALOG_DATA } from '@angular/material'

@Component({
    selector: 'app-message-dialog',
    templateUrl: './message-dialog.component.html',
    styleUrls: ['./message-dialog.component.scss']
})
export class MessageDialogComponent implements OnInit {

    displayedColumns: string[] = ['id', 'level', 'message', 'redirect'];
    dataSource;
    messageLevel = MessageLevel;

    @ViewChild(MatPaginator, { static: true }) paginator: MatPaginator;

    constructor(private messageService: MessageServiceService, private dialogRef: MatDialogRef<MessageDialogComponent>, @Inject(MAT_DIALOG_DATA) public data?: any) {
        this.dataSource = new MatTableDataSource<SyscomMessage>(this.messageService.messages);
        // console.log(MessageLevel[0])
    }

    ngOnInit() {
        this.dataSource.paginator = this.paginator;
    }

    close() {
        this.dialogRef.close();
    }
}
