import { Component, inject, signal, computed, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { ContentSyncService, ApiMission } from '../../infrastructure/sync/content-sync.service';
import { VocabularyRepository } from '../../core/repositories/vocabulary.repository';
import { LearningSessionService } from '../../features/learning/services/learning-session.service';

// Helper Interface for Grouping
interface MissionGroup {
    baseId: string;
    title: string;
    icon: string;
    parts: ApiMission[]; // The "Chunks" (Part I, Part II)
}

@Component({
    selector: 'app-level-detail',
    standalone: true,
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
                <div class="unit-info">
                  <span class="unit-name">{{ mission.title }}</span>
                  </div>
                <button class="start-btn">START</button>
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

    /* Tabs Styling */
    .tabs-scroll { 
      background: white; 
      border-bottom: 1px solid #e2e8f0; 
      padding-bottom: 1rem;
    }
    .tabs-track {
      display: flex; gap: 0.8rem; overflow-x: auto; 
      padding: 0 1.5rem; 
      scrollbar-width: none; /* Hide scrollbar */
    }
    .tabs-track::-webkit-scrollbar { display: none; }

    .tab-chip {
      background: #f1f5f9; border: none; padding: 0.6rem 1.2rem;
      border-radius: 20px; font-weight: 600; color: #64748b;
      display: flex; align-items: center; gap: 0.5rem;
      white-space: nowrap; cursor: pointer; transition: all 0.2s;
    }
    .tab-chip.active {
      background: #1e293b; color: white; box-shadow: 0 4px 12px rgba(30,41,59,0.2);
    }
    .tab-icon { font-size: 1.1rem; }

    /* Content Area */
    .content-area { flex: 1; padding: 1.5rem; overflow-y: auto; }
    .section-title { font-size: 0.9rem; text-transform: uppercase; letter-spacing: 1px; color: #94a3b8; margin-bottom: 1rem; }

    .units-list { display: flex; flex-direction: column; gap: 1rem; }

    .unit-card {
      background: white; padding: 1.2rem; border-radius: 16px;
      display: flex; align-items: center; justify-content: space-between;
      box-shadow: 0 2px 8px rgba(0,0,0,0.03); border: 1px solid transparent;
      cursor: pointer; transition: transform 0.1s;
    }
    .unit-card:active { transform: scale(0.98); background: #f8fafc; }

    .unit-name { font-weight: 700; color: #334155; font-size: 1rem; }
    
    .start-btn {
      background: #e0e7ff; color: #4338ca; border: none; 
      padding: 6px 16px; border-radius: 8px; font-weight: 700; font-size: 0.8rem;
    }
  `]
})
export class LevelDetailComponent implements OnInit {
    private route = inject(ActivatedRoute);
    private router = inject(Router);
    private sync = inject(ContentSyncService);
    private session = inject(LearningSessionService);

    // State
    activeGroupId = signal<string | null>(null);

    // 1. Find Current Level
    currentLevel = computed(() => {
        const id = this.route.snapshot.paramMap.get('id');
        return this.sync.curriculum().find(l => l.id === id);
    });

    levelTitle = computed(() => this.currentLevel()?.title || 'Loading...');

    // 2. GROUPING LOGIC (The Secret Sauce)
    missionGroups = computed(() => {
        const level = this.currentLevel();
        if (!level) return [];

        const groups = new Map<string, MissionGroup>();

        for (const mission of level.missions) {
            // Regex to remove suffix like "_1", "_2"
            // Example: "food_drink_1" -> "food_drink"
            const baseId = mission.id.replace(/_\d+$/, '');

            // Clean Title: "Food & Drink I" -> "Food & Drink"
            // Logic: If title ends with Roman Numeral, strip it. 
            // (Simple heuristic: Take grouping title from the first part encountered)

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

    // 3. Active Group Content
    activeGroup = computed(() => {
        return this.missionGroups().find(g => g.baseId === this.activeGroupId());
    });

    ngOnInit() {
        // Default to first tab
        if (this.missionGroups().length > 0) {
            this.activeGroupId.set(this.missionGroups()[0].baseId);
        }
    }

    goBack() {
        this.router.navigate(['/']);
    }

    startSession(missionId: string) {
        this.session.startSession(missionId, 'DE_TO_EN');
        this.router.navigate(['/learn']);
    }
}