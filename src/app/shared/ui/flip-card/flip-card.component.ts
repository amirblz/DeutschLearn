import { Component, input, computed, ChangeDetectionStrategy, signal, effect, untracked } from '@angular/core';
import { CommonModule } from '@angular/common';
import { VocabularyItem, Gender } from '../../../core/models/vocabulary.model';
import { LearningMode } from '../../../features/learning/services/learning-session.service';

@Component({
  selector: 'app-flip-card',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="flip-inner" 
         [class.is-flipped]="isFlipped()"
         [class.no-transition]="isSwitching()">
      
      <div class="face front" 
           [ngClass]="isGermanFront() ? getGenderClass() : 'neutral'">
         
         <div class="card-header">
           <span class="type-pill">{{ item().type }}</span>
         </div>

         <div class="center-stage">
            @if (isGermanFront() && hasArticle()) {
              <div class="article-bubble">{{ getArticle() }}</div>
            }

            <h1 class="main-text" [class.long]="isLongText()">
              {{ frontText() }}
            </h1>
         </div>

         <div class="card-footer">
            <div class="tap-indicator">
              <span class="dot"></span> Tap to flip
            </div>
         </div>
      </div>

      <div class="face back" 
           [ngClass]="!isGermanFront() ? getGenderClass() : 'clean'">
        
        <div class="back-content">
          <span class="label-lang">
            {{ isGermanFront() ? 'English Translation' : 'German Answer' }}
          </span>
          
          <h2 class="sub-text">{{ backText() }}</h2>
          
          @if (!isGermanFront() && hasArticle()) {
            <div class="revealed-article">{{ getArticle() }}</div>
          }

          <div class="divider"></div>

          @if (item().exampleSentence; as ex) {
            <div class="context-section">
              <span class="label-context">Example</span>
              <p class="sentence">"{{ ex }}"</p>
            </div>
          }
        </div>
      </div>

    </div>
  `,
  styles: [`
    :host { display: block; width: 100%; height: 100%; }

    .flip-inner {
      width: 100%; height: 100%; position: relative;
      transform-style: preserve-3d;
      transition: transform 0.6s cubic-bezier(0.19, 1, 0.22, 1);
    }
    .no-transition { transition: none !important; }
    .is-flipped { transform: rotateY(180deg); }

    /* --- FACE LAYOUT --- */
    .face {
      position: absolute; inset: 0;
      backface-visibility: hidden; /* Hides back of card when rotated */
      border-radius: 32px;
      overflow: hidden;
      box-shadow: inset 0 0 0 1px rgba(255,255,255,0.1);
      display: flex; flex-direction: column; justify-content: space-between;
      background: var(--bg-surface); /* Fallback */
    }

    /* 👇 THIS WAS MISSING! 👇 */
    .back {
      transform: rotateY(180deg);
    }
    /* 👆 WITHOUT THIS, BACK SITS ON TOP OF FRONT 👆 */

    /* --- THEMES --- */
    /* German Sides */
    .masc { background: var(--grad-masc); color: white; }
    .fem  { background: var(--grad-fem); color: white; }
    .neut { background: var(--grad-neut); color: white; }
    .verb { background: #1e293b; color: white; }

    /* English Side (Question) */
    .neutral {
      background: linear-gradient(135deg, #334155 0%, #1e293b 100%);
      color: #f8fafc;
    }

    /* English Side (Answer) */
    .clean {
      background: var(--bg-surface);
      color: var(--text-primary);
      align-items: center; justify-content: center;
    }
    /* If back is colored (German Answer), center it */
    .masc.back, .fem.back, .neut.back, .verb.back {
      align-items: center; justify-content: center;
    }

    /* --- TYPOGRAPHY & ELEMENTS --- */
    .card-header { padding: 1.5rem; display: flex; justify-content: flex-end; }
    .type-pill {
      background: rgba(0,0,0,0.2); backdrop-filter: blur(10px);
      padding: 6px 14px; border-radius: 20px;
      font-size: 0.75rem; font-weight: 700; text-transform: uppercase; letter-spacing: 1px;
    }

    .center-stage {
      display: flex; flex-direction: column; align-items: center; 
      padding: 0 1rem; text-align: center;
    }

    .article-bubble {
      font-size: 1.5rem; font-weight: 800; margin-bottom: 0.5rem; opacity: 0.9;
    }
    .revealed-article {
      margin-top: 0.5rem; font-weight: 800; opacity: 0.8; font-size: 1.2rem;
    }

    .main-text {
      font-family: 'Merriweather', serif;
      font-size: 3.5rem; font-weight: 700; margin: 0; line-height: 1.1;
      text-shadow: 0 4px 12px rgba(0,0,0,0.1);
    }
    .main-text.long { font-size: 2.2rem; }

    .card-footer { padding: 2rem; display: flex; justify-content: center; }
    .tap-indicator {
      font-size: 0.8rem; font-weight: 600; text-transform: uppercase; letter-spacing: 2px;
      opacity: 0.7; display: flex; align-items: center; gap: 8px;
    }
    .dot { width: 6px; height: 6px; background: white; border-radius: 50%; }

    /* Back Content Specifics */
    .back-content { padding: 2.5rem; text-align: center; width: 100%; }
    
    .label-lang {
      font-size: 0.75rem; text-transform: uppercase; letter-spacing: 2px;
      opacity: 0.7; margin-bottom: 1rem; display: block;
    }

    .sub-text {
      font-size: 2.5rem; font-weight: 700; margin: 0;
    }

    .divider {
      height: 1px; width: 40px; background: currentColor; opacity: 0.2;
      margin: 2rem auto;
    }

    .context-section { opacity: 0.9; }
    .label-context {
      font-size: 0.7rem; font-weight: 700; opacity: 0.7;
      text-transform: uppercase; margin-bottom: 0.5rem; display: block;
    }
    .sentence {
      font-style: italic; font-size: 1.1rem; line-height: 1.5; margin: 0;
    }
  `]
})
export class FlipCardComponent {
  item = input.required<VocabularyItem>();
  isFlipped = input.required<boolean>();
  mode = input.required<LearningMode>();

  isSwitching = signal(false);

  constructor() {
    effect(() => {
      const _ = this.item();
      untracked(() => {
        this.isSwitching.set(true);
        setTimeout(() => this.isSwitching.set(false), 50);
      });
    });
  }

  isGermanFront = computed(() => this.mode() === 'DE_TO_EN');
  hasArticle = computed(() => this.item().type === 'noun' && this.item().gender !== 'none');
  isLongText = computed(() => this.frontText().length > 10);

  frontText = computed(() => this.isGermanFront() ? this.item().german : this.item().english);
  backText = computed(() => this.isGermanFront() ? this.item().english : this.item().german);

  getArticle() { return this.item().gender.toUpperCase(); }

  getGenderClass() {
    if (this.item().type === 'verb') return 'verb';
    if (this.item().gender === 'der') return 'masc';
    if (this.item().gender === 'die') return 'fem';
    if (this.item().gender === 'das') return 'neut';
    return 'verb';
  }
}