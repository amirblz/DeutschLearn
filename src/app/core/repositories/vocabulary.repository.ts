import { VocabularyItem } from '../models/vocabulary.model';

// ✅ SHARED DEFINITION: No 'box'. FSRS data lives inside the encrypted 'payload'.
export interface EncryptedWrapper {
    id: string;
    missionId: string;
    nextReviewDate: number;
    lastReviewedDate?: number;
    payload: string; // Encrypted blob containing { state, difficulty, stability, german, english... }
}

export abstract class VocabularyRepository {
    abstract getAll(): Promise<VocabularyItem[]>;
    abstract getByMissionId(missionId: string): Promise<VocabularyItem[]>;
    abstract getDueItems(timestamp: number): Promise<VocabularyItem[]>;

    abstract addBulk(items: VocabularyItem[]): Promise<void>;
    abstract deleteBulk(ids: string[]): Promise<void>;

    // ✅ UNIFIED SIGNATURE: We pass the full item because FSRS data (D/S/R) 
    // needs to be re-encrypted into the payload.
    abstract updateProgress(
        id: string,
        updatedItem: VocabularyItem
    ): Promise<void>;

    // ✅ RAW ACCESS: For Sync
    abstract upsertRawWrappers(wrappers: EncryptedWrapper[]): Promise<void>;
    abstract getAllWrappers(): Promise<EncryptedWrapper[]>;
}