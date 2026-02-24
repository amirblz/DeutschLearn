import { Component, inject, signal, computed, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';

import { ContentSyncService } from '../../infrastructure/sync/content-sync.service';
import { VocabularyRepository } from '../../core/repositories/vocabulary.repository';
import { LearningSessionService } from '../../features/learning/services/learning-session.service';
import { VocabularyItem, CardState } from '../../core/models/vocabulary.model';

@Component({
  selector: 'app-level-detail',
  template: `
    <div class="tactical-interface">
      
      <header class="tactical-header">
        <button class="back-btn" (click)="goBack()">
           <span class="arrow">❮</span>
        </button>
        <div class="header-content">
           <span class="sector-id">SECTOR {{ currentLevel()?.id }}</span>
           <span class="sector-name">{{ levelTitle() }}</span>
        </div>
      </header>

      <div class="scroll-content">
        
        <section class="intel-card">
          <div class="intel-header">
            <span class="signal-icon">📡</span>
            <span class="label">ENVIRONMENTAL ANALYSIS</span>
          </div>
          <p class="intel-text">
            "{{ levelNarrative() }}"
          </p>
          <div class="data-row">
            <div class="stat">
              <span class="lbl">ELEVATION</span>
              <span class="val">{{ getAltitude() }}m</span>
            </div>
            <div class="stat">
              <span class="lbl">OXYGEN</span>
              <span class="val">{{ getOxygenLevel() }}%</span>
            </div>
            <div class="stat">
              <span class="lbl">STATUS</span>
              <span class="val active">ACTIVE</span>
            </div>
          </div>
        </section>

        <div class="map-grid">
          <div class="grid-line"></div>

          @for (group of missionGroups(); track group.baseId) {
            <div class="cluster-node">
              
              <div class="zone-header">
                <div class="zone-marker"></div>
                <span class="zone-title">{{ group.title }}</span>
              </div>

              <div class="mission-stack">
                @for (mission of group.parts; track mission.id) {
                  
                  <div class="mission-row" 
                       (click)="startSession(mission.id)"
                       [class.complete]="getProgress(mission.id).percent >= 100">
                    
                    <div class="hex-status">
                       <div class="hex-inner"></div>
                    </div>

                    <div class="row-content">
                      <h3>{{ mission.title }}</h3>
                      
                      <div class="mini-bar-track">
                        <div class="mini-bar-fill" 
                             [style.width.%]="getProgress(mission.id).percent"></div>
                      </div>
                      
                      <div class="meta-row">
                        <span class="meta-text">
                          {{ getProgress(mission.id).learned }} / {{ getProgress(mission.id).total }} Units
                        </span>
                        @if (getProgress(mission.id).percent >= 100) {
                          <span class="complete-tag">SECURED</span>
                        }
                      </div>
                    </div>

                    <div class="action-arrow">❯</div>

                  </div>
                }
              </div>
            </div>
          }
          
          <div class="end-of-line">
             <span>// END OF TRANSMISSION</span>
          </div>
          <div class="spacer"></div>
        </div>
      </div>

    </div>
  `,
  styles: [`
    :host { display: block; height: 100%; background: #0B0E14; color: #E2E8F0; }

    .tactical-interface { height: 100%; display: flex; flex-direction: column; }

    /* HEADER */
    .tactical-header {
      background: rgba(11, 14, 20, 0.95);
      border-bottom: 1px solid rgba(255,255,255,0.05);
      padding: var(--safe-top) 1rem 1rem 1rem;
      display: flex; align-items: center; gap: 1.5rem;
      backdrop-filter: blur(10px);
      z-index: 50; flex-shrink: 0;
    }
    .back-btn {
      background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1);
      width: 40px; height: 40px; border-radius: 8px;
      color: white; font-size: 1rem; cursor: pointer;
      display: flex; align-items: center; justify-content: center;
      transition: background 0.2s;
    }
    .back-btn:active { background: rgba(255,255,255,0.1); }
    
    .header-content { display: flex; flex-direction: column; }
    .sector-id { font-size: 0.6rem; color: #3B82F6; font-weight: 700; letter-spacing: 2px; }
    .sector-name { font-size: 1.1rem; font-weight: 700; text-transform: uppercase; color: white; }

    .scroll-content { flex: 1; overflow-y: auto; overflow-x: hidden; }

    /* --- INTEL CARD (Narrative) --- */
    .intel-card {
      margin: 1.5rem; padding: 1.5rem;
      background: linear-gradient(145deg, #151921, #0f1219);
      border: 1px solid rgba(255,255,255,0.05);
      border-left: 4px solid #3B82F6;
      border-radius: 4px; /* More angular/tactical */
      box-shadow: 0 10px 30px -5px rgba(0,0,0,0.5);
    }

    .intel-header { display: flex; align-items: center; gap: 0.5rem; margin-bottom: 1rem; opacity: 0.7; }
    .signal-icon { font-size: 0.8rem; animation: blink 2s infinite; }
    .label { font-size: 0.65rem; letter-spacing: 2px; font-weight: 700; color: #3B82F6; }

    .intel-text {
      font-family: 'Georgia', serif; /* Serif for the "Journal" feel inside the tactical UI */
      font-style: italic; font-size: 0.95rem; line-height: 1.6; color: #94a3b8;
      margin-bottom: 1.5rem;
    }

    .data-row {
      display: flex; gap: 2rem; border-top: 1px solid rgba(255,255,255,0.05); padding-top: 1rem;
    }
    .stat { display: flex; flex-direction: column; }
    .stat .lbl { font-size: 0.5rem; color: #475569; letter-spacing: 1px; margin-bottom: 2px; }
    .stat .val { font-size: 0.8rem; font-family: monospace; font-weight: 700; color: #e2e8f0; }
    .val.active { color: #10B981; }

    @keyframes blink { 0%, 100% { opacity: 1; } 50% { opacity: 0.3; } }

    /* --- MAP GRID --- */
    .map-grid {
      padding: 0 1.5rem 2rem 1.5rem; max-width: 600px; margin: 0 auto;
      position: relative;
    }

    .grid-line {
      position: absolute; left: 34px; top: 0; bottom: 0; width: 1px;
      background: repeating-linear-gradient(to bottom, #1e293b 0, #1e293b 5px, transparent 5px, transparent 10px);
      z-index: 0;
    }

    .cluster-node { margin-bottom: 2.5rem; position: relative; z-index: 1; }

    .zone-header {
      display: flex; align-items: center; gap: 1rem; margin-bottom: 1rem;
    }
    .zone-marker {
      width: 8px; height: 8px; background: #0B0E14;
      border: 2px solid #64748b; transform: rotate(45deg);
      box-shadow: 0 0 10px rgba(0,0,0,0.5);
      margin-left: 11px; /* Align with grid line */
    }
    .zone-title {
      font-size: 0.75rem; color: #94a3b8; font-weight: 700; text-transform: uppercase; letter-spacing: 1px;
    }

    .mission-stack { display: flex; flex-direction: column; gap: 0.8rem; padding-left: 2.5rem; }

    .mission-row {
      background: #151921; border: 1px solid rgba(255,255,255,0.03);
      border-radius: 8px; padding: 1rem;
      display: flex; align-items: center; gap: 1rem;
      cursor: pointer; transition: all 0.2s; position: relative; overflow: hidden;
    }
    .mission-row:hover { border-color: rgba(59, 130, 246, 0.3); background: #1a202c; }
    .mission-row:active { transform: scale(0.98); }

    /* Dynamic Border Left based on status */
    .mission-row::before {
      content: ''; position: absolute; left: 0; top: 0; bottom: 0; width: 3px;
      background: #334155; transition: background 0.3s;
    }
    .mission-row.complete::before { background: #10B981; }

    .hex-status {
      width: 20px; height: 20px; 
      display: flex; align-items: center; justify-content: center;
    }
    .hex-inner { 
      width: 8px; height: 8px; border-radius: 50%; background: #334155; 
      box-shadow: 0 0 0 2px #1e293b; 
    }
    .mission-row.complete .hex-inner { background: #10B981; box-shadow: 0 0 5px #10B981; }

    .row-content { flex: 1; }
    h3 { margin: 0 0 0.5rem 0; font-size: 0.9rem; font-weight: 600; color: #f1f5f9; }
    
    .mini-bar-track {
      height: 2px; width: 100%; background: rgba(255,255,255,0.05); margin-bottom: 0.5rem;
    }
    .mini-bar-fill { height: 100%; background: #3B82F6; transition: width 0.5s; }
    .mission-row.complete .mini-bar-fill { background: #10B981; }

    .meta-row { display: flex; justify-content: space-between; align-items: center; }
    .meta-text { font-size: 0.7rem; color: #64748b; font-family: monospace; }
    
    .complete-tag {
      font-size: 0.6rem; color: #10B981; font-weight: 700; letter-spacing: 1px;
    }

    .action-arrow { color: #334155; font-size: 0.8rem; }
    .mission-row:hover .action-arrow { color: #3B82F6; }

    .end-of-line { text-align: center; margin-top: 3rem; opacity: 0.3; font-family: monospace; font-size: 0.7rem; letter-spacing: 2px; }
    .spacer { height: 100px; }
  `]
})
export class LevelDetailComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private sync = inject(ContentSyncService);
  private session = inject(LearningSessionService);
  private repo = inject(VocabularyRepository);

  progressMap = signal<Map<string, { total: number, learned: number, percent: number }>>(new Map());

  currentLevel = computed(() => {
    const id = this.route.snapshot.paramMap.get('id');
    return this.sync.curriculum().find(l => l.id === id);
  });

  levelTitle = computed(() => {
    const id = this.currentLevel()?.id || '';
    const names: Record<string, string> = {
      'A1': 'Black Forest',
      'A2': 'Alpine Ascent',
      'B1': 'Fuji Crater',
      'B2-C1': 'Kilimanjaro',
      'C1': 'K2 Summit',
      'C2': 'The Void'
    };
    return names[id] || this.currentLevel()?.title || 'Unknown Sector';
  });

  // ✅ THE NARRATIVE ENGINE
  levelNarrative = computed(() => {
    const id = this.currentLevel()?.id || '';
    const text: Record<string, string> = {
      'A1': 'The jungle is chaotic. You cannot map it all at once. You camp here to learn the names of the trees and the paths of survival. Do not rush; observe the roots before you climb.',
      'A2': 'The incline begins. The air clears, revealing the structure of the land. Grammar rises like granite cliffs—intimidating from below, but sturdy once you find your grip.',
      'B1': 'The river widens. The flow of language is strong here. You must stop fighting the current and learn to move with it. Rhythm becomes more important than raw strength.',
      'B2-C1': 'The plateau is vast and unforgiving. The air is thin. Mistakes here cost energy. You must refine your gear, shedding simple words for precise, technical instruments.',
      'C1': 'You have entered the cloud layer. Visibility is low. You navigate by instinct and nuance. You are no longer a guest in this land; you are a survivor.',
      'C2': 'The summit is silent. There is no translation here, only being. Thought and speech have become one.'
    };
    return text[id] || 'Awaiting sector analysis...';
  });

  missionGroups = computed(() => {
    const level = this.currentLevel();
    if (!level) return [];
    const groups = new Map<string, any>();
    for (const mission of level.missions) {
      const baseId = mission.id.replace(/_\d+$/, '');
      if (!groups.has(baseId)) {
        groups.set(baseId, {
          baseId,
          title: mission.title.replace(/\s[IVX]+$/, '').replace(/\s\(\d+\)$/, ''),
          parts: []
        });
      }
      groups.get(baseId)?.parts.push(mission);
    }
    return Array.from(groups.values());
  });

  ngOnInit() {
    this.calculateProgress();
  }

  async calculateProgress() {
    const allItems = await this.repo.getAll();
    const map = new Map<string, { total: number, learned: number, percent: number }>();
    const itemsByMission: Record<string, VocabularyItem[]> = {};

    allItems.forEach(item => {
      if (!itemsByMission[item.missionId]) itemsByMission[item.missionId] = [];
      itemsByMission[item.missionId].push(item);
    });

    for (const missionId in itemsByMission) {
      const items = itemsByMission[missionId];
      const total = items.length;
      const learned = items.filter(i => i.state >= CardState.Review).length;
      const percent = total > 0 ? (learned / total) * 100 : 0;
      map.set(missionId, { total, learned, percent });
    }
    this.progressMap.set(map);
  }

  getProgress(missionId: string) {
    return this.progressMap().get(missionId) || { total: 0, learned: 0, percent: 0 };
  }

  // --- Dynamic Stats ---
  getAltitude(): string {
    const id = this.currentLevel()?.id || '';
    const alts: Record<string, string> = { 'A1': '850', 'A2': '2100', 'B1': '3400', 'B2-C1': '5200', 'C1': '7800', 'C2': '8848' };
    return alts[id] || '0';
  }

  getOxygenLevel(): string {
    const id = this.currentLevel()?.id || '';
    const ox: Record<string, string> = { 'A1': '98', 'A2': '85', 'B1': '72', 'B2-C1': '55', 'C1': '40', 'C2': '33' };
    return ox[id] || '100';
  }

  goBack() { this.router.navigate(['/']); }

  startSession(missionId: string) {
    this.session.startSession(missionId, 'DE_TO_EN');
    this.router.navigate(['/learn']);
  }
}