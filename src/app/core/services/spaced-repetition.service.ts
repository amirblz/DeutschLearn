import { Injectable } from '@angular/core';
import { CardState, Rating, VocabularyItem } from '../models/vocabulary.model';

@Injectable({
  providedIn: 'root'
})
export class SpacedRepetitionService {

  // ✅ GERMAN TUNING (Cognitive Load Adjustments)
  private readonly THRESHOLD_EASY_MS = 3000;   // < 3.0s = Easy (Bonus)
  private readonly THRESHOLD_HARD_MS = 12000;  // > 12.0s = Hard (Penalty)

  // ✅ LEECH PROTOCOL (Efficiency Guard)
  private readonly LEECH_FAILURE_THRESHOLD = 4; // 4 failures = Potential Leech
  private readonly LEECH_STABILITY_FLOOR = 0.5; // If stability stays < 0.5 days despite reviews

  // FSRS-5 Weights
  private readonly P = {
    w: [0.4, 0.6, 2.4, 5.8, 4.93, 0.94, 0.86, 0.01, 1.49, 0.14, 0.94, 2.18, 0.05, 0.34, 1.26, 0.29, 2.61],
    requestRetention: 0.9
  };

  /**
   * Calculates new state based on Rating + Thinking Time + Leech Status.
   */
  processReview(
    item: VocabularyItem,
    baseRating: Rating,
    thinkingDurationMs: number, // Time from "Show" to "Flip"
    now: number = Date.now()
  ): Partial<VocabularyItem> {

    // 1. Implicit Grading (Timing Analysis)
    let finalRating = baseRating;

    if (baseRating === Rating.Good) {
      if (thinkingDurationMs < this.THRESHOLD_EASY_MS) {
        finalRating = Rating.Easy;
      } else if (thinkingDurationMs > this.THRESHOLD_HARD_MS) {
        finalRating = Rating.Hard;
      }
    }

    // 2. Determine State
    let newState = item.state;
    if (item.state === CardState.New) {
      newState = finalRating === Rating.Again ? CardState.Learning : CardState.Review;
    } else if (item.state === CardState.Review && finalRating === Rating.Again) {
      newState = CardState.Relearning;
    } else if (item.state === CardState.Relearning && finalRating >= Rating.Good) {
      newState = CardState.Review;
    }

    // 3. Difficulty (Adaptive)
    let newDifficulty = item.difficulty || 5;
    if (item.state !== CardState.New) {
      newDifficulty = Math.min(10, Math.max(1, newDifficulty - 0.8 * (finalRating - 3)));
    }

    // 4. Stability (Memory Strength)
    let newStability = item.stability || 0;
    if (finalRating === Rating.Again) {
      newStability = this.nextForgotStability(item.difficulty, item.stability, item.retrievability);
    } else {
      newStability = this.nextRecallStability(item.difficulty, item.stability, item.retrievability, finalRating);
    }

    // 5. Interval Calculation
    let intervalDays = Math.max(1, Math.round(newStability));
    if (finalRating === Rating.Again) intervalDays = 0;

    // 6. Leech Detection
    let isLeech = item.isLeech || false;

    // Rule: If you failed (Again) AND you have failed many times before...
    if (finalRating === Rating.Again && (item.lapses || 0) + 1 >= this.LEECH_FAILURE_THRESHOLD) {
      // ...AND the card refuses to become stable...
      if (newStability < this.LEECH_STABILITY_FLOOR) {
        isLeech = true; // 🚨 SUSPEND CARD: It is wasting the user's time.
      }
    }

    return {
      state: newState,
      difficulty: parseFloat(newDifficulty.toFixed(2)),
      stability: parseFloat(newStability.toFixed(2)),
      retrievability: 1,
      reps: (item.reps || 0) + 1,
      lapses: finalRating === Rating.Again ? (item.lapses || 0) + 1 : (item.lapses || 0),
      lastReviewedDate: now,
      nextReviewDate: this.addDays(now, intervalDays),
      isLeech: isLeech
    };
  }

  // --- Math Helpers ---

  private nextRecallStability(d: number, s: number, r: number, g: Rating): number {
    if (s === 0) return this.P.w[g - 1];
    const hardPenalty = g === Rating.Hard ? this.P.w[15] : 1;
    const easyBonus = g === Rating.Easy ? this.P.w[16] : 1;
    const growth = 1 + (Math.exp(this.P.w[8]) * (11 - d) * Math.pow(s, -this.P.w[9]) * (Math.exp((1 - r) * this.P.w[10]) - 1) * hardPenalty * easyBonus);
    return s * growth;
  }

  private nextForgotStability(d: number, s: number, r: number): number {
    return Math.min(this.P.w[11] * Math.pow(d, -this.P.w[12]) * (Math.pow(s + 1, this.P.w[13]) - 1) * Math.exp((1 - r) * this.P.w[14]), s);
  }

  private addDays(timestamp: number, days: number): number {
    const date = new Date(timestamp);
    if (days === 0) return date.getTime() + (10 * 60 * 1000); // 10 mins
    date.setDate(date.getDate() + days);
    date.setHours(4, 0, 0, 0);
    return date.getTime();
  }
}