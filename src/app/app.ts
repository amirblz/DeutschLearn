import { Component, inject, OnInit } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';

import { UpdateNotificationService } from './core/services/update-notification.service';
import { StudyStateService } from './core/services/study-state.service';
import { PwaInstallComponent } from './shared/components/pwa-install/pwa-install.component';
@Component({
  selector: 'app-root',
  imports: [RouterOutlet, RouterLink, RouterLinkActive, PwaInstallComponent],
  template: `
    <div class="app-shell">
      
      <nav class="desktop-nav">
        <div class="nav-top">
          <div class="links">
            <a routerLink="/" routerLinkActive="active" [routerLinkActiveOptions]="{exact:true}">
              <span class="icon">Home</span>
            </a>
            
            <a routerLink="/library" routerLinkActive="active">
              <span class="icon">Library</span>
            </a>

            <a routerLink="/learn" routerLinkActive="active">
              <span class="icon">Study</span>
            </a>

            <a routerLink="/review" routerLinkActive="active" class="nav-item-desktop">
              <span class="icon-row">
                System
                @if (studyState.dueCount() > 0) {
                  <span class="badge-desktop">{{ studyState.dueCount() }}</span>
                }
              </span>
            </a>
          </div>
        </div>
        
        <div class="nav-footer">
          <span class="version">v1.0.0 (Beta)</span>
        </div>
      </nav>

      <main class="stage">
          <router-outlet></router-outlet>

          <app-pwa-install></app-pwa-install>
      </main>

      <nav class="mobile-bar">
        <div class="bar-blur"></div>
        
        <div class="nav-grid">
          <a routerLink="/" routerLinkActive="active" [routerLinkActiveOptions]="{exact:true}">
            <svg class="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
              <polyline points="9 22 9 12 15 12 15 22"></polyline>
            </svg>
            <span class="label">Home</span>
          </a>

          <a routerLink="/library" routerLinkActive="active">
            <svg class="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="11" cy="11" r="8"></circle>
              <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
            </svg>
            <span class="label">Library</span>
          </a>

          <a routerLink="/learn" routerLinkActive="active">
            <svg class="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <rect x="2" y="7" width="20" height="14" rx="2" ry="2"></rect>
              <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"></path>
            </svg>
            <span class="label">Study</span>
          </a>

          <a routerLink="/review" routerLinkActive="active">
            <div class="icon-wrapper">
              <svg class="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M12 2L2 7l10 5 10-5-10-5z"></path>
                <path d="M2 17l10 5 10-5"></path>
                <path d="M2 12l10 5 10-5"></path>
              </svg>
              
              @if (studyState.dueCount() > 0) {
                <span class="badge-mobile">{{ studyState.dueCount() }}</span>
              }
            </div>
            <span class="label">System</span>
          </a>
        </div>
      </nav>

      @if (updateService.updateAvailable()) {
        <div class="toast">
          <span>Update Ready</span>
          <button (click)="updateService.activateUpdate()">⟳</button>
        </div>
      }
    </div>
  `,
  styles: [`
    :host { display: block; height: 100vh; width: 100%; overflow: hidden; }

    .app-shell { display: flex; height: 100%; width: 100%; }

    /* --- DESKTOP NAV --- */
    .desktop-nav {
      width: 260px; background: var(--bg-surface);
      border-right: 1px solid var(--border-subtle);
      padding: 5rem 2rem 2rem 2rem; display: none;
      flex-direction: column; justify-content: space-between;
    }
    .logo-mark {
      width: 40px; height: 40px; background: var(--primary); color: white;
      border-radius: 10px; display: flex; align-items: center; justify-content: center;
      font-weight: 800; margin-bottom: 2rem;
      box-shadow: 0 0 20px var(--primary-glow);
    }
    .desktop-nav a {
      display: block; padding: 1rem; color: var(--text-secondary);
      text-decoration: none; font-weight: 500; border-radius: 12px;
      margin-bottom: 0.5rem; transition: all 0.2s;
    }
    .desktop-nav a:hover { background: var(--bg-surface-2); color: var(--text-primary); }
    .desktop-nav a.active { background: var(--bg-surface-2); color: var(--primary); font-weight: 700; }

    .nav-footer .version { font-size: 0.75rem; color: var(--text-tertiary); }
    
    /* Desktop Badge */
    .nav-item-desktop { display: flex; justify-content: space-between; align-items: center; }
    .icon-row { display: flex; align-items: center; width: 100%; justify-content: space-between; }
    .badge-desktop {
      background: #ef4444; color: white;
      font-size: 0.75rem; font-weight: 700;
      padding: 2px 8px; border-radius: 12px;
    }

    /* --- MAIN STAGE --- */
    .stage {
      margin: 0;
      padding: 0;
      flex: 1; position: relative;
      background: var(--bg-app);
      overflow: hidden;
      width: 100%; height: 100%;
    }

    /* --- MOBILE NAV --- */
    .mobile-bar {
      position: fixed; bottom: 0; left: 0; right: 0;
      z-index: 100;
      padding-top: 1rem;
      padding-bottom: var(--safe-bottom);
      background: rgba(15, 17, 21, 0.85);
      border-top: 1px solid rgba(255,255,255,0.08);
    }
    
    .bar-blur {
      position: absolute; inset: 0;
      backdrop-filter: blur(20px); -webkit-backdrop-filter: blur(20px);
      z-index: -1;
    }

    .nav-grid { 
      display: grid; 
      /* 4 Items Grid */
      grid-template-columns: repeat(4, 1fr); 
      height: 100%; 
    }

    .nav-grid a {
      display: flex; flex-direction: column;
      align-items: center; justify-content: center;
      text-decoration: none; color: var(--text-secondary);
      gap: 4px; transition: color 0.2s;
    }

    .nav-icon {
      width: 24px; height: 24px; stroke-width: 2px; opacity: 0.5;
      transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
    }

    .label {
      font-size: 10px; font-weight: 600; letter-spacing: 0.3px; opacity: 0.5;
    }

    .nav-grid a.active { color: var(--primary); }
    .nav-grid a.active .nav-icon { opacity: 1; transform: translateY(-2px); stroke-width: 2.5px; }
    .nav-grid a.active .label { opacity: 1; }
    .nav-grid a:active .nav-icon { transform: scale(0.9); }

    /* Mobile Badge */
    .icon-wrapper { position: relative; display: flex; justify-content: center; }
    .badge-mobile {
      position: absolute; top: -4px; right: -8px;
      background: #ef4444; color: white;
      font-size: 0.65rem; font-weight: 800;
      min-width: 18px; height: 18px;
      padding: 0 4px; border-radius: 9px;
      display: flex; align-items: center; justify-content: center;
      box-shadow: 0 2px 4px rgba(0,0,0,0.5);
      animation: popIn 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
    }

    @keyframes popIn {
      from { transform: scale(0); }
      to { transform: scale(1); }
    }

    /* --- RESPONSIVE --- */
    @media (min-width: 768px) {
      .mobile-bar { display: none; }
      .desktop-nav { display: flex; }
      .stage { padding-bottom: 0; }
    }

    .toast {
      position: absolute; bottom: 100px; left: 50%; transform: translateX(-50%);
      background: var(--bg-surface); border: 1px solid var(--border-subtle);
      color: var(--text-primary);
      padding: 12px 24px; border-radius: 50px;
      display: flex; gap: 12px; align-items: center;
      box-shadow: 0 10px 40px rgba(0,0,0,0.5); z-index: 200;
    }
    .toast button {
      background: var(--primary); border: none; color: white;
      padding: 6px 16px; border-radius: 20px; font-size: 0.8rem; font-weight: 700; cursor: pointer;
    }
  `]
})
export class App implements OnInit {
  updateService = inject(UpdateNotificationService);
  studyState = inject(StudyStateService);

  ngOnInit() {
    // Check for due cards on app load
    this.studyState.refreshCount();
  }
}