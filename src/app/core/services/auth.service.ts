import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class AuthService {
    private http = inject(HttpClient);
    private readonly API_URL = '/api/auth';

    // State
    currentUser = signal<string | null>(null); // Null = Anonymous
    isAuthenticated = signal(false);

    constructor() {
        this.checkAuth();
    }

    private checkAuth() {
        const token = localStorage.getItem('auth_token');
        const email = localStorage.getItem('auth_email');
        if (token && email) {
            this.currentUser.set(email);
            this.isAuthenticated.set(true);
        }
    }

    async requestLogin(email: string) {
        return firstValueFrom(this.http.post(`${this.API_URL}/login`, { email }));
    }

    async verifyLogin(email: string, code: string) {
        // 1. Get the current Anonymous ID to send for merging
        const anonId = localStorage.getItem('app_user_id') || '';

        const res: any = await firstValueFrom(
            this.http.post(
                `${this.API_URL}/verify`,
                { email, code },
                { headers: { 'x-user-id': anonId } }
            )
        );

        // 2. Save Credentials
        localStorage.setItem('auth_token', res.accessToken);
        localStorage.setItem('auth_email', email);

        // 3. SWITCH IDENTITY
        // We overwrite the 'app_user_id' with the real database ID
        // This ensures the ContentSyncService now syncs against the real account
        localStorage.setItem('app_user_id', res.userId);

        this.currentUser.set(email);
        this.isAuthenticated.set(true);
    }

    logout() {
        localStorage.removeItem('auth_token');
        localStorage.removeItem('auth_email');
        // We DO NOT remove app_user_id, we leave them with the last known ID 
        // or generate a new random one to start fresh.
        localStorage.setItem('app_user_id', crypto.randomUUID());

        this.isAuthenticated.set(false);
        this.currentUser.set(null);
        window.location.reload(); // Clean state
    }
}