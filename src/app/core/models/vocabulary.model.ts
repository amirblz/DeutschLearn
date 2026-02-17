export type WordType = 'noun' | 'verb' | 'adjective' | 'phrase';

export enum Gender {
    Masculine = 'der',
    Feminine = 'die',
    Neuter = 'das',
    None = 'none'
}

// FSRS State
export enum CardState {
    New = 0,
    Learning = 1,
    Review = 2,
    Relearning = 3
}

export enum Rating {
    Again = 1, // Forgot (Swipe Left)
    Hard = 2,  // Remembered with hesitation (Button)
    Good = 3,  // Remembered instantly (Swipe Right)
    Easy = 4   // Too easy (Button)
}

export interface VocabularyItem {
    id: string;
    missionId: string;
    type: WordType;
    german: string;
    english: string;
    gender: Gender;
    exampleSentence?: string;

    // --- FSRS-5 Data ---
    state: CardState;
    difficulty: number; // D: 1 (Easy) to 10 (Hard)
    stability: number;  // S: Interval in days
    retrievability: number; // R: Current probability of recall (calculated dynamic)

    lastReviewedDate?: number;
    nextReviewDate: number;
    reps: number;       // Total repetition count
    lapses: number;     // How many times forgotten?
}