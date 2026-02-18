import { Component, inject, signal, OnInit, computed, ElementRef, viewChildren, effect } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';

import { ContentSyncService } from '../../infrastructure/sync/content-sync.service';
import { VocabularyRepository } from '../../core/repositories/vocabulary.repository';
import { StudyStateService } from '../../core/services/study-state.service';
import { CardState } from '../../core/models/vocabulary.model';

@Component({
  selector: 'app-dashboard',
  imports: [CommonModule],
  template: `
    <div class="obsidian-layout">
      
      <header class="cyber-header">
        <div class="user-rank">
          <div class="rank-icon"></div>
          <div class="rank-info">
            <span class="label">Path Covered</span>
            <span class="value">{{ currentAltitude() }}m</span>
          </div>
        </div>
        <div class="stats-matrix">
          <div class="stat-cell">
            <span class="val">{{ streakDays() }}</span>
            <span class="lbl">Streak</span>
          </div>
          <div class="stat-cell">
            <span class="val">{{ dailyProgress() }} / {{ dailyGoal() }}</span>
            <span class="lbl">Daily</span>
          </div>
        </div>
      </header>

      <section class="orbit-hero">
        <div class="orbit-visual" (click)="goToSystem()">
          <div class="glow-ring"></div>
          <svg class="ring-svg" width="240" height="240">
            <circle class="track" cx="120" cy="120" r="100"></circle>
            <circle class="progress" cx="120" cy="120" r="100"
                    [attr.stroke-dasharray]="circumference"
                    [attr.stroke-dashoffset]="dashOffset()"></circle>
          </svg>
          <div class="core-data">
            @if (dailyProgress() >= dailyGoal()) {
              <div class="success-core">
                <span class="status">OBJECTIVE MET</span>
              </div>
            } @else {
              <div class="active-core">
                <span class="sub">TARGET</span>
                <span class="count">{{ dailyProgress() }}</span>
              </div>
            }
          </div>
        </div>
      </section>

      <section class="atlas-scroll">
        <h3 class="section-header">Sector Map</h3>
        
        <div class="card-track">
          @for (level of sync.curriculum(); track level.id) {
            
            <div class="portal-card" (click)="openLevel(level.id)">
              
              @defer (on viewport) {
                <video #bgVideo
                       class="bg-video"
                       [src]="getVideoPath(level.id)"
                       [poster]="getPosterPath(level.id)"
                       muted playsinline autoplay
                       [style.opacity]="0.6">
                </video>
              } @placeholder {
                <img class="bg-poster" [src]="getPosterPath(level.id)" alt="Sector Atmosphere">
              }

              <div class="atmosphere-overlay"></div>

              <div class="data-layer">
                <div class="level-id">{{ level.id }}</div>
                
                <div class="level-meta">
                  <h4>{{ getRealWorldName(level.id) }}</h4>
                  
                  <div class="progress-line">
                    <div class="fill" [style.width.%]="getLevelStats(level.id).percent"></div>
                  </div>
                  
                  <div class="meta-row">
                    <span class="pct">{{ getLevelStats(level.id).percent | number:'1.0-0' }}% Covered</span>
                    <span class="status-indicator" 
                          [class.active]="getLevelStats(level.id).percent > 0">
                       {{ getLevelStats(level.id).percent >= 100 ? 'SECURED' : 'LIVE' }}
                    </span>
                  </div>
                </div>
              </div>

            </div>
          }
        </div>
      </section>

    </div>
  `,
  styles: [`
    :host { display: block; height: 100vh; overflow-y: auto; background: #0B0E14; }

    .obsidian-layout { min-height: 100vh; color: #E2E8F0; padding-bottom: 80px; }

    /* --- HUD & HERO STYLES (Same as before, condensed) --- */
    .cyber-header { padding: var(--safe-top) 1.5rem 1rem; display: flex; justify-content: space-between; align-items: center; background: linear-gradient(to bottom, rgba(11,14,20, 0.9), transparent); }
    .user-rank { display: flex; gap: 12px; align-items: center; }
    .rank-icon { width: 36px; height: 36px; background: #3B82F6; clip-path: polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%); box-shadow: 0 0 15px rgba(59, 130, 246, 0.5); }
    .rank-info { display: flex; flex-direction: column; }
    .rank-info .label { font-size: 0.65rem; color: #64748B; text-transform: uppercase; letter-spacing: 1px; }
    .rank-info .value { font-weight: 700; font-family: monospace; }
    .stats-matrix { display: flex; gap: 1rem; background: rgba(255,255,255,0.03); padding: 8px 16px; border-radius: 12px; border: 1px solid rgba(255,255,255,0.05); }
    .stat-cell { display: flex; flex-direction: column; align-items: flex-end; }
    .stat-cell .val { font-weight: 700; font-size: 0.9rem; }
    .stat-cell .lbl { font-size: 0.6rem; color: #64748B; text-transform: uppercase; }

    .orbit-hero { display: flex; justify-content: center; margin: 3rem 0; }
    .orbit-visual { position: relative; width: 240px; height: 240px; display: flex; align-items: center; justify-content: center; }
    .glow-ring { position: absolute; inset: 0; border-radius: 50%; background: radial-gradient(circle, rgba(59,130,246,0.1) 0%, transparent 70%); filter: blur(20px); }
    .ring-svg { transform: rotate(-90deg); }
    .track { fill: none; stroke: rgba(255,255,255,0.05); stroke-width: 8; }
    .progress { fill: none; stroke: #3B82F6; stroke-width: 8; stroke-linecap: round; transition: stroke-dashoffset 1s ease-out; filter: drop-shadow(0 0 8px #3B82F6); }
    .core-data { position: absolute; text-align: center; }
    .sub { display: block; font-size: 0.7rem; color: #64748B; letter-spacing: 2px; margin-bottom: 4px; }
    .count { font-size: 3.5rem; font-weight: 800; line-height: 1; display: block; text-shadow: 0 0 20px rgba(59,130,246,0.4); }
    .resume-btn { margin-top: 1rem; background: rgba(59,130,246,0.2); border: 1px solid #3B82F6; color: #60A5FA; padding: 8px 20px; font-size: 0.75rem; letter-spacing: 1px; border-radius: 20px; cursor: pointer; }

    /* --- ATLAS SCROLL (Updated for Video) --- */
    .atlas-scroll { padding-left: 1.5rem; }
    .section-header { font-size: 0.8rem; text-transform: uppercase; letter-spacing: 2px; color: #64748B; margin-bottom: 1.5rem; }

    .card-track { display: flex; gap: 1.5rem; overflow-x: auto; padding-bottom: 2rem; padding-right: 1.5rem; scroll-snap-type: x mandatory; }
    .card-track::-webkit-scrollbar { display: none; }

    .portal-card {
      min-width: 280px; height: 420px; /* Taller for cinematic feel */
      background: #000; border-radius: 24px;
      position: relative; overflow: hidden;
      border: 1px solid rgba(255,255,255,0.1);
      box-shadow: 0 20px 50px -10px rgba(0,0,0,0.7);
      transition: transform 0.3s, border-color 0.3s;
      cursor: pointer; scroll-snap-align: center;
    }
    .portal-card:hover { transform: translateY(-5px); border-color: rgba(59, 130, 246, 0.5); }
    .portal-card:active { transform: scale(0.96); }

    /* VIDEO LAYER */
    .bg-video, .bg-poster {
      position: absolute; inset: 0; width: 100%; height: 100%;
      object-fit: cover; z-index: 0;
      transition: opacity 1s ease-in;
      filter: grayscale(0.2) contrast(1.1); /* Subtle "Film" look */
    }

    /* ATMOSPHERE OVERLAY */
    .atmosphere-overlay {
      position: absolute; inset: 0; z-index: 1;
      /* Gradient: Clear top -> Dark bottom for text */
      background: linear-gradient(to bottom, rgba(0,0,0,0.1) 0%, rgba(11,14,20,0.8) 60%, #0B0E14 100%);
    }

    /* DATA LAYER */
    .data-layer {
      position: absolute; inset: 0; z-index: 2;
      padding: 1.5rem;
      display: flex; flex-direction: column; justify-content: space-between;
    }
    
    .level-id {
      align-self: flex-end;
      font-size: 4rem; font-weight: 900; color: rgba(255,255,255,0.1);
      font-family: monospace; line-height: 0.8;
      mix-blend-mode: overlay;
    }

    .level-meta { transform: translateY(0); transition: transform 0.3s; }
    .portal-card:hover .level-meta { transform: translateY(-5px); }

    h4 { margin: 0 0 1rem 0; font-size: 1.5rem; font-weight: 700; color: white; letter-spacing: -0.5px; text-shadow: 0 2px 10px rgba(0,0,0,0.5); }
    
    .progress-line { height: 4px; background: rgba(255,255,255,0.2); border-radius: 2px; overflow: hidden; margin-bottom: 0.8rem; backdrop-filter: blur(4px); }
    .fill { height: 100%; background: #3B82F6; box-shadow: 0 0 10px #3B82F6; }
    
    .meta-row { display: flex; justify-content: space-between; align-items: center; }
    .pct { font-size: 0.75rem; font-family: monospace; color: #94A3B8; }
    
    .status-indicator {
      font-size: 0.6rem; font-weight: 800; padding: 4px 8px; border-radius: 4px;
      background: rgba(255,255,255,0.1); color: #64748B; letter-spacing: 1px;
    }
    .status-indicator.active { background: rgba(16, 185, 129, 0.2); color: #10B981; border: 1px solid rgba(16, 185, 129, 0.3); }
  `]
})
export class DashboardComponent implements OnInit {
  sync = inject(ContentSyncService);
  repo = inject(VocabularyRepository);
  router = inject(Router);
  studyState = inject(StudyStateService);

