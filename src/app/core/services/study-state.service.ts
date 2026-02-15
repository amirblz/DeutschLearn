import { Injectable, inject, signal } from '@angular/core';
import { VocabularyRepository } from '../repositories/vocabulary.repository';

@Injectable({
  providedIn: 'root'
})
export class StudyStateService {
  private repo = inject(VocabularyRepository);

  dueCount = signal<number>(0);

  constructor() {
    this.refreshCount();
  }

  async refreshCount() {
    const now = Date.now();
    const allItems = await this.repo.getAll();

    // FIX: Only count items that are "Due" AND have been reviewed before.
    // New items (no lastReviewedDate) should be ignored by the notification badge.
    const due = allItems.filter(item =>
      item.nextReviewDate <= now && item.lastReviewedDate
    );

    this.dueCount.set(due.length);
  }
}