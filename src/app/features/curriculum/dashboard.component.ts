import { Component, inject, signal, OnInit } from '@angular/core';
import { Router } from '@angular/router';

import { ContentSyncService } from '../../infrastructure/sync/content-sync.service';
import { VocabularyRepository } from '../../core/repositories/vocabulary.repository';
import { StudyStateService } from '../../core/services/study-state.service'; // <--- Import State
import { LeitnerBox } from '../../core/models/vocabulary.model';

@Component({
  selector: 'app-dashboard',
  template: `
    <div class="content-wrapper">
      <header>
        <div class="greeting">
          <h1>My Journey</h1>
          <p>Let's continue learning</p>
        </div>
        <button class="icon-btn" (click)="sync.sync()">🔄</button>
      </header>

      @if (studyState.dueCount() > 0) {
        <div class="brain-widget critical" (click)="goToSystem()">
          <div class="widget-content">
            <div class="pulse-icon">⚡</div>
            <div class="widget-text">
              <h3>{{ studyState.dueCount() }} Words Due</h3>
              <p>Your Leitner system needs attention.</p>
            </div>
          </div>
          <button class="action-btn">Review</button>
        </div>
      } @else {
        <div class="brain-widget optimized">
          <div class="widget-content">
            <div class="icon">🧠</div>
            <div class="widget-text">
              <h3>System Optimized</h3>
            </div>
          </div>
        </div>
      }

      <div class="level-grid">
        @for (level of sync.curriculum(); track level.id) {
          
          <div class="level-card glass-panel" 
               (click)="openLevel(level.id)">
            
            <div class="card-bg" [style.background]="level.color"></div>
            
            <div class="card-content">
              <span class="level-badge">{{ level.id }}</span>
              <h2>{{ level.title }}</h2>
              
              <div class="progress-section">
                <div class="progress-bar">
                  <div class="fill" 
                       [style.width.%]="getLevelStats(level.id).percent"></div>
                </div>
                <span class="stats-text">
                  {{ getLevelStats(level.id).learned }} / {{ getLevelStats(level.id).total }}
                </span>
              </div>
            </div>

            <div class="chevron">›</div>
          </div>
        }
      </div>
    </div>
  `,
  styles: [`
    .content-wrapper { padding: 1.5rem; }
    
    header {
      display: flex; justify-content: space-between; align-items: center;
      margin-bottom: 2rem;
    }
    h1 { font-size: 2rem; font-weight: 800; margin: 0; color: var(--text-primary); }
    p { margin: 0; color: var(--text-secondary); }
    
    .icon-btn {
      background: var(--bg-surface); color: var(--text-primary);
      border: 1px solid var(--border-subtle);
      width: 44px; height: 44px; border-radius: 12px;
      font-size: 1.2rem; cursor: pointer;
    }

    /* --- BRAIN WIDGET --- */
    .brain-widget {
      border-radius: 20px; padding: 1.2rem; margin-bottom: 2rem;
      display: flex; align-items: center; justify-content: space-between;
      cursor: pointer; position: relative; overflow: hidden;
      border: 1px solid rgba(255,255,255,0.05);
      transition: transform 0.2s;
    }
    .brain-widget:active { transform: scale(0.98); }

    /* Critical State */
    .brain-widget.critical {
      background: linear-gradient(135deg, rgba(239, 68, 68, 0.15) 0%, rgba(239, 68, 68, 0.05) 100%);
      border-color: rgba(239, 68, 68, 0.3);
    }
    .critical .pulse-icon {
      color: #ef4444; font-size: 1.5rem; margin-right: 1rem;
      animation: pulse 2s infinite;
    }
    .critical h3 { color: #fca5a5; margin: 0; font-size: 1rem; }
    .critical .action-btn {
      background: #ef4444; color: white; border: none;
      padding: 8px 16px; border-radius: 20px; font-weight: 700; font-size: 0.8rem;
    }

    /* Optimized State */
    .brain-widget.optimized {
      background: linear-gradient(135deg, rgba(16, 185, 129, 0.15) 0%, rgba(16, 185, 129, 0.05) 100%);
      border-color: rgba(16, 185, 129, 0.3);
    }
    .optimized .icon { font-size: 1.5rem; margin-right: 1rem; }
    .optimized h3 { color: #6ee7b7; margin: 0; font-size: 1rem; }

    .widget-content { display: flex; align-items: center; }
    .widget-text p { margin: 0; font-size: 0.8rem; opacity: 0.7; }

    @keyframes pulse {
      0% { transform: scale(1); opacity: 1; }
      50% { transform: scale(1.2); opacity: 0.7; }
      100% { transform: scale(1); opacity: 1; }
    }

    /* --- LEVEL GRID --- */
    .level-grid {
      display: grid; gap: 1.5rem;
      grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
    }

    .level-card {
      position: relative; overflow: hidden;
      border-radius: 24px; /* radius-lg */
      padding: 1.5rem; cursor: pointer;
      display: flex; align-items: center; justify-content: space-between;
      border: 1px solid var(--border-subtle);
      background: var(--bg-surface);
      transition: transform 0.2s, box-shadow 0.2s;
    }
    .level-card:hover {
      transform: translateY(-4px);
      box-shadow: 0 12px 24px rgba(0,0,0,0.2);
    }
    .level-card:active { transform: scale(0.98); }

    .card-bg {
      position: absolute; top: -50%; right: -20%;
      width: 200px; height: 200px; border-radius: 50%;
      filter: blur(60px); opacity: 0.15; pointer-events: none;
    }

    .card-content { z-index: 2; flex: 1; }
    
    .level-badge {
      font-size: 0.75rem; font-weight: 700; color: var(--text-secondary);
      background: var(--bg-app); padding: 4px 10px; border-radius: 20px;
    }
    
    h2 { font-size: 1.5rem; margin: 0.8rem 0; color: var(--text-primary); }

    .progress-bar {
      height: 6px; width: 100px; background: rgba(255,255,255,0.1);
      border-radius: 3px; overflow: hidden; display: inline-block;
      vertical-align: middle; margin-right: 10px;
    }
    .fill { height: 100%; background: var(--primary); transition: width 0.5s; }
    
    .stats-text { font-size: 0.8rem; color: var(--text-secondary); }
    .chevron { font-size: 2rem; color: var(--text-secondary); opacity: 0.5; }
  `]
})
export class DashboardComponent implements OnInit {
  sync = inject(ContentSyncService);
  repo = inject(VocabularyRepository);
  router = inject(Router);
  studyState = inject(StudyStateService); // <--- Inject

  // Map: LevelID -> { total, learned, percent }
  levelStats = signal<Map<string, { total: number, learned: number, percent: number }>>(new Map());

  async ngOnInit() {
    const allItems = await this.repo.getAll();
    const stats = new Map();

    const levels = this.sync.curriculum();

    levels.forEach(lvl => {
      const missionIds = new Set(lvl.missions.map(m => m.id));
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

  openLevel(id: string) {
    this.router.navigate(['/level', id]);
  }

  goToSystem() {
    this.router.navigate(['/review']);
  }
}