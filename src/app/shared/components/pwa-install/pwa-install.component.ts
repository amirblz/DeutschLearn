import { Component, ChangeDetectionStrategy, inject, ElementRef, ViewChild, effect } from '@angular/core';
import { PwaInstallService } from '../../../core/services/pwa-install.service';

@Component({
    selector: 'app-pwa-install',
    changeDetection: ChangeDetectionStrategy.OnPush,
    templateUrl: './pwa-install.component.html',
    styleUrl: './pwa-install.component.scss'
})
export class PwaInstallComponent {
    readonly pwaService = inject(PwaInstallService);

    @ViewChild('closeButton') closeButton!: ElementRef<HTMLButtonElement>;

    constructor() {
        effect(() => {
            if (this.pwaService.showPrompt()) {
                setTimeout(() => {
                    this.closeButton?.nativeElement.focus();
                }, 100);
            }
        });
    }

    onInstallClick(): void {
        this.pwaService.triggerNativeInstall();
    }

    onDismissClick(): void {
        this.pwaService.dismissPrompt();
    }
}