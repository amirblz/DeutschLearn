import { Component, inject, output, signal, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormControl, Validators } from '@angular/forms';
import { AuthService } from '../../core/services/auth.service';
import { ContentSyncService } from '../../infrastructure/sync/content-sync.service';

@Component({
  selector: 'app-login-modal',
  imports: [CommonModule, ReactiveFormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="terminal-backdrop" (click)="close.emit()">
      <div class="terminal-window" (click)="$event.stopPropagation()" role="dialog" aria-labelledby="modal-title" aria-modal="true">
        
        <div class="terminal-header">
          <div class="signal-light" [class.active]="!loading()" [class.busy]="loading()"></div>
          <span id="modal-title" class="header-title">IDENTITY UPLINK</span>
          <button class="close-btn" aria-label="Close modal" (click)="close.emit()">✕</button>
        </div>

        <div class="terminal-body">
          <div class="scan-line"></div>

          @if (!codeSent()) {
            <div class="form-state">
              <p class="console-text">> INITIATE SEQUENCE...</p>
              <p class="console-text"><label for="email-input">> ENTER DESIGNATION (EMAIL):</label></p>
              
              <div class="input-wrapper">
                <span class="prompt" aria-hidden="true">$</span>
                <input id="email-input"
                       type="email" 
                       [formControl]="emailControl" 
                       placeholder="pilot@deuvocab.com" 
                       (keyup.enter)="sendCode()"
                       [disabled]="loading()"
                       autofocus>
              </div>

              <button class="tactical-btn" [disabled]="loading() || emailControl.invalid" (click)="sendCode()">
                <span class="btn-text">{{ loading() ? 'TRANSMITTING...' : 'SEND ACCESS CODE' }}</span>
                <span class="btn-decor"></span>
              </button>
            </div>
          } @else {
            <div class="form-state">
              <p class="console-text text-success">> CODE TRANSMITTED.</p>
              <p class="console-text"><label for="code-input">> AWAITING INPUT:</label></p>

              <div class="input-wrapper code-mode">
                <span class="prompt" aria-hidden="true">CODE:</span>
                <input id="code-input"
                       type="text" 
                       [formControl]="codeControl" 
                       placeholder="_ _ _ _ _ _" 
                       maxlength="6" 
                       (keyup.enter)="verify()"
                       [disabled]="loading()"
                       class="code-input">
              </div>

              <div class="actions">
                <button class="tactical-btn confirm" [disabled]="loading() || codeControl.invalid" (click)="verify()">
                  {{ loading() ? 'VERIFYING...' : 'ESTABLISH LINK' }}
                </button>
                <button class="text-link" (click)="codeSent.set(false)">
                  [ ABORT / RETRY ]
                </button>
              </div>
            </div>
          }

          @if (errorMsg()) {
            <div class="error-log" aria-live="assertive">
              <span>⚠ ERROR: {{ errorMsg() }}</span>
            </div>
          }
        </div>
        
        <div class="terminal-footer">
          <span>SECURE CONNECTION</span>
          <span>V.2.0.4</span>
        </div>
      </div>
    </div>
  `,
  // ... (Keep the exact same styles you provided previously)
  styles: [`/* Styles remain identical */`]
})
export class LoginModalComponent {
  auth = inject(AuthService);
  sync = inject(ContentSyncService);

  close = output<void>();

  emailControl = new FormControl('', { validators: [Validators.required, Validators.email], nonNullable: true });
  codeControl = new FormControl('', { validators: [Validators.required, Validators.minLength(6)], nonNullable: true });

  loading = signal(false);
  codeSent = signal(false);
  errorMsg = signal('');

  async sendCode() {
    if (this.emailControl.invalid) {
      this.errorMsg.set('INVALID DESIGNATION');
      return;
    }
    this.loading.set(true);
    this.errorMsg.set('');

    try {
      await this.auth.requestLogin(this.emailControl.value);
      this.codeSent.set(true);
    } catch (e) {
      this.errorMsg.set('TRANSMISSION FAILED');
    } finally {
      this.loading.set(false);
    }
  }

  async verify() {
    if (this.codeControl.invalid) return;
    this.loading.set(true);
    this.errorMsg.set('');

    try {
      await this.auth.verifyLogin(this.emailControl.value, this.codeControl.value);
      await this.sync.sync();
      this.close.emit();
    } catch (e) {
      this.errorMsg.set('ACCESS DENIED. INVALID CODE.');
    } finally {
      this.loading.set(false);
    }
  }
}