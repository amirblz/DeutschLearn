import { Component, inject, signal, OnInit } from '@angular/core'; // Added OnInit
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { ContentSyncService } from '../../infrastructure/sync/content-sync.service';
import { VocabularyRepository } from '../../core/repositories/vocabulary.repository'; // Inject Repo
import { LeitnerBox } from '../../core/models/vocabulary.model';

@Component({
  selector: 'app-dashboard',
  standalone: true,
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
                <span>{{ getLevelStats(level.id).learned }} / {{ getLevelStats(level.id).total }} Words</span>
              </div>
            </div>

            <div class="ring-container" 
                 [style.background]="getRingGradient(level.id)">
              
              <div class="play-icon">▶</div>
            
            </div>

          </div>
        }
      </div>
    </div>
  `,
  styles: [`
    /* ... existing styles ... */
    .container { padding: 2rem; max-width: 600px; margin: 0 auto; }
    header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 3rem; }
    h1 { font-size: 2rem; font-weight: 800; color: #1e293b; margin: 0; }
    .sync-btn { background: none; border: none; font-size: 1.5rem; cursor: pointer; }
    .level-grid { display: flex; flex-direction: column; gap: 1.5rem; }

    .level-card {
      border-radius: 24px; padding: 1.5rem 2rem;
      color: white; cursor: pointer;
      display: flex; align-items: center; justify-content: space-between;
      box-shadow: 0 10px 30px rgba(0,0,0,0.15);
      transition: transform 0.2s; position: relative; overflow: hidden;
    }
    .level-card:active { transform: scale(0.98); }
    
    .level-content { z-index: 2; }
    .level-id { 
      background: rgba(255,255,255,0.2); padding: 4px 12px; 
      border-radius: 20px; font-weight: 700; font-size: 0.9rem;
    }
    h2 { margin: 0.5rem 0; font-size: 1.8rem; }
    .stats { opacity: 0.9; font-size: 0.9rem; font-weight: 500; }

    /* --- THE RING MAGIC --- */
    .ring-container {
      width: 70px; height: 70px; border-radius: 50%;
      display: flex; align-items: center; justify-content: center;
      position: relative;
      /* This enables the gradient border effect */
      padding: 4px; /* Thickness of the progress bar */
    }

    .play-icon { 
      background: rgba(255,255,255,0.3); 
      width: 100%; height: 100%; 
      border-radius: 50%; 
      display: flex; align-items: center; justify-content: center;
      font-size: 1.2rem; backdrop-filter: blur(4px);
      color: white; z-index: 2;
      /* Hides the center of the conic gradient so it looks like a ring */
      box-shadow: 0 0 0 2px rgba(255,255,255,0.1); 
    }
  `]
})
export class DashboardComponent implements OnInit {
  sync = inject(ContentSyncService);
  repo = inject(VocabularyRepository);
  router = inject(Router);

  // Map: LevelID -> { total, learned, percent }
  levelStats = signal<Map<string, { total: number, learned: number, percent: number }>>(new Map());

  async ngOnInit() {
    const allItems = await this.repo.getAll();
    const stats = new Map();

    // 1. Get Levels from Sync Service
    const levels = this.sync.curriculum();

    // 2. Calculate Stats
    levels.forEach(lvl => {
      // Find all mission IDs in this level
      const missionIds = new Set(lvl.missions.map(m => m.id));

      // Filter items belonging to this level
      const items = allItems.filter(i => missionIds.has(i.missionId));

      const total = items.length;
      const learned = items.filter(i => i.box > LeitnerBox.Box1).length;
      const percent = total > 0 ? (learned / total) * 100 : 0;

      stats.set(lvl.id, { total, learned, percent });
    });

    this.levelStats.set(stats);
  }

  getLevelStats(id: string) {
    return this.levelStats().get(id) || { total: 0, learned: 0, percent: 0 };
  }

  // Generate CSS for the ring
  getRingGradient(id: string) {
    const pct = this.getLevelStats(id).percent;
    // White progress bar, transparent track
    return `conic-gradient(#ffffff ${pct}%, rgba(255,255,255,0.2) 0)`;
  }

  openLevel(id: string) {
    this.router.navigate(['/level', id]);
  }
}