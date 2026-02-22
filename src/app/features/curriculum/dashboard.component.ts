import { Component, inject, signal, computed, OnInit, viewChildren, ElementRef, ChangeDetectionStrategy, effect } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule, NgOptimizedImage } from '@angular/common';
import { ContentSyncService } from '../../infrastructure/sync/content-sync.service';
import { VocabularyRepository } from '../../core/repositories/vocabulary.repository';
import { StudyStateService } from '../../core/services/study-state.service';
import { AuthService } from '../../core/services/auth.service';
import { CardState } from '../../core/models/vocabulary.model';
import { LoginModalComponent } from '../auth/login-modal.component';

@Component({
  selector: 'app-dashboard',
  imports: [CommonModule, LoginModalComponent, NgOptimizedImage],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="obsidian-layout">
      <header class="cyber-header">
        <div class="user-rank">
          <div class="rank-icon"></div>
          <div class="rank-info">
            <span class="label">Path Covered</span>
            <span class="value">{{ currentAltitude() | number }}m</span>
          </div>
        </div>

        <div class="hud-controls">
          <button class="uplink-btn" 
                  [class.connected]="auth.isAuthenticated()"
                  (click)="showLogin.set(true)">
            <span class="status-dot"></span>
            <span class="uplink-text">
              {{ auth.isAuthenticated() ? 'SIGNAL ACTIVE' : 'ESTABLISH LINK' }}
            </span>
          </button>

          <div class="stats-matrix">
             <div class="stat-cell">
               <span class="val">{{ streakDays() }}</span>
               <span class="lbl">Streak</span>
             </div>
          </div>
        </div>
      </header>

      <section class="orbit-hero">
        <div class="orbit-visual" role="button" tabindex="0" (click)="goToSystem()" (keydown.enter)="goToSystem()">
          <div class="glow-ring"></div>
          <svg class="ring-svg" width="260" height="260" aria-hidden="true">
            <circle class="track" cx="130" cy="130" r="110"></circle>
            <circle class="progress" cx="130" cy="130" r="110"
                    [attr.stroke-dasharray]="circumference"
                    [attr.stroke-dashoffset]="dashOffset()"></circle>
          </svg>

          <div class="core-data">
            @if (dailyProgress() >= dailyGoal()) {
              <div class="success-core">
                <span class="icon-check">✓</span>
                <span class="status">OBJECTIVE MET</span>
              </div>
            } @else {
              <div class="active-core">
                <span class="sub">DAILY TARGET</span>
                <span class="count">{{ dailyProgress() }} <span class="total">/ {{ dailyGoal() }}</span></span>
              </div>
            }
          </div>
        </div>
      </section>

      <section class="atlas-scroll">
        <h3 class="section-header">Zones</h3>
        
        <div class="card-track">
          @for (level of sync.curriculum(); track level.id) {
            <div class="portal-card" role="button" tabindex="0" (click)="openLevel(level.id)" (keydown.enter)="openLevel(level.id)">
              
              @defer (on viewport) {
                <video #bgVideo
                       class="bg-video"
                       [src]="getVideoPath(level.id)"
                       [poster]="getPosterPath(level.id)"
                       muted playsinline autoplay
                       [style.opacity]="0.5">
                </video>
              } @placeholder {
                <img class="bg-poster" [ngSrc]="getPosterPath(level.id)" fill alt="Atmosphere visual representation">
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
                          [class.active]="getLevelStats(level.id).percent > 0"
                          [class.complete]="getLevelStats(level.id).percent >= 100">
                       {{ getLevelStatusText(level.id) }}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          }
        </div>
      </section>

      @if (showLogin()) {
        <app-login-modal (close)="showLogin.set(false)"></app-login-modal>
      }
    </div>
  `,
  // ... (Keep exact styles)
  styles: [`
    :host { display: block; height: 100%; overflow-y: auto; background: #0B0E14; }

    /* --- LAYOUT --- */
    .obsidian-layout {
      min-height: 100%;
      color: #E2E8F0;
      font-family: sans-serif;
    }

    /* --- HEADER --- */
    .cyber-header {
      position: sticky; top: 0; z-index: 50;
      padding: var(--safe-top, 20px) 1.5rem 1rem 1.5rem;
      display: flex; justify-content: space-between; align-items: center;
      background: linear-gradient(to bottom, rgba(11,14,20, 0.95) 0%, rgba(11,14,20, 0.8) 80%, transparent 100%);
      backdrop-filter: blur(5px);
    }

    .user-rank { display: flex; gap: 12px; align-items: center; }
    .rank-icon {
      width: 36px; height: 36px; background: #3B82F6;
      clip-path: polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%);
      box-shadow: 0 0 15px rgba(59, 130, 246, 0.5);
    }
    .rank-info { display: flex; flex-direction: column; }
    .rank-info .label { font-size: 0.65rem; color: #64748B; text-transform: uppercase; letter-spacing: 1px; font-weight: 700; }
    .rank-info .value { font-weight: 700; font-family: monospace; font-size: 1rem; color: white; }

    .hud-controls { display: flex; align-items: center; gap: 1rem; }

    /* UPLINK BUTTON (Auth) */
    .uplink-btn {
      background: rgba(255,255,255,0.03); 
      border: 1px solid rgba(255,255,255,0.1);
      padding: 6px 12px; border-radius: 4px;
      display: flex; align-items: center; gap: 8px;
      cursor: pointer; transition: all 0.2s;
    }
    .uplink-btn:hover { background: rgba(255,255,255,0.08); border-color: rgba(255,255,255,0.3); }
    .uplink-btn:active { transform: scale(0.96); }

    .status-dot {
      width: 6px; height: 6px; border-radius: 50%;
      background: #ef4444; /* Red = Anon */
      box-shadow: 0 0 5px #ef4444;
      animation: pulse-red 2s infinite;
    }
    .uplink-text {
      font-family: monospace; font-size: 0.65rem; font-weight: 700; 
      color: #94a3b8; letter-spacing: 1px;
    }

    /* Connected State (Green) */
    .uplink-btn.connected { border-color: rgba(16, 185, 129, 0.3); background: rgba(16, 185, 129, 0.05); }
    .uplink-btn.connected .status-dot { background: #10b981; box-shadow: 0 0 5px #10b981; animation: none; }
    .uplink-btn.connected .uplink-text { color: #10b981; }

    .stats-matrix {
      display: flex; gap: 1rem; background: rgba(255,255,255,0.03); 
      padding: 6px 12px; border-radius: 4px; border: 1px solid rgba(255,255,255,0.05);
    }
    .stat-cell { display: flex; flex-direction: column; align-items: flex-end; }
    .stat-cell .val { font-weight: 700; font-size: 0.8rem; line-height: 1; color: white; }
    .stat-cell .lbl { font-size: 0.55rem; color: #64748B; text-transform: uppercase; }

    /* --- HERO --- */
    .orbit-hero { display: flex; justify-content: center; margin: 2rem 0 3rem 0; }
    .orbit-visual {
      position: relative; width: 260px; height: 260px;
      display: flex; align-items: center; justify-content: center;
      cursor: pointer; transition: transform 0.2s;
    }
    .orbit-visual:active { transform: scale(0.98); }

    .glow-ring {
      position: absolute; inset: 0; border-radius: 50%;
      background: radial-gradient(circle, rgba(59,130,246,0.15) 0%, transparent 70%);
      filter: blur(20px);
    }

    .ring-svg { transform: rotate(-90deg); }
    .track { fill: none; stroke: rgba(255,255,255,0.05); stroke-width: 12; }
    .progress {
      fill: none; stroke: #3B82F6; stroke-width: 12; stroke-linecap: round;
      transition: stroke-dashoffset 1s ease-out;
      filter: drop-shadow(0 0 8px #3B82F6);
    }

    .core-data { position: absolute; text-align: center; }
    .sub { display: block; font-size: 0.7rem; color: #64748B; letter-spacing: 2px; margin-bottom: 8px; font-weight: 700; }
    .count { font-size: 3rem; font-weight: 800; line-height: 1; display: block; text-shadow: 0 0 20px rgba(59,130,246,0.4); color: white; }
    .count .total { font-size: 1.2rem; color: #475569; }
    
    .resume-btn {
      margin-top: 1rem; background: rgba(59,130,246,0.1); border: 1px solid #3B82F6;
      color: #60A5FA; padding: 10px 24px; font-size: 0.75rem; letter-spacing: 1px; font-weight: 700;
      border-radius: 20px; cursor: pointer; transition: all 0.2s;
    }
    .resume-btn:hover { background: #3B82F6; color: white; box-shadow: 0 0 15px rgba(59,130,246,0.4); }

    .success-core { display: flex; flex-direction: column; align-items: center; color: #10B981; }
    .icon-check { font-size: 3rem; margin-bottom: 0.5rem; text-shadow: 0 0 10px #10B981; }
    .status { font-weight: 700; letter-spacing: 2px; font-size: 0.8rem; }

    /* --- SCROLL MAP --- */
    .atlas-scroll { padding-left: 1.5rem; }
    .section-header {
      font-size: 0.75rem; text-transform: uppercase; letter-spacing: 2px; 
      color: #64748B; margin-bottom: 1.5rem; font-weight: 700;
    }

    .card-track {
      display: flex; flex-wrap: wrap; gap: 1.5rem; overflow-x: auto; 
      padding-bottom: 2rem; padding-right: 1.5rem;
    }
    .card-track::-webkit-scrollbar { display: none; }

    .portal-card {
      width: 100%; height: 420px;
      background: #000; border-radius: 24px;
      position: relative; overflow: hidden;
      border: 1px solid rgba(255,255,255,0.1);
      box-shadow: 0 20px 50px -10px rgba(0,0,0,0.7);
      transition: transform 0.3s, border-color 0.3s;
      cursor: pointer; scroll-snap-align: center;
    }
    .portal-card:hover { transform: translateY(-8px); border-color: rgba(59, 130, 246, 0.4); }
    .portal-card:active { transform: scale(0.96); }

    /* Video & Poster */
    .bg-video, .bg-poster {
      position: absolute; inset: 0; width: 100%; height: 100%;
      object-fit: cover; z-index: 0;
      transition: opacity 1s ease-in;
      filter: grayscale(0.2) contrast(1.1);
    }

    /* Gradient Overlay */
    .atmosphere-overlay {
      position: absolute; inset: 0; z-index: 1;
      background: linear-gradient(to bottom, rgba(0,0,0,0.2) 0%, rgba(11,14,20,0.6) 60%, #0B0E14 100%);
    }

    /* Data HUD */
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

    h4 {
      margin: 0 0 1rem 0; font-size: 1.5rem; font-weight: 700; color: white;
      letter-spacing: -0.5px; text-shadow: 0 2px 10px rgba(0,0,0,0.5);
    }

    .progress-line {
      height: 4px; background: rgba(255,255,255,0.15); 
      border-radius: 2px; overflow: hidden; margin-bottom: 1rem;
      backdrop-filter: blur(4px);
    }
    .fill { height: 100%; background: #3B82F6; box-shadow: 0 0 10px #3B82F6; transition: width 0.5s ease-out; }

    .meta-row { display: flex; justify-content: space-between; align-items: center; }
    .pct { font-size: 0.75rem; font-family: monospace; color: #94A3B8; }

    .status-indicator {
      font-size: 0.6rem; font-weight: 800; padding: 4px 8px; border-radius: 4px;
      background: rgba(255,255,255,0.1); color: #64748B; letter-spacing: 1px;
      text-transform: uppercase;
    }
    .status-indicator.active {
      background: rgba(59, 130, 246, 0.2); color: #60A5FA; border: 1px solid rgba(59, 130, 246, 0.3);
    }
    .status-indicator.complete {
      background: rgba(16, 185, 129, 0.2); color: #10B981; border: 1px solid rgba(16, 185, 129, 0.3);
    }

    @keyframes pulse-red { 0% { opacity: 1; } 50% { opacity: 0.4; } 100% { opacity: 1; } }
  `]
})
export class DashboardComponent implements OnInit {
  // Services
  auth = inject(AuthService);
  sync = inject(ContentSyncService);
  repo = inject(VocabularyRepository);
  router = inject(Router);
  studyState = inject(StudyStateService);

  // Element References
  videoElements = viewChildren<ElementRef<HTMLVideoElement>>('bgVideo');

  // Signals
  dailyGoal = signal(50);
  dailyProgress = signal(0);
  streakDays = signal(12);
  currentAltitude = signal(1450);
  showLogin = signal(false);
  levelStats = signal<Map<string, { percent: number }>>(new Map());

  // SVG Maths (Radius 110)
  radius = 110;
  circumference = 2 * Math.PI * this.radius;
  dashOffset = computed(() => {
    const progress = Math.min(this.dailyProgress() / this.dailyGoal(), 1);
    return this.circumference * (1 - progress);
  });

  constructor() {
    // Cinematic Controller: Force play videos when they enter the DOM
    effect(() => {
      this.videoElements().forEach(el => {
        const video = el.nativeElement;
        video.playbackRate = 0.7; // Cinematic Slow-Mo
        video.muted = true;

        // Force play to bypass some strict autoplay policies on route change
        video.play().catch(e => console.warn('Autoplay prevented:', e));
      });
    });
  }

  async ngOnInit() {
    // 1. Calculate Daily Progress
    const all = await this.repo.getAll();
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const reviewedToday = all.filter(i => i.lastReviewedDate && i.lastReviewedDate >= todayStart.getTime()).length;
    this.dailyProgress.set(reviewedToday);

    // 2. Calculate Altitude (10m per learned word)
    const learnedTotal = all.filter(i => i.state >= CardState.Review).length;
    this.currentAltitude.set(learnedTotal * 10);

    // 3. Calculate Level Stats
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

  getLevelStats(id: string) {
    return this.levelStats().get(id) || { percent: 0 };
  }

  getLevelStatusText(id: string): string {
    const stats = this.getLevelStats(id);
    if (stats.percent >= 100) return 'SECURED';
    if (stats.percent > 0) return 'ACTIVE';
    return 'STANDBY';
  }

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

  getVideoPath(id: string): string {
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
    const map: Record<string, string> = {
      'A1': 'assets/images/forest-thumb.webp',
      'A2': 'assets/images/mountain-thumb.webp',
      'B1': 'assets/images/river-thumb.webp',
      'B2-C1': 'assets/images/plateau-thumb.webp',
      'C1': 'assets/images/clouds-thumb.webp',
      'C2': 'assets/images/void-thumb.webp',
    };
    return map[id] || '';
  }

  openLevel(id: string) { this.router.navigate(['/level', id]); }
  goToSystem() { this.router.navigate(['/review']); }
  // ...
}