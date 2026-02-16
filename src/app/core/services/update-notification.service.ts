import { Injectable, inject, signal } from '@angular/core';
import { SwUpdate } from '@angular/service-worker';
import { filter } from 'rxjs';

@Injectable({
    providedIn: 'root'
})
export class UpdateNotificationService {
    private swUpdate = inject(SwUpdate);

    updateAvailable = signal<boolean>(false);

    constructor() {
        if (!this.swUpdate.isEnabled) return;

        this.swUpdate.versionUpdates
            .pipe(filter(evt => evt.type === 'VERSION_READY'))
            .subscribe(() => {
                this.updateAvailable.set(true);
            });
    }

    activateUpdate() {
        this.swUpdate.activateUpdate().then(() => document.location.reload());
    }
}