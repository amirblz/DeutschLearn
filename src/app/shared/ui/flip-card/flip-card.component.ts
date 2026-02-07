import { Component, input, computed, ChangeDetectionStrategy } from '@angular/core';
import { VocabularyItem, Gender } from '../../../core/models/vocabulary.model';
import { LearningMode } from '../../../features/learning/services/learning-session.service';

@Component({
  selector: 'app-flip-card',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="scene">
      <div class="card" [class.is-flipped]="isFlipped()">
        
        <div class="card-face card-front" [style.border-top-color]="frontColor()">
          <span class="category-tag" [style.color]="frontColor()">
             {{ frontHint() }}
          </span>

          <h2 class="word-main" [class.long-text]="isPhrase()">
            {{ frontText() }}
          </h2>
          
          <p class="tap-hint">Space to Flip</p>
        </div>

        <div class="card-face card-back" [style.border-top-color]="backColor()">
          <span class="category-tag" [style.color]="backColor()">
            {{ backHint() }}
          </span>

          <h3 class="word-secondary" [class.long-text]="isPhrase()">
            {{ backText() }}
          </h3>

          @if (item().exampleSentence; as example) {
            <p class="example">"{{ example }}"</p>
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
    /* ... (Layout styles remain the same) ... */
    
    :host { display: block; width: 100%; max-width: 400px; height: 500px; perspective: 1000px; }
    .scene { width: 100%; height: 100%; }
    .card { width: 100%; height: 100%; position: relative; transition: transform 0.6s; transform-style: preserve-3d; }
    .card.is-flipped { transform: rotateY(180deg); }
    
    .card-face {
      position: absolute; width: 100%; height: 100%; backface-visibility: hidden;
      border-radius: 16px; background: #fff; box-shadow: 0 10px 30px rgba(0,0,0,0.08);
      display: flex; flex-direction: column; align-items: center; justify-content: center;
      padding: 2rem; box-sizing: border-box; text-align: center;
      border-top: 8px solid transparent; 
    }
    .card-back { transform: rotateY(180deg); background: #fafafa; }

    /* Typography */
    .word-main { font-family: var(--font-serif); font-size: 3rem; margin: 0.5rem 0; line-height: 1.2; }
    .word-secondary { font-family: var(--font-serif); font-size: 2.2rem; color: #444; margin: 0.5rem 0; }
    
    /* Adjust size for long phrases */
    .long-text { font-size: 1.8rem; }

    .category-tag {
      font-size: 0.75rem; 
      font-weight: 700; 
      letter-spacing: 1.5px; 
      text-transform: uppercase;
      margin-bottom: 1rem;
    }

    .example { font-style: italic; margin-top: 2rem; color: #666; font-size: 0.95rem; }
    .tap-hint, .actions-hint { position: absolute; bottom: 2rem; font-size: 0.8rem; color: #aaa; text-transform: uppercase; }
    .actions-hint { display: flex; gap: 2rem; }
  `]
})
export class FlipCardComponent {
  item = input.required<VocabularyItem>();
  isFlipped = input.required<boolean>();
  mode = input.required<LearningMode>();

  // --- Helpers ---

  // Determine the color based on Type and Gender
  private getColor(): string {
    const i = this.item();

    if (i.type === 'noun') {
      switch (i.gender) {
        case Gender.Masculine: return 'var(--color-masc)';
        case Gender.Feminine: return 'var(--color-fem)';
        case Gender.Neuter: return 'var(--color-neut)';
        default: return 'var(--color-text-light)';
      }
    }

    switch (i.type) {
      case 'verb': return 'var(--color-verb)';
      case 'phrase': return 'var(--color-phrase)';
      case 'adjective': return 'var(--color-adj)';
      default: return 'var(--color-text)';
    }
  }

  // --- Computed Props ---

  isPhrase = computed(() => this.item().type === 'phrase' || this.item().german.length > 15);

  // Dynamic Text/Colors based on Direction
  frontText = computed(() => this.mode() === 'DE_TO_EN' ? this.item().german : this.item().english);
  backText = computed(() => this.mode() === 'DE_TO_EN' ? this.item().english : this.item().german);

  // Color Logic: 
  // DE side always shows the color code. 
  // EN side is neutral (transparent or gray).
  frontColor = computed(() => this.mode() === 'DE_TO_EN' ? this.getColor() : 'transparent');
  backColor = computed(() => this.mode() === 'EN_TO_DE' ? this.getColor() : 'transparent');

  // Hint Logic (Top of card)
  frontHint = computed(() => {
    if (this.mode() === 'DE_TO_EN') return this.getGermanHint();
    return 'ENGLISH';
  });

  backHint = computed(() => {
    if (this.mode() === 'EN_TO_DE') return this.getGermanHint();
    return 'ENGLISH';
  });

  private getGermanHint(): string {
    const i = this.item();
    if (i.type === 'noun' && i.gender !== 'none') {
      return i.gender.toUpperCase(); // DER, DIE, DAS
    }
    return i.type.toUpperCase(); // VERB, PHRASE
  }
}