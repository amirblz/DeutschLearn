import { Component, output, ChangeDetectionStrategy } from '@angular/core';

@Component({
  selector: 'app-algorithm-guide',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="modal-backdrop" (click)="close.emit()">
      <div class="guide-window glass" (click)="$event.stopPropagation()">
        
        <header class="guide-header">
          <h2>How the Engine Works</h2>
          <p>Your reviews are perfectly timed by analyzing three core metrics of your memory, driven entirely by your swipes.</p>
          <button class="close-btn" (click)="close.emit()">✕</button>
        </header>

        <div class="scroll-content">
          
          <div class="concept-card">
            <div class="concept-header">
              <div class="icon-box purple">⏱️</div>
              <h3>1. Evaluation (The Swipe & Clock)</h3>
            </div>
            <p class="simple-text">Every time you review a card, we measure your swipe direction and your reaction time to grade your memory.</p>
            
            <div class="visual-box">
              <div class="evaluation-visual">
                
                <div class="eval-column penalty-col">
                  <span class="eval-title red">⬅️ Swipe Left (Forgot)</span>
                  <div class="eval-block red-block">
                    <span class="grade">Grade: AGAIN</span>
                    <span class="effect">Drops memory anchor.</span>
                  </div>
                </div>

                <div class="eval-column reward-col">
                  <span class="eval-title green">Swipe Right (Remembered) ➡️</span>
                  <div class="time-blocks">
                    <div class="t-block fast">
                      <span class="t-icon">⚡</span>
                      <span class="t-text">Under 3s (EASY)</span>
                    </div>
                    <div class="t-block mid">
                      <span class="t-icon">✅</span>
                      <span class="t-text">3s - 12s (GOOD)</span>
                    </div>
                    <div class="t-block slow">
                      <span class="t-icon">🐢</span>
                      <span class="t-text">Over 12s (HARD)</span>
                    </div>
                  </div>
                </div>

              </div>
            </div>
            
            <p class="example-text">If you remember a word but it takes you 15 seconds to flip the card, the system knows you struggled. It silently grades it as "Hard" and will test you slightly sooner next time.</p>
          </div>

          <div class="concept-card">
            <div class="concept-header">
              <div class="icon-box blue">⚓</div>
              <h3>2. The Anchor (Memory Lifespan)</h3>
            </div>
            <p class="simple-text">How long a word will stick in your head before you forget it.</p>
            
            <div class="visual-box">
              <div class="timeline-visual">
                <div class="timeline-track">
                  <div class="timeline-fill grow-anim"></div>
                </div>
                <div class="markers">
                  <span>1 Day</span>
                  <span>1 Week</span>
                  <span>1 Month</span>
                </div>
              </div>
            </div>
            
            <p class="example-text">Every time you score a "Good" or "Easy", the anchor drops deeper, increasing the time until you need to see the word again.</p>
          </div>

          <div class="concept-card">
            <div class="concept-header">
              <div class="icon-box orange">🏋️‍♂️</div>
              <h3>3. The Weight (Cognitive Load)</h3>
            </div>
            <p class="simple-text">How naturally hard your brain has to work to remember a specific word.</p>
            
            <div class="visual-box">
              <div class="gauge-visual">
                <div class="spectrum"></div>
                <div class="slider slide-anim">
                </div>
                <div class="markers">
                  <span>Light ("Apfel")</span>
                  <span>Heavy ("Geschwindigkeit")</span>
                </div>
              </div>
            </div>
            
            <p class="example-text">If you swipe left or score "Hard", the system increases the word's weight and shows it to you more frequently to help you lift it.</p>
          </div>

          <div class="concept-card">
            <div class="concept-header">
              <div class="icon-box teal">🔋</div>
              <h3>4. The Battery (Recall Chance)</h3>
            </div>
            <p class="simple-text">The exact probability that you would remember the word right now.</p>
            
            <p class="example-text">Memory naturally drains over time. We schedule your next review at the exact moment your battery hits 90%, recharging it right before it dies.</p>
          </div>

        </div>
        
        <div class="guide-footer">
          <button class="primary-btn" (click)="close.emit()">I Understand</button>
        </div>
      </div>
    </div>
  `,
  styles: [`
    :host { display: block; }

    /* --- Modal Structure --- */
    .modal-backdrop {
      position: fixed; inset: 0; z-index: 200;
      background: rgba(0, 0, 0, 0.8); backdrop-filter: blur(8px);
      display: flex; align-items: center; justify-content: center;
      padding: 1rem;
      animation: fadeIn 0.2s ease-out;
    }

    .guide-window {
      width: 100%; max-width: 500px; max-height: 90vh;
      display: flex; flex-direction: column;
      background: #0f1219;
      border: 1px solid rgba(255,255,255,0.1);
      border-radius: 20px;
      overflow: hidden;
      box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.7);
      animation: slideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1);
    }

    .guide-header {
      padding: 1.5rem; border-bottom: 1px solid rgba(255,255,255,0.05);
      position: relative;
    }
    .guide-header h2 { margin: 0 0 0.5rem 0; color: white; font-size: 1.3rem; }
    .guide-header p { margin: 0; color: #94A3B8; font-size: 0.85rem; line-height: 1.4; padding-right: 2rem; }
    .close-btn {
      position: absolute; top: 1.5rem; right: 1.5rem;
      background: none; border: none; color: #64748B; font-size: 1.2rem; cursor: pointer;
    }

    .scroll-content {
      flex: 1; overflow-y: auto; padding: 1.5rem;
      display: flex; flex-direction: column; gap: 2rem;
    }

    /* --- Concept Cards --- */
    .concept-card { display: flex; flex-direction: column; gap: 0.8rem; }
    .concept-header { display: flex; align-items: center; gap: 0.8rem; }
    .concept-header h3 { margin: 0; color: white; font-size: 1.1rem; }
    
    .icon-box {
      width: 32px; height: 32px; border-radius: 8px;
      display: flex; align-items: center; justify-content: center; font-size: 1.2rem;
    }
    .icon-box.purple { background: rgba(168, 85, 247, 0.2); }
    .icon-box.blue { background: rgba(59, 130, 246, 0.2); }
    .icon-box.orange { background: rgba(249, 115, 22, 0.2); }
    .icon-box.teal { background: rgba(20, 184, 166, 0.2); }

    .simple-text { margin: 0; color: #E2E8F0; font-size: 0.9rem; font-weight: 500; }
    .example-text { margin: 0; color: #64748B; font-size: 0.8rem; line-height: 1.5; background: rgba(255,255,255,0.03); padding: 10px; border-radius: 8px; }
    .example-text strong { color: #94A3B8; }

    /* --- Pure CSS Visualizations --- */
    .visual-box {
      background: #0B0E14; border: 1px solid rgba(255,255,255,0.05);
      border-radius: 12px; padding: 1.2rem; margin: 0.5rem 0;
    }

    /* 1. Evaluation (Swipe & Clock) */
    .evaluation-visual { display: flex; gap: 1rem; }
    .eval-column { flex: 1; display: flex; flex-direction: column; gap: 8px; }
    
    .eval-title { font-size: 0.75rem; font-weight: 800; text-transform: uppercase; letter-spacing: 0.5px; }
    .eval-title.red { color: #F87171; }
    .eval-title.green { color: #34D399; }
    
    .eval-block { 
      background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.05); 
      padding: 10px; border-radius: 8px; display: flex; flex-direction: column; gap: 4px;
      height: 100%; justify-content: center;
    }
    .red-block { border-left: 3px solid #EF4444; }
    .grade { font-size: 0.85rem; font-weight: 700; color: #E2E8F0; }
    .effect { font-size: 0.7rem; color: #94A3B8; }

    .time-blocks { display: flex; flex-direction: column; gap: 6px; }
    .t-block { 
      display: flex; align-items: center; gap: 8px; padding: 6px 10px; 
      background: rgba(255,255,255,0.03); border-radius: 6px; 
      border: 1px solid rgba(255,255,255,0.05);
    }
    .t-block.fast { border-left: 3px solid #3B82F6; }
    .t-block.mid { border-left: 3px solid #10B981; }
    .t-block.slow { border-left: 3px solid #F59E0B; }
    
    .t-text { font-size: 0.75rem; font-family: monospace; color: #E2E8F0; }

    /* 2. Timeline (Stability) */
    .timeline-visual { position: relative; padding-top: 10px; }
    .timeline-track { width: 100%; height: 8px; background: rgba(255,255,255,0.1); border-radius: 4px; overflow: hidden; }
    .timeline-fill { height: 100%; background: #3B82F6; border-radius: 4px; box-shadow: 0 0 10px #3B82F6; }
    .markers { display: flex; justify-content: space-between; margin-top: 8px; color: #64748B; font-size: 0.65rem; font-family: monospace; text-transform: uppercase; }
    .grow-anim { animation: growRight 2s ease-out forwards; animation-iteration-count: infinite; }

    /* 3. Gauge (Difficulty) */
    .gauge-visual { position: relative; padding-top: 10px; }
    .spectrum { width: 100%; height: 8px; border-radius: 4px; background: linear-gradient(to right, #10B981, #F59E0B, #EF4444); }
    .slider { position: absolute; top: 0; width: 2px; height: 28px; background: white; box-shadow: 0 0 5px white; }
    .slide-anim { animation: slideHeavy 3s cubic-bezier(0.4, 0, 0.2, 1) infinite alternate; }

    /* --- Footer --- */
    .guide-footer { padding: 1.5rem; border-top: 1px solid rgba(255,255,255,0.05); }
    .primary-btn {
      width: 100%; padding: 12px; background: #3B82F6; color: white;
      border: none; border-radius: 8px; font-weight: 700; cursor: pointer;
      transition: background 0.2s;
    }
    .primary-btn:hover { background: #2563EB; }

    /* --- Animations --- */
    @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
    @keyframes slideUp { from { transform: translateY(20px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
    @keyframes growRight { 0% { width: 10%; } 100% { width: 85%; } }
    @keyframes slideHeavy { 0% { left: 10%; } 100% { left: 80%; } }
    @keyframes droopDown { 0% { transform: scaleY(1); opacity: 1; } 80% { transform: scaleY(3.5); opacity: 1; } 85% { opacity: 0; } 100% { transform: scaleY(1); opacity: 0; } }
  `]
})
export class AlgorithmGuideComponent {
  close = output<void>();
}