  // Access video elements to control playback speed
  videoElements = viewChildren<ElementRef<HTMLVideoElement>>('bgVideo');

  dailyGoal = signal(50);
  dailyProgress = signal(0);
  streakDays = signal(12);
  currentAltitude = signal(1450);

  // SVG Maths
  radius = 100;
  circumference = 2 * Math.PI * this.radius;
  dashOffset = computed(() => {
    const progress = Math.min(this.dailyProgress() / this.dailyGoal(), 1);
    return this.circumference * (1 - progress);
  });

  levelStats = signal<Map<string, { percent: number }>>(new Map());

  constructor() {
    effect(() => {
      const videos = this.videoElements();

      videos.forEach(el => {
        const video = el.nativeElement;

        video.playbackRate = 0.7;
        video.muted = true;

        // Force Play
        video.play().catch(err => {
          console.warn('Autoplay prevented by browser:', err);
        });
      });
    });
  }

  async ngOnInit() {
    const all = await this.repo.getAll();
    const todayStart = new Date(); todayStart.setHours(0, 0, 0, 0);
    const reviewedToday = all.filter(i => i.lastReviewedDate && i.lastReviewedDate >= todayStart.getTime()).length;
    this.dailyProgress.set(reviewedToday);

    const learnedTotal = all.filter(i => i.state >= CardState.Review).length;
    this.currentAltitude.set(learnedTotal * 10);

    const stats = new Map();
    const levels = this.sync.curriculum();
    levels.forEach(lvl => {
      const missionIds = new Set(lvl.missions.map(m => m.id));
      const items = all.filter(i => missionIds.has(i.missionId));
      const learned = items.filter(i => i.state >= CardState.Review).length;
      const total = items.length;
      stats.set(lvl.id, { percent: total > 0 ? (learned / total) * 100 : 0 });
    });
    this.levelStats.set(stats);
  }

