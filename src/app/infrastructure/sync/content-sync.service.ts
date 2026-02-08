import { Injectable, inject, signal } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { VocabularyRepository } from '../../core/repositories/vocabulary.repository';
import { VocabularyItem, LeitnerBox, WordType, Gender } from '../../core/models/vocabulary.model';

// --- API Interfaces (Matching NestJS Responses) ---
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

// --- Wrapper for Mission Item Response ---
interface MissionItemsResponse {
  versionTag: string;
  data: ApiItem[];
}

@Injectable({
  providedIn: 'root'
})
export class ContentSyncService {
  private http = inject(HttpClient);
  private repo = inject(VocabularyRepository);

  // 🔗 Point to your NestJS Backend
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
      // 1. Fetch Hierarchy (Fast)
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

  /**
   * Fetches items for a specific mission.
   * Note: In a real PWA, you could add E-Tag headers here to prevent 
   * downloading unchanged data (returning 304).
   */
  /**
     * FIX APPLIED: Unwrap the { data: [...] } response from the backend
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

    // 4. Upsert Logic (Your existing logic)
    const itemsToSave: VocabularyItem[] = [];
    for (const rawItem of apiItems) {
      const existing = existingMap.get(rawItem.id);

      const newItem: VocabularyItem = {
        id: rawItem.id,
        missionId: rawItem.missionId,

        // Ensure Types match your Frontend Enums
        // (Assuming backend sends 'noun', 'verb' etc lowercase)
        type: rawItem.type as WordType,
        german: rawItem.german,
        english: rawItem.english,
        gender: rawItem.gender as Gender,
        exampleSentence: rawItem.example, // Mapping backend 'example' to frontend 'exampleSentence'

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
      await this.repo.deleteBulk(staleIds); // <--- NEED TO IMPLEMENT THIS IN REPO
    }
  }
}