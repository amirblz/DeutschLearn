import { Component, ElementRef, output, signal, computed, effect, input, untracked, inject, ChangeDetectionStrategy } from '@angular/core';

@Component({
  selector: 'app-swipe-card',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '(window:pointermove)': 'onDragMove($event)',
    '(window:pointerup)': 'onDragEnd($event)',
    '(window:pointercancel)': 'onDragEnd($event)',
    'role': 'application',
    'tabindex': '0',
    '(keydown.ArrowLeft)': 'flyAway(-1000); emitLeft()',
    '(keydown.ArrowRight)': 'flyAway(1000); emitRight()',
    '(keydown.Enter)': 'onCardClick($event)',
    '(keydown.Space)': 'onCardClick($event)'
  },
  template: `
    <div class="card-container" 
         [style.transform]="transformStyle()"
         [class.is-animating]="isAnimating()"
         (pointerdown)="onDragStart($event)"
         (click)="onCardClick($event)">

      <div class="stamp stamp-nope" [style.opacity]="nopeOpacity()">AGAIN</div>
      <div class="stamp stamp-like" [style.opacity]="likeOpacity()">GOT IT</div>

      <ng-content></ng-content>
      
    </div>
  `,
  styles: [`
  :host { display: block; position: absolute; width: 100%; height: 100%; top: 0; left: 0; touch-action: none; outline: none; }

  .card-container {
    width: 100%; height: 100%;
    border-radius: 32px;
    position: relative;
    cursor: grab;
    will-change: transform;
    box-shadow: 0 20px 40px -10px rgba(0,0,0,0.5); 
  }

  /* ✅ ADDED: The missing transition class */
  .card-container.is-animating {
    transition: transform 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
  }

  .card-container:active { cursor: grabbing; }

  .stamp {
    position: absolute; top: 40px;
    font-size: 3rem; font-weight: 900; text-transform: uppercase;
    border: 6px solid; border-radius: 12px; padding: 0.2rem 1.5rem;
    z-index: 20; opacity: 0; 
    backdrop-filter: blur(4px); 
    box-shadow: 0 4px 15px rgba(0,0,0,0.2);
  }
  .stamp-like {
     left: 1rem;
     color: #4ade80;
     border-color: #4ade80;
  }
  .stamp-nope {
     right: 1rem;
     color: #f87171;
     border-color: #f87171;
  }
`]
})
export class SwipeCardComponent {
  itemKey = input.required<string>();

  swipedLeft = output<void>();
  swipedRight = output<void>();
  cardTapped = output<void>();

  private startX = 0;
  private currentX = signal(0);
  private currentY = signal(0);
  isAnimating = signal(false);

  transformStyle = computed(() => {
    const x = this.currentX();
    const y = this.currentY();
    const rotate = x * 0.05;
    return `translate3d(${x}px, ${y}px, 0) rotate(${rotate}deg)`;
  });

  nopeOpacity = computed(() => this.currentX() < 0 ? Math.min(Math.abs(this.currentX()) / 120, 1) : 0);
  likeOpacity = computed(() => this.currentX() > 0 ? Math.min(Math.abs(this.currentX()) / 120, 1) : 0);

  private el = inject(ElementRef);
  private isDragging = false;

  constructor() {
    effect(() => {
      const key = this.itemKey();

      untracked(() => {
        this.isAnimating.set(false);

        // ✅ CRITICAL iOS FIX: Wait for the DOM to process the removal of `.is-animating`
        // before snapping the coordinates back to 0. This breaks the batch update!
        setTimeout(() => {
          this.currentX.set(0);
          this.currentY.set(0);
        }, 20);
      });
    });
  }

  onDragStart(event: PointerEvent) {
    this.isDragging = true;
    this.isAnimating.set(false);
    this.startX = event.clientX;
    (event.target as HTMLElement).setPointerCapture(event.pointerId);
  }

  onDragMove(event: PointerEvent) {
    if (!this.isDragging) return;

    const delta = event.clientX - this.startX;
    this.currentX.set(delta);
    this.currentY.set(Math.abs(delta) * 0.1);
  }

  onDragEnd(event: PointerEvent) {
    if (!this.isDragging) return;
    this.isDragging = false;
    this.isAnimating.set(true);

    const threshold = 120;
    const x = this.currentX();

    if (x > threshold) {
      this.flyAway(1000);
      setTimeout(() => this.swipedRight.emit(), 300);
    } else if (x < -threshold) {
      this.flyAway(-1000);
      setTimeout(() => this.swipedLeft.emit(), 300);
    } else {
      this.resetPosition();
    }
  }

  onCardClick(event: Event) {
    if (Math.abs(this.currentX()) < 5) {
      this.cardTapped.emit();
    }
  }

  flyAway(toX: number) {
    this.currentX.set(toX);
  }

  emitLeft() { setTimeout(() => this.swipedLeft.emit(), 300); }
  emitRight() { setTimeout(() => this.swipedRight.emit(), 300); }

  private resetPosition() {
    this.currentX.set(0);
    this.currentY.set(0);
  }
}