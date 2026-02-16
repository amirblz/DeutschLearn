import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { VocabularyRepository } from '../../core/repositories/vocabulary.repository';
import { VocabularyItem, LeitnerBox, WordType, Gender } from '../../core/models/vocabulary.model';

export interface ApiItem {
  id: string;
  missionId: string;
  type: string;
  german: string;
  english: string;
  gender: string;
  example: string;
}

export interface ApiMission {
  id: string;
  title: string;
  icon: string;
  levelId: string;
  version: number;
  lastUpdated: string;
}

export interface ApiLevel {
  id: string;
  title: string;
  color: string;
  missions: ApiMission[];
}

@Injectable({
  providedIn: 'root'
})
export class ContentSyncService {
  private http = inject(HttpClient);
  private repo = inject(VocabularyRepository);

  // 🔗 Point to NestJS Backend
  private readonly API_URL = 'http://localhost:3000/vocabulary';

  private readonly STORAGE_KEY_DATA = 'app_curriculum_structure';

  // The Source of Truth for the UI (Dashboard)
  readonly curriculum = signal<ApiLevel[]>([]);

  constructor() {
    this.loadCachedStructure();
  }

  private loadCachedStructure() {
    const cached = localStorage.getItem(this.STORAGE_KEY_DATA);
    if (cached) {
      try {
        this.curriculum.set(JSON.parse(cached));
      } catch (e) {
        console.error('[ContentSync] Failed to parse cached curriculum', e);
      }
    }
  }

  /**
   * Main Sync Orchestrator
   * 1. Fetches Hierarchy (Levels/Missions)
   * 2. Fetches All Words from API
   * 3. Merges with local DB (preserving progress)
   */
  async sync() {
    console.log('[ContentSync] 🔄 Starting synchronization...');

    try {
      await this.pushLocalProgress();

      // 1. Fetch Hierarchy
      const levels = await firstValueFrom(this.http.get<ApiLevel[]>(`${this.API_URL}/levels`));

      // Update UI immediately
      this.curriculum.set(levels);
      localStorage.setItem(this.STORAGE_KEY_DATA, JSON.stringify(levels));

      // 2. Fetch All Items (Parallel requests for speed)
      // We gather all mission IDs first
      const allMissions = levels.flatMap(lvl => lvl.missions);
      console.log(`[ContentSync] Found ${allMissions.length} missions. Fetching items...`);

      // Execute all HTTP requests in parallel
      const allItemsLists = await Promise.all(
        allMissions.map(mission => this.fetchMissionItems(mission.id))
      );

      // Flatten into one giant array of API Items
      const flatApiItems = allItemsLists.flat();

      // 3. Perform Migration / Update Local DB
      await this.performMigration(flatApiItems);

      console.log('[ContentSync] ✅ Sync complete.');

    } catch (err) {
      console.warn('[ContentSync] ⚠️ Offline or API unavailable. Using cached data.', err);
    }
  }

  private async pushLocalProgress() {
    const queueKey = 'sync_queue';
    const rawQueue = localStorage.getItem(queueKey);
    if (!rawQueue) return;

    const updates = JSON.parse(rawQueue);
    if (updates.length === 0) return;

    console.log(`[ContentSync] ⬆️ Pushing ${updates.length} progress updates to cloud...`);

    try {
      // Send to NestJS endpoint
      await firstValueFrom(this.http.post(`${this.API_URL}/progress`, updates));

      // Clear queue on success
      localStorage.removeItem(queueKey);
      console.log('[ContentSync] ✅ Push successful.');
    } catch (e) {
      console.error('[ContentSync] ❌ Push failed. Will retry next time.', e);
      // Do NOT clear the queue so we retry later
    }
  }

  /**
   * Fetches items for a specific mission.
   * Note: In a real PWA, we could add E-Tag headers here to prevent 
   * downloading unchanged data (returning 304).
   */
  private async fetchMissionItems(missionId: string): Promise<ApiItem[]> {
    try {
      const url = `${this.API_URL}/mission/${missionId}/items`;

      // 1. Fetch as 'any' or a specific wrapper interface
      const response = await firstValueFrom(this.http.get<any>(url));

      // 2. Return ONLY the .data array
      return response.data || [];

    } catch (error) {
      console.error(`[ContentSync] Failed to fetch items for mission ${missionId}`, error);
      return [];
    }
  }

  private async performMigration(apiItems: ApiItem[]) {
    // 1. Get ALL local items
    const allExisting = await this.repo.getAll();
    const existingMap = new Map(allExisting.map(i => [i.id, i]));

    // 2. Create Set of new API IDs for fast lookup
    const validApiIds = new Set(apiItems.map(i => i.id));

    // 3. Identify Stale Items (Exist locally but NOT in API)
    const staleIds = allExisting
      .filter(local => !validApiIds.has(local.id))
      .map(local => local.id);

    // 4. Upsert Logic 
    const itemsToSave: VocabularyItem[] = [];
    for (const rawItem of apiItems) {
      const existing = existingMap.get(rawItem.id);

      const newItem: VocabularyItem = {
        id: rawItem.id,
        missionId: rawItem.missionId,

        // (Assuming backend sends 'noun', 'verb' etc lowercase)
        type: rawItem.type as WordType,
        german: rawItem.german,
        english: rawItem.english,
        gender: rawItem.gender as Gender,
        exampleSentence: rawItem.example,

        // 3. CRITICAL: Preserve Learning State (The "Merge" logic)
        box: existing ? existing.box : LeitnerBox.Box1,
        nextReviewDate: existing ? existing.nextReviewDate : Date.now(),
        lastReviewedDate: existing ? existing.lastReviewedDate : undefined
      };

      itemsToSave.push(newItem);
    }

    // 5. Bulk Operation: Save New + Delete Stale
    if (itemsToSave.length > 0) {
      await this.repo.addBulk(itemsToSave);
    }

    if (staleIds.length > 0) {
      console.warn(`[ContentSync] Removing ${staleIds.length} stale items.`);
      await this.repo.deleteBulk(staleIds);
    }
  }
}