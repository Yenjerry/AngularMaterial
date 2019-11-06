
import { Component, OnInit, Host } from '@angular/core';
import { AuthService } from 'src/app/auth/auth.service';

@Component({
    selector: 'app-sitemenu',
    templateUrl: './sitemenu.component.html',
    styleUrls: ['./sitemenu.component.scss']
})
export class SitemenuComponent implements OnInit {

    constructor(private auth: AuthService) { 
      
    }

    ngOnInit() {
    }

}
