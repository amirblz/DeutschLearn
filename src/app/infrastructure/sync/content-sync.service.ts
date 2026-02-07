import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { VocabularyRepository } from '../../core/repositories/vocabulary.repository';
import { VocabularyItem, LeitnerBox, WordType, Gender } from '../../core/models/vocabulary.model';

// --- Interfaces matching the JSON structure ---
interface JsonItem {
  id: string;
  type: string;
  german: string;
  english: string;
  gender: string;
  example: string; // Note: In DB model this is 'exampleSentence'
}

interface JsonMission {
  id: string;
  title: string;
  icon: string;
  items: JsonItem[];
}

interface JsonLevel {
  id: string;
  title: string;
  color: string;
  missions: JsonMission[];
}

interface MasterData {
  version: number;
  levels: JsonLevel[];
}

// --- Interfaces for UI Consumption ---
export interface MissionConfig {
  id: string;
  title: string;
  icon: string;
}

export interface LevelConfig {
  id: string;
  title: string;
  color: string;
  missions: MissionConfig[];
}

@Injectable({
  providedIn: 'root'
})
export class ContentSyncService {
  private http = inject(HttpClient);
  private repo = inject(VocabularyRepository);

  private readonly DATA_URL = 'assets/data/master-curriculum.json';
  private readonly STORAGE_KEY_DATA = 'app_curriculum_structure';
  private readonly STORAGE_KEY_VER = 'app_content_version';

  // The Source of Truth for the UI
  readonly curriculum = signal<LevelConfig[]>([]);

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

  async sync() {
    console.log('[ContentSync] Checking for updates...');
    try {
      // CACHE BUSTING: Add timestamp to force browser to ignore cache
      const url = `${this.DATA_URL}?t=${Date.now()}`;
      const data = await firstValueFrom(this.http.get<MasterData>(url));

      // 1. Update UI Structure immediately
      this.curriculum.set(data.levels);
      localStorage.setItem(this.STORAGE_KEY_DATA, JSON.stringify(data.levels));

      // 2. Check Version & Migrate DB Items
      const localVersion = Number(localStorage.getItem(this.STORAGE_KEY_VER) || 0);

      console.log(`[ContentSync] Local v${localVersion} vs Remote v${data.version}`);

      if (data.version > localVersion) {
        console.log(`[ContentSync] New version detected. performing migration...`);
        await this.performMigration(data);
        localStorage.setItem(this.STORAGE_KEY_VER, data.version.toString());
        console.log('[ContentSync] Migration complete.');

        // Reload page to ensure Dashboard stats refresh with new data
        window.location.reload();
      } else {
        console.log('[ContentSync] Already up to date.');
      }

    } catch (err) {
      console.warn('[ContentSync] Offline or fetch failed. Using cached structure.', err);
    }
  }

  private async performMigration(data: MasterData) {
    // 1. Get existing items to preserve user progress (Leitner boxes)
    const allExisting = await this.repo.getAll();
    const existingMap = new Map(allExisting.map(i => [i.id, i])); // ID -> Item

    const itemsToSave: VocabularyItem[] = [];

    // 2. Iterate through the JSON hierarchy
    for (const level of data.levels) {
      for (const mission of level.missions) {
        for (const rawItem of mission.items) {

          const existing = existingMap.get(rawItem.id);

          // 3. Map JSON -> Domain Model
          const newItem: VocabularyItem = {
            id: rawItem.id,
            missionId: mission.id,
            // Cast string types from JSON to strict Enums
            type: rawItem.type as WordType,
            german: rawItem.german,
            english: rawItem.english,
            gender: rawItem.gender as Gender,
            exampleSentence: rawItem.example, // Mapping mismatch fixed here

            // 4. CRITICAL: Preserve Learning State
            box: existing ? existing.box : LeitnerBox.Box1,
            nextReviewDate: existing ? existing.nextReviewDate : Date.now(),
            lastReviewedDate: existing ? existing.lastReviewedDate : undefined
          };

          itemsToSave.push(newItem);
        }
      }
    }

    // 5. Commit to DB
    if (itemsToSave.length > 0) {
      await this.repo.addBulk(itemsToSave);
      console.log(`[ContentSync] Successfully saved ${itemsToSave.length} items to DB.`);
    } else {
      console.warn('[ContentSync] Migration run but 0 items found to save.');
    }
  }
}