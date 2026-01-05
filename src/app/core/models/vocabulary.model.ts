export enum Gender {
    Masculine = 'der',
    Feminine = 'die',
    Neuter = 'das',
    None = 'none' // For verbs/adjectives
}

export enum LeitnerBox {
    Box1 = 1, // Daily
    Box2 = 2, // Every 3 days
    Box3 = 3, // Every week
    Box4 = 4, // Every 2 weeks
    Box5 = 5  // Retired / Monthly
}

export interface VocabularyItem {
    id: string;              // UUID
    missionId: string;       // Foreign Key to Mission
    german: string;
    english: string;
    gender: Gender;
    exampleSentence?: string;

    // Learning State (Mutable)
    box: LeitnerBox;
    nextReviewDate: number;  // Timestamp (Date.now())
    lastReviewedDate?: number;
}