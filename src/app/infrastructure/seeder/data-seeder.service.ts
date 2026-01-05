import { Injectable, inject } from '@angular/core';
import { VocabularyRepository } from '../../core/repositories/vocabulary.repository';
import { VocabularyItem, Gender, LeitnerBox } from '../../core/models/vocabulary.model';
import { CURRICULUM } from '../../core/config/curriculum.config';

@Injectable({
    providedIn: 'root'
})
export class DataSeederService {
    private repo = inject(VocabularyRepository);

    async seedIfEmpty(): Promise<void> {
        console.log('[DataSeeder] Checking for missing missions...');

        const allItems = await this.repo.getAll();
        const existingMissionIds = new Set(allItems.map(i => i.missionId));

        const newItems: VocabularyItem[] = [];

        for (const level of CURRICULUM) {
            for (const mission of level.missions) {

                if (!existingMissionIds.has(mission.id)) {
                    console.log(`[DataSeeder] Generating missing data for: ${mission.title}`);

                    switch (mission.id) {
                        case 'a1-basics':
                            newItems.push(...this.getA1_Basics());
                            break;
                        case 'a1-food':
                            newItems.push(...this.getA1_Food());
                            break;
                        case 'a2-travel':
                            newItems.push(...this.getA2_Travel());
                            break;
                        case 'a2-work':
                            newItems.push(...this.getA2_Work());
                            break;
                    }
                }
            }
        }

        if (newItems.length > 0) {
            await this.repo.addBulk(newItems);
            console.log(`[DataSeeder] Successfully added ${newItems.length} new cards.`);
        } else {
            console.log('[DataSeeder] All missions are already populated.');
        }
    }

    private getA1_Basics(): VocabularyItem[] {
        return this.mapToItems('a1-basics', [
            { g: Gender.Masculine, d: 'Morgen', e: 'Morning' },
            { g: Gender.Feminine, d: 'Nacht', e: 'Night' },
            { g: Gender.Masculine, d: 'Tag', e: 'Day' },
            { g: Gender.Masculine, d: 'Abend', e: 'Evening' },
            { g: Gender.Masculine, d: 'Apfel', e: 'Apple' },
            { g: Gender.Masculine, d: 'Tisch', e: 'Table' },
            { g: Gender.Masculine, d: 'Stuhl', e: 'Chair' },
            { g: Gender.Masculine, d: 'Kaffee', e: 'Coffee' },
            { g: Gender.Masculine, d: 'Vater', e: 'Father' },
            { g: Gender.Masculine, d: 'Baum', e: 'Tree' }
        ]);
    }

    private getA1_Food(): VocabularyItem[] {
        return this.mapToItems('a1-food', [
            { g: Gender.Masculine, d: 'Käse', e: 'Cheese' },
            { g: Gender.Masculine, d: 'Wein', e: 'Wine' },
            { g: Gender.Masculine, d: 'Löffel', e: 'Spoon' },
            { g: Gender.Feminine, d: 'Gabel', e: 'Fork' },
            { g: Gender.Feminine, d: 'Milch', e: 'Milk' },
            { g: Gender.Feminine, d: 'Suppe', e: 'Soup' },
            { g: Gender.Neuter, d: 'Wasser', e: 'Water' },
            { g: Gender.Neuter, d: 'Brot', e: 'Bread' },
            { g: Gender.Neuter, d: 'Gemüse', e: 'Vegetables' },
            { g: Gender.Neuter, d: 'Ei', e: 'Egg' }
        ]);
    }

    private getA2_Travel(): VocabularyItem[] {
        return this.mapToItems('a2-travel', [
            { g: Gender.Masculine, d: 'Flughafen', e: 'Airport' },
            { g: Gender.Masculine, d: 'Pass', e: 'Passport' },
            { g: Gender.Masculine, d: 'Koffer', e: 'Suitcase' },
            { g: Gender.Feminine, d: 'Fahrkarte', e: 'Ticket' },
            { g: Gender.Feminine, d: 'Abreise', e: 'Departure' },
            { g: Gender.Neuter, d: 'Flugzeug', e: 'Airplane' },
            { g: Gender.Neuter, d: 'Gepäck', e: 'Luggage' },
            { g: Gender.Neuter, d: 'Hotel', e: 'Hotel' }
        ]);
    }

    private getA2_Work(): VocabularyItem[] {
        return this.mapToItems('a2-work', [
            { g: Gender.Masculine, d: 'Chef', e: 'Boss' },
            { g: Gender.Masculine, d: 'Computer', e: 'Computer' },
            { g: Gender.Feminine, d: 'Erfahrung', e: 'Experience' },
            { g: Gender.Feminine, d: 'Bewerbung', e: 'Application' },
            { g: Gender.Neuter, d: 'Büro', e: 'Office' },
            { g: Gender.Neuter, d: 'Gehalt', e: 'Salary' }
        ]);
    }

    private mapToItems(missionId: string, raw: any[]): VocabularyItem[] {
        return raw.map(r => ({
            id: crypto.randomUUID(),
            missionId,
            german: r.d,
            english: r.e,
            gender: r.g,
            exampleSentence: `Das ist ${r.g === Gender.Feminine ? 'eine' : 'ein'} ${r.d}.`,
            box: LeitnerBox.Box1,
            nextReviewDate: Date.now()
        }));
    }
}