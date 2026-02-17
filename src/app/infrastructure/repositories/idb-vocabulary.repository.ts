import { Injectable, inject } from '@angular/core';
import { openDB, DBSchema, IDBPDatabase } from 'idb';
import { VocabularyRepository, EncryptedWrapper } from '../../core/repositories/vocabulary.repository';
import { VocabularyItem, CardState } from '../../core/models/vocabulary.model';
import { EncryptionService } from '../../core/services/encryption.service';

interface GermanAppDB extends DBSchema {
    vocabulary: {
        key: string;
        value: EncryptedWrapper;
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
    private crypto = inject(EncryptionService);
    private dbPromise: Promise<IDBPDatabase<GermanAppDB>>;

    constructor() {
        this.dbPromise = openDB<GermanAppDB>('german-learning-db', 4, {
            upgrade(db) {
                if (db.objectStoreNames.contains('vocabulary')) {
                    db.deleteObjectStore('vocabulary');
                }
                const vocabStore = db.createObjectStore('vocabulary', { keyPath: 'id' });
                vocabStore.createIndex('by-mission', 'missionId');
                vocabStore.createIndex('by-review-date', 'nextReviewDate');
            },
        });
    }

    async upsertRawWrappers(wrappers: EncryptedWrapper[]): Promise<void> {
        const db = await this.dbPromise;
        const tx = db.transaction('vocabulary', 'readwrite');
        await Promise.all([
            ...wrappers.map(w => tx.store.put(w)),
            tx.done
        ]);
    }

    async getAllWrappers(): Promise<EncryptedWrapper[]> {
        const db = await this.dbPromise;
        return db.getAll('vocabulary');
    }

    async getAll(): Promise<VocabularyItem[]> {
        const db = await this.dbPromise;
        const wrappers = await db.getAll('vocabulary');
        return this.decryptWrappers(wrappers);
    }

    async getByMissionId(missionId: string): Promise<VocabularyItem[]> {
        const db = await this.dbPromise;
        const wrappers = await db.getAllFromIndex('vocabulary', 'by-mission', missionId);
        return this.decryptWrappers(wrappers);
    }

    async getDueItems(timestamp: number): Promise<VocabularyItem[]> {
        const db = await this.dbPromise;
        const range = IDBKeyRange.upperBound(timestamp);
        const wrappers = await db.getAllFromIndex('vocabulary', 'by-review-date', range);
        return this.decryptWrappers(wrappers);
    }

    async addBulk(items: VocabularyItem[]): Promise<void> {
        const db = await this.dbPromise;
        const tx = db.transaction('vocabulary', 'readwrite');

        const promises = items.map(async (item) => {
            const { id, missionId, nextReviewDate, lastReviewedDate, ...content } = item;
            const payload = await this.crypto.encrypt(content, id);
            return tx.store.put({ id, missionId, nextReviewDate, lastReviewedDate, payload });
        });

        await Promise.all([...promises, tx.done]);
    }

    async deleteBulk(ids: string[]): Promise<void> {
        const db = await this.dbPromise;
        const tx = db.transaction('vocabulary', 'readwrite');
        await Promise.all([...ids.map(id => tx.store.delete(id)), tx.done]);
    }

    // ✅ FIXED SIGNATURE: Matches Abstract Class
    async updateProgress(id: string, updatedItem: VocabularyItem): Promise<void> {
        const db = await this.dbPromise;
        const tx = db.transaction('vocabulary', 'readwrite');
        const wrapper = await tx.store.get(id);

        if (wrapper) {
            wrapper.nextReviewDate = updatedItem.nextReviewDate;
            wrapper.lastReviewedDate = updatedItem.lastReviewedDate;

            // Re-encrypt payload with new FSRS data
            const { id: _id, missionId: _mid, nextReviewDate: _nrd, lastReviewedDate: _lrd, ...content } = updatedItem;
            wrapper.payload = await this.crypto.encrypt(content, id);

            await tx.store.put(wrapper);
        }
        await tx.done;
    }

    private async decryptWrappers(wrappers: EncryptedWrapper[]): Promise<VocabularyItem[]> {
        const results = await Promise.all(
            wrappers.map(async (w) => {
                try {
                    const content = await this.crypto.decrypt<any>(w.payload, w.id);
                    return {
                        id: w.id,
                        missionId: w.missionId,
                        nextReviewDate: w.nextReviewDate,
                        lastReviewedDate: w.lastReviewedDate,
                        // Defaults for FSRS
                        state: content.state ?? CardState.New,
                        difficulty: content.difficulty ?? 0,
                        stability: content.stability ?? 0,
                        reps: content.reps ?? 0,
                        lapses: content.lapses ?? 0,
                        ...content
                    };
                } catch (e) {
                    return null;
                }
            })
        );
        return results.filter((i): i is VocabularyItem => i !== null);
    }
}