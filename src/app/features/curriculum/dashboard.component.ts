import { Component, inject, signal, ChangeDetectionStrategy, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { VocabularyRepository } from '../../core/repositories/vocabulary.repository';
import { LearningSessionService, LearningMode } from '../learning/services/learning-session.service';
import { CURRICULUM, LevelConfig } from '../../core/config/curriculum.config';
import { VocabularyItem, LeitnerBox } from '../../core/models/vocabulary.model';
import { ContentSyncService } from '../../infrastructure/sync/content-sync.service';

// View Model for the Template
interface MissionViewModel {
  id: string;
  title: string;
  icon: string;
  total: number;
  due: number;
  learnedPct: number; // 0 to 100
}

interface LevelViewModel {
  config: LevelConfig;
  missions: MissionViewModel[];
}

@Component({
  selector: 'app-dashboard',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="dashboard-container">
<header>
  <h1>My Curriculum</h1>
  <div style="display:flex; gap:1rem;">
    <div class="mode-toggle">...</div>
    
    <button id="syncBtn" (click)="manualSync()" 
            style="border:none; background:transparent; font-size:1.2rem; cursor:pointer;"
            title="Check for content updates">
      🔄
    </button>
  </div>
</header>

      @if (curriculumData(); as levels) {
        <div class="levels-list">
          @for (level of levels; track level.config.id) {
            <section class="level-section">
              <h2 [style.color]="level.config.color">{{ level.config.title }}</h2>
              
              <div class="mission-grid">
                @for (m of level.missions; track m.id) {
                  <div class="mission-card" (click)="start(m.id)">
                    <div class="mission-icon">{{ m.icon }}</div>
                    
                    <div class="mission-info">
                      <h3>{{ m.title }}</h3>
                      <div class="mission-meta">
                        <span>{{ m.total }} Words</span>
                        @if (m.due > 0) {
                          <span class="badge-due">{{ m.due }} Due</span>
                        } @else {
                          <span class="badge-done">Done</span>
                        }
                      </div>
                      
                      <div class="progress-track">
                        <div class="progress-fill" [style.width.%]="m.learnedPct"></div>
                      </div>
                    </div>
                    
                    <div class="chevron">›</div>
                  </div>
                }
              </div>
            </section>
          }
        </div>
      } @else {
        <div class="loading">Loading Curriculum...</div>
      }
    </div>
  `,
  styles: [`
    .dashboard-container { padding: 1rem; max-width: 600px; margin: 0 auto; padding-bottom: 4rem; }
    
    header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 2rem; }
    h1 { margin: 0; font-family: var(--font-serif); font-size: 1.5rem; }

    .mode-toggle { 
      background: #e2e8f0; border-radius: 20px; padding: 4px; display: flex; gap: 4px; 
    }
    .mode-toggle span {
      padding: 4px 12px; border-radius: 16px; font-size: 0.8rem; font-weight: bold; cursor: pointer; color: #64748b;
    }
    .mode-toggle span.active { background: #fff; color: #1e293b; box-shadow: 0 1px 3px rgba(0,0,0,0.1); }

    .level-section { margin-bottom: 2rem; }
    .level-section h2 { font-size: 1rem; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 1rem; border-bottom: 2px solid #eee; padding-bottom: 0.5rem; }

    .mission-grid { display: flex; flex-direction: column; gap: 1rem; }

    .mission-card {
      background: #fff; border-radius: 12px; padding: 1rem;
      display: flex; align-items: center; gap: 1rem;
      box-shadow: 0 2px 8px rgba(0,0,0,0.04); border: 1px solid transparent;
      transition: all 0.2s; cursor: pointer;
    }
    .mission-card:active { transform: scale(0.98); background: #fafafa; }

    .mission-icon { font-size: 2rem; width: 50px; text-align: center; }

    .mission-info { flex: 1; }
    .mission-info h3 { margin: 0 0 0.5rem 0; font-size: 1.1rem; }

    .mission-meta { display: flex; gap: 0.8rem; font-size: 0.8rem; color: #666; margin-bottom: 0.5rem; align-items: center; }
    
    .badge-due { background: #fee2e2; color: #b91c1c; padding: 2px 8px; border-radius: 4px; font-weight: 600; }
    .badge-done { background: #dcfce7; color: #166534; padding: 2px 8px; border-radius: 4px; font-weight: 600; }

    .progress-track { height: 4px; background: #f1f1f1; border-radius: 2px; overflow: hidden; width: 100%; }
    .progress-fill { height: 100%; background: var(--color-masc); transition: width 0.5s ease; }

    .chevron { color: #ccc; font-size: 1.5rem; font-weight: 300; }
  `]
})
export class DashboardComponent implements OnInit {
  private repo = inject(VocabularyRepository);
  private sessionStore = inject(LearningSessionService);
  private router = inject(Router);
  private syncService = inject(ContentSyncService);

  mode = signal<LearningMode>('DE_TO_EN');
  curriculumData = signal<LevelViewModel[] | null>(null);

  async ngOnInit() {
    // 1. Fetch ALL items once (Optimization: In a real large app, fetch stats only)
    const allItems = await this.repo.getAll();
    const now = Date.now();

    // 2. Map Config to View Model
    const viewData: LevelViewModel[] = CURRICULUM.map(level => {

      const missionViewModels = level.missions.map(mission => {
        // Filter items for this specific mission
        const items = allItems.filter(i => i.missionId === mission.id);

        const total = items.length;
        const due = items.filter(i => i.nextReviewDate <= now).length;
        // Logic: "Learned" is anything not in Box 1
        const learnedCount = items.filter(i => i.box > LeitnerBox.Box1).length;
        const learnedPct = total > 0 ? (learnedCount / total) * 100 : 0;

        return {
          id: mission.id,
          title: mission.title,
          icon: mission.icon,
          total,
          due,
          learnedPct
        };
      });

      return {
        config: level,
        missions: missionViewModels
      };
    });

    this.curriculumData.set(viewData);
  }

  async manualSync() {
    const btn = document.getElementById('syncBtn') as HTMLButtonElement;
    if (btn) btn.innerText = 'Syncing...';

    await this.syncService.sync();

    // Refresh page to load new data from DB
    window.location.reload();
  }

  start(missionId: string) {
    this.sessionStore.startSession(missionId, this.mode());
    this.router.navigate(['/learn']);
  }
}