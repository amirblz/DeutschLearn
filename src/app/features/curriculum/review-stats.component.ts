import { Component, inject, signal, computed, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { VocabularyRepository } from '../../core/repositories/vocabulary.repository';
import { LeitnerBox, VocabularyItem } from '../../core/models/vocabulary.model';

@Component({
  selector: 'app-review-stats',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="stats-container">
      
      <header>
        <h1>Brain Map</h1>
        <p class="subtitle">Your knowledge distribution</p>
      </header>

      <div class="boxes-grid">
        @for (box of boxStats(); track box.id) {
          <div class="box-card" [class]="'box-' + box.id">
            
            <div class="box-header">
              <span class="box-title">BOX {{ box.id }}</span>
              <span class="interval-tag">Every {{ box.interval }}</span>
            </div>

            <div class="box-visual">
              <div class="card-stack" [style.height.px]="calculateStackHeight(box.count)">
                <div class="layer l1"></div>
                <div class="layer l2"></div>
                <div class="layer l3"></div>
              </div>
              <div class="count-badge">{{ box.count }}</div>
            </div>

            <div class="box-footer">
              <span class="label">Cards Inside</span>
              @if (box.due > 0) {
                <button class="review-btn" (click)="reviewBox(box.id)">
                  Review {{ box.due }}
                </button>
              } @else {
                <span class="all-good">All caught up</span>
              }
            </div>

          </div>
        }
      </div>

    </div>
  `,
  styles: [`
    .stats-container { padding: 2rem; max-width: 800px; margin: 0 auto; background: #f8fafc; min-height: 100vh; }
    
    header { margin-bottom: 3rem; text-align: center; }
    h1 { font-size: 2.5rem; font-weight: 800; color: #1e293b; margin: 0; letter-spacing: -1px; }
    .subtitle { color: #64748b; margin-top: 0.5rem; font-weight: 500; }

    .boxes-grid { 
      display: grid; 
      grid-template-columns: repeat(auto-fit, minmax(160px, 1fr)); 
      gap: 1.5rem; 
    }

    /* --- THE BOX CARD --- */
    .box-card {
      background: white; border-radius: 20px; padding: 1.5rem;
      display: flex; flex-direction: column; gap: 2rem;
      box-shadow: 0 10px 30px rgba(0,0,0,0.05);
      transition: transform 0.2s; position: relative; overflow: hidden;
    }
    .box-card:hover { transform: translateY(-5px); }

    /* Header */
    .box-header { display: flex; justify-content: space-between; align-items: center; }
    .box-title { font-weight: 900; font-size: 0.9rem; color: #94a3b8; letter-spacing: 1px; }
    .interval-tag { font-size: 0.7rem; background: #f1f5f9; padding: 4px 8px; border-radius: 12px; color: #64748b; font-weight: 600; }

    /* Visual Stack (The "Pile" of cards) */
    .box-visual { 
      position: relative; height: 100px; display: flex; 
      align-items: center; justify-content: center; 
    }
    
    .card-stack { width: 60px; position: relative; transition: height 0.5s; }
    .layer {
      position: absolute; width: 100%; height: 80px; border-radius: 8px;
      border: 1px solid rgba(0,0,0,0.05);
      background: linear-gradient(135deg, #fff 0%, #f1f5f9 100%);
      box-shadow: 0 4px 6px rgba(0,0,0,0.05);
    }
    .l1 { bottom: 0; z-index: 3; transform: rotate(-2deg); }
    .l2 { bottom: 4px; z-index: 2; transform: rotate(3deg); opacity: 0.8; }
    .l3 { bottom: 8px; z-index: 1; transform: rotate(-1deg); opacity: 0.6; }

    /* The Big Number */
    .count-badge {
      position: absolute; font-size: 2.5rem; font-weight: 800; z-index: 10;
      text-shadow: 0 2px 0 rgba(255,255,255,0.8); color: #334155;
    }

    /* Footer */
    .box-footer { display: flex; flex-direction: column; gap: 0.5rem; text-align: center; }
    .label { font-size: 0.75rem; text-transform: uppercase; color: #cbd5e1; font-weight: 700; letter-spacing: 1px; }
    
    .review-btn {
      background: #3b82f6; color: white; border: none; padding: 0.5rem; width: 100%;
      border-radius: 8px; font-weight: 600; cursor: pointer; font-size: 0.8rem;
      box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3);
    }
    .all-good { font-size: 0.8rem; color: #10b981; font-weight: 600; }

    /* --- COLOR THEMES PER BOX --- */
    /* Box 1 (Struggle/New) -> Red/Orange */
    .box-1 .l1 { background: #fee2e2; }
    .box-1 .count-badge { color: #ef4444; }
    
    /* Box 3 (Solid) -> Blue */
    .box-3 .l1 { background: #dbeafe; }
    .box-3 .count-badge { color: #3b82f6; }

    /* Box 5 (Mastered) -> Green/Gold */
    .box-5 .l1 { background: #dcfce7; }
    .box-5 .count-badge { color: #10b981; }
  `]
})
export class ReviewStatsComponent implements OnInit {
  private repo = inject(VocabularyRepository);
  private router = inject(Router);

  // Raw data grouped by box
  boxStats = signal<any[]>([]);

  // Config for labels (matches your LeitnerService intervals)
  private readonly BOX_CONFIG = {
    [LeitnerBox.Box1]: '1 Day',
    [LeitnerBox.Box2]: '3 Days',
    [LeitnerBox.Box3]: '1 Week',
    [LeitnerBox.Box4]: '2 Weeks',
    [LeitnerBox.Box5]: '1 Month'
  };

  async ngOnInit() {
    const allItems = await this.repo.getAll();
    const now = Date.now();

    // Initialize stats
    const stats = [1, 2, 3, 4, 5].map(id => ({
      id,
      interval: this.BOX_CONFIG[id as LeitnerBox],
      count: 0,
      due: 0
    }));

    // Fill with data
    allItems.forEach(item => {
      // LOGIC FIX:
      // If the item is in Box 1 BUT has never been reviewed, 
      // it is "New Content", not "Review Content". Skip it.
      if (item.box === LeitnerBox.Box1 && !item.lastReviewedDate) {
        return;
      }

      const boxIndex = item.box - 1;

      if (stats[boxIndex]) {
        stats[boxIndex].count++;

        // Only mark as "Due" if the time has passed
        if (item.nextReviewDate <= now) {
          stats[boxIndex].due++;
        }
      }
    });

    this.boxStats.set(stats);
  }

  calculateStackHeight(count: number): number {
    // Visual logic: 0 cards = 0px, 50 cards = 15px max offset
    return Math.min(count, 50) * 0.5;
  }

  reviewBox(boxId: number) {
    // Future Feature: Route to a "Review specific box" mode
    // For now, redirect to main learn or show a toast
    console.log('Reviewing Box', boxId);
    // this.router.navigate(['/learn', { box: boxId }]); 
  }
}