import { Component, inject, signal, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { VocabularyRepository } from '../../core/repositories/vocabulary.repository';
import { CardState } from '../../core/models/vocabulary.model';
import { AlgorithmGuideComponent } from './algorithm-guide.component';

interface JourneyStats {
  training: number;
  secured: number;
  critical: number;
  totalActive: number;
}

interface ForecastDay {
  label: string;
  count: number;
  isToday: boolean;
  startMs: number;
  endMs: number;
}

interface EngineMetrics {
  avgStability: string;
  avgDifficulty: string;
}

@Component({
  selector: 'app-review-stats',
  imports: [CommonModule, AlgorithmGuideComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="stats-container">
      <header class="page-header">
        <h1>System Overview</h1>
        <p class="subtitle">Track your active vocabulary and monitor the neural link's efficiency.</p>
      </header>

      <section class="journey-section">
        <h2 class="section-title">The Vocabulary Journey</h2>
        
        <div class="pipeline-grid">
          
          <div class="phase-card glass border-blue">
            <!-- <div class="phase-icon blue">1</div> -->
            <div class="phase-data">
              <span class="count">{{ stats().training }}</span>
              <span class="title">Active Training</span>
            </div>
            <p class="description">Words you are currently learning. The system is showing you these frequently to build a baseline memory trace.</p>
          </div>

          <div class="connector" aria-hidden="true">❯</div>

          <div class="phase-card glass border-green">
            <!-- <div class="phase-icon green">2</div> -->
            <div class="phase-data">
              <span class="count">{{ stats().secured }}</span>
              <span class="title">Secured Memory</span>
            </div>
            <p class="description">Words successfully committed to long-term memory. The algorithm will only test you on these occasionally to prevent decay.</p>
          </div>

        </div>

        @if (stats().critical > 0) {
          <div class="critical-alert glass border-red">
            <div class="alert-header">
              <span class="alert-icon">⚠</span>
              <span class="alert-title">Critical Recovery ({{ stats().critical }} words)</span>
            </div>
            <p class="description">These are words you've consistently struggled with. They have been temporarily isolated so they don't drain your daily energy. Focus on creating mental associations for them.</p>
          </div>
        }
      </section>

      <section class="metrics-section">
        <div class="section-header-row">
          <div>
            <h2 class="section-title">Under the Hood</h2>
            <p class="section-subtitle">How the spaced repetition engine evaluates your brain's performance.</p>
          </div>
          <button class="guide-btn" (click)="showGuide.set(true)" aria-label="Open algorithm guide">
            <span class="guide-icon">ℹ️</span> How it Works
          </button>
        </div>

        <div class="metrics-grid">
          
          <div class="metric-card glass border-indigo">
            <div class="metric-header">
              <span class="m-val">{{ engine().avgStability }}<span class="m-unit">d</span></span>
              <span class="m-title">Memory Strength (Stability)</span>
            </div>
            <p class="m-desc">The estimated number of days a word stays in your memory before you forget it. As this number grows, your review intervals get longer.</p>
          </div>

          <div class="metric-card glass border-orange">
            <div class="metric-header">
              <span class="m-val">{{ engine().avgDifficulty }}<span class="m-unit">/10</span></span>
              <span class="m-title">Cognitive Load (Difficulty)</span>
            </div>
            <p class="m-desc">How inherently difficult the current vocabulary is for you. The algorithm dynamically adjusts this based on your correct/incorrect swipes to give you more time for harder words.</p>
          </div>

          <div class="metric-card glass border-teal">
            <div class="metric-header">
              <span class="m-val">90<span class="m-unit">%</span></span>
              <span class="m-title">Target Recall (Retrievability)</span>
            </div>
            <p class="m-desc">The system schedules your next review right before your chance of recalling a word drops below 90%. It catches you at the exact moment of forgetting to maximize memory growth.</p>
          </div>

        </div>
      </section>

      <section class="forecast-section">
        <h2 class="section-title">Your 7-Day Radar</h2>
        <p class="section-subtitle">Estimated number of "Secured" words returning for a maintenance check.</p>

        <div class="radar-card glass">
          <div class="chart-container">
            @for (day of forecast(); track day.label) {
              <div class="bar-group" [class.is-today]="day.isToday">
                <span class="count-label">{{ day.count > 0 ? day.count : '' }}</span>
                <div class="bar-visual">
                  <div class="fill" 
                       [style.height.%]="day.count === 0 ? 2 : (day.count / maxForecast()) * 100"
                       [class.empty]="day.count === 0">
                  </div>
                </div>
                <span class="day-label">{{ day.label }}</span>
                @if (day.isToday) {
                  <span class="today-dot"></span>
                }
              </div>
            }
          </div>
        </div>
      </section>

    </div>

    @if (showGuide()) {
      <app-algorithm-guide (close)="showGuide.set(false)"></app-algorithm-guide>
    }
  `,
  styles: [`
    :host { display: block; height: 100%; overflow-y: auto; background: #0B0E14; color: #E2E8F0; position: relative; }
    
    .stats-container {
      padding: var(--safe-top) 1.5rem calc(var(--safe-bottom-and-footer) + 2rem) 1.5rem;
      max-width: 800px;
      margin: 0 auto;
    }

    /* --- Typography & Headers --- */
    .page-header { margin-bottom: 2.5rem; text-align: center; }
    h1 { margin: 0 0 0.5rem 0; font-size: 1.8rem; font-weight: 800; color: #ffffff; letter-spacing: -0.5px; }
    .subtitle { color: #94A3B8; font-size: 0.9rem; line-height: 1.5; max-width: 400px; margin: 0 auto; }

    .section-header-row { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 1.5rem; }
    .section-title { font-size: 1.1rem; font-weight: 700; color: #ffffff; margin: 0 0 0.5rem 0; }
    .section-subtitle { font-size: 0.8rem; color: #64748B; margin: 0; }

    .guide-btn {
      display: flex; align-items: center; gap: 6px;
      background: rgba(59, 130, 246, 0.1); border: 1px solid rgba(59, 130, 246, 0.3);
      color: #60A5FA; padding: 6px 12px; border-radius: 20px;
      font-size: 0.75rem; font-weight: 700; cursor: pointer;
      transition: all 0.2s; white-space: nowrap;
    }
    .guide-btn:hover { background: rgba(59, 130, 246, 0.2); transform: translateY(-1px); }
    .guide-icon { font-size: 0.9rem; }

    /* --- Common Glass/Panel Styles --- */
    .glass {
      background: #151921;
      border: 1px solid rgba(255,255,255,0.05);
      border-radius: 16px;
      padding: 1.5rem;
      box-shadow: 0 10px 30px -10px rgba(0,0,0,0.5);
    }

    /* --- PIPELINE GRID (The Journey) --- */
    .journey-section { margin-bottom: 3rem; }
    
    .pipeline-grid {
      display: flex; flex-direction: column; gap: 1rem;
    }

    @media (min-width: 768px) {
      .pipeline-grid { flex-direction: row; align-items: stretch; }
    }

    .connector {
      display: flex; align-items: center; justify-content: center;
      color: #334155; font-size: 1.5rem; font-weight: 900;
      transform: rotate(90deg);
    }

    @media (min-width: 768px) {
      .connector { transform: rotate(0deg); }
    }

    .phase-card {
      flex: 1; display: flex; flex-direction: column;
      position: relative; overflow: hidden;
    }

    /* Dynamic Border Accents */
    .border-blue { border-top: 3px solid #3B82F6; }
    .border-green { border-top: 3px solid #10B981; }
    .border-red { border-top: 3px solid #EF4444; background: rgba(239, 68, 68, 0.05); }
    .border-indigo { border-top: 3px solid #6366F1; }
    .border-orange { border-top: 3px solid #F97316; }
    .border-teal { border-top: 3px solid #14B8A6; }

    .phase-icon {
      width: 24px; height: 24px; border-radius: 50%;
      display: flex; align-items: center; justify-content: center;
      font-size: 0.7rem; font-weight: 800; font-family: monospace;
      margin-bottom: 1rem;
    }
    .phase-icon.blue { background: rgba(59, 130, 246, 0.2); color: #60A5FA; }
    .phase-icon.green { background: rgba(16, 185, 129, 0.2); color: #34D399; }

    .phase-data { display: flex; flex-direction: column; margin-bottom: 0.8rem; }
    .phase-data .count { font-size: 2.5rem; font-weight: 800; color: #ffffff; line-height: 1; }
    .phase-data .title { font-size: 0.85rem; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; color: #94A3B8; margin-top: 4px; }
    
    .description { font-size: 0.8rem; color: #64748B; line-height: 1.5; margin: 0; }

    /* Critical Alert */
    .critical-alert { margin-top: 1rem; padding: 1rem 1.5rem; }
    .alert-header { display: flex; align-items: center; gap: 8px; margin-bottom: 0.5rem; }
    .alert-icon { color: #EF4444; font-weight: 800; }
    .alert-title { color: #EF4444; font-size: 0.9rem; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; }

    /* --- METRICS GRID (Under the Hood) --- */
    .metrics-section { margin-bottom: 3rem; }
    .metrics-grid {
      display: grid; grid-template-columns: 1fr; gap: 1rem;
    }
    
    @media (min-width: 768px) {
      .metrics-grid { grid-template-columns: repeat(3, 1fr); }
    }

    .metric-card { display: flex; flex-direction: column; }
    .metric-header { display: flex; flex-direction: column; margin-bottom: 0.8rem; }
    .m-val { font-size: 2rem; font-weight: 800; color: #ffffff; line-height: 1; }
    .m-unit { font-size: 1rem; color: #94A3B8; font-weight: 600; margin-left: 2px; }
    .m-title { font-size: 0.75rem; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; color: #94A3B8; margin-top: 6px; }
    .m-desc { font-size: 0.8rem; color: #64748B; line-height: 1.5; margin: 0; flex: 1; }

    /* --- RADAR CHART (Forecast) --- */
    .chart-container {
      display: flex; justify-content: space-between; align-items: flex-end;
      height: 160px; padding-top: 20px;
    }

    .bar-group { 
      display: flex; flex-direction: column; align-items: center; gap: 8px; flex: 1; 
      position: relative;
    }
    
    .count-label { 
      font-size: 0.7rem; font-weight: 700; color: #94A3B8; font-family: monospace;
      height: 14px; 
    }

    .bar-visual {
      width: 16px; height: 100px; background: rgba(255,255,255,0.03);
      border-radius: 8px; position: relative; display: flex; align-items: flex-end;
    }
    
    .fill {
      width: 100%; background: linear-gradient(to top, #2563EB, #60A5FA);
      border-radius: 8px; transition: height 0.8s cubic-bezier(0.22, 1, 0.36, 1);
    }
    .fill.empty { background: #334155; }

    .day-label { font-size: 0.75rem; color: #64748B; font-weight: 600; text-transform: uppercase; }
    
    .is-today .day-label { color: #ffffff; }
    .is-today .fill { background: linear-gradient(to top, #059669, #34D399); }
    
    .today-dot {
      width: 4px; height: 4px; background: #34D399; border-radius: 50%;
      position: absolute; bottom: -12px;
    }
  `]
})
export class ReviewStatsComponent implements OnInit {
  private repo = inject(VocabularyRepository);

  stats = signal<JourneyStats>({ training: 0, secured: 0, critical: 0, totalActive: 0 });
  engine = signal<EngineMetrics>({ avgStability: '0.0', avgDifficulty: '0.0' });
  forecast = signal<ForecastDay[]>([]);
  maxForecast = signal<number>(1);
  showGuide = signal<boolean>(false);

  async ngOnInit() {
    const allItems = await this.repo.getAll();
    const now = Date.now();
    const ONE_DAY = 86400000;

    let training = 0;
    let secured = 0;
    let critical = 0;

    let totalStability = 0;
    let totalDifficulty = 0;
    let activeItemsCount = 0;

    allItems.forEach(item => {
      if (item.state !== CardState.New) {
        activeItemsCount++;
        totalStability += (item.stability || 0);
        totalDifficulty += (item.difficulty || 0);

        if (item.isLeech) {
          critical++;
        } else if (item.state === CardState.Learning || item.state === CardState.Relearning) {
          training++;
        } else if (item.state === CardState.Review) {
          secured++;
        }
      }
    });

    this.stats.set({
      training,
      secured,
      critical,
      totalActive: activeItemsCount
    });

    if (activeItemsCount > 0) {
      this.engine.set({
        avgStability: (totalStability / activeItemsCount).toFixed(1),
        avgDifficulty: (totalDifficulty / activeItemsCount).toFixed(1)
      });
    }

    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const currentDayIndex = new Date().getDay();

    const next7Days: ForecastDay[] = Array.from({ length: 7 }).map((_, i) => {
      const isToday = i === 0;
      const dateIndex = (currentDayIndex + i) % 7;
      return {
        label: isToday ? 'Tdy' : dayNames[dateIndex],
        count: 0,
        isToday,
        startMs: now + (i * ONE_DAY),
        endMs: now + ((i + 1) * ONE_DAY)
      };
    });

    allItems.forEach(item => {
      if (item.state !== CardState.New && !item.isLeech) {
        const due = item.nextReviewDate;
        const dayBin = next7Days.find(d => due >= d.startMs && due < d.endMs);
        if (dayBin) {
          dayBin.count++;
        }
      }
    });

    const highestCount = Math.max(...next7Days.map(d => d.count), 5);

    this.maxForecast.set(highestCount);
    this.forecast.set(next7Days);
  }
}