import { Injectable, inject } from '@angular/core';
import { openDB, DBSchema, IDBPDatabase } from 'idb';
import { VocabularyRepository, DictionaryItem, ProgressItem } from '../../core/repositories/vocabulary.repository';
import { VocabularyItem, CardState } from '../../core/models/vocabulary.model';
import { EncryptionService } from '../../core/services/encryption.service';

interface GermanAppDB extends DBSchema {
    dictionary: {
        key: string;
        value: DictionaryItem;
        indexes: { 'by-mission': string };
    };
    progress: {
        key: string;
        value: ProgressItem;
        indexes: { 'by-review-date': number };
    };
    sync_queue: {
        key: string;
        value: ProgressItem;
    };
}

@Injectable({ providedIn: 'root' })
export class IdbVocabularyRepository implements VocabularyRepository {
    private crypto = inject(EncryptionService);
    private dbPromise: Promise<IDBPDatabase<GermanAppDB>>;

    constructor() {
        this.dbPromise = openDB<GermanAppDB>('german-learning-db', 5, {
            upgrade(db) {
                if (!db.objectStoreNames.contains('dictionary')) {
                    const dictStore = db.createObjectStore('dictionary', { keyPath: 'id' });
                    dictStore.createIndex('by-mission', 'missionId');
                }
                if (!db.objectStoreNames.contains('progress')) {
                    const progStore = db.createObjectStore('progress', { keyPath: 'id' });
                    progStore.createIndex('by-review-date', 'nextReviewDate');
                }
                if (!db.objectStoreNames.contains('sync_queue')) {
                    db.createObjectStore('sync_queue', { keyPath: 'id' });
                }
            },
        });
    }

    async upsertDictionary(items: DictionaryItem[]): Promise<void> {
        const db = await this.dbPromise;
        const tx = db.transaction('dictionary', 'readwrite');
        await Promise.all([...items.map(item => tx.store.put(item)), tx.done]);
    }

    async upsertProgress(items: ProgressItem[]): Promise<void> {
        const db = await this.dbPromise;
        const tx = db.transaction('progress', 'readwrite');
        await Promise.all([...items.map(item => tx.store.put(item)), tx.done]);
    }

    async updateProgress(id: string, progressUpdates: Partial<ProgressItem>): Promise<void> {
        const db = await this.dbPromise;

        // 1. Update active progress store
        const tx = db.transaction('progress', 'readwrite');
        let current = await tx.store.get(id);
        if (!current) current = this.getDefaultProgress(id);
        const updated = { ...current, ...progressUpdates };
        await tx.store.put(updated);
        await tx.done;

        // 2. Add to Sync Queue
        const syncTx = db.transaction('sync_queue', 'readwrite');
        await syncTx.store.put(updated);
        await syncTx.done;
    }

    async getLocalProgressToSync(): Promise<ProgressItem[]> {
        const db = await this.dbPromise;
        return db.getAll('sync_queue');
    }

    async clearSyncQueue(): Promise<void> {
        const db = await this.dbPromise;
        await db.clear('sync_queue');
    }

    /**
     * O(1) Fast fetch. Only reads FSRS numbers first, then ONLY decrypts the 50 cards you actually need.
     */
    async getDueItems(timestamp: number): Promise<VocabularyItem[]> {
        const db = await this.dbPromise;
        const range = IDBKeyRange.upperBound(timestamp);
        const dueProgress = await db.getAllFromIndex('progress', 'by-review-date', range);

        const tx = db.transaction('dictionary', 'readonly');
        const results: VocabularyItem[] = [];

        for (const prog of dueProgress) {
            const dictItem = await tx.store.get(prog.id);
            if (dictItem) {
                const content = await this.crypto.decrypt<any>(dictItem.payload, dictItem.id);
                results.push({ ...content, ...prog, missionId: dictItem.missionId });
            }
        }
        return results;
    }

    async getByMissionId(missionId: string): Promise<VocabularyItem[]> {
        const db = await this.dbPromise;
        const dictItems = await db.getAllFromIndex('dictionary', 'by-mission', missionId);
        const progItems = await db.getAll('progress');
        const progMap = new Map(progItems.map(p => [p.id, p]));

        return Promise.all(dictItems.map(async d => {
            const content = await this.crypto.decrypt<any>(d.payload, d.id);
            const p = progMap.get(d.id) || this.getDefaultProgress(d.id);
            return { ...content, ...p, missionId: d.missionId };
        }));
    }

    /**
     * Asynchronous chunking guarantees native-alike UI performance even when crunching 100,000 items.
     */
    async getAll(): Promise<VocabularyItem[]> {
        const db = await this.dbPromise;
        const dictItems = await db.getAll('dictionary');
        const progItems = await db.getAll('progress');
        const progMap = new Map(progItems.map(p => [p.id, p]));

        const results: VocabularyItem[] = [];
        const BATCH_SIZE = 250;

        for (let i = 0; i < dictItems.length; i += BATCH_SIZE) {
            const batch = dictItems.slice(i, i + BATCH_SIZE);
            const decryptedBatch = await Promise.all(batch.map(async d => {
                try {
                    const content = await this.crypto.decrypt<any>(d.payload, d.id);
                    const p = progMap.get(d.id) || this.getDefaultProgress(d.id);
                    return { ...content, ...p, missionId: d.missionId };
                } catch { return null; }
            }));

            results.push(...decryptedBatch.filter((x): x is VocabularyItem => x !== null));

            // Yield to event loop to keep the UI from freezing
            await new Promise(resolve => setTimeout(resolve, 0));
        }

        return results;
    }

    private getDefaultProgress(id: string): ProgressItem {
        return {
            id, state: CardState.New, difficulty: 0, stability: 0,
            reps: 0, lapses: 0, nextReviewDate: Date.now()
        };
    }
}