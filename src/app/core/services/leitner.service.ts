import { Injectable } from '@angular/core';
import { LeitnerBox } from '../models/vocabulary.model';

@Injectable({
    providedIn: 'root'
})
export class LeitnerService {

    // Configuration: Days to wait for each box
    // Box 1: 1 day
    // Box 2: 3 days
    // Box 3: 7 days
    // Box 4: 14 days
    // Box 5: 30 days (Mastered)
    private readonly INTERVALS: Record<LeitnerBox, number> = {
        [LeitnerBox.Box1]: 1,
        [LeitnerBox.Box2]: 3,
        [LeitnerBox.Box3]: 7,
        [LeitnerBox.Box4]: 14,
        [LeitnerBox.Box5]: 30
    };

    /**
     * Calculates the new state for a card based on the answer.
     */
    calculateProgress(currentBox: LeitnerBox, isCorrect: boolean): { box: LeitnerBox; nextReview: number } {
        let newBox: LeitnerBox;

        if (isCorrect) {
            // PROMOTION: Move to next box (cap at Box 5)
            // Note: We cast to number to do math, then back to Enum
            const next = Math.min((currentBox as number) + 1, LeitnerBox.Box5);
            newBox = next as LeitnerBox;
        } else {
            // DEMOTION: Reset to Box 1 (Strict Leitner)
            // Alternative: You could implement "Soft Punishment" (go back 1 box) here if desired.
            newBox = LeitnerBox.Box1;
        }

        const daysToAdd = this.INTERVALS[newBox];
        const nextReview = this.addDaysToNow(daysToAdd);

        return { box: newBox, nextReview };
    }

    private addDaysToNow(days: number): number {
        const date = new Date();
        // Reset time to midnight to avoid "due in 23.9 hours" issues
        // (Optional: depending on if you want precise timing or day-based)
        date.setHours(0, 0, 0, 0);
        date.setDate(date.getDate() + days);
        return date.getTime();
    }
}