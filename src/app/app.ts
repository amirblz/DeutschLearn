import { Component, ChangeDetectionStrategy, inject } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { UpdateNotificationService } from './core/services/update-notification.service';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, RouterLink, RouterLinkActive],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <nav class="library-nav">
      <div class="nav-content">
        <a routerLink="/" class="brand">Dashboard</a>
        <div class="nav-links">
           <a routerLink="/review" class="nav-item"><span class="badge">🧠</span>Boxes</a>
           <a routerLink="/dashboard" routerLinkActive="active">Library</a>
           <a routerLink="/learn" routerLinkActive="active" class="btn-study">Study</a>
        </div>
      </div>
    </nav>

    <main class="main-content">
      <router-outlet></router-outlet>
    </main>

    @if (updateService.updateAvailable()) {
      <div class="update-toast">
        <span>New content available.</span>
        <button (click)="updateService.activateUpdate()">Update Now</button>
      </div>
    }
  `,
  styles: [`
    :host {
      display: flex;
      flex-direction: column;
      min-height: 100vh;
    }

    .library-nav {
      background: #fff;
      border-bottom: 1px solid rgba(0,0,0,0.05);
      padding: 0 1rem;
      position: sticky;
      top: 0;
      z-index: 10;
    }

    .nav-content {
      max-width: 800px;
      margin: 0 auto;
      height: 60px;
      display: flex;
      align-items: center;
      justify-content: space-between;
    }

    .brand {
      text-decoration: none;
      font-weight: 700;
      font-family: var(--font-serif);
      font-size: 1.2rem;
      color: var(--color-text);
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }
    
    .highlight { color: var(--color-masc); } 

    .nav-links {
      display: flex;
      gap: 1.5rem;
      align-items: center;
    }

    .nav-links a {
      text-decoration: none;
      color: var(--color-text-light);
      font-size: 0.9rem;
      font-weight: 500;
      transition: color 0.2s;
    }

    .nav-links a.active {
      color: var(--color-text);
      font-weight: 700;
    }

    .nav-links a.btn-study {
      background: var(--color-text);
      color: #fff;
      padding: 0.5rem 1rem;
      border-radius: 8px;
    }

    .main-content {
      flex: 1;
      width: 100%;
      max-width: 800px;
      margin: 0 auto;
      padding-top: 2rem;
    }

    .update-toast {
      position: fixed;
      bottom: 2rem;
      right: 2rem;
      background: var(--color-text);
      color: #fff;
      padding: 1rem 1.5rem;
      border-radius: 8px;
      box-shadow: 0 4px 12px rgba(0,0,0,0.2);
      display: flex;
      align-items: center;
      gap: 1rem;
      animation: slideIn 0.3s ease-out;
      z-index: 100;
    }

    .update-toast button {
      background: #fff;
      color: var(--color-text);
      border: none;
      padding: 0.5rem 1rem;
      border-radius: 4px;
      font-weight: 600;
      cursor: pointer;
    }

    @keyframes slideIn {
      from { transform: translateY(20px); opacity: 0; }
      to { transform: translateY(0); opacity: 1; }
    }
  `]
})
export class App {
  updateService = inject(UpdateNotificationService);
}