import { Injectable, inject, signal, computed } from '@angular/core';
import { VocabularyRepository } from '../../../core/repositories/vocabulary.repository';
import { VocabularyItem, Rating, CardState } from '../../../core/models/vocabulary.model';
import { SpacedRepetitionService } from '../../../core/services/spaced-repetition.service';

export type LearningMode = 'DE_TO_EN' | 'EN_TO_DE';

@Injectable({
    providedIn: 'root'
})
export class LearningSessionService {
    private repo = inject(VocabularyRepository);
    private algo = inject(SpacedRepetitionService);

    private _mode = signal<LearningMode>('DE_TO_EN');
    private _sessionItems = signal<VocabularyItem[]>([]);
    private _currentIndex = signal<number>(0);
    private _isFlipped = signal<boolean>(false);
    private _isLoading = signal<boolean>(true);

    // ✅ TIMING STATE
    private _cardShownAt = 0;
    private _cardFlippedAt = 0;

    // ... (Keep existing computeds: currentCard, mode, etc.) ...
    readonly currentCard = computed(() => this._sessionItems()[this._currentIndex()] || null);
    readonly mode = this._mode.asReadonly();
    readonly isFlipped = this._isFlipped.asReadonly();
    readonly isSessionComplete = computed(() => this._currentIndex() >= this._sessionItems().length);
    readonly nextCard = computed(() => {
        const nextIndex = this._currentIndex() + 1;
        const items = this._sessionItems();
        return nextIndex < items.length ? items[nextIndex] : null;
    });
    readonly progress = computed(() => ({
        current: this._currentIndex() + 1,
        total: this._sessionItems().length,
        percentage: this._sessionItems().length > 0 ? (this._currentIndex() / this._sessionItems().length) * 100 : 0
    }));

    constructor() {
        this.loadDueCards();
    }

    async startSession(missionId: string, mode: LearningMode) {
        this._mode.set(mode);
        this._isLoading.set(true);

        const allMissionItems = await this.repo.getByMissionId(missionId);
        const now = Date.now();
        const dueItems = allMissionItems
            .filter(item => item.nextReviewDate <= now)
            .sort((a, b) => a.nextReviewDate - b.nextReviewDate);

        this._sessionItems.set(dueItems);
        this._currentIndex.set(0);
        this._isFlipped.set(false);
        this._isLoading.set(false);

        this._cardShownAt = Date.now();
        this._cardFlippedAt = 0;
    }

    async loadDueCards() {
        this._isLoading.set(true);
        const items = (await this.repo.getDueItems(Date.now()))
            .sort((a, b) => a.nextReviewDate - b.nextReviewDate);

        this._sessionItems.set(items.slice(0, 50));
        this._isLoading.set(false);

        this._cardShownAt = Date.now();
        this._cardFlippedAt = 0;
    }

    toggleFlip() {
        if (!this._isFlipped()) {
            // ✅ Capture the EXACT moment of recall
            this._cardFlippedAt = Date.now();
        }
        this._isFlipped.update(v => !v);
    }

    async submitAnswer(correct: boolean) {
        const card = this.currentCard();
        if (!card) return;

        // 1. CALCULATE RECALL TIME
        // If they flipped, we use (Flip - Show).
        // If they swiped WITHOUT flipping (Blind Swipe), we use (Now - Show).
        const recallMoment = this._cardFlippedAt > 0 ? this._cardFlippedAt : Date.now();
        const thinkingDuration = recallMoment - this._cardShownAt;

        // 2. MAP GESTURE
        const rating = correct ? Rating.Good : Rating.Again;

        // 3. RUN ALGORITHM
        const updates = this.algo.processReview(card, rating, thinkingDuration);

        // 4. PERSIST
        const updatedCard = { ...card, ...updates };
        await this.repo.updateProgress(updatedCard.id, updatedCard);
        this.markForSync(updatedCard);

        // 5. NEXT CARD
        this._isFlipped.set(false);
        this._currentIndex.update(i => i + 1);

        // ✅ RESET TIMERS
        this._cardShownAt = Date.now();
        this._cardFlippedAt = 0;
    }

    private markForSync(item: VocabularyItem) {
        const queue = JSON.parse(localStorage.getItem('sync_queue') || '[]');
        queue.push({
            id: item.id,
            state: item.state,
            difficulty: item.difficulty,
            stability: item.stability,
            reps: item.reps,
            lapses: item.lapses,
            nextReviewDate: item.nextReviewDate,
            timestamp: Date.now()
        });
        localStorage.setItem('sync_queue', JSON.stringify(queue));
    }
}