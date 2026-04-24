import { Component, inject, signal, OnInit } from '@angular/core';

import { LearningSessionService } from './services/learning-session.service';
import { FlipCardComponent } from '../../shared/ui/flip-card/flip-card.component';
import { SwipeCardComponent } from '../../shared/ui/swipe-card/swipe-card.component';

@Component({
  selector: 'app-learning',
  imports: [FlipCardComponent, SwipeCardComponent],
  template: `
    <div class="dating-layout">
      
      <div class="progress-line">
        <div class="fill" [style.width.%]="store.progress().percentage"></div>
      </div>

      <div class="stack-container">
        
        @if (store.isLoading()) {
          <div class="loading-overlay">
            <div class="radar-spinner"></div>
            <p>Accessing memory banks...</p>
          </div>
        } @else {
          
          @if (store.nextCard(); as next) {
            <div class="card-bg">
              <app-flip-card 
                [item]="next" 
                [isFlipped]="false" 
                [mode]="store.mode()">
              </app-flip-card>
            </div>
          }

          @if (store.currentCard(); as current) {
            <app-swipe-card 
              class="card-top"
              [itemKey]="current.id" 
              (swipedLeft)="handleSwipe(false)"
              (swipedRight)="handleSwipe(true)"
              (cardTapped)="flip()"
              (pointerdown)="dismissTutorial()">
              
              <app-flip-card 
                [item]="current" 
                [isFlipped]="store.isFlipped()" 
                [mode]="store.mode()">
              </app-flip-card>

            </app-swipe-card>
          }

          @if (showTutorial() && !store.isSessionComplete()) {
            <div class="tutorial-overlay">
              <div class="hand-animation">
                <div class="hand">👆</div>
              </div>
              <div class="tutorial-text">
                <div class="hint left"><span>← AGAIN</span></div>
                <div class="hint right"><span>GOT IT →</span></div>
              </div>
              <p class="tutorial-sub">Tap to Flip</p>
            </div>
          }

          @if (store.isSessionComplete()) {
            <div class="complete-overlay">
              <div class="trophy">🏆</div>
              <h2>Session Complete</h2>
              <p>You're all caught up!</p>
              <button class="btn-primary" (click)="store.initializeSession()">Check Again</button>
            </div>
          }

        }
      </div>

    </div>
  `,
  styles: [`
    :host { display: block; height: 100%; background: var(--bg-surface-2); overflow: hidden; }

    .dating-layout {
      height: 100%; display: flex; flex-direction: column; 
      max-width: 500px; margin: 0 auto;
      padding: var(--safe-top) 0 var(--safe-bottom-and-footer) 0;
    }

    .progress-line { height: 4px; background:var(--glass-panel); width: 100%; }
    .fill { height: 100%; background:var(--primary); transition: width 0.3s; }

    .stack-container {
      flex: 1; position: relative;
      margin: var(--safe-top) 1.5rem var(--safe-bottom-and-footer) 1.5rem; 
      perspective: 1000px;
    }

    .loading-overlay {
      position: absolute; inset: 0;
      display: flex; flex-direction: column; align-items: center; justify-content: center;
      color: #64748b; font-family: monospace; font-size: 0.8rem; letter-spacing: 1px;
    }
    .radar-spinner {
      width: 40px; height: 40px; margin-bottom: 1rem;
      border: 3px solid rgba(59, 130, 246, 0.1);
      border-top-color: #3B82F6;
      border-radius: 50%;
      animation: spin 1s linear infinite;
    }
    @keyframes spin { to { transform: rotate(360deg); } }

    .card-bg {
      position: absolute; inset: 0;
      transform: scale(0.92) translateY(30px); 
      border-radius: 32px;
      background: var(--bg-surface-2);
      box-shadow: var(--shadow-lg);
      opacity: 1; pointer-events: none; z-index: 1;
    }
  
    .card-top { z-index: 10; }

    .tutorial-overlay {
      position: absolute; inset: 0; z-index: 50; pointer-events: none;
      display: flex; flex-direction: column; justify-content: center; align-items: center;
      background: rgba(255,255,255,0.1);
    }
    
    .hand-animation {
      font-size: 4rem; animation: swipe-hint 2s infinite ease-in-out;
      filter: drop-shadow(0 4px 6px rgba(0,0,0,0.2));
    }

    .tutorial-text {
      width: 100%; display: flex; justify-content: space-between;
      position: absolute; top: 50%; transform: translateY(-50%);
      padding: 0 1rem; box-sizing: border-box;
    }
    .hint span {
      background: rgba(0,0,0,0.7); color: white;
      padding: 6px 12px; border-radius: 8px; font-weight: 800; font-size: 0.9rem;
      letter-spacing: 1px;
    }
    .tutorial-sub {
        position: absolute; bottom: 10%; background: rgba(0,0,0,0.7); color: white;
        padding: 4px 12px; border-radius: 20px; font-size: 0.8rem; font-weight: 600;
    }

    @keyframes swipe-hint {
      0% { transform: translateX(0) rotate(0deg); opacity: 0; }
      10% { opacity: 1; }
      25% { transform: translateX(-50px) rotate(-10deg); }
      50% { transform: translateX(0) rotate(0deg); }
      75% { transform: translateX(50px) rotate(10deg); }
      90% { opacity: 1; }
      100% { transform: translateX(0) rotate(0deg); opacity: 0; }
    }

    .complete-overlay {
      text-align: center; margin-top: 30%; animation: popIn 0.5s;
    }
    .trophy { font-size: 5rem; margin-bottom: 1rem; }
    .complete-overlay h2 { color: #1e293b; margin: 0; }
    .complete-overlay p { color: #64748b; margin-top: 0.5rem; margin-bottom: 2rem; }
    
    .btn-primary {
      background: #1e293b; color: white; border: none; padding: 1rem 3rem;
      border-radius: 30px; font-weight: 600; font-size: 1.1rem; cursor: pointer;
      box-shadow: 0 4px 15px rgba(30, 41, 59, 0.3);
    }
    @keyframes popIn {
      from { transform: scale(0.8); opacity: 0; }
      to { transform: scale(1); opacity: 1; }
    }
  `]
})
export class LearningComponent implements OnInit {
  store = inject(LearningSessionService);
  showTutorial = signal(false);

  ngOnInit() {
    const seen = localStorage.getItem('app_tutorial_seen');
    if (!seen) {
      this.showTutorial.set(true);
    }
  }

  dismissTutorial() {
    if (this.showTutorial()) {
      this.showTutorial.set(false);
      localStorage.setItem('app_tutorial_seen', 'true');
    }
  }

  handleSwipe(correct: boolean) {
    this.store.submitAnswer(correct);
  }

  flip() {
    this.store.toggleFlip();
  }
}