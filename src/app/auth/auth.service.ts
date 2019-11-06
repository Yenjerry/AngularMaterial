import { User } from './../Models/user';
import { Injectable } from '@angular/core';

import { Observable, of } from 'rxjs';
import { tap, delay } from 'rxjs/operators';

@Injectable({
    providedIn: 'root',
})
export class AuthService {
    isLoggedIn = false;
    userInfo: User = new User();
    // store the URL so we can redirect after logging in
    redirectUrl: string;

    login(account, password): Observable<boolean> {

        if (password == '123456') {
            this.isLoggedIn = true;
            this.userInfo.name = account;
        }

        return of(this.isLoggedIn).pipe(
            delay(1000)
        );
    }

    logout(): void {
        this.isLoggedIn = false;
    }
}