import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { VocabularyRepository, EncryptedWrapper } from '../../core/repositories/vocabulary.repository';
import { CardState } from '../../core/models/vocabulary.model'; // ✅ Use CardState

export interface ApiBatchItem {
  id: string;
  missionId: string;
  payload: string;
}

export interface ApiLevel {
  id: string;
  title: string;
  color: string;
  missions: any[];
}

@Injectable({
  providedIn: 'root'
})
export class ContentSyncService {
  private http = inject(HttpClient);
  private repo = inject(VocabularyRepository);

  private readonly API_URL = 'http://localhost:3000/vocabulary';
  private readonly STORAGE_KEY_DATA = 'app_curriculum_structure';

  readonly curriculum = signal<ApiLevel[]>([]);

  constructor() {
    this.loadCachedStructure();
  }

  private loadCachedStructure() {
    const cached = localStorage.getItem(this.STORAGE_KEY_DATA);
    if (cached) {
      try { this.curriculum.set(JSON.parse(cached)); } catch (e) { console.error(e); }
    }
  }

  async sync() {
    console.log('[ContentSync] 🔄 Starting FSRS Sync...');
    try {
      await this.pushLocalProgress();

      const levels = await firstValueFrom(this.http.get<ApiLevel[]>(`${this.API_URL}/levels`));
      this.curriculum.set(levels);
      localStorage.setItem(this.STORAGE_KEY_DATA, JSON.stringify(levels));

      const response = await firstValueFrom(
        this.http.post<{ data: ApiBatchItem[] }>(`${this.API_URL}/sync/batch`, { missionIds: [] })
      );

      await this.performFastMigration(response.data);
      console.log('[ContentSync] ✅ Sync complete.');

    } catch (err) {
      console.warn('[ContentSync] ⚠️ Sync failed', err);
    }
  }

  private async performFastMigration(serverItems: ApiBatchItem[]) {
    // 1. Get current local wrappers (Raw)
    const currentWrappers = await this.repo.getAllWrappers();
    const localMap = new Map(currentWrappers.map(w => [w.id, w]));

    const wrappersToSave: EncryptedWrapper[] = [];

    for (const serverItem of serverItems) {
      const local = localMap.get(serverItem.id);

      // ✅ PERSIST LOCAL SCHEDULING DATA
      // If we have local data, we prefer its schedule over the server's default
      const nextReviewDate = local ? local.nextReviewDate : Date.now();
      const lastReviewedDate = local ? local.lastReviewedDate : undefined;

      wrappersToSave.push({
        id: serverItem.id,
        missionId: serverItem.missionId,
        nextReviewDate,
        lastReviewedDate,
        payload: serverItem.payload
      });
    }

    await this.repo.upsertRawWrappers(wrappersToSave);
  }

  private async pushLocalProgress() {
    const queueKey = 'sync_queue';
    const rawQueue = localStorage.getItem(queueKey);
    if (!rawQueue) return;
    const updates = JSON.parse(rawQueue);
    if (updates.length === 0) return;

    try {
      await firstValueFrom(this.http.post(`${this.API_URL}/progress`, updates));
      localStorage.removeItem(queueKey);
    } catch (e) {
      console.error('[ContentSync] Push failed', e);
    }
  }
}