  getLevelStats(id: string) { return this.levelStats().get(id) || { percent: 0 }; }

  getRealWorldName(id: string): string {
    const names: Record<string, string> = {
      'A1': 'The Black Forest',
      'A2': 'Alpine Ascent',
      'B1': 'River Crossing',
      'B2-C1': 'High Plateau',
      'C1': 'Cloud Peaks',
      'C2': 'The Void'
    };
    return names[id] || 'Unknown Sector';
  }

  // Helper to map IDs to asset paths
  getVideoPath(id: string): string {
    // In production, these should be /assets/videos/A1.webm
    const map: Record<string, string> = {
      'A1': 'assets/videos/forest.webm',
      'A2': 'assets/videos/mountain.webm',
      'B1': 'assets/videos/river.webm',
      'B2-C1': 'assets/videos/plateau.webm',
      'C1': 'assets/videos/clouds.webm',
      'C2': 'assets/videos/void.webm',
    };
    return map[id] || '';
  }

  getPosterPath(id: string): string {
    // Thumbnails for instant LCP
    const map: Record<string, string> = {
      'A1': 'assets/images/forest-thumb.jpg',
      'A2': 'assets/images/mountain-thumb.jpg',
      'B1': 'assets/images/river-thumb.jpg',
      'B2-C1': 'assets/images/plateau-thumb.jpg',
      'C1': 'assets/images/clouds-thumb.jpg',
      'C2': 'assets/images/void-thumb.jpg',
    };
    return map[id] || '';
  }

  openLevel(id: string) { this.router.navigate(['/level', id]); }
  goToSystem() { this.router.navigate(['/review']); }
}