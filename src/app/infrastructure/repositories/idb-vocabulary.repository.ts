import { Injectable, inject } from '@angular/core';
import { openDB, DBSchema, IDBPDatabase } from 'idb';
import { VocabularyRepository, EncryptedWrapper } from '../../core/repositories/vocabulary.repository';
import { VocabularyItem, LeitnerBox } from '../../core/models/vocabulary.model';
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
        this.dbPromise = openDB<GermanAppDB>('german-learning-db', 3, { // Version Bumped
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

    // --- Fast Raw Access for Sync (Pass-Through) ---

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

    // --- Application Access (Decrypts on demand) ---

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
            // Extract content to encrypt
            const { id, missionId, box, nextReviewDate, lastReviewedDate, ...content } = item;
            const payload = await this.crypto.encrypt(content, id);

            return tx.store.put({
                id,
                missionId,
                box,
                nextReviewDate,
                lastReviewedDate,
                payload
            });
        });

        await Promise.all([...promises, tx.done]);
    }

    async deleteBulk(ids: string[]): Promise<void> {
        const db = await this.dbPromise;
        const tx = db.transaction('vocabulary', 'readwrite');
        await Promise.all([...ids.map(id => tx.store.delete(id)), tx.done]);
    }

    async updateProgress(id: string, newBox: LeitnerBox, nextReviewDate: number): Promise<void> {
        const db = await this.dbPromise;
        const tx = db.transaction('vocabulary', 'readwrite');
        const wrapper = await tx.store.get(id);

        if (wrapper) {
            // Only update metadata. Payload remains encrypted.
            wrapper.box = newBox;
            wrapper.nextReviewDate = nextReviewDate;
            wrapper.lastReviewedDate = Date.now();
            await tx.store.put(wrapper);
        }
        await tx.done;
    }

    // --- Helper: Merge Decrypted Content + Local Progress ---
    private async decryptWrappers(wrappers: EncryptedWrapper[]): Promise<VocabularyItem[]> {
        return Promise.all(
            wrappers.map(async (w) => {
                const content = await this.crypto.decrypt<any>(w.payload, w.id);

                return {
                    id: w.id,
                    missionId: w.missionId,
                    box: w.box,
                    nextReviewDate: w.nextReviewDate,
                    lastReviewedDate: w.lastReviewedDate,
                    ...content // Spread: german, english, type, etc.
                };
            })
        );
    }
}