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

    // Computeds
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

        this.resetTimers();
    }

    async loadDueCards() {
        this._isLoading.set(true);
        const items = (await this.repo.getDueItems(Date.now()))
            .sort((a, b) => a.nextReviewDate - b.nextReviewDate);

        this._sessionItems.set(items.slice(0, 50));
        this._isLoading.set(false);

        this.resetTimers();
    }

    toggleFlip() {
        if (!this._isFlipped()) {
            // Capture flip time (Thinking ends here)
            this._cardFlippedAt = Date.now();

            // ✅ TRIGGER HAPTIC GENDER CUE (Sensory Binding)
            const card = this.currentCard();
            if (card) this.playGenderHaptics(card);
        }
        this._isFlipped.update(v => !v);
    }

    async submitAnswer(correct: boolean) {
        const card = this.currentCard();
        if (!card) return;

        // 1. Calculate Thinking Time
        // Thinking = (Flip Time) - (Show Time)
        const recallMoment = this._cardFlippedAt > 0 ? this._cardFlippedAt : Date.now();
        const thinkingDuration = recallMoment - this._cardShownAt;

        // 2. Feedback Haptics
        this.playFeedbackHaptics(correct);

        // 3. Run FSRS Algorithm
        const rating = correct ? Rating.Good : Rating.Again;
        const updates = this.algo.processReview(card, rating, thinkingDuration);

        // 4. Persist
        const updatedCard = { ...card, ...updates };
        await this.repo.updateProgress(updatedCard.id, updatedCard);
        this.markForSync(updatedCard);

        // 5. Next Card
        this._isFlipped.set(false);
        this._currentIndex.update(i => i + 1);

        this.resetTimers();
    }

    private resetTimers() {
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
            isLeech: item.isLeech, // Include new flag in sync
            timestamp: Date.now()
        });
        localStorage.setItem('sync_queue', JSON.stringify(queue));
    }

    // --- HAPTIC ENGINE ---

    private playGenderHaptics(card: VocabularyItem) {
        if (!navigator.vibrate) return;

        // Only play for Nouns that have a gender
        if (card.type !== 'noun' || card.gender === 'none') return;

        try {
            switch (card.gender) {
                case 'der':
                    // Masculine: One Heavy Thud
                    navigator.vibrate(70);
                    break;
                case 'die':
                    // Feminine: Two Light Ticks
                    navigator.vibrate([30, 50, 30]);
                    break;
                case 'das':
                    // Neuter: One Long Smooth Hum
                    navigator.vibrate(150);
                    break;
            }
        } catch (e) {
            // Ignore haptic errors on unsupported devices
        }
    }

    private playFeedbackHaptics(correct: boolean) {
        if (!navigator.vibrate) return;
        try {
            if (correct) {
                navigator.vibrate(50); // Crisp "Click"
            } else {
                navigator.vibrate([30, 50, 30]); // "Buzz-Buzz" (Error)
            }
        } catch (e) { }
    }
}