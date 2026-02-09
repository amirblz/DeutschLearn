import { Component, inject } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { ContentSyncService } from '../../infrastructure/sync/content-sync.service';

@Component({
  selector: 'app-dashboard',
  imports: [CommonModule],
  template: `
    <div class="container">
<header>
        <h1>My Journey</h1>
        <button class="sync-btn" (click)="sync.sync()">🔄</button>
      </header>

      <div class="level-grid">
        @for (level of sync.curriculum(); track level.id) {
          <div class="level-card" 
               [style.background]="level.color"
               (click)="openLevel(level.id)">
            
            <div class="level-content">
              <span class="level-id">{{ level.id }}</span>
              <h2>{{ level.title }}</h2>
              <div class="stats">
                <span>{{ level.missions.length }} Topics</span>
              </div>
            </div>

            <div class="play-icon">▶</div>
          </div>
        }
      </div>
    </div>
  `,
  styles: [`
    .container { padding: 2rem; max-width: 600px; margin: 0 auto; }
    header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 3rem; }
    h1 { font-size: 2rem; font-weight: 800; color: #1e293b; margin: 0; }
    
    .sync-btn { background: none; border: none; font-size: 1.5rem; cursor: pointer; }

    .level-grid { display: flex; flex-direction: column; gap: 1.5rem; }

    .level-card {
      border-radius: 24px; padding: 2rem;
      color: white; cursor: pointer;
      display: flex; align-items: center; justify-content: space-between;
      box-shadow: 0 10px 30px rgba(0,0,0,0.15);
      transition: transform 0.2s, box-shadow 0.2s;
    }
    .level-card:active { transform: scale(0.98); }
    
    .level-id { 
      background: rgba(255,255,255,0.2); padding: 4px 12px; 
      border-radius: 20px; font-weight: 700; font-size: 0.9rem;
    }
    h2 { margin: 0.5rem 0; font-size: 1.8rem; }
    .stats { opacity: 0.9; font-size: 0.9rem; }
    
    .play-icon { 
      background: rgba(255,255,255,0.2); width: 50px; height: 50px; 
      border-radius: 50%; display: flex; align-items: center; justify-content: center;
      font-size: 1.2rem; backdrop-filter: blur(4px);
    }
  `]
})
export class DashboardComponent {
  sync = inject(ContentSyncService);
  router = inject(Router);

  openLevel(id: string) {
    this.router.navigate(['/level', id]);
  }
}