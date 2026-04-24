import { Component, inject, output, signal, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormControl, Validators } from '@angular/forms';
import { AuthService } from '../../core/services/auth.service';
import { ContentSyncService } from '../../core/services/content-sync.service';

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
  styles: [`
    /* --- BACKDROP --- */
    .terminal-backdrop {
      position: fixed; inset: 0; 
      background: rgba(0, 0, 0, 0.85); backdrop-filter: blur(8px);
      display: flex; align-items: center; justify-content: center;
      z-index: 100; animation: fadeIn 0.2s ease-out;
    }

    /* --- WINDOW --- */
    .terminal-window {
      width: 90%; max-width: 400px;
      background: #0B0E14;
      border: 1px solid #1e293b;
      box-shadow: 0 0 40px rgba(0,0,0,0.8), 0 0 0 1px rgba(59, 130, 246, 0.1);
      border-radius: 8px; overflow: hidden;
      position: relative;
      animation: slideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1);
    }

    /* --- HEADER --- */
    .terminal-header {
      background: #151921; padding: 12px 16px;
      display: flex; align-items: center; justify-content: space-between;
      border-bottom: 1px solid #1e293b;
    }
    .header-title {
      font-family: monospace; font-size: 0.8rem; letter-spacing: 2px;
      color: #64748b; font-weight: 700;
    }
    .signal-light {
      width: 8px; height: 8px; border-radius: 50%; background: #334155;
      transition: all 0.3s;
    }
    .signal-light.active { background: #10b981; box-shadow: 0 0 8px #10b981; }
    .signal-light.busy { background: #eab308; animation: blink 0.5s infinite; }
    .close-btn { background: none; border: none; color: #475569; cursor: pointer; font-size: 1rem; }
    .close-btn:hover { color: #fff; }

    /* --- BODY --- */
    .terminal-body {
      padding: 2rem; position: relative; min-height: 240px;
      display: flex; flex-direction: column; justify-content: center;
    }

    /* CRT SCANLINE EFFECT */
    .scan-line {
      position: absolute; inset: 0; pointer-events: none;
      background: linear-gradient(to bottom, transparent 50%, rgba(0,0,0,0.2) 50%);
      background-size: 100% 4px; opacity: 0.5; z-index: 0;
    }

    .console-text {
      font-family: monospace; color: #94a3b8; font-size: 0.85rem; margin-bottom: 0.5rem;
      z-index: 1; position: relative;
    }
    .text-success { color: #10b981; }

    .input-wrapper {
      display: flex; align-items: center; gap: 10px;
      background: rgba(255,255,255,0.03); border: 1px solid #334155;
      padding: 12px; margin: 1.5rem 0; border-radius: 4px;
      transition: border-color 0.2s; position: relative; z-index: 2;
    }
    .input-wrapper:focus-within { border-color: #3b82f6; background: rgba(59, 130, 246, 0.05); }
    
    .prompt { color: #3b82f6; font-weight: 700; font-family: monospace; }
    input {
      background: transparent; border: none; outline: none; color: white;
      font-family: monospace; font-size: 1rem; width: 100%;
    }
    .code-input { letter-spacing: 8px; font-weight: 700; text-align: center; }

    /* --- BUTTONS --- */
    .tactical-btn {
      width: 100%; padding: 14px; background: #3b82f6;
      border: none; color: white; font-family: monospace; font-weight: 700;
      letter-spacing: 1px; cursor: pointer; position: relative; overflow: hidden;
      clip-path: polygon(10px 0, 100% 0, 100% calc(100% - 10px), calc(100% - 10px) 100%, 0 100%, 0 10px);
      transition: all 0.2s; z-index: 2;
    }
    .tactical-btn:hover:not(:disabled) { background: #2563eb; transform: translateY(-1px); }
    .tactical-btn:active:not(:disabled) { transform: translateY(1px); }
    .tactical-btn:disabled { background: #334155; cursor: not-allowed; opacity: 0.7; }
    
    .tactical-btn.confirm { background: #10b981; }
    .tactical-btn.confirm:hover { background: #059669; }

    .actions { display: flex; flex-direction: column; gap: 1rem; margin-top: 1rem; }
    .text-link {
      background: none; border: none; color: #475569; font-family: monospace;
      font-size: 0.75rem; cursor: pointer; margin-top: 0.5rem;
    }
    .text-link:hover { color: #94a3b8; }

    .error-log {
      margin-top: 1rem; padding: 10px; background: rgba(239, 68, 68, 0.1);
      border-left: 3px solid #ef4444; color: #ef4444; font-family: monospace; font-size: 0.75rem;
      animation: shake 0.3s;
    }

    .terminal-footer {
      background: #0f1219; padding: 8px 16px; display: flex; justify-content: space-between;
      color: #334155; font-family: monospace; font-size: 0.6rem; letter-spacing: 1px;
    }

    @keyframes blink { 50% { opacity: 0.5; } }
    @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
    @keyframes slideUp { from { transform: translateY(20px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
    @keyframes shake { 0%, 100% { transform: translateX(0); } 25% { transform: translateX(-4px); } 75% { transform: translateX(4px); } }
  `]
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