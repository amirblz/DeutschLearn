import { Injectable, inject, signal, computed, effect } from '@angular/core';
import { VocabularyRepository } from '../../../core/repositories/vocabulary.repository';
import { VocabularyItem, LeitnerBox } from '../../../core/models/vocabulary.model';
import { LeitnerService } from '../../../core/services/leitner.service';

export type LearningMode = 'DE_TO_EN' | 'EN_TO_DE';

@Injectable({
    providedIn: 'root' // Scoped to root for simplicity, could be component-scoped
})
export class LearningSessionService {
    private repo = inject(VocabularyRepository);
    private leitner = inject(LeitnerService);

    // --- State Signals ---
    private _mode = signal<LearningMode>('DE_TO_EN'); // Default
    private _sessionItems = signal<VocabularyItem[]>([]);
    private _currentIndex = signal<number>(0);
    private _isFlipped = signal<boolean>(false);
    private _isLoading = signal<boolean>(true);
    private _activeMissionId = signal<string | null>(null);

    // --- Computed State ---
    readonly currentCard = computed(() => this._sessionItems()[this._currentIndex()] || null);

    readonly mode = this._mode.asReadonly();

    readonly progress = computed(() => {
        return {
            current: this._currentIndex() + 1,
            total: this._sessionItems().length,
            percentage: (this._currentIndex() / this._sessionItems().length) * 100
        };
    });

    readonly isFlipped = this._isFlipped.asReadonly();
    readonly isLoading = this._isLoading.asReadonly();
    readonly isSessionComplete = computed(() =>
        this._currentIndex() >= this._sessionItems().length
    );

    readonly nextCard = computed(() => {
        const nextIndex = this._currentIndex() + 1;
        const items = this._sessionItems();
        return nextIndex < items.length ? items[nextIndex] : null;
    });

    constructor() {
        this.loadDueCards();
    }

    async startSession(missionId: string, mode: LearningMode) {
        this._activeMissionId.set(missionId);
        this._mode.set(mode);
        this._isLoading.set(true);

        // Fetch items specifically for this mission AND filter by due date
        const allMissionItems = await this.repo.getByMissionId(missionId);
        const now = Date.now();

        // Filter: Only Due items
        const dueItems = allMissionItems.filter(item => item.nextReviewDate <= now);

        this._sessionItems.set(dueItems);
        this._currentIndex.set(0);
        this._isFlipped.set(false);
        this._isLoading.set(false);
    }

    setMode(newMode: LearningMode) {
        this._mode.set(newMode);
    }

    async loadDueCards() {
        this._isLoading.set(true);
        // Fetch items due before or at "now"
        const items = await this.repo.getDueItems(Date.now());
        this._sessionItems.set(items);
        this._isLoading.set(false);
    }

    toggleFlip() {
        this._isFlipped.update(v => !v);
    }

    async submitAnswer(correct: boolean) {
        const card = this.currentCard();
        if (!card) return;

        // 1. DELEGATE MATH TO LEITNER SERVICE
        const result = this.leitner.calculateProgress(card.box, correct);

        // 2. OPTIMISTIC UPDATE (Fire & Forget to DB)
        // We assume it succeeds. If DB fails, it's a rare edge case in a PWA.
        this.repo.updateProgress(card.id, result.box, result.nextReview);

        // 3. Mark as "Dirty" for Sync 
        // (We will handle this in Step 4 - marking items that need to be pushed to backend)
        this.markForSync(card.id, result.box, result.nextReview);

        // 4. Update UI State
        this._isFlipped.set(false);

        // Remove the card from the current session view if you want strictly "Due" cards
        // OR just move to next index (your current approach)
        this._currentIndex.update(i => i + 1);
    }

    private markForSync(id: string, box: number, due: number) {
        // Store this in a separate "sync_queue" in LocalStorage
        const queue = JSON.parse(localStorage.getItem('sync_queue') || '[]');
        queue.push({ id, box, nextReviewDate: due, timestamp: Date.now() });
        localStorage.setItem('sync_queue', JSON.stringify(queue));
    }
}