import { Component, inject, signal, computed, OnInit, viewChildren, ElementRef, ChangeDetectionStrategy, effect } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule, NgOptimizedImage } from '@angular/common';
import { ContentSyncService } from '../../core/services/content-sync.service';
import { VocabularyRepository } from '../../core/repositories/vocabulary.repository';
import { StudyStateService } from '../../core/services/study-state.service';
import { AuthService } from '../../core/services/auth.service';
import { CardState } from '../../core/models/vocabulary.model';
import { LoginModalComponent } from '../auth/login-modal.component';

@Component({
  selector: 'app-dashboard',
  imports: [CommonModule, LoginModalComponent, NgOptimizedImage],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.scss'
})
export class DashboardComponent implements OnInit {
  auth = inject(AuthService);
  sync = inject(ContentSyncService);
  repo = inject(VocabularyRepository);
  router = inject(Router);
  studyState = inject(StudyStateService);

  videoElements = viewChildren<ElementRef<HTMLVideoElement>>('bgVideo');

  dailyGoal = signal(50);
  dailyProgress = signal(0);
  currentAltitude = signal(1450);
  showLogin = signal(false);
  levelStats = signal<Map<string, { percent: number }>>(new Map());

  progressPercentage = computed(() => {
    const hasDue = this.studyState.dueCount() > 0;
    if (hasDue) return 100;
    const progress = this.dailyProgress() / this.dailyGoal();
    return Math.min(progress * 100, 100);
  });

  heroAriaLabel = computed(() => {
    const due = this.studyState.dueCount();
    if (due > 0) {
      return `Start review, ${due} items due now`;
    } else if (this.dailyProgress() >= this.dailyGoal()) {
      return 'Objective met, all daily reviews complete';
    } else {
      return `Daily target progress: ${this.dailyProgress()} out of ${this.dailyGoal()}, click to view stats`;
    }
  });

  constructor() {
    effect(() => {
      this.videoElements().forEach(el => {
        const video = el.nativeElement;
        video.playbackRate = 0.7;
        video.muted = true;
        video.play().catch(e => console.warn('Autoplay prevented:', e));
      });
    });
  }

  async ngOnInit() {
    const all = await this.repo.getAll();
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
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
      'A1': 'The Black Forest', 'A2': 'Alpine Ascent',
      'B1': 'River Crossing', 'B2-C1': 'High Plateau',
      'C1': 'Cloud Peaks', 'C2': 'The Void'
    };
    return names[id] || 'Unknown Sector';
  }

  getVideoPath(id: string): string {
    const map: Record<string, string> = {
      'A1': 'assets/videos/forest.webm', 'A2': 'assets/videos/mountain.webm',
      'B1': 'assets/videos/river.webm', 'B2-C1': 'assets/videos/plateau.webm',
      'C1': 'assets/videos/clouds.webm', 'C2': 'assets/videos/void.webm',
    };
    return map[id] || '';
  }

  getPosterPath(id: string): string {
    const map: Record<string, string> = {
      'A1': 'assets/images/forest-thumb.webp', 'A2': 'assets/images/mountain-thumb.webp',
      'B1': 'assets/images/river-thumb.webp', 'B2-C1': 'assets/images/plateau-thumb.webp',
      'C1': 'assets/images/clouds-thumb.webp', 'C2': 'assets/images/void-thumb.webp',
    };
    return map[id] || '';
  }

  openLevel(id: string) {
    this.router.navigate(['/level', id]);
  }

  goToSystem() {
    if (this.studyState.dueCount() > 0) {
      this.router.navigate(['/learn']);
    } else {
      this.router.navigate(['/review']);
    }
  }

  onStartReview(event: Event) {
    event.stopPropagation();
    this.goToSystem();
  }

  onViewStats(event: Event) {
    event.stopPropagation();
    this.goToSystem();
  }
}