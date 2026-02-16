import { Component, inject, signal, OnInit, ChangeDetectionStrategy } from '@angular/core';

import { Router } from '@angular/router';
import { VocabularyRepository } from '../../core/repositories/vocabulary.repository';

@Component({
  selector: 'app-review-stats',
  imports: [],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="leitner-page">
      
      <header class="header">
        <h1>The Leitner System</h1>
        <p class="subtitle">Spaced Repetition Algorithm</p>
      </header>

      <div class="hero-stats glass">
        <div class="stat-item">
          <span class="value">{{ totalCards() }}</span>
          <span class="label">Active Words</span>
        </div>
        <div class="divider"></div>
        <div class="stat-item highlight">
          <span class="value">{{ dueCount() }}</span>
          <span class="label">Due Reviews</span>
        </div>
        <div class="divider"></div>
        <div class="stat-item">
          <span class="value">{{ newCount() }}</span>
          <span class="label">New / Untouched</span>
        </div>
      </div>

      <div class="boxes-container">
        @for (box of boxes(); track box.id) {
          
          <div class="box-card" [class.is-due]="box.due > 0">
            <div class="box-header">
              <span class="box-id">BOX {{ box.id }}</span>
              <span class="interval-badge">{{ box.intervalLabel }}</span>
            </div>

            <div class="box-visual">
              <div class="card-stack" [style.height.px]="getStackHeight(box.total)">
                 <div class="layer l1"></div>
                 <div class="layer l2"></div>
                 <div class="layer l3"></div>
              </div>
              <div class="count">{{ box.total }}</div>
            </div>

            <div class="box-footer">
              @if (box.due > 0) {
                <button class="review-btn" (click)="reviewSpecificBox(box.id)">
                  Review {{ box.due }}
                </button>
              } @else {
                 <div class="resting-state">
                   <span class="icon">😴</span>
                   <span>Resting</span>
                 </div>
              }
            </div>
            
            <div class="box-progress">
               <div class="fill" [style.width.%]="(box.due / box.total) * 100"></div>
            </div>
          </div>

        }
      </div>

      <div class="system-explainer">
        <h3>How it works</h3>
        <div class="step">
          <span class="icon">ℹ️</span>
          <p>This screen only tracks words you have <strong>started learning</strong>.</p>
        </div>
        <div class="step">
          <span class="icon">✅</span>
          <p>Correct answers move cards to the next box (longer interval).</p>
        </div>
        <div class="step">
          <span class="icon">❌</span>
          <p>Any mistake sends the card back to Box 1.</p>
        </div>
      </div>

    </div>
  `,
  styles: [`
    /* ... (Keep your existing styles, they are perfect) ... */
    :host { display: block; min-height: 100%; padding-bottom: 100px; }

    .leitner-page { padding: 1.5rem; max-width: 800px; margin: 0 auto; }

    .header { margin-bottom: 2rem; text-align: center; }
    h1 { font-size: 2rem; font-weight: 800; margin: 0; background: linear-gradient(to right, #fff, #94a3b8); -webkit-background-clip: text; color: transparent; }
    .subtitle { color: var(--text-secondary); margin-top: 0.5rem; font-size: 0.9rem; letter-spacing: 1px; text-transform: uppercase; }

    .hero-stats {
      display: flex; justify-content: space-around; align-items: center;
      padding: 1.5rem; border-radius: 24px; margin-bottom: 3rem;
      border: 1px solid var(--border-subtle);
    }
    .stat-item { display: flex; flex-direction: column; align-items: center; gap: 0.5rem; }
    .stat-item .value { font-size: 1.8rem; font-weight: 800; color: var(--text-primary); }
    .stat-item .label { font-size: 0.75rem; text-transform: uppercase; color: var(--text-secondary); letter-spacing: 1px; }
    .stat-item.highlight .value { color: var(--primary); text-shadow: 0 0 20px var(--primary-dim); }
    .divider { width: 1px; height: 40px; background: var(--border-subtle); }

    .boxes-container {
      display: grid; 
      grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
      gap: 1rem; margin-bottom: 3rem;
    }

    .box-card {
      background: var(--bg-surface);
      border: 1px solid var(--border-subtle);
      border-radius: 20px; padding: 1.2rem;
      position: relative; overflow: hidden;
      transition: transform 0.2s, box-shadow 0.2s;
    }

    .box-card.is-due {
      border-color: var(--primary);
      box-shadow: 0 0 20px var(--primary-dim);
    }

    .box-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.5rem; }
    .box-id { font-weight: 900; font-size: 0.8rem; color: var(--text-secondary); }
    .interval-badge { 
      font-size: 0.65rem; background: var(--bg-surface-2); 
      padding: 4px 8px; border-radius: 10px; color: var(--primary); font-weight: 700;
    }

    .box-visual { 
      height: 80px; display: flex; align-items: center; justify-content: center; 
      position: relative; margin-bottom: 1rem;
    }
    .count { 
      position: absolute; font-size: 2rem; font-weight: 800; z-index: 10;
      color: var(--text-primary); text-shadow: 0 2px 10px rgba(0,0,0,0.5);
    }
    
    .card-stack { width: 50px; position: relative; transition: height 0.3s; max-height: 60px; }
    .layer {
      position: absolute; width: 100%; height: 60px; border-radius: 8px;
      border: 1px solid rgba(255,255,255,0.1);
      background: linear-gradient(135deg, var(--bg-surface-2), var(--bg-surface));
    }
    .l1 { bottom: 0; z-index: 3; transform: rotate(-3deg); }
    .l2 { bottom: 4px; z-index: 2; transform: rotate(4deg); opacity: 0.7; }
    .l3 { bottom: 8px; z-index: 1; transform: rotate(-2deg); opacity: 0.4; }

    .box-footer { min-height: 36px; display: flex; align-items: center; justify-content: center; }
    
    .review-btn {
      width: 100%; background: var(--primary); color: white; border: none;
      padding: 8px; border-radius: 12px; font-weight: 700; font-size: 0.8rem;
      cursor: pointer; box-shadow: 0 4px 12px var(--primary-dim);
    }
    .resting-state {
      display: flex; align-items: center; gap: 8px; opacity: 0.5; font-size: 0.8rem; font-weight: 600;
    }

    .box-progress {
      position: absolute; bottom: 0; left: 0; right: 0; height: 3px; background: var(--bg-surface-2);
    }
    .fill { height: 100%; background: var(--primary); transition: width 0.5s; }

    .system-explainer {
      background: var(--bg-surface); padding: 1.5rem; border-radius: 20px;
      border: 1px solid var(--border-subtle);
    }
    .system-explainer h3 { margin-top: 0; font-size: 1rem; }
    .step { display: flex; gap: 1rem; margin-bottom: 1rem; align-items: flex-start; }
    .step p { margin: 0; font-size: 0.9rem; color: var(--text-secondary); line-height: 1.4; }
  `]
})
export class ReviewStatsComponent implements OnInit {
  repo = inject(VocabularyRepository);
  router = inject(Router);

  boxes = signal<any[]>([]);
  totalCards = signal(0);
  dueCount = signal(0);
  newCount = signal(0); // Added this

  private readonly INTERVALS = {
    1: '1 Day',
    2: '3 Days',
    3: '1 Week',
    4: '2 Weeks',
    5: '1 Month'
  };

  async ngOnInit() {
    const all = await this.repo.getAll();
    const now = Date.now();

    let due = 0;
    let totalActive = 0; // Only count cards that are in the system
    let newItems = 0;

    const boxMap = [1, 2, 3, 4, 5].map(id => ({
      id,
      intervalLabel: this.INTERVALS[id as 1 | 2 | 3 | 4 | 5],
      total: 0,
      due: 0
    }));

    all.forEach(item => {
      // LOGIC FIX: Check if the card is actually "In the System"
      if (!item.lastReviewedDate) {
        // This is a NEW card. It doesn't belong in the "Review" buckets yet.
        newItems++;
        return;
      }

      // If we are here, the user has studied this card at least once
      totalActive++;

      const index = item.box - 1;
      if (boxMap[index]) {
        boxMap[index].total++;
        if (item.nextReviewDate <= now) {
          boxMap[index].due++;
          due++;
        }
      }
    });

    this.boxes.set(boxMap);
    this.totalCards.set(totalActive);
    this.dueCount.set(due);
    this.newCount.set(newItems);
  }

  getStackHeight(count: number) {
    return Math.min(count, 20) * 2;
  }

  reviewSpecificBox(boxId: number) {
    console.log(`Reviewing Box ${boxId}`);
    // Note: You'll need to update LearningSession to filter by Box & Due
    this.router.navigate(['/learn']);
  }
}