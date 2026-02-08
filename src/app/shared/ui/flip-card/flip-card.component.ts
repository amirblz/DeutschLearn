import { Component, input, computed, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { VocabularyItem, Gender } from '../../../core/models/vocabulary.model';
import { LearningMode } from '../../../features/learning/services/learning-session.service';

@Component({
  selector: 'app-flip-card',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="flip-inner" [class.is-flipped]="isFlipped()">
      
      <div class="face front" 
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
    .is-flipped { transform: rotateY(180deg); }

    .face {
      position: absolute; inset: 0;
      backface-visibility: hidden;
      border-radius: 24px;
      display: flex; flex-direction: column; align-items: center; justify-content: center;
      padding: 2rem;
      user-select: none; -webkit-user-select: none;
      /* Subtle border to prevent color bleeding on white backgrounds */
      box-shadow: inset 0 0 0 1px rgba(0,0,0,0.05); 
    }

    /* --- THEMES (Full Background Colors) --- */
    /* Default */
    .front { background: #f8fafc; color: #334155; } 
    
    /* Masculine (DER) -> Blue */
    .masc { 
        background: linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%); 
        color: #1e40af; 
    } 
    /* Feminine (DIE) -> Pink/Red */
    .fem { 
        background: linear-gradient(135deg, #fff1f2 0%, #ffe4e6 100%); 
        color: #be123c; 
    } 
    /* Neuter (DAS) -> Green */
    .neut { 
        background: linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%); 
        color: #15803d; 
    } 
    /* Verbs/Others -> Gray/Neutral */
    .verb { 
        background: linear-gradient(135deg, #f9fafb 0%, #f3f4f6 100%); 
        color: #4b5563; 
    }

    /* Back side always clean white */
    .back { transform: rotateY(180deg); background: #ffffff; color: #333; }

    .content-wrapper { 
      display: flex; flex-direction: column; align-items: center; gap: 1rem; text-align: center; width: 100%;
    }

    /* Article Bubble */
    .article-badge {
      font-size: 1.5rem; font-weight: 900; text-transform: uppercase;
      background: rgba(255,255,255,0.7);
      padding: 0.8rem 2rem; border-radius: 60px;
      margin-bottom: 1rem;
      backdrop-filter: blur(4px);
      box-shadow: 0 4px 15px rgba(0,0,0,0.05);
      letter-spacing: 1px;
    }

    .type-badge {
      font-size: 0.9rem; text-transform: uppercase; letter-spacing: 2px;
      opacity: 0.6; margin-bottom: 1rem; font-weight: 700;
    }

    .main-text {
      font-size: 3.5rem; font-weight: 800; margin: 0; line-height: 1.1;
      /* Subtle text shadow for better readability on colors */
      text-shadow: 0 2px 0 rgba(255,255,255,0.5);
    }
    .main-text.long { font-size: 2.2rem; }

    .sub-text { font-size: 2.5rem; font-weight: 600; margin: 0; color: #1e293b; }

    .tap-hint {
      margin-top: 4rem; font-size: 0.75rem; font-weight: 700; 
      text-transform: uppercase; letter-spacing: 1.5px;
      opacity: 0.5; display: flex; flex-direction: column; gap: 6px;
    }
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

  // --- Computed Text ---
  isLongText = computed(() => this.item().german.length > 12);
  frontText = computed(() => this.mode() === 'DE_TO_EN' ? this.item().german : this.item().english);
  backText = computed(() => this.mode() === 'DE_TO_EN' ? this.item().english : this.item().german);

  // --- Computed Classes for Styling ---
  isMasc = computed(() => this.item().type === 'noun' && this.item().gender === Gender.Masculine);
  isFem = computed(() => this.item().type === 'noun' && this.item().gender === Gender.Feminine);
  isNeut = computed(() => this.item().type === 'noun' && this.item().gender === Gender.Neuter);
  isVerb = computed(() => this.item().type === 'verb');

  // --- Helpers ---
  hasArticle = computed(() => this.item().type === 'noun' && this.item().gender !== 'none');

  getArticle() {
    return this.item().gender.toUpperCase();
  }
}