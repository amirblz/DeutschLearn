import { Component, input, computed, ChangeDetectionStrategy } from '@angular/core';
import { UpperCasePipe } from '@angular/common';
import { VocabularyItem, Gender } from '../../../core/models/vocabulary.model';
import { LearningMode } from '../../../features/learning/services/learning-session.service';

@Component({
  selector: 'app-flip-card',
  standalone: true,
  imports: [UpperCasePipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="scene">
      <div class="card" [class.is-flipped]="isFlipped()">
        
        <div class="card-face card-front" 
             [style.border-color]="frontBorderColor()">
             
          @if (mode() === 'DE_TO_EN') {
            <span class="gender-hint">{{ item().gender | uppercase }}</span>
            <h2 class="word-main">{{ item().german }}</h2>
          } @else {
            <span class="lang-hint">EN</span>
            <h2 class="word-main">{{ item().english }}</h2>
          }
          
          <p class="tap-hint">Space to Flip</p>
        </div>

        <div class="card-face card-back"
             [style.border-color]="backBorderColor()">
             
          @if (mode() === 'DE_TO_EN') {
            <h3 class="word-secondary">{{ item().english }}</h3>
          } @else {
            <span class="gender-hint-back">{{ item().gender | uppercase }}</span>
            <h3 class="word-secondary">{{ item().german }}</h3>
          }

          @if (item().exampleSentence) {
            <p class="example">"{{ item().exampleSentence }}"</p>
          }

          <div class="actions-hint">
            <span>← Wrong</span>
            <span>Correct →</span>
          </div>
        </div>

      </div>
    </div>
  `,
  styles: [`
    :host { display: block; width: 100%; max-width: 400px; height: 500px; perspective: 1000px; }
    .scene { width: 100%; height: 100%; }
    .card { width: 100%; height: 100%; position: relative; transition: transform 0.6s; transform-style: preserve-3d; }
    .card.is-flipped { transform: rotateY(180deg); }
    
    .card-face {
      position: absolute; width: 100%; height: 100%; backface-visibility: hidden;
      border-radius: 16px; background: #fff; box-shadow: 0 10px 30px rgba(0,0,0,0.08);
      display: flex; flex-direction: column; align-items: center; justify-content: center;
      padding: 2rem; box-sizing: border-box; text-align: center;
      border: 20px solid transparent; /* Dynamic color */
    }

    .card-back { transform: rotateY(180deg); background: #fafafa; }

    .word-main { font-family: var(--font-serif); font-size: 3rem; margin: 0.5rem 0; }
    .word-secondary { font-family: var(--font-serif); font-size: 2.5rem; color: #444; }

    .gender-hint, .gender-hint-back, .lang-hint {
      font-size: 0.85rem; font-weight: 600; letter-spacing: 1px; color: #888;
    }
    
    .example { font-style: italic; margin-top: 1.5rem; color: #666; }
    .tap-hint, .actions-hint { position: absolute; bottom: 2rem; font-size: 0.8rem; color: #aaa; text-transform: uppercase; }
    .actions-hint { display: flex; gap: 2rem; }
  `]
})
export class FlipCardComponent {
  item = input.required<VocabularyItem>();
  isFlipped = input.required<boolean>();
  mode = input.required<LearningMode>(); // Receive mode here

  // Helper to get gender color (blue/red/green)
  private getGenderColor(gender: string): string {
    switch (gender) {
      case Gender.Masculine: return 'var(--color-masc)';
      case Gender.Feminine: return 'var(--color-fem)';
      case Gender.Neuter: return 'var(--color-neut)';
      default: return 'transparent';
    }
  }

  // Border logic: Only show color on the side that has the German word
  frontBorderColor = computed(() => {
    if (this.mode() === 'DE_TO_EN') return this.getGenderColor(this.item().gender);
    return 'transparent'; // English side has no gender color
  });

  backBorderColor = computed(() => {
    if (this.mode() === 'EN_TO_DE') return this.getGenderColor(this.item().gender);
    return 'transparent';
  });
}