import { Component, inject, signal, computed, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { ContentSyncService } from '../../infrastructure/sync/content-sync.service';
import { VocabularyRepository } from '../../core/repositories/vocabulary.repository'; // <--- Inject Repo
import { LearningSessionService } from '../../features/learning/services/learning-session.service';
import { VocabularyItem, LeitnerBox } from '../../core/models/vocabulary.model';

@Component({
  selector: 'app-level-detail',
  imports: [CommonModule],
  template: `
    <div class="page-container">
      
      <header class="glass-header">
        <button class="nav-btn" (click)="goBack()">
          <span class="icon">←</span>
        </button>
        <span class="header-title">{{ levelTitle() }}</span>
        <div class="placeholder"></div> </header>

      <div class="mission-path">
        
        <div class="path-line"></div>

        @for (group of missionGroups(); track group.baseId) {
          <div class="mission-cluster">
            
            <div class="cluster-label">
              <span class="icon">{{ group.icon }}</span>
              <span class="text">{{ group.title }}</span>
            </div>

            <div class="units-stack">
              @for (mission of group.parts; track mission.id) {
                
                <div class="unit-island" 
                     (click)="startSession(mission.id)"
                     [class.locked]="isLocked(mission.id)">
                  
                  <div class="island-content">
                    <div class="island-info">
                      <h3>{{ mission.title }}</h3>
                      <div class="progress-pill">
                        <div class="bar" [style.width.%]="getProgress(mission.id).percent"></div>
                      </div>
                    </div>
                    
                    <button class="play-fab">
                       {{ getProgress(mission.id).percent >= 100 ? '↺' : '▶' }}
                    </button>
                  </div>

                </div>
              }
            </div>
          </div>
        }
        
        <div class="spacer"></div>
      </div>
    </div>
  `,
  styles: [`
    .page-container { background: var(--bg-app); min-height: 100vh; position: relative; }

    /* --- GLASS HEADER --- */
    .glass-header {
      position: fixed; top: 0; left: 0; right: 0; z-index: 50;
      height: calc(60px + var(--safe-top));
      padding-top: var(--safe-top);
      padding-left: 1.5rem; padding-right: 1.5rem;
      display: flex; align-items: center; justify-content: space-between;
      
      background: var(--glass-panel);
      backdrop-filter: blur(12px); -webkit-backdrop-filter: blur(12px);
      border-bottom: 1px solid var(--border-subtle);
    }

    .nav-btn {
      background: transparent; border: none; color: var(--text-primary);
      font-size: 1.5rem; cursor: pointer; padding: 0;
    }
    .header-title { font-weight: 700; font-size: 1.1rem; letter-spacing: 0.5px; }
    .placeholder { width: 24px; }

    /* --- MISSION PATH --- */
    .mission-path {
      padding-top: calc(80px + var(--safe-top));
      padding-left: 1.5rem; padding-right: 1.5rem;
      max-width: 600px; margin: 0 auto;
      position: relative;
    }

    /* Vertical Line connecting clusters */
    .path-line {
      position: absolute; left: 2.5rem; top: 0; bottom: 0; width: 2px;
      background: linear-gradient(to bottom, var(--bg-app), var(--border-subtle) 10%, var(--border-subtle) 90%, var(--bg-app));
      z-index: 0;
    }

    .mission-cluster { margin-bottom: 3rem; position: relative; z-index: 1; }

    .cluster-label {
      display: flex; align-items: center; gap: 1rem; margin-bottom: 1.5rem;
    }
    .cluster-label .icon {
      width: 40px; height: 40px; background: var(--bg-surface-2);
      border-radius: 50%; display: flex; align-items: center; justify-content: center;
      font-size: 1.2rem; border: 2px solid var(--bg-app);
      box-shadow: var(--shadow-sm);
    }
    .cluster-label .text {
      font-weight: 700; color: var(--text-secondary); text-transform: uppercase; 
      font-size: 0.8rem; letter-spacing: 1px;
    }

    .units-stack { display: flex; flex-direction: column; gap: 1rem; padding-left: 3.5rem; }

    /* --- THE ISLAND CARD --- */
    .unit-island {
      background: var(--bg-surface);
      border-radius: 20px;
      padding: 1.2rem;
      box-shadow: var(--shadow-sm);
      border: 1px solid var(--border-subtle);
      transition: all 0.2s cubic-bezier(0.25, 0.8, 0.25, 1);
      cursor: pointer;
    }

    .unit-island:active { transform: scale(0.96); }

    .island-content { display: flex; justify-content: space-between; align-items: center; }

    h3 { margin: 0 0 0.5rem 0; font-size: 1rem; font-weight: 600; color: var(--text-primary); }

    .progress-pill {
      height: 4px; width: 100px; background: var(--bg-surface-2);
      border-radius: 2px; overflow: hidden;
    }
    .bar { height: 100%; background: var(--primary); transition: width 0.3s; }

    .play-fab {
      width: 44px; height: 44px; border-radius: 50%; border: none;
      background: var(--bg-surface-2); color: var(--text-primary);
      font-size: 1.2rem; display: flex; align-items: center; justify-content: center;
      transition: background 0.2s;
    }
    .unit-island:hover .play-fab {
      background: var(--primary); color: white;
    }

    .spacer { height: 100px; }
  `]
})
export class LevelDetailComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private sync = inject(ContentSyncService);
  private session = inject(LearningSessionService);
  private repo = inject(VocabularyRepository); // Inject Repo

  activeGroupId = signal<string | null>(null);

  isLocked(id: string) { return false; }
  // Store progress map: "mission_id" -> { total: 20, learned: 5, percent: 25 }
  progressMap = signal<Map<string, { total: number, learned: number, percent: number }>>(new Map());

  currentLevel = computed(() => {
    const id = this.route.snapshot.paramMap.get('id');
    return this.sync.curriculum().find(l => l.id === id);
  });

  levelTitle = computed(() => this.currentLevel()?.title || 'Loading...');

  missionGroups = computed(() => {
    // ... (Your existing grouping logic) ...
    // Note: Copy the logic from the previous turn exactly
    const level = this.currentLevel();
    if (!level) return [];
    const groups = new Map<string, any>();
    for (const mission of level.missions) {
      const baseId = mission.id.replace(/_\d+$/, '');
      if (!groups.has(baseId)) {
        groups.set(baseId, {
          baseId,
          title: mission.title.replace(/\s[IVX]+$/, '').replace(/\s\(\d+\)$/, ''),
          icon: mission.icon,
          parts: []
        });
      }
      groups.get(baseId)?.parts.push(mission);
    }
    return Array.from(groups.values());
  });

  activeGroup = computed(() => {
    return this.missionGroups().find(g => g.baseId === this.activeGroupId());
  });

  ngOnInit() {
    if (this.missionGroups().length > 0) {
      this.activeGroupId.set(this.missionGroups()[0].baseId);
    }

    // LOAD PROGRESS
    this.calculateProgress();
  }

  async calculateProgress() {
    // 1. Get ALL items from DB (Fast, in-memory mostly)
    const allItems = await this.repo.getAll();
    const map = new Map<string, { total: number, learned: number, percent: number }>();

    // 2. Iterate items and aggregate
    // (Optimization: Group items by missionId first)
    const itemsByMission: Record<string, VocabularyItem[]> = {};

    allItems.forEach(item => {
      if (!itemsByMission[item.missionId]) itemsByMission[item.missionId] = [];
      itemsByMission[item.missionId].push(item);
    });

    // 3. Populate Map
    for (const missionId in itemsByMission) {
      const items = itemsByMission[missionId];
      const total = items.length;
      // "Learned" = Moved out of Box 1
      const learned = items.filter(i => i.box > LeitnerBox.Box1).length;
      const percent = total > 0 ? (learned / total) * 100 : 0;

      map.set(missionId, { total, learned, percent });
    }

    this.progressMap.set(map);
  }

  // Helper for Template
  getProgress(missionId: string) {
    return this.progressMap().get(missionId) || { total: 0, learned: 0, percent: 0 };
  }

  goBack() {
    this.router.navigate(['/']);
  }

  startSession(missionId: string) {
    this.session.startSession(missionId, 'DE_TO_EN');
    this.router.navigate(['/learn']);
  }

  getGroupGradient(baseId: string) {
    const group = this.missionGroups().find(g => g.baseId === baseId);
    if (!group) return 'none';

    let total = 0;
    let learned = 0;

    group.parts.forEach(p => {
      const s = this.getProgress(p.id); // Re-use your existing unit progress logic
      total += s.total;
      learned += s.learned;
    });

    const pct = total > 0 ? (learned / total) * 100 : 0;

    // Blue progress ring, Grey track
    return `conic-gradient(#3b82f6 ${pct}%, #e2e8f0 0)`;
  }
}