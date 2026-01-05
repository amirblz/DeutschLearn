export interface MissionConfig {
    id: string;
    title: string;
    icon: string;
}

export interface LevelConfig {
    id: string; // 'A1', 'A2'
    title: string;
    color: string;
    missions: MissionConfig[];
}

export const CURRICULUM: LevelConfig[] = [
    {
        id: 'A1',
        title: 'A1: The Foundation',
        color: '#2c5282', // Blue-ish
        missions: [
            { id: 'a1-basics', title: 'The Basics', icon: '🏠' },
            { id: 'a1-food', title: 'Food & Drink', icon: '🍎' }
        ]
    },
    {
        id: 'A2',
        title: 'A2: Expanding Horizons',
        color: '#c53030', // Red-ish
        missions: [
            { id: 'a2-travel', title: 'Travel & City', icon: '✈️' },
            { id: 'a2-work', title: 'Work & Office', icon: '💼' }
        ]
    }
];