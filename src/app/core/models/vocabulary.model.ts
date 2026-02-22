export type WordType = 'noun' | 'verb' | 'adjective' | 'phrase';

export enum Gender {
    Masculine = 'der',
    Feminine = 'die',
    Neuter = 'das',
    None = 'none'
}

export enum CardState {
    New = 0,
    Learning = 1,
    Review = 2,
    Relearning = 3
}

export enum Rating {
    Again = 1,
    Hard = 2,
    Good = 3,
    Easy = 4
}

export interface VocabularyItem {
    id: string;
    missionId: string;
    type: WordType;
    german: string;
    english: string;
    gender: Gender;
    exampleSentence?: string;

    // FSRS Data (Now handled separately in IDB, but merged for the UI)
    state: CardState;
    difficulty: number;
    stability: number;
    retrievability: number;
    reps: number;
    lapses: number;
    isLeech?: boolean;

    lastReviewedDate?: number;
    nextReviewDate: number;
}