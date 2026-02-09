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
      
      <header>
        <button class="back-btn" (click)="goBack()">← Back</button>
        <h1>{{ levelTitle() }}</h1>
      </header>

      <div class="tabs-scroll">
        <div class="tabs-track">
          @for (group of missionGroups(); track group.baseId) {
            <button class="tab-chip" 
                    [class.active]="activeGroupId() === group.baseId"
                    (click)="activeGroupId.set(group.baseId)">
              <span class="tab-icon">{{ group.icon }}</span>
              <span>{{ group.title }}</span>
            </button>
          }
        </div>
      </div>

      <div class="content-area">
        @if (activeGroup(); as group) {
          <h3 class="section-title">Units</h3>
          
          <div class="units-list">
            @for (mission of group.parts; track mission.id) {
              
              <div class="unit-card" (click)="startSession(mission.id)">
                
                <div class="card-top-row">
                  <div class="unit-info">
                    <span class="unit-name">{{ mission.title }}</span>
                    <span class="unit-count">
                      {{ getProgress(mission.id).learned }} / {{ getProgress(mission.id).total }} Words
                    </span>
                  </div>
                  <button class="start-btn">
                    {{ getProgress(mission.id).percent >= 100 ? 'REVIEW' : 'START' }}
                  </button>
                </div>

                <div class="progress-track">
                  <div class="progress-fill" 
                       [style.width.%]="getProgress(mission.id).percent"
                       [class.complete]="getProgress(mission.id).percent >= 100">
                  </div>
                </div>

              </div>

            }
          </div>
        }
      </div>

    </div>
  `,
  styles: [`
    .page-container { height: 100vh; display: flex; flex-direction: column; background: #f8fafc; }
    
    header { padding: 1.5rem; background: white; }
    .back-btn { border: none; background: none; color: #64748b; font-weight: 600; cursor: pointer; margin-bottom: 0.5rem; padding: 0; }
    h1 { margin: 0; font-size: 1.8rem; color: #1e293b; }

    .tabs-scroll { background: white; border-bottom: 1px solid #e2e8f0; padding-bottom: 1rem; }
    .tabs-track { display: flex; gap: 0.8rem; overflow-x: auto; padding: 0 1.5rem; scrollbar-width: none; }
    .tabs-track::-webkit-scrollbar { display: none; }

    .tab-chip {
      background: #f1f5f9; border: none; padding: 0.6rem 1.2rem;
      border-radius: 20px; font-weight: 600; color: #64748b;
      display: flex; align-items: center; gap: 0.5rem; white-space: nowrap; cursor: pointer; transition: all 0.2s;
    }
    .tab-chip.active { background: #1e293b; color: white; box-shadow: 0 4px 12px rgba(30,41,59,0.2); }
    .tab-icon { font-size: 1.1rem; }

    .content-area { flex: 1; padding: 1.5rem; overflow-y: auto; }
    .section-title { font-size: 0.9rem; text-transform: uppercase; letter-spacing: 1px; color: #94a3b8; margin-bottom: 1rem; }

    .units-list { display: flex; flex-direction: column; gap: 1rem; }

    /* --- UNIT CARD STYLES --- */
    .unit-card {
      background: white; padding: 1.2rem; border-radius: 16px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.03); border: 1px solid transparent;
      cursor: pointer; transition: transform 0.1s;
      display: flex; flex-direction: column; gap: 1rem;
    }
    .unit-card:active { transform: scale(0.98); background: #f8fafc; }

    .card-top-row { display: flex; justify-content: space-between; align-items: center; }

    .unit-name { font-weight: 700; color: #334155; font-size: 1rem; display: block; margin-bottom: 4px; }
    .unit-count { font-size: 0.8rem; color: #94a3b8; font-weight: 500; }
    
    .start-btn {
      background: #e0e7ff; color: #4338ca; border: none; 
      padding: 6px 16px; border-radius: 8px; font-weight: 700; font-size: 0.75rem;
    }

    /* --- PROGRESS BAR STYLES --- */
    .progress-track {
      height: 6px; width: 100%;
      background: #f1f5f9; border-radius: 3px;
      overflow: hidden;
    }
    .progress-fill {
      height: 100%; background: #6366f1; border-radius: 3px;
      transition: width 0.5s cubic-bezier(0.4, 0, 0.2, 1);
    }
    .progress-fill.complete { background: #22c55e; } /* Green when done */
  `]
})
export class LevelDetailComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private sync = inject(ContentSyncService);
  private session = inject(LearningSessionService);
  private repo = inject(VocabularyRepository); // Inject Repo

  activeGroupId = signal<string | null>(null);

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
}