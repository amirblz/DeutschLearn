import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { VocabularyRepository, EncryptedWrapper } from '../../core/repositories/vocabulary.repository';

// Define Interfaces
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

  private readonly API_URL = '/api/vocabulary';
  private readonly STORAGE_KEY_DATA = 'app_curriculum_structure';

  readonly curriculum = signal<ApiLevel[]>([]);

  constructor() {
    this.ensureUserId(); // ✅ 1. Make sure we have an ID
    this.loadCachedStructure();
  }

  // --- IDENTITY MANAGEMENT ---
  private ensureUserId() {
    // If no ID exists (first run), generate a random one.
    // If user logs in later, AuthService will overwrite this.
    if (!localStorage.getItem('app_user_id')) {
      localStorage.setItem('app_user_id', crypto.randomUUID());
    }
  }

  private get headers() {
    // ✅ 2. Always grab the latest ID (Anon or Logged In)
    return {
      'x-user-id': localStorage.getItem('app_user_id') || 'anon-device'
    };
  }

  // --- SYNC LOGIC ---

  private loadCachedStructure() {
    const cached = localStorage.getItem(this.STORAGE_KEY_DATA);
    if (cached) {
      try { this.curriculum.set(JSON.parse(cached)); } catch (e) { console.error(e); }
    }
  }

  async sync() {
    console.log('[ContentSync] 🔄 Starting Sync...');
    try {
      // 1. Push Local Changes (with ID header)
      await this.pushLocalProgress();

      // 2. Download Structure
      const levels = await firstValueFrom(this.http.get<ApiLevel[]>(`${this.API_URL}/levels`));
      this.curriculum.set(levels);
      localStorage.setItem(this.STORAGE_KEY_DATA, JSON.stringify(levels));

      // 3. Download Batch Data (with ID header)
      const response = await firstValueFrom(
        this.http.post<{ data: ApiBatchItem[] }>(
          `${this.API_URL}/sync/batch`,
          { missionIds: [] },
          { headers: this.headers } // ✅ 3. INJECT HEADER HERE
        )
      );

      if (response.data && response.data.length > 0) {
        await this.performFastMigration(response.data);
      } else {
        console.warn('[ContentSync] Server returned 0 items. Skipping local update.');
      }

      console.log('[ContentSync] ✅ Sync complete.');

    } catch (err) {
      console.warn('[ContentSync] ⚠️ Sync failed (Offline or Auth Error)', err);
    }
  }

  private async performFastMigration(serverItems: ApiBatchItem[]) {
    const currentWrappers = await this.repo.getAllWrappers();
    const localMap = new Map(currentWrappers.map(w => [w.id, w]));
    const wrappersToSave: EncryptedWrapper[] = [];

    for (const serverItem of serverItems) {
      const local = localMap.get(serverItem.id);

      // Prefer local scheduling data if available (Client Truth)
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

    // Cleanup Stale Items
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
      // Send queue to backend (with ID header)
      await firstValueFrom(
        this.http.post(
          `${this.API_URL}/progress`,
          updates,
          { headers: this.headers } // ✅ 4. INJECT HEADER HERE TOO
        )
      );
      // Clear queue only on success
      localStorage.removeItem(queueKey);
    } catch (e) {
      console.error('[ContentSync] Push failed', e);
      throw e;
    }
  }
}