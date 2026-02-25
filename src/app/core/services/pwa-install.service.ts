import { Injectable, inject, signal, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser, DOCUMENT } from '@angular/common';

export interface BeforeInstallPromptEvent extends Event {
    readonly platforms: string[];
    readonly userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
    prompt(): Promise<void>;
}

export type PwaPlatform = 'ios' | 'native' | 'unsupported';

@Injectable({
    providedIn: 'root'
})
export class PwaInstallService {
    private readonly platformId = inject(PLATFORM_ID);
    private readonly document = inject(DOCUMENT);
    private readonly window = this.document.defaultView;

    private readonly COOLDOWN_DAYS = 7;
    private readonly COOLDOWN_MS = this.COOLDOWN_DAYS * 24 * 60 * 60 * 1000;
    private readonly STORAGE_KEY = 'pwa_prompt_dismissed_at';

    private deferredPrompt: BeforeInstallPromptEvent | null = null;

    readonly showPrompt = signal<boolean>(false);
    readonly platform = signal<PwaPlatform>('unsupported');

    constructor() {
        if (isPlatformBrowser(this.platformId) && this.window) {
            this.initializeFrictionlessPrompt();
        }
    }

    private initializeFrictionlessPrompt(): void {
        if (this.isAppAlreadyInstalled()) {
            return;
        }

        this.detectPlatform();

        this.window?.addEventListener('beforeinstallprompt', (event: Event) => {
            event.preventDefault();
            this.deferredPrompt = event as BeforeInstallPromptEvent;
            this.platform.set('native');
        });

        this.window?.addEventListener('appinstalled', () => {
            this.deferredPrompt = null;
            this.showPrompt.set(false);
            this.clearCooldown();
        });

        // Smart Timing: Wait 10 seconds before offering the prompt
        this.window?.setTimeout(() => {
            this.evaluateAndShowPrompt();
        }, 10000);
    }

    private detectPlatform(): void {
        const userAgent = this.window?.navigator.userAgent.toLowerCase() || '';
        const isIOS = /iphone|ipad|ipod/.test(userAgent);
        const isSafari = /safari/.test(userAgent) && !/chrome|crios|fxios/.test(userAgent);

        if (isIOS && isSafari) {
            this.platform.set('ios');
        }
    }

    private isAppAlreadyInstalled(): boolean {
        if (!this.window) return false;
        const isStandaloneMatchMedia = this.window.matchMedia('(display-mode: standalone)').matches;
        const isStandaloneNavigator = ('standalone' in this.window.navigator) && (this.window.navigator as any).standalone;
        return isStandaloneMatchMedia || isStandaloneNavigator;
    }

    evaluateAndShowPrompt(): void {
        if (this.isAppAlreadyInstalled() || this.platform() === 'unsupported') {
            return;
        }

        const dismissedAt = localStorage.getItem(this.STORAGE_KEY);
        if (dismissedAt) {
            const dismissedTime = parseInt(dismissedAt, 10);
            const now = Date.now();
            if (now - dismissedTime < this.COOLDOWN_MS) {
                return;
            }
        }

        this.showPrompt.set(true);
    }

    async triggerNativeInstall(): Promise<void> {
        if (!this.deferredPrompt) {
            return;
        }

        this.showPrompt.set(false);
        await this.deferredPrompt.prompt();
        const choice = await this.deferredPrompt.userChoice;

        if (choice.outcome === 'dismissed') {
            this.dismissPrompt();
        } else {
            this.deferredPrompt = null;
        }
    }

    dismissPrompt(): void {
        this.showPrompt.set(false);
        localStorage.setItem(this.STORAGE_KEY, Date.now().toString());
    }

    private clearCooldown(): void {
        localStorage.removeItem(this.STORAGE_KEY);
    }
}