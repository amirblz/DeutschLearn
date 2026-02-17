import { Component, inject, signal, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { Router } from '@angular/router';
import { VocabularyRepository } from '../../core/repositories/vocabulary.repository';
import { CardState } from '../../core/models/vocabulary.model';

@Component({
  selector: 'app-review-stats',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="stats-page">
      <header class="header">
        <h1>Memory Stream</h1>
        <p class="subtitle">FSRS Algorithm Status</p>
      </header>

      <div class="stats-grid">
        <div class="stat-card total">
          <span class="value">{{ totalCards() }}</span>
          <span class="label">Total Words</span>
        </div>
        <div class="stat-card due">
          <span class="value">{{ dueCount() }}</span>
          <span class="label">Due Now</span>
        </div>
        <div class="stat-card retention">
          <span class="value">90%</span>
          <span class="label">Target Retention</span>
        </div>
      </div>

      <h3 class="section-title">Learning Phases</h3>
      
      <div class="phases-container">
        <div class="phase-card new">
          <div class="phase-header">
            <span class="dot"></span>
            <h3>New</h3>
          </div>
          <p class="count">{{ counts().new }}</p>
          <div class="phase-bar"><div class="fill" [style.width.%]="getPercent(counts().new)"></div></div>
        </div>

        <div class="phase-card learning">
          <div class="phase-header">
            <span class="dot"></span>
            <h3>Learning</h3>
          </div>
          <p class="count">{{ counts().learning }}</p>
          <div class="phase-bar"><div class="fill" [style.width.%]="getPercent(counts().learning)"></div></div>
        </div>

        <div class="phase-card review">
          <div class="phase-header">
            <span class="dot"></span>
            <h3>Review</h3>
          </div>
          <p class="count">{{ counts().review }}</p>
          <div class="phase-bar"><div class="fill" [style.width.%]="getPercent(counts().review)"></div></div>
        </div>

        <div class="phase-card relearning">
          <div class="phase-header">
            <span class="dot"></span>
            <h3>Lapsed</h3>
          </div>
          <p class="count">{{ counts().relearning }}</p>
          <div class="phase-bar"><div class="fill" [style.width.%]="getPercent(counts().relearning)"></div></div>
        </div>
      </div>

      <button class="review-btn" (click)="startReview()" [disabled]="dueCount() === 0">
        {{ dueCount() > 0 ? 'Start Review Session' : 'All Caught Up' }}
      </button>

    </div>
  `,
  styles: [`
    .stats-page { padding: 1.5rem; max-width: 600px; margin: 0 auto; padding-bottom: 100px; }
    
    .header { text-align: center; margin-bottom: 2rem; }
    h1 { font-size: 1.8rem; margin: 0; color: var(--text-primary); }
    .subtitle { color: var(--text-secondary); margin: 0; font-size: 0.9rem; }

    /* Grid Stats */
    .stats-grid { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 1rem; margin-bottom: 2rem; }
    .stat-card {
      background: var(--bg-surface); padding: 1rem; border-radius: 16px;
      display: flex; flex-direction: column; align-items: center; justify-content: center;
      border: 1px solid var(--border-subtle);
    }
    .value { font-size: 1.5rem; font-weight: 800; color: var(--text-primary); }
    .label { font-size: 0.7rem; text-transform: uppercase; color: var(--text-secondary); margin-top: 4px; }
    
    .due .value { color: #facc15; }
    .retention .value { color: #4ade80; }

    /* Phases */
    .section-title { font-size: 1rem; color: var(--text-secondary); margin-bottom: 1rem; }
    .phases-container { display: flex; flex-direction: column; gap: 1rem; margin-bottom: 2rem; }
    
    .phase-card {
      background: var(--bg-surface); padding: 1rem; border-radius: 16px;
      display: flex; align-items: center; gap: 1rem;
      border: 1px solid var(--border-subtle);
    }
    
    .phase-header { width: 100px; display: flex; align-items: center; gap: 8px; }
    .phase-header h3 { margin: 0; font-size: 0.9rem; color: var(--text-primary); }
    .dot { width: 8px; height: 8px; border-radius: 50%; }
    
    .new .dot { background: #94a3b8; }
    .learning .dot { background: #60a5fa; }
    .review .dot { background: #4ade80; }
    .relearning .dot { background: #ef4444; }

    .count { font-weight: 800; width: 40px; text-align: right; margin: 0; }
    
    .phase-bar { flex: 1; height: 6px; background: var(--bg-surface-2); border-radius: 3px; overflow: hidden; }
    .fill { height: 100%; background: var(--text-secondary); }
    .new .fill { background: #94a3b8; }
    .learning .fill { background: #60a5fa; }
    .review .fill { background: #4ade80; }
    .relearning .fill { background: #ef4444; }

    .review-btn {
      width: 100%; padding: 1rem; border-radius: 16px; border: none;
      font-weight: 700; font-size: 1rem; cursor: pointer;
      background: var(--primary); color: white;
      transition: opacity 0.2s;
    }
    .review-btn:disabled { opacity: 0.5; cursor: not-allowed; }
  `]
})
export class ReviewStatsComponent implements OnInit {
  repo = inject(VocabularyRepository);
  router = inject(Router);

  totalCards = signal(0);
  dueCount = signal(0);

  counts = signal({ new: 0, learning: 0, review: 0, relearning: 0 });

  async ngOnInit() {
    const all = await this.repo.getAll();
    const now = Date.now();

    this.totalCards.set(all.length);
    this.dueCount.set(all.filter(i => i.nextReviewDate <= now && i.state !== CardState.New).length);

    const c = { new: 0, learning: 0, review: 0, relearning: 0 };

    all.forEach(item => {
      // Map numerical enums to keys
      if (item.state === CardState.New) c.new++;
      else if (item.state === CardState.Learning) c.learning++;
      else if (item.state === CardState.Review) c.review++;
      else if (item.state === CardState.Relearning) c.relearning++;
    });

    this.counts.set(c);
  }

  getPercent(count: number) {
    const total = this.totalCards();
    return total > 0 ? (count / total) * 100 : 0;
  }

  startReview() {
    this.router.navigate(['/learn']);
  }
}