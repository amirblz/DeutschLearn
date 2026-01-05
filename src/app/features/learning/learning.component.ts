import { Component, inject, ChangeDetectionStrategy, effect } from '@angular/core';
import { LearningSessionService } from './services/learning-session.service';
import { FlipCardComponent } from '../../shared/ui/flip-card/flip-card.component';

@Component({
  selector: 'app-learning',
  standalone: true,
  imports: [FlipCardComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '(window:keydown)': 'handleKeyboardEvent($event)'
  },
  template: `
    <div class="layout-container">
      
      <header class="session-header">
        <div class="progress-container">
          <div class="progress-bar" [style.width.%]="store.progress().percentage"></div>
        </div>
        <span class="progress-text">
          {{ store.progress().current }} / {{ store.progress().total }}
        </span>
      </header>

      <main class="card-area">
        @if (store.isLoading()) {
          <div class="loading">Laden...</div>
        } 
        @else if (store.isSessionComplete()) {
          <div class="complete-state">
            <h2>Session Complete!</h2>
            <p>Great job today.</p>
            <button class="btn-primary" (click)="store.loadDueCards()">Check for more</button>
          </div>
        } 
        @else if (store.currentCard(); as card) {
<app-flip-card 
  [item]="card" 
  [isFlipped]="store.isFlipped()"
  [mode]="store.mode()"   (click)="flipAndSpeak()">
</app-flip-card>
        }
      </main>

      <footer class="controls">
        @if (store.isFlipped()) {
          <button class="btn-action wrong" (click)="store.submitAnswer(false)" aria-label="Mark Wrong">
            Recall Failed (←)
          </button>
          <button class="btn-action correct" (click)="store.submitAnswer(true)" aria-label="Mark Correct">
            Correct (→)
          </button>
        } @else {
          <button class="btn-action flip" (click)="flipAndSpeak()">
            Reveal (Space)
          </button>
        }
      </footer>

    </div>
  `,
  styles: [`
    .layout-container {
      display: grid;
      grid-template-rows: auto 1fr auto;
      height: 100vh;
      max-width: 600px;
      margin: 0 auto;
      padding: 1rem;
      box-sizing: border-box;
    }

    .session-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 1rem 0;
    }

    .progress-container {
      flex-grow: 1;
      height: 4px;
      background: #e0e0e0;
      border-radius: 2px;
      margin-right: 1rem;
      overflow: hidden;
    }

    .progress-bar {
      height: 100%;
      background-color: var(--color-text);
      transition: width 0.3s ease;
    }

    .card-area {
      display: flex;
      justify-content: center;
      align-items: center;
    }

    .controls {
      display: flex;
      gap: 1rem;
      padding: 2rem 0;
    }

    .btn-action {
      flex: 1;
      padding: 1.2rem;
      border: none;
      border-radius: 12px;
      font-weight: 600;
      font-size: 1rem;
      cursor: pointer;
      transition: transform 0.1s;
    }

    .btn-action:active { transform: scale(0.98); }

    .flip { background: var(--color-text); color: #fff; }
    .wrong { background: #fee2e2; color: #991b1b; }
    .correct { background: #dcfce7; color: #166534; }
    
    .complete-state { text-align: center; }
  `]
})
export class LearningComponent {
  store = inject(LearningSessionService);

  constructor() {
    // Optional: Effect to auto-play audio when card loads (if preferred)
    // effect(() => { ... })
  }

  // 1. Handling Audio (Web Speech API)
  speak(text: string) {
    if ('speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'de-DE'; // Force German
      utterance.rate = 0.9;     // Slightly slower for learning
      window.speechSynthesis.speak(utterance);
    }
  }

  flipAndSpeak() {
    const mode = this.store.mode();
    const current = this.store.currentCard();

    if (!current) return;

    if (!this.store.isFlipped()) {
      // We are about to flip. 
      // If DE->EN, we see German, we flip to see English.
      // If EN->DE, we see English, we flip to see German.

      // Speak German only when the German side is VISIBLE.

      // Case 1: Mode DE->EN. German is front. Speak on initial load or click? 
      // Usually, you speak the target language.

      if (mode === 'DE_TO_EN') {
        // Front is German. It's already visible. Speaking now is fine.
        this.speak(current.german);
      } else {
        // Front is English. Back is German. 
        // We are flipping to Back. So speak German NOW as we reveal it.
        this.speak(current.german);
      }

      this.store.toggleFlip();
    } else {
      // Card is flipped back to front.
      this.store.toggleFlip();
    }
  }

  // 2. Keyboard Logic
  handleKeyboardEvent(event: KeyboardEvent) {
    if (this.store.isLoading() || this.store.isSessionComplete()) return;

    // Prevent default scrolling for Space/Arrows
    if (['Space', 'ArrowLeft', 'ArrowRight'].includes(event.code)) {
      event.preventDefault();
    }

    switch (event.code) {
      case 'Space':
        this.flipAndSpeak();
        break;
      case 'ArrowLeft':
        if (this.store.isFlipped()) this.store.submitAnswer(false);
        break;
      case 'ArrowRight':
        if (this.store.isFlipped()) this.store.submitAnswer(true);
        break;
    }
  }
}