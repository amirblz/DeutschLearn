import { Component, inject } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { CommonModule } from '@angular/common';
import { UpdateNotificationService } from './core/services/update-notification.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive, CommonModule],
  template: `
    <div class="app-shell">
      
      <nav class="desktop-nav">
        <div class="nav-top">
          <div class="logo">
             <div class="logo-mark">DE</div>
          </div>
          <div class="links">
            <a routerLink="/" routerLinkActive="active" [routerLinkActiveOptions]="{exact:true}">
              <span class="icon">Home</span>
            </a>
            <a routerLink="/learn" routerLinkActive="active">
              <span class="icon">Study</span>
            </a>
            <a routerLink="/review" routerLinkActive="active">
              <span class="icon">Profile</span>
            </a>
          </div>
        </div>
        
        <div class="nav-footer">
          <span class="version">v1.0.0 (Beta)</span>
        </div>
      </nav>

      <main class="stage">
        <div class="stage-content">
          <router-outlet></router-outlet>
        </div>
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

          <a routerLink="/learn" routerLinkActive="active">
            <svg class="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <rect x="2" y="7" width="20" height="14" rx="2" ry="2"></rect>
              <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"></path>
            </svg>
            <span class="label">Learn</span>
          </a>

          <a routerLink="/review" routerLinkActive="active">
            <svg class="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M18 20V10"></path>
              <path d="M12 20V4"></path>
              <path d="M6 20v-6"></path>
            </svg>
            <span class="label">Stats</span>
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
    :host { display: block; height: 100dvh; overflow: hidden; }

    .app-shell { display: flex; height: 100%; width: 100%; }

    /* --- DESKTOP NAV --- */
    .desktop-nav {
      width: 260px; background: var(--bg-surface);
      border-right: 1px solid var(--border-subtle);
      padding: 2rem; display: none;
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

    /* --- MAIN STAGE --- */
    .stage {
      flex: 1; position: relative;
      background: var(--bg-app);
      overflow-y: auto; overflow-x: hidden;
      padding-top: var(--safe-top);
      padding-bottom: calc(65px + var(--safe-bottom)); 
    }
    .stage-content {
      max-width: 1024px; margin: 0 auto; width: 100%; height: 100%;
    }

    /* --- MOBILE NAV (Permanent Dark Glass) --- */
    .mobile-bar {
      position: fixed; bottom: 0; left: 0; right: 0;
      z-index: 100;
      height: calc(60px + var(--safe-bottom));
      padding-bottom: var(--safe-bottom);
      background: rgba(15, 17, 21, 0.85); /* Dark base */
      border-top: 1px solid rgba(255,255,255,0.08);
    }
    
    .bar-blur {
      position: absolute; inset: 0;
      backdrop-filter: blur(20px); -webkit-backdrop-filter: blur(20px);
      z-index: -1;
    }

    .nav-grid { display: grid; grid-template-columns: 1fr 1fr 1fr; height: 100%; }

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

    /* Active State */
    .nav-grid a.active { color: var(--primary); }
    .nav-grid a.active .nav-icon { opacity: 1; transform: translateY(-2px); stroke-width: 2.5px; }
    .nav-grid a.active .label { opacity: 1; }
    .nav-grid a:active .nav-icon { transform: scale(0.9); }

    /* --- RESPONSIVE --- */
    @media (min-width: 768px) {
      .mobile-bar { display: none; }
      .desktop-nav { display: flex; }
      .stage { padding-bottom: 0; }
    }

    /* Toast */
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
export class App {
  updateService = inject(UpdateNotificationService);
}