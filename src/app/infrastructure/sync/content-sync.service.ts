import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { VocabularyRepository, EncryptedWrapper } from '../../core/repositories/vocabulary.repository';
import { LeitnerBox } from '../../core/models/vocabulary.model';

// Interface for what the Backend Batch Endpoint returns
export interface ApiBatchItem {
  id: string;
  missionId: string;
  payload: string; // Encrypted Blob
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
    console.time('SyncDuration');
    console.log('[ContentSync] 🔄 Starting High-Performance Sync...');

    try {
      await this.pushLocalProgress();

      // 1. Fetch Hierarchy
      const levels = await firstValueFrom(this.http.get<ApiLevel[]>(`${this.API_URL}/levels`));
      this.curriculum.set(levels);
      localStorage.setItem(this.STORAGE_KEY_DATA, JSON.stringify(levels));

      // 2. ⚡️ BATCH FETCH: Get ALL items in ONE compressed request
      console.log('[ContentSync] ⬇️ Downloading Batch Data...');
      const response = await firstValueFrom(
        this.http.post<{ data: ApiBatchItem[] }>(`${this.API_URL}/sync/batch`, { missionIds: [] })
      );

      const serverItems = response.data;
      console.log(`[ContentSync] Received ${serverItems.length} items. Saving to Safe...`);

      // 3. ⚡️ PASS-THROUGH SAVE (Zero Decryption)
      await this.performFastMigration(serverItems);

      console.log('[ContentSync] ✅ Sync complete.');
      console.timeEnd('SyncDuration');

    } catch (err) {
      console.warn('[ContentSync] ⚠️ Sync failed', err);
    }
  }

  private async performFastMigration(serverItems: ApiBatchItem[]) {
    // 1. Get current local state (Wrappers only, no decryption)
    // This allows us to preserve user progress without reading the words
    const currentWrappers = await this.repo.getAllWrappers();
    const localMap = new Map(currentWrappers.map(w => [w.id, w]));

    const wrappersToSave: EncryptedWrapper[] = [];

    // 2. Merge Server Blob + Local Progress
    for (const serverItem of serverItems) {
      const local = localMap.get(serverItem.id);

      // If we have local progress, keep it. Otherwise default.
      const box = local ? local.box : LeitnerBox.Box1;
      const nextReviewDate = local ? local.nextReviewDate : Date.now();
      const lastReviewedDate = local ? local.lastReviewedDate : undefined;

      wrappersToSave.push({
        id: serverItem.id,
        missionId: serverItem.missionId,
        box,
        nextReviewDate,
        lastReviewedDate,
        payload: serverItem.payload // <--- The secure payload from server
      });
    }

    // 3. Batch Save
    await this.repo.upsertRawWrappers(wrappersToSave);

    // 4. Cleanup Stale Items (Items that exist locally but not on server)
    const serverIdSet = new Set(serverItems.map(i => i.id));
    const staleIds = currentWrappers
      .filter(local => !serverIdSet.has(local.id))
      .map(local => local.id);

    if (staleIds.length > 0) {
      await this.repo.deleteBulk(staleIds);
    }
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