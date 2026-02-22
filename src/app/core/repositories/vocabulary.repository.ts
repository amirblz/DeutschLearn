import { VocabularyItem } from '../models/vocabulary.model';

export interface DictionaryItem {
    id: string;
    missionId: string;
    payload: string; // Encrypted static data
}

export interface ProgressItem {
    id: string;
    state: number;
    difficulty: number;
    stability: number;
    reps: number;
    lapses: number;
    nextReviewDate: number;
    lastReviewedDate?: number;
    isLeech?: boolean;
}

export abstract class VocabularyRepository {
    abstract getAll(): Promise<VocabularyItem[]>;
    abstract getByMissionId(missionId: string): Promise<VocabularyItem[]>;
    abstract getDueItems(timestamp: number): Promise<VocabularyItem[]>;

    // Fast $O(1)$ Updates (No encryption required here anymore!)
    abstract updateProgress(id: string, progress: Partial<ProgressItem>): Promise<void>;

    // Sync Operations
    abstract upsertDictionary(items: DictionaryItem[]): Promise<void>;
    abstract upsertProgress(items: ProgressItem[]): Promise<void>;
    abstract getLocalProgressToSync(): Promise<ProgressItem[]>;
    abstract clearSyncQueue(): Promise<void>;
}