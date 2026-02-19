import { Component, inject, signal, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { VocabularyRepository } from '../../core/repositories/vocabulary.repository';
import { CardState } from '../../core/models/vocabulary.model';

@Component({
  selector: 'app-review-stats',
  imports: [CommonModule],
  template: `
    <div class="stats-bg">
      <header>
        <h1>Neural Link</h1>
        <p>Memory Status: {{ getMemoryHealth() }}</p>
      </header>

      <div class="forecast-card glass">
        <h3>Incoming Wave (7 Days)</h3>
        <div class="chart-container">
          @for (day of forecast(); track day.label) {
            <div class="bar-group">
              <div class="bar-visual">
                <div class="fill" [style.height.%]="(day.count / maxForecast) * 100"></div>
              </div>
              <span class="label">{{ day.label }}</span>
            </div>
          }
        </div>
      </div>

      <div class="retention-dashboard">
        <div class="donut-card glass">
            <div class="donut" [style.--p]="retentionRate()">
                <div class="hole">
                    <span class="value">{{ retentionRate() }}%</span>
                    <span class="sub">Recall Rate</span>
                </div>
            </div>
        </div>

        <div class="metric-grid">
            <div class="metric glass">
                <span class="num">{{ counts().learning }}</span>
                <span class="txt">Active</span>
            </div>
            <div class="metric glass">
                <span class="num">{{ counts().review }}</span>
                <span class="txt">Mature</span>
            </div>
            <div class="metric glass alert" *ngIf="counts().leech > 0">
                <span class="num">{{ counts().leech }}</span>
                <span class="txt">Leeches</span>
            </div>
        </div>
      </div>

    </div>
  `,
  styles: [`
    :host { display: block; height: 100vh; background: #0f172a; color: white; overflow-y: auto; }
    .stats-bg { padding: 2rem 1.5rem 6rem 1.5rem; max-width: 600px; margin: 0 auto; }

    header { margin-bottom: 2rem; text-align: center; }
    h1 { margin: 0; font-size: 1.8rem; background: linear-gradient(to right, #a5f3fc, #22d3ee); -webkit-background-clip: text; color: transparent; font-weight: 800; }
    p { color: #94a3b8; font-size: 0.9rem; }

    .glass {
        background: rgba(30, 41, 59, 0.6);
        backdrop-filter: blur(12px);
        border: 1px solid rgba(255,255,255,0.05);
        border-radius: 20px;
        padding: 1.5rem;
    }

    /* --- FORECAST CHART --- */
    .forecast-card { margin-bottom: 2rem; }
    .forecast-card h3 { margin: 0 0 1.5rem 0; font-size: 1rem; color: #cbd5e1; }
    
    .chart-container {
        display: flex; justify-content: space-between; align-items: flex-end;
        height: 120px;
    }
    .bar-group { display: flex; flex-direction: column; align-items: center; gap: 8px; flex: 1; }
    .bar-visual {
        width: 12px; height: 100px; background: rgba(255,255,255,0.05);
        border-radius: 6px; position: relative; display: flex; align-items: flex-end;
    }
    .fill {
        width: 100%; background: #6366f1; border-radius: 6px;
        min-height: 4px; transition: height 0.5s cubic-bezier(0.22, 1, 0.36, 1);
    }
    .label { font-size: 0.7rem; color: #64748b; font-weight: 700; }

    /* --- METRICS --- */
    .retention-dashboard { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; }
    
    .donut-card { grid-column: span 2; display: flex; justify-content: center; }
    .donut {
        width: 120px; height: 120px; border-radius: 50%;
        background: conic-gradient(#22d3ee calc(var(--p) * 1%), rgba(255,255,255,0.05) 0);
        display: flex; align-items: center; justify-content: center;
        box-shadow: 0 0 20px rgba(34, 211, 238, 0.2);
    }
    .hole {
        width: 100px; height: 100px; background: #0f172a; border-radius: 50%;
        display: flex; flex-direction: column; align-items: center; justify-content: center;
    }
    .hole .value { font-size: 1.5rem; font-weight: 800; color: #22d3ee; }
    .hole .sub { font-size: 0.7rem; color: #64748b; text-transform: uppercase; }

    .metric-grid { grid-column: span 2; display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; }
    .metric {
        display: flex; flex-direction: column; align-items: center;
        padding: 1rem;
    }
    .metric .num { font-size: 1.5rem; font-weight: 700; color: white; }
    .metric .txt { font-size: 0.75rem; color: #94a3b8; text-transform: uppercase; margin-top: 4px; }
    
    .metric.alert .num { color: #ef4444; }
  `]
})
export class ReviewStatsComponent implements OnInit {
  repo = inject(VocabularyRepository);

  forecast = signal<{ label: string, count: number }[]>([]);
  maxForecast = 1;
  retentionRate = signal(92); // Mock, but usually FSRS targets 90-95
  counts = signal({ new: 0, learning: 0, review: 0, leech: 0 });

  async ngOnInit() {
    const all = await this.repo.getAll();
    const now = Date.now();
    const ONE_DAY = 86400000;

    // 1. Calculate Forecast (Next 7 Days)
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const todayIndex = new Date().getDay();
    const next7Days = Array(7).fill(0).map((_, i) => {
      const dIndex = (todayIndex + i) % 7;
      return { label: days[dIndex], count: 0, start: now + (i * ONE_DAY), end: now + ((i + 1) * ONE_DAY) };
    });

    let max = 1;
    let counts = { new: 0, learning: 0, review: 0, leech: 0 };

    all.forEach(item => {
      // Forecast
      if (item.state !== CardState.New && item.state !== CardState.Relearning) {
        const due = item.nextReviewDate;
        const dayBin = next7Days.find(d => due >= d.start && due < d.end);
        if (dayBin) dayBin.count++;
      }

      // Counts
      if (item.state === CardState.New) counts.new++;
      else if (item.state === CardState.Learning) counts.learning++;
      else if (item.state === CardState.Review) counts.review++;

      if (item.isLeech) counts.leech++;
    });

    // Find max for chart scaling
    this.maxForecast = Math.max(...next7Days.map(d => d.count), 10); // Min 10 scale
    this.forecast.set(next7Days);
    this.counts.set(counts);
  }

  getMemoryHealth() {
    const r = this.retentionRate();
    if (r > 90) return 'Optimized 🟢';
    if (r > 80) return 'Stable 🟡';
    return 'Degrading 🔴';
  }
}