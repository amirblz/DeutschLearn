import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { VocabularyRepository, DictionaryItem, ProgressItem } from '../../core/repositories/vocabulary.repository';

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
    this.ensureUserId();
    this.loadCachedStructure();
  }

  private ensureUserId() {
    if (!localStorage.getItem('app_user_id')) {
      localStorage.setItem('app_user_id', crypto.randomUUID());
    }
  }

  private get headers() {
    return {
      'x-user-id': localStorage.getItem('app_user_id') || 'anon-device'
    };
  }

  private loadCachedStructure() {
    const cached = localStorage.getItem(this.STORAGE_KEY_DATA);
    if (cached) {
      try { this.curriculum.set(JSON.parse(cached)); } catch (e) { console.error(e); }
    }
  }

  async sync() {
    console.log('[ContentSync] 🔄 Starting Sync...');
    try {
      // 1. Push Local Progress
      await this.pushLocalProgress();

      // 2. Download Structure
      const levels = await firstValueFrom(this.http.get<ApiLevel[]>(`${this.API_URL}/levels`));
      this.curriculum.set(levels);
      localStorage.setItem(this.STORAGE_KEY_DATA, JSON.stringify(levels));

      // 3. 🚀 NEW: Download the entire static dictionary export in one shot
      const dictData = await firstValueFrom(
        this.http.get<DictionaryItem[]>(`${this.API_URL}/dictionary/export`)
      );

      if (dictData && dictData.length > 0) {
        await this.repo.upsertDictionary(dictData);
      }

      // 4. Download User Progress
      const progRes = await firstValueFrom(
        this.http.get<{ data: ProgressItem[] }>(`${this.API_URL}/progress`, { headers: this.headers })
      );

      if (progRes.data) {
        await this.repo.upsertProgress(progRes.data);
      }

      console.log('[ContentSync] ✅ Sync complete.');

    } catch (err) {
      console.warn('[ContentSync] ⚠️ Sync failed (Offline or Server Error)', err);
    }
  }

  private async pushLocalProgress() {
    const updates = await this.repo.getLocalProgressToSync();
    if (updates.length === 0) return;

    try {
      await firstValueFrom(
        this.http.post(`${this.API_URL}/progress`, updates, { headers: this.headers })
      );
      await this.repo.clearSyncQueue();
    } catch (e) {
      console.error('[ContentSync] Push failed', e);
      throw e;
    }
  }
}