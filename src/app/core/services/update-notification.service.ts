import { Injectable, inject, signal } from '@angular/core';
import { SwUpdate } from '@angular/service-worker';
import { filter } from 'rxjs';

@Injectable({
    providedIn: 'root'
})
export class UpdateNotificationService {
    private swUpdate = inject(SwUpdate);

    // Signal to drive the UI Toast
    updateAvailable = signal<boolean>(false);

    constructor() {
        if (!this.swUpdate.isEnabled) return;

        // Poll for updates every 6 hours (optional, good for long-running tabs)
        // setInterval(() => this.swUpdate.checkForUpdate(), 6 * 60 * 60 * 1000);

        this.swUpdate.versionUpdates
            .pipe(filter(evt => evt.type === 'VERSION_READY'))
            .subscribe(() => {
                // Set signal to true to show the toast
                this.updateAvailable.set(true);
            });
    }

    activateUpdate() {
        // Reload the page to load the new version
        this.swUpdate.activateUpdate().then(() => document.location.reload());
    }
}