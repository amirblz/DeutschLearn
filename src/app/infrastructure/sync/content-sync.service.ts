import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { VocabularyRepository } from '../../core/repositories/vocabulary.repository';
import { VocabularyItem, LeitnerBox } from '../../core/models/vocabulary.model';

// Types matching the JSON file
interface JsonItem {
  id: string;
  type: string;
  german: string;
  english: string;
  gender: string;
  example: string;
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
  levels: JsonLevel[];
}

@Injectable({
  providedIn: 'root'
})
export class ContentSyncService {
  private http = inject(HttpClient);
  private repo = inject(VocabularyRepository);

  private readonly DATA_URL = 'assets/data/master-curriculum.json';
  private readonly VERSION_KEY = 'app_content_version';

  async sync() {
    console.log('[ContentSync] Checking for updates...');

    try {
      // 1. Fetch the "Backend" Data
      const masterData = await firstValueFrom(this.http.get<MasterData>(this.DATA_URL));

      // 2. Check Local Version
      const localVersion = Number(localStorage.getItem(this.VERSION_KEY) || 0);

      if (masterData.version > localVersion) {
        console.log(`[ContentSync] New version detected (v${masterData.version}). Updating DB...`);
        await this.performMigration(masterData);
        localStorage.setItem(this.VERSION_KEY, masterData.version.toString());
      } else {
        console.log('[ContentSync] Content is up to date.');
      }
    } catch (err) {
      console.error('[ContentSync] Failed to fetch master data', err);
    }
  }

  private async performMigration(data: MasterData) {
    // Strategy: Upsert.
    // In a real app, we might want to be careful not to overwrite user progress (box/nextReviewDate).
    // Here, we check if item exists. If yes, update content but keep progress. If no, add it.

    const allExisting = await this.repo.getAll();
    const existingMap = new Map(allExisting.map(i => [i.id, i])); // ID -> Item

    const itemsToSave: VocabularyItem[] = [];

    for (const level of data.levels) {
      for (const mission of level.missions) {
        for (const rawItem of mission.items) {

          const existing = existingMap.get(rawItem.id);

          const newItem: VocabularyItem = {
            id: rawItem.id,
            missionId: mission.id,
            type: rawItem.type as any,
            german: rawItem.german,
            english: rawItem.english,
            gender: rawItem.gender as any,
            exampleSentence: rawItem.example,

            // PRESERVE PROGRESS if exists, else default
            box: existing ? existing.box : LeitnerBox.Box1,
            nextReviewDate: existing ? existing.nextReviewDate : Date.now()
          };

          itemsToSave.push(newItem);
        }
      }
    }

    await this.repo.addBulk(itemsToSave);
    console.log(`[ContentSync] Synced ${itemsToSave.length} items.`);
  }
}