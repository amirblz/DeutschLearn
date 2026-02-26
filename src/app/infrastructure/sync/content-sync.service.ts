import { Injectable, inject, signal } from '@angular/core';
import { HttpClient, HttpEventType } from '@angular/common/http';
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

  // 🚀 NEW: Signals to drive the Splash Screen
  readonly isSyncing = signal<boolean>(true); // Starts true so it shows immediately
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
      await this.pushLocalProgress();

      this.syncProgress.set(10);
      this.syncMessage.set('Mapping the route...');
      const levels = await firstValueFrom(this.http.get<ApiLevel[]>(`${this.API_URL}/levels`));
      this.curriculum.set(levels);
      localStorage.setItem(this.STORAGE_KEY_DATA, JSON.stringify(levels));

      this.syncMessage.set('Gathering your luggage...');

      // 🚀 NEW: Download with real-time byte tracking
      const dictData = await this.downloadDictionaryWithProgress();

      if (dictData && Array.isArray(dictData)) {
        const validItems = dictData.filter(item => item && item.id != null);
        if (validItems.length > 0) {
          this.syncMessage.set('Unpacking vocabulary...');
          await this.repo.upsertDictionary(validItems);
        }
      }

      this.syncProgress.set(90);
      this.syncMessage.set('Checking itinerary...');
      const progRes = await firstValueFrom(
        this.http.get<{ data: ProgressItem[] }>(`${this.API_URL}/progress`, { headers: this.headers })
      );

      if (progRes.data) {
        await this.repo.upsertProgress(progRes.data);
      }

      this.syncProgress.set(100);
      this.syncMessage.set('Ready for departure!');

      // Give the user a moment to see 100% before dismissing
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
            // Estimate 3MB if server drops Content-Length header due to compression
            const total = event.total || 3000000;
            const percent = Math.round((100 * event.loaded) / total);
            // Scale this phase to represent 10% -> 85% of the total bar
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