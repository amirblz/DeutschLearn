import { VocabularyItem, LeitnerBox } from '../models/vocabulary.model';

// The "Physical" shape of data in IndexedDB
export interface EncryptedWrapper {
    id: string;
    missionId: string;
    box: LeitnerBox;
    nextReviewDate: number;
    lastReviewedDate?: number;
    payload: string; // The secured content blob
}

export abstract class VocabularyRepository {
    abstract getAll(): Promise<VocabularyItem[]>;
    abstract getByMissionId(missionId: string): Promise<VocabularyItem[]>;
    abstract getDueItems(timestamp: number): Promise<VocabularyItem[]>;

    abstract addBulk(items: VocabularyItem[]): Promise<void>;
    abstract deleteBulk(ids: string[]): Promise<void>;

    abstract updateProgress(
        id: string,
        newBox: LeitnerBox,
        nextReviewDate: number
    ): Promise<void>;

    // ✅ New methods for High-Performance Sync
    abstract upsertRawWrappers(wrappers: EncryptedWrapper[]): Promise<void>;
    abstract getAllWrappers(): Promise<EncryptedWrapper[]>;
}