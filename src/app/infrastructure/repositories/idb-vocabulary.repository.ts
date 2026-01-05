import { Injectable } from '@angular/core';
import { openDB, DBSchema, IDBPDatabase } from 'idb';
import { VocabularyRepository } from '../../core/repositories/vocabulary.repository';
import { VocabularyItem, LeitnerBox } from '../../core/models/vocabulary.model';

interface GermanAppDB extends DBSchema {
    vocabulary: {
        key: string;
        value: VocabularyItem;
        indexes: {
            'by-mission': string;
            'by-review-date': number;
        };
    };
}

@Injectable({
    providedIn: 'root'
})
export class IdbVocabularyRepository implements VocabularyRepository {
    private dbPromise: Promise<IDBPDatabase<GermanAppDB>>;

    constructor() {
        this.dbPromise = openDB<GermanAppDB>('german-learning-db', 1, {
            upgrade(db) {
                const vocabStore = db.createObjectStore('vocabulary', { keyPath: 'id' });
                vocabStore.createIndex('by-mission', 'missionId');
                vocabStore.createIndex('by-review-date', 'nextReviewDate');
            },
        });
    }

    async getAll(): Promise<VocabularyItem[]> {
        const db = await this.dbPromise;
        return db.getAll('vocabulary');
    }

    async getByMissionId(missionId: string): Promise<VocabularyItem[]> {
        const db = await this.dbPromise;
        return db.getAllFromIndex('vocabulary', 'by-mission', missionId);
    }

    async getDueItems(timestamp: number): Promise<VocabularyItem[]> {
        const db = await this.dbPromise;
        // Get all items where nextReviewDate is <= timestamp
        const range = IDBKeyRange.upperBound(timestamp);
        return db.getAllFromIndex('vocabulary', 'by-review-date', range);
    }

    async addBulk(items: VocabularyItem[]): Promise<void> {
        const db = await this.dbPromise;
        const tx = db.transaction('vocabulary', 'readwrite');
        // Parallelize promises for speed
        await Promise.all([
            ...items.map(item => tx.store.put(item)),
            tx.done
        ]);
    }

    async updateProgress(id: string, newBox: LeitnerBox, nextReviewDate: number): Promise<void> {
        const db = await this.dbPromise;
        const tx = db.transaction('vocabulary', 'readwrite');
        const item = await tx.store.get(id);

        if (item) {
            item.box = newBox;
            item.nextReviewDate = nextReviewDate;
            item.lastReviewedDate = Date.now();
            await tx.store.put(item);
        }

        await tx.done;
    }
}