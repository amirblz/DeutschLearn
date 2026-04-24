import { Injectable, inject, signal, computed } from '@angular/core';
import { VocabularyRepository } from '../../../core/repositories/vocabulary.repository';
import { VocabularyItem, Rating } from '../../../core/models/vocabulary.model';
import { SpacedRepetitionService } from '../../../core/services/spaced-repetition.service';
import { StudyStateService } from '../../../core/services/study-state.service';

export type LearningMode = 'DE_TO_EN' | 'EN_TO_DE';

@Injectable({ providedIn: 'root' })
export class LearningSessionService {
    private repo = inject(VocabularyRepository);
    private algo = inject(SpacedRepetitionService);
    private studyState = inject(StudyStateService);

    private _mode = signal<LearningMode>('DE_TO_EN');
    private _sessionItems = signal<VocabularyItem[]>([]);
    private _currentIndex = signal<number>(0);
    private _isFlipped = signal<boolean>(false);
    private _isLoading = signal<boolean>(true);

    private _cardShownAt = 0;
    private _cardFlippedAt = 0;

    readonly currentCard = computed(() => this._sessionItems()[this._currentIndex()] || null);
    readonly mode = this._mode.asReadonly();
    readonly isFlipped = this._isFlipped.asReadonly();
    readonly isLoading = this._isLoading.asReadonly();

    readonly isSessionComplete = computed(() => {
        if (this._isLoading()) return false;
        return this._currentIndex() >= this._sessionItems().length;
    });

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
        this.initializeSession();
    }

    async initializeSession() {
        this._isLoading.set(true);

        await new Promise(r => setTimeout(r, 100));

        const now = Date.now();
        const allItems = await this.repo.getAll();

        // 1. PRIORITY ONE: Global Overdue Reviews
        const dueReviews = allItems
            .filter(item => item.lastReviewedDate && item.nextReviewDate <= now)
            .sort((a, b) => a.nextReviewDate - b.nextReviewDate);

        if (dueReviews.length > 0) {
            this._sessionItems.set(dueReviews.slice(0, 50));
            this._currentIndex.set(0);
            this._isFlipped.set(false);
            this._isLoading.set(false);
            this.resetTimers();
            return;
        }

        // 2. PRIORITY TWO: Resume Active Mission
        const activeMissionId = this.studyState.activeMission();
        if (activeMissionId) {
            const missionItems = allItems.filter(i => i.missionId === activeMissionId);

            const pendingMissionItems = missionItems
                .filter(item => !item.lastReviewedDate || item.nextReviewDate <= now)
                .sort((a, b) => a.nextReviewDate - b.nextReviewDate);

            if (pendingMissionItems.length > 0) {
                this._sessionItems.set(pendingMissionItems);
                this._currentIndex.set(0);
                this._isFlipped.set(false);
                this._isLoading.set(false);
                this.resetTimers();
                return;
            } else {
                this.studyState.setActiveMission(null);
            }
        }

        this._sessionItems.set([]);
        this._isLoading.set(false);
    }

    async startSession(missionId: string, mode: LearningMode) {
        this._mode.set(mode);
        this._isLoading.set(true);

        this.studyState.setActiveMission(missionId);

        const allMissionItems = await this.repo.getByMissionId(missionId);
        const now = Date.now();

        const sessionItems = allMissionItems
            .filter(item => !item.lastReviewedDate || item.nextReviewDate <= now)
            .sort((a, b) => a.nextReviewDate - b.nextReviewDate);

        this._sessionItems.set(sessionItems);
        this._currentIndex.set(0);
        this._isFlipped.set(false);
        this._isLoading.set(false);

        this.resetTimers();
    }

    toggleFlip() {
        if (!this._isFlipped()) {
            this._cardFlippedAt = Date.now();
            const card = this.currentCard();
            if (card) this.playGenderHaptics(card);
        }
        this._isFlipped.update(v => !v);
    }

    async submitAnswer(correct: boolean) {
        const card = this.currentCard();
        if (!card) return;

        const recallMoment = this._cardFlippedAt > 0 ? this._cardFlippedAt : Date.now();
        const thinkingDuration = recallMoment - this._cardShownAt;

        this.playFeedbackHaptics(correct);

        const rating = correct ? Rating.Good : Rating.Again;
        const updates = this.algo.processReview(card, rating, thinkingDuration);

        await this.repo.updateProgress(card.id, updates);

        this._isFlipped.set(false);
        this._currentIndex.update(i => i + 1);

        this.resetTimers();
    }

    private resetTimers() {
        this._cardShownAt = Date.now();
        this._cardFlippedAt = 0;
    }

    private playGenderHaptics(card: VocabularyItem) {
        if (!navigator.vibrate || card.type !== 'noun' || card.gender === 'none') return;
        try {
            switch (card.gender) {
                case 'der': navigator.vibrate(70); break;
                case 'die': navigator.vibrate([30, 50, 30]); break;
                case 'das': navigator.vibrate(150); break;
            }
        } catch (e) { }
    }

    private playFeedbackHaptics(correct: boolean) {
        if (!navigator.vibrate) return;
        try {
            if (correct) navigator.vibrate(50);
            else navigator.vibrate([30, 50, 30]);
        } catch (e) { }
    }
}