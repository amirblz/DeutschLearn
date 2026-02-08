import { Injectable, inject, signal, computed, effect } from '@angular/core';
import { VocabularyRepository } from '../../../core/repositories/vocabulary.repository';
import { VocabularyItem, LeitnerBox } from '../../../core/models/vocabulary.model';

export type LearningMode = 'DE_TO_EN' | 'EN_TO_DE';

@Injectable({
    providedIn: 'root' // Scoped to root for simplicity, could be component-scoped
})
export class LearningSessionService {
    private repo = inject(VocabularyRepository);

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

        // 1. Calculate new state (Leitner Logic)
        let newBox = card.box;
        let daysToAdd = 0;

        if (correct) {
            newBox = Math.min(card.box + 1, LeitnerBox.Box5);
            // Simple spacing algorithm: 1d, 3d, 7d, 14d, 30d
            const spacing = [0, 1, 3, 7, 14, 30];
            daysToAdd = spacing[newBox];
        } else {
            newBox = LeitnerBox.Box1; // Reset on error
            daysToAdd = 0; // Review immediately (or tomorrow)
        }

        const nextReview = Date.now() + (daysToAdd * 24 * 60 * 60 * 1000);

        // 2. Persist to DB (Fire and forget from UI perspective)
        this.repo.updateProgress(card.id, newBox, nextReview);

        // 3. Update UI State
        this._isFlipped.set(false);
        this._currentIndex.update(i => i + 1);

        // 4. Audio Feedback (Simple Haptic/Audio trigger here)
        if (correct) {
            // play success sound
        }
    }
}