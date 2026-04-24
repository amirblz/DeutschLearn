import { Injectable, inject, signal } from '@angular/core';
import { HttpClient, HttpEventType } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { VocabularyRepository, ProgressItem } from '../repositories/vocabulary.repository';
import { StudyStateService } from './study-state.service';

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

  readonly isSyncing = signal<boolean>(true);
  readonly syncProgress = signal<number>(0);
  readonly syncMessage = signal<string>('Checking tickets...');

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
    return { 'x-user-id': localStorage.getItem('app_user_id') || 'anon-device' };
  }

  private loadCachedStructure() {
    const cached = localStorage.getItem(this.STORAGE_KEY_DATA);
    if (cached) {
      try { this.curriculum.set(JSON.parse(cached)); } catch (e) { console.error(e); }
    }
  }

  async sync() {
    console.log('[ContentSync] 🔄 Starting Sync...');
    this.isSyncing.set(true);
    this.syncProgress.set(5);
    this.syncMessage.set('Boarding the train...');

    try {
      // 1. Push any local offline progress to the server
      await this.pushLocalProgress();

      // 2. Fetch the structure (Levels & Missions)
      this.syncProgress.set(10);
      this.syncMessage.set('Mapping the route...');
      const levels = await firstValueFrom(this.http.get<ApiLevel[]>(`${this.API_URL}/levels`));
      this.curriculum.set(levels);
      localStorage.setItem(this.STORAGE_KEY_DATA, JSON.stringify(levels));

      // 3. Stream the massive dictionary file directly into IndexedDB
      this.syncMessage.set('Gathering your luggage...');
      const dictData = await this.downloadDictionaryWithProgress();

      if (dictData && Array.isArray(dictData)) {
        const validItems = dictData.filter(item => item && item.id != null);
        if (validItems.length > 0) {
          this.syncMessage.set('Unpacking vocabulary...');
          await this.repo.upsertDictionary(validItems);
        }
      }

      // 4. Pull the user's specific spaced-repetition progress
      this.syncProgress.set(90);
      this.syncMessage.set('Checking itinerary...');
      const progRes = await firstValueFrom(
        this.http.get<{ data: ProgressItem[] }>(`${this.API_URL}/progress`, { headers: this.headers })
      );

      if (progRes.data) {
        await this.repo.upsertProgress(progRes.data);
      }

      // 🚀 5. Fetch cloud metadata (Streak & Active Mission Resume State)
      const studyState = inject(StudyStateService);
      await studyState.fetchCloudMeta();

      this.syncProgress.set(100);
      this.syncMessage.set('Ready for departure!');

      setTimeout(() => this.isSyncing.set(false), 600);

    } catch (err) {
      console.warn('[ContentSync] ⚠️ Sync failed (Offline or Server Error)', err);
      this.syncMessage.set('Offline mode engaged. Journey continues.');
      setTimeout(() => this.isSyncing.set(false), 1500);
    }
  }

  private downloadDictionaryWithProgress(): Promise<any[]> {
    return new Promise((resolve, reject) => {
      this.http.get<any[]>(`${this.API_URL}/dictionary/export`, {
        reportProgress: true,
        observe: 'events',
        responseType: 'json'
      }).subscribe({
        next: (event) => {
          if (event.type === HttpEventType.DownloadProgress) {
            const total = event.total || 3000000;
            const percent = Math.round((100 * event.loaded) / total);
            this.syncProgress.set(10 + (Math.min(percent, 100) * 0.75));
          } else if (event.type === HttpEventType.Response) {
            resolve(event.body || []);
          }
        },
        error: (err) => reject(err)
      });
    });
  }

  private async pushLocalProgress() {
    const updates = await this.repo.getLocalProgressToSync();
    if (updates.length === 0) return;
    try {
      await firstValueFrom(this.http.post(`${this.API_URL}/progress`, updates, { headers: this.headers }));
      await this.repo.clearSyncQueue();
    } catch (e) { throw e; }
  }
}