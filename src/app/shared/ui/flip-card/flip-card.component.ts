import { Component, input, computed, ChangeDetectionStrategy, signal, effect, untracked } from '@angular/core'; // <--- Import signal, effect, untracked
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
         [class.no-transition]="isSwitching()"> <div class="face front" 
           [class.masc]="isMasc()" 
           [class.fem]="isFem()" 
           [class.neut]="isNeut()"
           [class.verb]="isVerb()">
           
        <div class="content-wrapper">
          @if (hasArticle()) {
            <div class="article-badge">{{ getArticle() }}</div>
          } @else {
            <div class="type-badge">{{ item().type }}</div>
          }

          <h1 class="main-text" [class.long]="isLongText()">{{ frontText() }}</h1>
          
          <div class="tap-hint">
             <span class="icon">👆</span> Tap to Flip
          </div>
        </div>
      </div>

      <div class="face back">
        <div class="content-wrapper">
          <span class="lang-label">English</span>
          <h2 class="sub-text">{{ backText() }}</h2>
          
          @if (item().exampleSentence; as ex) {
            <div class="example-box">
              <p>"{{ ex }}"</p>
            </div>
          }
        </div>
      </div>

    </div>
  `,
  styles: [`
    :host { display: block; width: 100%; height: 100%; }
    
    .flip-inner {
      width: 100%; height: 100%;
      transition: transform 0.6s cubic-bezier(0.175, 0.885, 0.32, 1.275);
      transform-style: preserve-3d;
      position: relative;
    }
    
    /* 👇 ADD THIS CLASS 👇 */
    /* Forces instant change, overriding the transition */
    .no-transition {
      transition: none !important;
    }

    .is-flipped { transform: rotateY(180deg); }

    /* ... keep your existing face styles ... */
    .face {
      position: absolute; inset: 0;
      backface-visibility: hidden;
      border-radius: 24px;
      display: flex; flex-direction: column; align-items: center; justify-content: center;
      padding: 2rem;
      user-select: none; -webkit-user-select: none;
      box-shadow: inset 0 0 0 1px rgba(0,0,0,0.05); 
    }
    /* ... keep colors, fonts, etc. ... */
    .front { background: #f8fafc; color: #334155; } 
    .masc { background: linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%); color: #1e40af; } 
    .fem { background: linear-gradient(135deg, #fff1f2 0%, #ffe4e6 100%); color: #be123c; } 
    .neut { background: linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%); color: #15803d; } 
    .verb { background: linear-gradient(135deg, #f9fafb 0%, #f3f4f6 100%); color: #4b5563; }
    .back { transform: rotateY(180deg); background: #ffffff; color: #333; }
    .content-wrapper { 
      display: flex; flex-direction: column; align-items: center; gap: 1rem; text-align: center; width: 100%;
    }
    .article-badge { font-size: 1.5rem; font-weight: 900; background: rgba(255,255,255,0.7); padding: 0.8rem 2rem; border-radius: 60px; margin-bottom: 1rem; }
    .type-badge { font-size: 0.9rem; font-weight: 700; opacity: 0.6; margin-bottom: 1rem; text-transform: uppercase; }
    .main-text { font-size: 3.5rem; font-weight: 800; margin: 0; line-height: 1.1; }
    .sub-text { font-size: 2.5rem; font-weight: 600; margin: 0; color: #1e293b; }
    .tap-hint { margin-top: 4rem; opacity: 0.5; font-size: 0.75rem; font-weight: 700; text-transform: uppercase; display: flex; flex-direction: column; gap: 6px; }
        .tap-hint .icon { font-size: 1.5rem; animation: bounce 2s infinite; }

    .lang-label {
      font-size: 0.7rem; text-transform: uppercase; letter-spacing: 2px; color: #94a3b8;
    }

    .example-box {
      background: #f8fafc; padding: 1.5rem; border-radius: 16px; margin-top: 2rem;
      color: #64748b; font-style: italic; border: 1px solid #e2e8f0;
      font-size: 1.1rem;
    }

    @keyframes bounce {
      0%, 20%, 50%, 80%, 100% {transform: translateY(0);}
      40% {transform: translateY(-6px);}
      60% {transform: translateY(-3px);}
    }

  `]
})
export class FlipCardComponent {
  item = input.required<VocabularyItem>();
  isFlipped = input.required<boolean>();
  mode = input.required<LearningMode>();

  // State to disable transition temporarily
  isSwitching = signal(false);

  constructor() {
    // Watch for ITEM changes
    effect(() => {
      const currentItem = this.item(); // Dependency

      untracked(() => {
        // 1. Disable animation instantly
        this.isSwitching.set(true);

        // 2. Re-enable it after a tiny delay (enough for the DOM to snap to 0deg)
        setTimeout(() => {
          this.isSwitching.set(false);
        }, 50);
      });
    });
  }

  // ... (Keep your existing computed properties)
  isLongText = computed(() => this.item().german.length > 12);
  frontText = computed(() => this.mode() === 'DE_TO_EN' ? this.item().german : this.item().english);
  backText = computed(() => this.mode() === 'DE_TO_EN' ? this.item().english : this.item().german);
  isMasc = computed(() => this.item().type === 'noun' && this.item().gender === Gender.Masculine);
  isFem = computed(() => this.item().type === 'noun' && this.item().gender === Gender.Feminine);
  isNeut = computed(() => this.item().type === 'noun' && this.item().gender === Gender.Neuter);
  isVerb = computed(() => this.item().type === 'verb');
  hasArticle = computed(() => this.item().type === 'noun' && this.item().gender !== 'none');

  getArticle() { return this.item().gender.toUpperCase(); }
}