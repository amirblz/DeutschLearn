import { VocabularyItem, LeitnerBox } from '../models/vocabulary.model';

export abstract class VocabularyRepository {
    abstract getAll(): Promise<VocabularyItem[]>;
    abstract getByMissionId(missionId: string): Promise<VocabularyItem[]>;
    abstract getDueItems(timestamp: number): Promise<VocabularyItem[]>;

    abstract addBulk(items: VocabularyItem[]): Promise<void>;

    // Updates specific fields for Leitner logic
    abstract updateProgress(
        id: string,
        newBox: LeitnerBox,
        nextReviewDate: number
    ): Promise<void>;
}