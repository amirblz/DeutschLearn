import { Component, ElementRef, output, signal, computed, effect, input, untracked } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-swipe-card',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="card-container" 
         [style.transform]="transformStyle()"
         [class.is-animating]="isAnimating()"
         (pointerdown)="onDragStart($event)"
         (pointerup)="onDragEnd($event)"
         (pointercancel)="onDragEnd($event)"
         (click)="onCardClick($event)">

      <div class="stamp stamp-nope" [style.opacity]="nopeOpacity()">AGAIN</div>
      <div class="stamp stamp-like" [style.opacity]="likeOpacity()">GOT IT</div>

      <ng-content></ng-content>
      
    </div>
  `,
  styles: [`
  :host { display: block; position: absolute; width: 100%; height: 100%; top: 0; left: 0; touch-action: none; }

  .card-container {
    width: 100%; height: 100%;
    /* No background here, the flip-card handles background */
    border-radius: 32px;
    position: relative;
    cursor: grab;
    will-change: transform;
    
    /* THE PREMIUM SHADOW */
    box-shadow: 0 20px 40px -10px rgba(0,0,0,0.5); 
  }

  .card-container:active { cursor: grabbing; }

  /* Stamps (Like/Nope) - Make them bolder */
  .stamp {
    position: absolute; top: 40px;
    font-size: 3rem; font-weight: 900; text-transform: uppercase;
    border: 6px solid; border-radius: 12px; padding: 0.2rem 1.5rem;
    z-index: 20; opacity: 0; 
    /* Add backdrop blur behind stamp for legibility */
    backdrop-filter: blur(4px); 
    box-shadow: 0 4px 15px rgba(0,0,0,0.2);
  }
  .stamp-like {
     left: 1rem;
  }
  .stamp-nope {
     right: 1rem;
  }
`]
})
export class SwipeCardComponent {
  // --- Inputs & Outputs ---
  itemKey = input.required<string>(); // CRITICAL: To detect when card changes

  swipedLeft = output<void>();
  swipedRight = output<void>();
  cardTapped = output<void>();

  // --- Internal State ---
  private startX = 0;
  private currentX = signal(0);
  private currentY = signal(0);
  isAnimating = signal(false);

  // --- Computed Styles ---
  transformStyle = computed(() => {
    const x = this.currentX();
    const y = this.currentY();
    const rotate = x * 0.05; // Rotate 5deg per 100px moved
    return `translate3d(${x}px, ${y}px, 0) rotate(${rotate}deg)`;
  });

  nopeOpacity = computed(() => this.currentX() < 0 ? Math.min(Math.abs(this.currentX()) / 120, 1) : 0);
  likeOpacity = computed(() => this.currentX() > 0 ? Math.min(Math.abs(this.currentX()) / 120, 1) : 0);

  constructor(private el: ElementRef) {
    // Bind to window to handle dragging outside the card area
    window.addEventListener('pointermove', this.onDragMove.bind(this));

    // --- CRITICAL FIX: Reset Position when Data Changes ---
    effect(() => {
      // Trigger whenever itemKey changes (e.g. uuid-1 -> uuid-2)
      const key = this.itemKey();

      untracked(() => {
        // Instant reset (no animation) so the new card appears in center immediately
        this.isAnimating.set(false);
        this.currentX.set(0);
        this.currentY.set(0);
      });
    });
  }

  // --- Drag Logic ---
  private isDragging = false;

  onDragStart(event: PointerEvent) {
    this.isDragging = true;
    this.isAnimating.set(false); // Disable smoothing for instant 1:1 tracking
    this.startX = event.clientX;
    (event.target as HTMLElement).setPointerCapture(event.pointerId);
  }

  onDragMove(event: PointerEvent) {
    if (!this.isDragging) return;

    const delta = event.clientX - this.startX;
    this.currentX.set(delta);

    // Add slight vertical dip based on horizontal distance (pendulum effect)
    this.currentY.set(Math.abs(delta) * 0.1);
  }

  onDragEnd(event: PointerEvent) {
    if (!this.isDragging) return;
    this.isDragging = false;
    this.isAnimating.set(true); // Re-enable smoothing for snap/fly

    const threshold = 120; // Pixels required to commit action
    const x = this.currentX();

    if (x > threshold) {
      this.flyAway(1000); // Swipe Right
      setTimeout(() => this.swipedRight.emit(), 300);
    } else if (x < -threshold) {
      this.flyAway(-1000); // Swipe Left
      setTimeout(() => this.swipedLeft.emit(), 300);
    } else {
      this.resetPosition(); // Snap Back
    }
  }

  onCardClick(event: Event) {
    // Distinguish between a "Tap" and a "Drag that ended"
    if (Math.abs(this.currentX()) < 5) {
      this.cardTapped.emit();
    }
  }

  private flyAway(toX: number) {
    this.currentX.set(toX);
  }

  private resetPosition() {
    this.currentX.set(0);
    this.currentY.set(0);
  }
}