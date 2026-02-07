import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { VocabularyRepository } from '../../core/repositories/vocabulary.repository';
import { VocabularyItem, LeitnerBox } from '../../core/models/vocabulary.model';


interface JsonItem {
  id: string;
  type: string;
  german: string;
  english: string;
  gender: string;
  example: string;
}
// Re-export or define the Types here to be used by Dashboard
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
interface MasterData {
  version: number;
  levels: any[]; // refined below
}

interface JsonMission {
  id: string;
  items: JsonItem[];
}

interface JsonLevel {
  id: string;
  missions: JsonMission[];
}

interface MasterData {
  version: number;
  levels: any[];
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

  // THE NEW SOURCE OF TRUTH
  // The Dashboard will read this signal instead of the hardcoded config
  readonly curriculum = signal<LevelConfig[]>([]);

  constructor() {
    // 1. Load cached structure immediately (so UI works offline)
    const cached = localStorage.getItem(this.STORAGE_KEY_DATA);
    if (cached) {
      try {
        this.curriculum.set(JSON.parse(cached));
      } catch (e) {
        console.error('Failed to parse cached curriculum', e);
      }
    }
  }

  async sync() {
    console.log('[ContentSync] Checking for updates...');
    try {
      const data = await firstValueFrom(this.http.get<MasterData>(this.DATA_URL));

      // Update the Signal (Updates the UI immediately)
      this.curriculum.set(data.levels);

      // Cache the structure for next offline launch
      localStorage.setItem(this.STORAGE_KEY_DATA, JSON.stringify(data.levels));

      // Check Version & Migrate DB Items
      const localVersion = Number(localStorage.getItem(this.STORAGE_KEY_VER) || 0);
      if (data.version > localVersion) {
        console.log(`[ContentSync] New version v${data.version}. Updating DB...`);
        await this.performMigration(data);
        localStorage.setItem(this.STORAGE_KEY_VER, data.version.toString());
      }
    } catch (err) {
      console.warn('[ContentSync] Offline or fetch failed. Using cached structure.');
    }
  }

  private async performMigration(data: MasterData) {
    // ... (Keep your existing migration logic here) ...
    // This logic saves the actual words (VocabularyItems) to IndexedDB

    // Quick recap of that logic for context:
    const allExisting = await this.repo.getAll();
    const existingMap = new Map(allExisting.map(i => [i.id, i]));
    const itemsToSave: VocabularyItem[] = [];

    for (const level of data.levels) {
      for (const mission of level.missions) {
        for (const rawItem of mission.items) {
          const existing = existingMap.get(rawItem.id);
          // ... map fields ...
          // itemsToSave.push(newItem);
        }
      }
    }
    await this.repo.addBulk(itemsToSave);
  }
}