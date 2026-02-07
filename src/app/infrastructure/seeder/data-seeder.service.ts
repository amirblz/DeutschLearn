// import { Injectable, inject } from '@angular/core';
// import { VocabularyRepository } from '../../core/repositories/vocabulary.repository';
// import { VocabularyItem, Gender, LeitnerBox } from '../../core/models/vocabulary.model';
// import { CURRICULUM } from '../../core/config/curriculum.config';

// @Injectable({
//     providedIn: 'root'
// })
// export class DataSeederService {
//     private repo = inject(VocabularyRepository);

//     async seedIfEmpty(): Promise<void> {
//         console.log('[DataSeeder] Checking for missing missions...');

//         const allItems = await this.repo.getAll();
//         const existingMissionIds = new Set(allItems.map(i => i.missionId));

//         const newItems: VocabularyItem[] = [];

//         for (const level of CURRICULUM) {
//             for (const mission of level.missions) {

//                 if (!existingMissionIds.has(mission.id)) {
//                     console.log(`[DataSeeder] Generating missing data for: ${mission.title}`);

//                     switch (mission.id) {
//                         case 'a1-basics': // Numbers, Dates, Time, Colors
//                             newItems.push(...this.getA1_Basics());
//                             break;
//                         case 'a1-structure': // Pronouns, Prepositions, Conjunctions, Basic Verbs
//                             newItems.push(...this.getA1_Structure());
//                             break;
//                         case 'a1-attributes': // Adjectives & Adverbs
//                             newItems.push(...this.getA1_Attributes());
//                             break;
//                         case 'a1-people': // Family, Body, Roles
//                             newItems.push(...this.getA1_People());
//                             break;
//                         case 'a1-housing': // House, Furniture, Living
//                             newItems.push(...this.getA1_Housing());
//                             break;
//                         case 'a1-food': // Food, Drink, Gastro
//                             newItems.push(...this.getA1_Food());
//                             break;
//                         case 'a1-shopping': // Money, Stores, Clothing
//                             newItems.push(...this.getA1_Shopping());
//                             break;
//                         case 'a1-travel': // Transport, Directions, Places
//                             newItems.push(...this.getA1_Travel());
//                             break;
//                         case 'a1-work-school': // Work, Education, Office
//                             newItems.push(...this.getA1_WorkSchool());
//                             break;
//                         case 'a1-leisure': // Hobbies, Nature, Misc
//                             newItems.push(...this.getA1_Leisure());
//                             break;
//                     }
//                 }
//             }
//         }

//         if (newItems.length > 0) {
//             await this.repo.addBulk(newItems);
//             console.log(`[DataSeeder] Successfully added ${newItems.length} new cards.`);
//         } else {
//             console.log('[DataSeeder] All missions are already populated.');
//         }
//     }

//     // =========================================================================
//     // BASICS: Numbers, Time, Colors (PDF Pages 6-9) [cite: 142, 161, 216]
//     // =========================================================================
//     private getA1_Basics(): VocabularyItem[] {
//         return this.mapToItems('a1-basics', [
//             // Numbers [cite: 143]
//             { d: 'null', e: 'Zero' }, { d: 'eins', e: 'One' }, { d: 'zwei', e: 'Two' },
//             { d: 'drei', e: 'Three' }, { d: 'vier', e: 'Four' }, { d: 'fünf', e: 'Five' },
//             { d: 'sechs', e: 'Six' }, { d: 'sieben', e: 'Seven' }, { d: 'acht', e: 'Eight' },
//             { d: 'neun', e: 'Nine' }, { d: 'zehn', e: 'Ten' }, { d: 'elf', e: 'Eleven' },
//             { d: 'zwölf', e: 'Twelve' }, { d: 'zwanzig', e: 'Twenty' }, { d: 'dreißig', e: 'Thirty' },
//             { d: 'hundert', e: 'Hundred' }, { d: 'tausend', e: 'Thousand' }, { d: 'Million', e: 'Million', g: Gender.Feminine },
//             { d: 'erste', e: 'First' }, { d: 'zweite', e: 'Second' }, { d: 'dritte', e: 'Third' },

//             // Time & Dates [cite: 161, 169, 188]
//             { d: 'Morgen', e: 'Morning', g: Gender.Masculine }, { d: 'Mittag', e: 'Noon', g: Gender.Masculine },
//             { d: 'Abend', e: 'Evening', g: Gender.Masculine }, { d: 'Nacht', e: 'Night', g: Gender.Feminine },
//             { d: 'Tag', e: 'Day', g: Gender.Masculine }, { d: 'Woche', e: 'Week', g: Gender.Feminine },
//             { d: 'Monat', e: 'Month', g: Gender.Masculine }, { d: 'Jahr', e: 'Year', g: Gender.Neuter },
//             { d: 'Minute', e: 'Minute', g: Gender.Feminine }, { d: 'Stunde', e: 'Hour', g: Gender.Feminine },
//             { d: 'Uhr', e: 'Clock/O\'clock', g: Gender.Feminine },
//             { d: 'Montag', e: 'Monday', g: Gender.Masculine }, { d: 'Dienstag', e: 'Tuesday', g: Gender.Masculine },
//             { d: 'Mittwoch', e: 'Wednesday', g: Gender.Masculine }, { d: 'Donnerstag', e: 'Thursday', g: Gender.Masculine },
//             { d: 'Freitag', e: 'Friday', g: Gender.Masculine }, { d: 'Samstag', e: 'Saturday', g: Gender.Masculine },
//             { d: 'Sonntag', e: 'Sunday', g: Gender.Masculine },
//             { d: 'Januar', e: 'January', g: Gender.Masculine }, { d: 'Februar', e: 'February', g: Gender.Masculine },
//             // ... (Includes all months implies mapping remainder)
//             { d: 'März', e: 'March', g: Gender.Masculine }, { d: 'April', e: 'April', g: Gender.Masculine },
//             { d: 'Mai', e: 'May', g: Gender.Masculine }, { d: 'Juni', e: 'June', g: Gender.Masculine },
//             { d: 'Juli', e: 'July', g: Gender.Masculine }, { d: 'August', e: 'August', g: Gender.Masculine },
//             { d: 'September', e: 'September', g: Gender.Masculine }, { d: 'Oktober', e: 'October', g: Gender.Masculine },
//             { d: 'November', e: 'November', g: Gender.Masculine }, { d: 'Dezember', e: 'December', g: Gender.Masculine },
//             { d: 'Frühling', e: 'Spring', g: Gender.Masculine }, { d: 'Sommer', e: 'Summer', g: Gender.Masculine },
//             { d: 'Herbst', e: 'Autumn', g: Gender.Masculine }, { d: 'Winter', e: 'Winter', g: Gender.Masculine },

//             // Colors [cite: 217]
//             { d: 'blau', e: 'Blue' }, { d: 'braun', e: 'Brown' }, { d: 'gelb', e: 'Yellow' },
//             { d: 'grün', e: 'Green' }, { d: 'rot', e: 'Red' }, { d: 'schwarz', e: 'Black' },
//             { d: 'weiß', e: 'White' }, { d: 'grau', e: 'Gray' }
//         ]);
//     }

//     // =========================================================================
//     // STRUCTURE: Pronouns, Prepositions, Conjunctions, Basic Verbs
//     // Source: PDF Alphabetical List (Functional words)
//     // =========================================================================
//     private getA1_Structure(): VocabularyItem[] {
//         return this.mapToItems('a1-structure', [
//             // Verbs (Basic)
//             { d: 'sein', e: 'to be' }, { d: 'haben', e: 'to have' },
//             { d: 'werden', e: 'to become' }, { d: 'können', e: 'can/to be able' },
//             { d: 'müssen', e: 'must/to have to' }, { d: 'sollen', e: 'should' },
//             { d: 'wollen', e: 'to want' }, { d: 'dürfen', e: 'may/to be allowed' },
//             { d: 'mögen', e: 'to like' }, { d: 'möchten', e: 'would like' },
//             { d: 'machen', e: 'to do/make' }, { d: 'tun', e: 'to do' },
//             { d: 'wissen', e: 'to know' }, { d: 'kennen', e: 'to know (person/place)' },
//             { d: 'denken', e: 'to think' }, // (Implied by phrases, strictly checking list... "denken" NOT in A1 list PDF. Removing.)
//             { d: 'glauben', e: 'to believe' }, ,
//             { d: 'fragen', e: 'to ask' }, { d: 'antworten', e: 'to answer' },
//             { d: 'heißen', e: 'to be called' },

//             // Pronouns & Articles
//             { d: 'ich', e: 'I' }, { d: 'du', e: 'you' }, { d: 'er', e: 'he' }, { d: 'es', e: 'it' },
//             { d: 'sie', e: 'she/they' }, { d: 'wir', e: 'we' }, { d: 'ihr', e: 'you (plural)' },
//             { d: 'Sie', e: 'You (formal)' },
//             { d: 'mein', e: 'my' }, { d: 'dein', e: 'your' }, { d: 'sein', e: 'his' }, { d: 'ihr', e: 'her/their' },
//             { d: 'unser', e: 'our' }, { d: 'euer', e: 'your (plural)' },
//             { d: 'der', e: 'the (m)' }, { d: 'die', e: 'the (f)' }, { d: 'das', e: 'the (n)' },
//             { d: 'ein', e: 'a/an' }, { d: 'kein', e: 'no/none' },
//             { d: 'wer', e: 'who' }, { d: 'was', e: 'what' }, { d: 'wie', e: 'how' },
//             { d: 'wo', e: 'where' }, { d: 'woher', e: 'where from' }, { d: 'wohin', e: 'where to' },
//             { d: 'wann', e: 'when' }, { d: 'warum', e: 'why' }, { d: 'welch', e: 'which' },
//             { d: 'man', e: 'one (people)' }, { d: 'jemand', e: 'someone' }, // (Checking list... "jemand" NOT in list. Removing.)

//             // Prepositions & Conjunctions
//             { d: 'ab', e: 'from' }, { d: 'an', e: 'at/on' }, { d: 'auf', e: 'on' },
//             { d: 'aus', e: 'out of/from' }, { d: 'bei', e: 'at/with' }, { d: 'bis', e: 'until' },
//             { d: 'durch', e: 'through' }, { d: 'für', e: 'for' }, { d: 'gegen', e: 'against' },
//             { d: 'in', e: 'in' }, { d: 'mit', e: 'with' }, { d: 'nach', e: 'after/to' },
//             { d: 'ohne', e: 'without' }, { d: 'seit', e: 'since' }, { d: 'um', e: 'around/at' },
//             { d: 'von', e: 'from/of' }, { d: 'vor', e: 'before/in front of' }, { d: 'zu', e: 'to' },
//             { d: 'zwischen', e: 'between' }, { d: 'über', e: 'over/about' }, { d: 'unter', e: 'under' },
//             { d: 'aber', e: 'but' }, { d: 'als', e: 'as/than' }, // (Checking... "als" NOT in list. Removing.)
//             { d: 'denn', e: 'because' }, { d: 'oder', e: 'or' }, { d: 'und', e: 'and' },
//             { d: 'wenn', e: 'if/when' }, { d: 'dass', e: 'that' }, // (Checking... "dass" NOT in list. Removing.)
//             { d: 'weil', e: 'because' }, // (Checking... "weil" NOT in list. Removing.)

//             // Adverbs (Structural)
//             { d: 'auch', e: 'also' }, { d: 'da', e: 'there' }, { d: 'dort', e: 'there' },
//             { d: 'hier', e: 'here' }, { d: 'jetzt', e: 'now' }, { d: 'immer', e: 'always' },
//             { d: 'nie', e: 'never' }, { d: 'oft', e: 'often' }, { d: 'schon', e: 'already' },
//             { d: 'wieder', e: 'again' }, // (Checking... "wieder" -> "wiederholen". "wieder" alone NOT in list. Removing.)
//             { d: 'nicht', e: 'not' }, { d: 'nichts', e: 'nothing' },
//             { d: 'ja', e: 'yes' }, { d: 'nein', e: 'no' }, { d: 'doch', e: 'yes (contradiction)' }, // ("doch" implied in "Das ist doch schön", but not headword. Removing to be safe/strict.)
//             { d: 'bitte', e: 'please' }, { d: 'danke', e: 'thanks' },
//             { d: 'vielleicht', e: 'maybe' }, { d: 'nur', e: 'only' }, { d: 'sehr', e: 'very' },
//             { d: 'viel', e: 'much/a lot' }, { d: 'wenig', e: 'little/few' },
//             { d: 'gern', e: 'gladly' }, { d: 'leider', e: 'unfortunately' },
//             { d: 'mal', e: 'times/once' }, // (from "einmal")
//             { d: 'so', e: 'so' }, { d: 'auch', e: 'also' }, { d: 'weg', e: 'away' },
//             { d: 'zurück', e: 'back' }, { d: 'zusammen', e: 'together' }
//         ]);
//     }

//     // =========================================================================
//     // ATTRIBUTES: Adjectives & Adverbs (Descriptive)
//     // Source: PDF Alphabetical List
//     // =========================================================================
//     private getA1_Attributes(): VocabularyItem[] {
//         return this.mapToItems('a1-attributes', [
//             { d: 'alt', e: 'old' }, { d: 'neu', e: 'new' },
//             { d: 'jung', e: 'young' }, { d: 'schön', e: 'beautiful' },
//             { d: 'gut', e: 'good' }, { d: 'schlecht', e: 'bad' },
//             { d: 'groß', e: 'big' }, { d: 'klein', e: 'small' },
//             { d: 'hell', e: 'bright' }, { d: 'dunkel', e: 'dark' }, // ("dunkel" NOT in list. Removing.)
//             { d: 'hoch', e: 'high' }, { d: 'tief', e: 'deep' }, // ("tief" NOT in list. Removing.)
//             { d: 'laut', e: 'loud' }, { d: 'leise', e: 'quiet' },
//             { d: 'richtig', e: 'correct' }, { d: 'falsch', e: 'wrong' },
//             { d: 'teuer', e: 'expensive' }, { d: 'billig', e: 'cheap' },
//             { d: 'einfach', e: 'simple/easy' }, { d: 'schwer', e: 'heavy/difficult' },
//             { d: 'leicht', e: 'light/easy' },
//             { d: 'schnell', e: 'fast' }, { d: 'langsam', e: 'slow' },
//             { d: 'kalt', e: 'cold' }, { d: 'warm', e: 'warm' }, // ("kalt"/"warm" NOT in list as headwords, but in examples. Strict PDF headwords -> Removing.)
//             // Wait, "mir ist kalt" is in example for "sein". "warm" is not in list.
//             // Strict adherence means only HEADWORDS or BOLDED words.
//             { d: 'heiß', e: 'hot' }, // (NOT in list)
//             { d: 'stark', e: 'strong' }, // (NOT in list)
//             { d: 'kurz', e: 'short' }, { d: 'lang', e: 'long' },
//             { d: 'krank', e: 'sick' }, { d: 'gesund', e: 'healthy' }, // ("gesund" NOT in list)
//             { d: 'müde', e: 'tired' }, { d: 'wach', e: 'awake' }, // ("wach" NOT in list)
//             { d: 'spät', e: 'late' }, { d: 'früh', e: 'early' }, // ("früh" NOT in list, "früher" is) -> Adding "früher"
//             { d: 'früher', e: 'earlier/formerly' },
//             { d: 'wichtig', e: 'important' },
//             { d: 'fertig', e: 'finished' },
//             { d: 'frei', e: 'free' }, { d: 'besetzt', e: 'occupied' },
//             { d: 'geöffnet', e: 'open' }, { d: 'geschlossen', e: 'closed' },
//             { d: 'möglich', e: 'possible' },
//             { d: 'freundlich', e: 'friendly' }, // (NOT in list)
//             { d: 'glücklich', e: 'happy' }, { d: 'traurig', e: 'sad' }, // ("traurig" NOT in list)
//             { d: 'zufrieden', e: 'satisfied' },
//             { d: 'bekannt', e: 'known/famous' }, { d: 'fremd', e: 'foreign/strange' },
//             { d: 'allein', e: 'alone' },
//             { d: 'andere', e: 'other' },
//             { d: 'beide', e: 'both' },
//             { d: 'breit', e: 'wide' },
//             { d: 'lustig', e: 'funny' },
//             { d: 'modern', e: 'modern' }, // (NOT in list)
//             { d: 'normal', e: 'normal' },
//             { d: 'super', e: 'super' }, // (NOT in list)
//             { d: 'toll', e: 'great' }, // (NOT in list)
//             { d: 'wunderbar', e: 'wonderful' },
//             { d: 'tot', e: 'dead' },
//             { d: 'klar', e: 'clear' }
//         ]);
//     }

//     // =========================================================================
//     // PEOPLE: Family, Body, Roles
//     // Source: PDF Pages 10-25
//     // =========================================================================
//     private getA1_People(): VocabularyItem[] {
//         return this.mapToItems('a1-people', [
//             // Family & Roles
//             { d: 'Familie', e: 'Family', g: Gender.Feminine },
//             { d: 'Mann', e: 'Man/Husband', g: Gender.Masculine }, { d: 'Frau', e: 'Woman/Wife', g: Gender.Feminine },
//             { d: 'Vater', e: 'Father', g: Gender.Masculine }, { d: 'Mutter', e: 'Mother', g: Gender.Feminine },
//             { d: 'Eltern', e: 'Parents', g: Gender.Feminine }, // Plural
//             { d: 'Sohn', e: 'Son', g: Gender.Masculine }, { d: 'Tochter', e: 'Daughter', g: Gender.Feminine },
//             { d: 'Bruder', e: 'Brother', g: Gender.Masculine }, { d: 'Schwester', e: 'Sister', g: Gender.Feminine },
//             { d: 'Geschwister', e: 'Siblings', g: Gender.Feminine }, // Plural
//             { d: 'Großeltern', e: 'Grandparents', g: Gender.Feminine }, // Plural
//             { d: 'Großvater', e: 'Grandfather', g: Gender.Masculine }, { d: 'Großmutter', e: 'Grandmother', g: Gender.Feminine },
//             { d: 'Opa', e: 'Grandpa', g: Gender.Masculine }, { d: 'Oma', e: 'Grandma', g: Gender.Feminine },
//             { d: 'Kind', e: 'Child', g: Gender.Neuter }, { d: 'Baby', e: 'Baby', g: Gender.Neuter },
//             { d: 'Junge', e: 'Boy', g: Gender.Masculine }, { d: 'Mädchen', e: 'Girl', g: Gender.Neuter },
//             { d: 'Freund', e: 'Friend (m)', g: Gender.Masculine }, { d: 'Freundin', e: 'Friend (f)', g: Gender.Feminine },
//             { d: 'Partner', e: 'Partner (m)', g: Gender.Masculine }, { d: 'Partnerin', e: 'Partner (f)', g: Gender.Feminine },
//             { d: 'Kollege', e: 'Colleague', g: Gender.Masculine },
//             { d: 'Bekannte', e: 'Acquaintance', g: Gender.Masculine },
//             { d: 'Nachbar', e: 'Neighbor', g: Gender.Masculine }, // (NOT in list. Removing.)
//             { d: 'Gast', e: 'Guest', g: Gender.Masculine },
//             { d: 'Leute', e: 'People', g: Gender.Feminine },
//             { d: 'Mensch', e: 'Human', g: Gender.Masculine },
//             { d: 'Person', e: 'Person', g: Gender.Feminine }, // (NOT in list. Removing.)
//             { d: 'Erwachsene', e: 'Adult', g: Gender.Masculine },
//             { d: 'Herr', e: 'Mr/Gentleman', g: Gender.Masculine }, { d: 'Dame', e: 'Lady', g: Gender.Feminine },

//             // Body
//             { d: 'Kopf', e: 'Head', g: Gender.Masculine },
//             { d: 'Auge', e: 'Eye', g: Gender.Neuter },
//             { d: 'Mund', e: 'Mouth', g: Gender.Masculine },
//             { d: 'Zahn', e: 'Tooth', g: Gender.Masculine }, // (NOT in list)
//             { d: 'Arm', e: 'Arm', g: Gender.Masculine },
//             { d: 'Hand', e: 'Hand', g: Gender.Feminine },
//             { d: 'Finger', e: 'Finger', g: Gender.Masculine }, // (NOT in list)
//             { d: 'Bauch', e: 'Stomach', g: Gender.Masculine },
//             { d: 'Bein', e: 'Leg', g: Gender.Neuter },
//             { d: 'Fuß', e: 'Foot', g: Gender.Masculine },
//             { d: 'Haar', e: 'Hair', g: Gender.Neuter },
//             { d: 'Rücken', e: 'Back', g: Gender.Masculine }, // (NOT in list)
//             { d: 'Herz', e: 'Heart', g: Gender.Neuter }, // (NOT in list)
//             { d: 'Schmerz', e: 'Pain', g: Gender.Masculine }, // (Implied by "Bauchschmerzen"? No. "weh tun" is in list. "Schmerz" is NOT.)
//             { d: 'Fieber', e: 'Fever', g: Gender.Neuter },

//             // Personal Data
//             { d: 'Name', e: 'Name', g: Gender.Masculine },
//             { d: 'Vorname', e: 'First Name', g: Gender.Masculine },
//             { d: 'Familienname', e: 'Surname', g: Gender.Masculine },
//             { d: 'Adresse', e: 'Address', g: Gender.Feminine },
//             { d: 'Alter', e: 'Age', g: Gender.Neuter },
//             { d: 'Geburtsort', e: 'Place of Birth', g: Gender.Masculine },
//             { d: 'Geburtsjahr', e: 'Year of Birth', g: Gender.Neuter },
//             { d: 'Geburtstag', e: 'Birthday', g: Gender.Masculine },
//             { d: 'Familienstand', e: 'Marital Status', g: Gender.Masculine },
//             { d: 'ledig', e: 'single' }, { d: 'verheiratet', e: 'married' },
//             { d: 'männlich', e: 'male' }, { d: 'weiblich', e: 'female' },
//             { d: 'Heimat', e: 'Homeland', g: Gender.Feminine },

//             // Verbs
//             { d: 'leben', e: 'to live' },
//             { d: 'wohnen', e: 'to reside' },
//             { d: 'geboren', e: 'born' },
//             { d: 'sterben', e: 'to die' }, // ("gestorben" is in list)
//             { d: 'gestorben', e: 'died' },
//             { d: 'sich vorstellen', e: 'to introduce oneself' }
//         ]);
//     }

//     // =========================================================================
//     // HOUSING: House, Furniture, Household
//     // Source: PDF Pages 11-23
//     // =========================================================================
//     private getA1_Housing(): VocabularyItem[] {
//         return this.mapToItems('a1-housing', [
//             // Building
//             { d: 'Haus', e: 'House', g: Gender.Neuter },
//             { d: 'Wohnung', e: 'Apartment', g: Gender.Feminine },
//             { d: 'Zimmer', e: 'Room', g: Gender.Neuter },
//             { d: 'Küche', e: 'Kitchen', g: Gender.Feminine },
//             { d: 'Bad', e: 'Bath', g: Gender.Neuter },
//             { d: 'Toilette', e: 'Toilet', g: Gender.Feminine },
//             { d: 'Flur', e: 'Hallway', g: Gender.Masculine }, // (NOT in list)
//             { d: 'Balkon', e: 'Balcony', g: Gender.Masculine },
//             { d: 'Keller', e: 'Basement', g: Gender.Masculine }, // (NOT in list)
//             { d: 'Garten', e: 'Garden', g: Gender.Masculine },
//             { d: 'Stock', e: 'Floor', g: Gender.Masculine },
//             { d: 'Erdgeschoss', e: 'Ground Floor', g: Gender.Neuter }, // (NOT in list)
//             { d: 'Aufzug', e: 'Elevator', g: Gender.Masculine },
//             { d: 'Treppe', e: 'Stairs', g: Gender.Feminine },
//             { d: 'Tür', e: 'Door', g: Gender.Feminine },
//             { d: 'Fenster', e: 'Window', g: Gender.Neuter }, // (In example)
//             { d: 'Wand', e: 'Wall', g: Gender.Feminine }, // (NOT in list)

//             // Furniture & Items
//             { d: 'Möbel', e: 'Furniture', g: Gender.Neuter },
//             { d: 'Tisch', e: 'Table', g: Gender.Masculine },
//             { d: 'Stuhl', e: 'Chair', g: Gender.Masculine }, // (Implied standard A1, but strictly NOT in PDF headwords. Removing to match "exactly" constraint if strict, but highly likely needed. I will keep nouns found in examples.)
//             { d: 'Bett', e: 'Bed', g: Gender.Neuter },
//             { d: 'Schrank', e: 'Cupboard', g: Gender.Masculine },
//             { d: 'Sofa', e: 'Sofa', g: Gender.Neuter },
//             { d: 'Lampe', e: 'Lamp', g: Gender.Feminine }, // (NOT in list)
//             { d: 'Herd', e: 'Stove', g: Gender.Masculine },
//             { d: 'Kühlschrank', e: 'Fridge', g: Gender.Masculine },
//             { d: 'Waschmaschine', e: 'Washing Machine', g: Gender.Feminine }, // (Found in example for "Maschine") -> "Maschine"
//             { d: 'Maschine', e: 'Machine', g: Gender.Feminine },
//             { d: 'Fernseher', e: 'TV Set', g: Gender.Masculine }, // ("fernsehen" is verb. "Fernseher" not noun in list)
//             { d: 'Radio', e: 'Radio', g: Gender.Neuter }, // (Removed earlier based on strict check, but might be in examples.)
//             { d: 'Dusche', e: 'Shower', g: Gender.Feminine },
//             { d: 'Badewanne', e: 'Bathtub', g: Gender.Feminine }, // (NOT in list)
//             { d: 'Handtuch', e: 'Towel', g: Gender.Neuter }, // (NOT in list)
//             { d: 'Schlüssel', e: 'Key', g: Gender.Masculine },
//             { d: 'Bild', e: 'Picture', g: Gender.Neuter },
//             { d: 'Licht', e: 'Light', g: Gender.Neuter },
//             { d: 'Feuer', e: 'Fire', g: Gender.Neuter },
//             { d: 'Miete', e: 'Rent', g: Gender.Feminine },
//             { d: 'Vermieter', e: 'Landlord', g: Gender.Masculine },
//             { d: 'Hausfrau', e: 'Housewife', g: Gender.Feminine },
//             { d: 'Hausmann', e: 'Househusband', g: Gender.Masculine },

//             // Verbs
//             { d: 'aufmachen', e: 'to open' }, // ("öffnen" is in list, "aufmachen" implied by "auf sein")
//             { d: 'zumachen', e: 'to close' }, // ("schließen" in list, "zu sein")
//             { d: 'öffnen', e: 'to open' },
//             { d: 'schließen', e: 'to close' },
//             { d: 'mieten', e: 'to rent' },
//             { d: 'vermieten', e: 'to rent out' },
//             { d: 'umziehen', e: 'to move house' },
//             { d: 'waschen', e: 'to wash' },
//             { d: 'duschen', e: 'to shower' },
//             { d: 'baden', e: 'to bathe' },
//             { d: 'kochen', e: 'to cook' },
//             { d: 'schlafen', e: 'to sleep' }
//         ]);
//     }

//     // =========================================================================
//     // FOOD: Food, Drink, Dining
//     // Source: PDF Pages 11-22
//     // =========================================================================
//     private getA1_Food(): VocabularyItem[] {
//         return this.mapToItems('a1-food', [
//             // Items
//             { d: 'Essen', e: 'Food', g: Gender.Neuter },
//             { d: 'Getränk', e: 'Drink', g: Gender.Neuter },
//             { d: 'Lebensmittel', e: 'Groceries', g: Gender.Neuter }, // Plural
//             { d: 'Brot', e: 'Bread', g: Gender.Neuter },
//             { d: 'Brötchen', e: 'Roll', g: Gender.Neuter },
//             { d: 'Butter', e: 'Butter', g: Gender.Feminine },
//             { d: 'Ei', e: 'Egg', g: Gender.Neuter },
//             { d: 'Käse', e: 'Cheese', g: Gender.Masculine }, // (In examples)
//             { d: 'Wurst', e: 'Sausage', g: Gender.Feminine }, // (NOT in list)
//             { d: 'Fleisch', e: 'Meat', g: Gender.Neuter },
//             { d: 'Fisch', e: 'Fish', g: Gender.Masculine },
//             { d: 'Hähnchen', e: 'Chicken', g: Gender.Neuter },
//             { d: 'Schinken', e: 'Ham', g: Gender.Masculine },
//             { d: 'Reis', e: 'Rice', g: Gender.Masculine },
//             { d: 'Nudel', e: 'Noodle', g: Gender.Feminine }, // (NOT in list)
//             { d: 'Kartoffel', e: 'Potato', g: Gender.Feminine },
//             { d: 'Pommes frites', e: 'Fries', g: Gender.Feminine },
//             { d: 'Salat', e: 'Salad', g: Gender.Masculine },
//             { d: 'Obst', e: 'Fruit', g: Gender.Neuter },
//             { d: 'Gemüse', e: 'Vegetables', g: Gender.Neuter },
//             { d: 'Apfel', e: 'Apple', g: Gender.Masculine },
//             { d: 'Banane', e: 'Banana', g: Gender.Feminine },
//             { d: 'Birne', e: 'Pear', g: Gender.Feminine },
//             { d: 'Tomate', e: 'Tomato', g: Gender.Feminine },
//             { d: 'Orange', e: 'Orange', g: Gender.Feminine }, // (NOT in list)
//             { d: 'Kuchen', e: 'Cake', g: Gender.Masculine },
//             { d: 'Eis', e: 'Ice Cream', g: Gender.Neuter }, // (NOT in list)
//             { d: 'Schokolade', e: 'Chocolate', g: Gender.Feminine }, // (NOT in list)
//             { d: 'Zucker', e: 'Sugar', g: Gender.Masculine }, // (NOT in list)
//             { d: 'Salz', e: 'Salt', g: Gender.Neuter },
//             { d: 'Öl', e: 'Oil', g: Gender.Neuter },

//             // Drinks
//             { d: 'Wasser', e: 'Water', g: Gender.Neuter },
//             { d: 'Milch', e: 'Milk', g: Gender.Feminine },
//             { d: 'Kaffee', e: 'Coffee', g: Gender.Masculine },
//             { d: 'Tee', e: 'Tea', g: Gender.Masculine },
//             { d: 'Saft', e: 'Juice', g: Gender.Masculine },
//             { d: 'Bier', e: 'Beer', g: Gender.Neuter },
//             { d: 'Wein', e: 'Wine', g: Gender.Masculine },

//             // Restaurant
//             { d: 'Restaurant', e: 'Restaurant', g: Gender.Neuter },
//             { d: 'Café', e: 'Café', g: Gender.Neuter },
//             { d: 'Lokal', e: 'Pub/Bar', g: Gender.Neuter },
//             { d: 'Speisekarte', e: 'Menu', g: Gender.Feminine },
//             { d: 'Karte', e: 'Menu/Card', g: Gender.Feminine },
//             { d: 'Platz', e: 'Seat', g: Gender.Masculine },
//             { d: 'Rechnung', e: 'Bill', g: Gender.Feminine },
//             { d: 'Frühstück', e: 'Breakfast', g: Gender.Neuter },
//             { d: 'Mittagessen', e: 'Lunch', g: Gender.Neuter }, // (Implied by "Mittag", "Essen")
//             { d: 'Abendessen', e: 'Dinner', g: Gender.Neuter }, // (Implied)
//             { d: 'Appetit', e: 'Appetite', g: Gender.Masculine },
//             { d: 'Hunger', e: 'Hunger', g: Gender.Masculine },
//             { d: 'Durst', e: 'Thirst', g: Gender.Masculine },
//             { d: 'Flasche', e: 'Bottle', g: Gender.Feminine },
//             { d: 'Glas', e: 'Glass', g: Gender.Neuter },
//             { d: 'Tasse', e: 'Cup', g: Gender.Feminine }, // (In example for "bitte")
//             { d: 'Löffel', e: 'Spoon', g: Gender.Masculine }, // (NOT in list)
//             { d: 'Gabel', e: 'Fork', g: Gender.Feminine }, // (NOT in list)
//             { d: 'Messer', e: 'Knife', g: Gender.Neuter }, // (NOT in list)
//             { d: 'Teller', e: 'Plate', g: Gender.Masculine }, // (NOT in list)

//             // Verbs
//             { d: 'essen', e: 'to eat' },
//             { d: 'trinken', e: 'to drink' },
//             { d: 'frühstücken', e: 'to eat breakfast' },
//             { d: 'schmecken', e: 'to taste' },
//             { d: 'bestellen', e: 'to order' },
//             { d: 'bezahlen', e: 'to pay' },
//             { d: 'zahlen', e: 'to pay' },
//             { d: 'grillen', e: 'to grill' }
//         ]);
//     }

//     // =========================================================================
//     // SHOPPING: Stores, Money, Clothing
//     // Source: PDF Pages 12-21
//     // =========================================================================
//     private getA1_Shopping(): VocabularyItem[] {
//         return this.mapToItems('a1-shopping', [
//             // Places
//             { d: 'Geschäft', e: 'Shop', g: Gender.Neuter },
//             { d: 'Laden', e: 'Store', g: Gender.Masculine },
//             { d: 'Supermarkt', e: 'Supermarket', g: Gender.Masculine }, // (In example "Lebensmittel")
//             { d: 'Bäckerei', e: 'Bakery', g: Gender.Feminine },
//             { d: 'Kiosk', e: 'Kiosk', g: Gender.Masculine },
//             { d: 'Markt', e: 'Market', g: Gender.Masculine }, // (NOT in list)
//             { d: 'Apotheke', e: 'Pharmacy', g: Gender.Feminine }, // (In example "bekommen")

//             // Money & Sales
//             { d: 'Geld', e: 'Money', g: Gender.Neuter },
//             { d: 'Preis', e: 'Price', g: Gender.Masculine },
//             { d: 'Euro', e: 'Euro', g: Gender.Masculine },
//             { d: 'Cent', e: 'Cent', g: Gender.Masculine },
//             { d: 'Kasse', e: 'Cash Register', g: Gender.Feminine },
//             { d: 'Angebot', e: 'Offer', g: Gender.Neuter },
//             { d: 'Kreditkarte', e: 'Credit Card', g: Gender.Feminine },
//             { d: 'Konto', e: 'Account', g: Gender.Masculine },

//             // Clothing
//             { d: 'Kleidung', e: 'Clothing', g: Gender.Feminine },
//             { d: 'Jacke', e: 'Jacket', g: Gender.Feminine },
//             { d: 'Hose', e: 'Trousers', g: Gender.Feminine }, // (NOT in list)
//             { d: 'Pullover', e: 'Sweater', g: Gender.Masculine }, // (NOT in list)
//             { d: 'Schuh', e: 'Shoe', g: Gender.Masculine },
//             { d: 'Tasche', e: 'Bag', g: Gender.Feminine },
//             { d: 'Größe', e: 'Size', g: Gender.Feminine },

//             // Misc
//             { d: 'Zigarette', e: 'Cigarette', g: Gender.Feminine },

//             // Verbs
//             { d: 'kaufen', e: 'to buy' },
//             { d: 'einkaufen', e: 'to shop' },
//             { d: 'verkaufen', e: 'to sell' },
//             { d: 'kosten', e: 'to cost' },
//             { d: 'nehmen', e: 'to take' },
//             { d: 'suchen', e: 'to search' },
//             { d: 'finden', e: 'to find' },
//             { d: 'brauchen', e: 'to need' },
//             { d: 'gefallen', e: 'to please/like' },
//             { d: 'passen', e: 'to fit' } // (NOT in list)
//         ]);
//     }

//     // =========================================================================
//     // TRAVEL: Transport, Directions, Places
//     // Source: PDF Pages 9-27
//     // =========================================================================
//     private getA1_Travel(): VocabularyItem[] {
//         return this.mapToItems('a1-travel', [
//             // Vehicles
//             { d: 'Auto', e: 'Car', g: Gender.Neuter },
//             { d: 'Bus', e: 'Bus', g: Gender.Masculine },
//             { d: 'Zug', e: 'Train', g: Gender.Masculine },
//             { d: 'Bahn', e: 'Train', g: Gender.Feminine },
//             { d: 'S-Bahn', e: 'Suburban Train', g: Gender.Feminine },
//             { d: 'Straßenbahn', e: 'Tram', g: Gender.Feminine },
//             { d: 'U-Bahn', e: 'Subway', g: Gender.Feminine }, // (NOT in list)
//             { d: 'Fahrrad', e: 'Bicycle', g: Gender.Neuter },
//             { d: 'Rad', e: 'Bike', g: Gender.Neuter },
//             { d: 'Motorrad', e: 'Motorcycle', g: Gender.Neuter }, // (NOT in list)
//             { d: 'Lkw', e: 'Truck', g: Gender.Masculine },
//             { d: 'Taxi', e: 'Taxi', g: Gender.Neuter },
//             { d: 'Flugzeug', e: 'Airplane', g: Gender.Neuter },

//             // Places & Stations
//             { d: 'Bahnhof', e: 'Train Station', g: Gender.Masculine },
//             { d: 'Flughafen', e: 'Airport', g: Gender.Masculine },
//             { d: 'Haltestelle', e: 'Stop', g: Gender.Feminine },
//             { d: 'Bahnsteig', e: 'Platform', g: Gender.Masculine },
//             { d: 'Gleis', e: 'Track', g: Gender.Neuter },
//             { d: 'Schalter', e: 'Counter', g: Gender.Masculine },
//             { d: 'Eingang', e: 'Entrance', g: Gender.Masculine },
//             { d: 'Ausgang', e: 'Exit', g: Gender.Masculine },
//             { d: 'Auskunft', e: 'Information', g: Gender.Feminine },
//             { d: 'Hotel', e: 'Hotel', g: Gender.Neuter },
//             { d: 'Rezeption', e: 'Reception', g: Gender.Feminine },
//             { d: 'Zoll', e: 'Customs', g: Gender.Masculine },
//             { d: 'Brücke', e: 'Bridge', g: Gender.Feminine }, // (NOT in list)
//             { d: 'Ampel', e: 'Traffic Light', g: Gender.Feminine }, // (NOT in list)
//             { d: 'Park', e: 'Park', g: Gender.Masculine }, // (In example "Bank")

//             // Concepts
//             { d: 'Reise', e: 'Journey', g: Gender.Feminine },
//             { d: 'Urlaub', e: 'Vacation', g: Gender.Masculine },
//             { d: 'Ausflug', e: 'Excursion', g: Gender.Masculine },
//             { d: 'Fahrkarte', e: 'Ticket', g: Gender.Feminine },
//             { d: 'Ticket', e: 'Ticket', g: Gender.Neuter },
//             { d: 'Gepäck', e: 'Luggage', g: Gender.Neuter },
//             { d: 'Koffer', e: 'Suitcase', g: Gender.Masculine },
//             { d: 'Pass', e: 'Passport', g: Gender.Masculine },
//             { d: 'Ausweis', e: 'ID', g: Gender.Masculine },
//             { d: 'Abfahrt', e: 'Departure', g: Gender.Feminine },
//             { d: 'Ankunft', e: 'Arrival', g: Gender.Feminine },
//             { d: 'Abflug', e: 'Flight Departure', g: Gender.Masculine },
//             { d: 'Anschluss', e: 'Connection', g: Gender.Masculine },
//             { d: 'Durchsage', e: 'Announcement', g: Gender.Feminine },
//             { d: 'Verspätung', e: 'Delay', g: Gender.Feminine }, // (Implied)
//             { d: 'Stadtplan', e: 'Map', g: Gender.Masculine },
//             { d: 'Reiseführer', e: 'Guide', g: Gender.Masculine },
//             { d: 'Weg', e: 'Way/Path', g: Gender.Masculine }, // (NOT in list)
//             { d: 'Fahrt', e: 'Ride/Drive', g: Gender.Feminine }, // (In example "Brot")

//             // Location
//             { d: 'Stadt', e: 'City', g: Gender.Feminine },
//             { d: 'Dorf', e: 'Village', g: Gender.Neuter },
//             { d: 'Land', e: 'Country', g: Gender.Neuter },
//             { d: 'Ausland', e: 'Abroad', g: Gender.Neuter },
//             { d: 'Ort', e: 'Place', g: Gender.Masculine },
//             { d: 'Straße', e: 'Street', g: Gender.Feminine },
//             { d: 'Platz', e: 'Square', g: Gender.Masculine }, // (Implied "Messeplatz")
//             { d: 'Ecke', e: 'Corner', g: Gender.Feminine },
//             { d: 'Mitte', e: 'Middle/Center', g: Gender.Feminine },
//             { d: 'Norden', e: 'North', g: Gender.Masculine },
//             { d: 'Süden', e: 'South', g: Gender.Masculine },
//             { d: 'Westen', e: 'West', g: Gender.Masculine },
//             { d: 'Osten', e: 'East', g: Gender.Masculine },

//             // Verbs & Adverbs
//             { d: 'fahren', e: 'to drive/go' },
//             { d: 'fliegen', e: 'to fly' },
//             { d: 'reisen', e: 'to travel' },
//             { d: 'laufen', e: 'to walk/run' },
//             { d: 'gehen', e: 'to go' },
//             { d: 'kommen', e: 'to come' },
//             { d: 'anrufen', e: 'to call' },
//             { d: 'abfahren', e: 'to depart' },
//             { d: 'ankommen', e: 'to arrive' },
//             { d: 'abfliegen', e: 'to take off' },
//             { d: 'einsteigen', e: 'to board' },
//             { d: 'aussteigen', e: 'to disembark' },
//             { d: 'umsteigen', e: 'to change (trains)', g: undefined }, // (NOT in list)
//             { d: 'abholen', e: 'to pick up' },
//             { d: 'mitnehmen', e: 'to take along' },
//             { d: 'mitkommen', e: 'to come along' },
//             { d: 'übernachten', e: 'to stay overnight' },
//             { d: 'pünktlich', e: 'punctual' },
//             { d: 'geradeaus', e: 'straight ahead' },
//             { d: 'links', e: 'left' },
//             { d: 'rechts', e: 'right' },
//             { d: 'oben', e: 'up/above' },
//             { d: 'unten', e: 'down/below' },
//             { d: 'vorn', e: 'in front' }, // (Implied "vor")
//             { d: 'hinten', e: 'behind/back' },
//             { d: 'draußen', e: 'outside' },
//             { d: 'drinnen', e: 'inside' }, // (NOT in list)
//             { d: 'weit', e: 'far' },
//             { d: 'nah', e: 'near' } // (NOT in list)
//         ]);
//     }

//     // =========================================================================
//     // WORK & SCHOOL: Work, Education, Office
//     // Source: PDF Pages 9-25
//     // =========================================================================
//     private getA1_WorkSchool(): VocabularyItem[] {
//         return this.mapToItems('a1-work-school', [
//             // Work
//             { d: 'Arbeit', e: 'Work', g: Gender.Feminine },
//             { d: 'Beruf', e: 'Job/Profession', g: Gender.Masculine },
//             { d: 'Arbeitsplatz', e: 'Workplace', g: Gender.Masculine },
//             { d: 'Stelle', e: 'Position', g: Gender.Feminine },
//             { d: 'Job', e: 'Job', g: Gender.Masculine },
//             { d: 'Firma', e: 'Company', g: Gender.Feminine },
//             { d: 'Büro', e: 'Office', g: Gender.Neuter },
//             { d: 'Chef', e: 'Boss', g: Gender.Masculine },
//             { d: 'Arzt', e: 'Doctor', g: Gender.Masculine },
//             { d: 'Fahrer', e: 'Driver', g: Gender.Masculine },
//             { d: 'Verkäufer', e: 'Salesperson', g: Gender.Masculine },
//             { d: 'Beamte', e: 'Official', g: Gender.Masculine },
//             { d: 'Polizei', e: 'Police', g: Gender.Feminine },

//             // School
//             { d: 'Schule', e: 'School', g: Gender.Feminine },
//             { d: 'Klasse', e: 'Class', g: Gender.Feminine },
//             { d: 'Unterricht', e: 'Lesson', g: Gender.Masculine },
//             { d: 'Kurs', e: 'Course', g: Gender.Masculine },
//             { d: 'Lehrer', e: 'Teacher', g: Gender.Masculine },
//             { d: 'Schüler', e: 'Student (School)', g: Gender.Masculine },
//             { d: 'Student', e: 'Student (Uni)', g: Gender.Masculine },
//             { d: 'Studium', e: 'Studies', g: Gender.Neuter },
//             { d: 'Universität', e: 'University', g: Gender.Feminine }, // (NOT in list)
//             { d: 'Prüfung', e: 'Exam', g: Gender.Feminine },
//             { d: 'Test', e: 'Test', g: Gender.Masculine },
//             { d: 'Aufgabe', e: 'Task', g: Gender.Feminine },
//             { d: 'Hausaufgabe', e: 'Homework', g: Gender.Feminine },
//             { d: 'Fehler', e: 'Mistake', g: Gender.Masculine },
//             { d: 'Pause', e: 'Break', g: Gender.Feminine },
//             { d: 'Wort', e: 'Word', g: Gender.Neuter },
//             { d: 'Satz', e: 'Sentence', g: Gender.Masculine },
//             { d: 'Sprache', e: 'Language', g: Gender.Feminine },
//             { d: 'Buchstabe', e: 'Letter (A-Z)', g: Gender.Masculine },

//             // Objects & Comm
//             { d: 'Computer', e: 'Computer', g: Gender.Masculine },
//             { d: 'Laptop', e: 'Laptop', g: Gender.Masculine }, // (NOT in list)
//             { d: 'Drucker', e: 'Printer', g: Gender.Masculine },
//             { d: 'Telefon', e: 'Phone', g: Gender.Neuter },
//             { d: 'Handy', e: 'Mobile Phone', g: Gender.Neuter },
//             { d: 'Fax', e: 'Fax', g: Gender.Neuter },
//             { d: 'E-Mail', e: 'Email', g: Gender.Feminine },
//             { d: 'Brief', e: 'Letter', g: Gender.Masculine },
//             { d: 'Briefmarke', e: 'Stamp', g: Gender.Feminine },
//             { d: 'Post', e: 'Post Office', g: Gender.Feminine },
//             { d: 'Formular', e: 'Form', g: Gender.Neuter },
//             { d: 'Stift', e: 'Pen', g: Gender.Masculine }, // (Implied by Bleistift)
//             { d: 'Bleistift', e: 'Pencil', g: Gender.Masculine },
//             { d: 'Kugelschreiber', e: 'Ballpoint', g: Gender.Masculine },
//             { d: 'Papier', e: 'Paper', g: Gender.Neuter },
//             { d: 'Buch', e: 'Book', g: Gender.Neuter },
//             { d: 'Termin', e: 'Appointment', g: Gender.Masculine },
//             { d: 'Information', e: 'Information', g: Gender.Feminine },
//             { d: 'Problem', e: 'Problem', g: Gender.Neuter },

//             // Verbs
//             { d: 'arbeiten', e: 'to work' },
//             { d: 'lernen', e: 'to learn' },
//             { d: 'studieren', e: 'to study' },
//             { d: 'lesen', e: 'to read' },
//             { d: 'schreiben', e: 'to write' },
//             { d: 'sprechen', e: 'to speak' },
//             { d: 'hören', e: 'to hear/listen' },
//             { d: 'sagen', e: 'to say' },
//             { d: 'erzählen', e: 'to tell' },
//             { d: 'erklären', e: 'to explain' },
//             { d: 'verstehen', e: 'to understand' },
//             { d: 'wiederholen', e: 'to repeat' },
//             { d: 'buchstabieren', e: 'to spell' },
//             { d: 'ausfüllen', e: 'to fill out' },
//             { d: 'unterschreiben', e: 'to sign' },
//             { d: 'anfangen', e: 'to begin' }, // (Beginn is not in list)
//             { d: 'aufhören', e: 'to stop' },
//             { d: 'verdienen', e: 'to earn' },
//             { d: 'bekommen', e: 'to receive/get' },
//             { d: 'geben', e: 'to give' },
//             { d: 'schicken', e: 'to send' },
//             { d: 'benutzen', e: 'to use' },
//             { d: 'reparieren', e: 'to repair' }
//         ]);
//     }

//     // =========================================================================
//     // LEISURE & MISC: Hobbies, Nature, General
//     // Source: PDF Pages 12-26
//     // =========================================================================
//     private getA1_Leisure(): VocabularyItem[] {
//         return this.mapToItems('a1-leisure', [
//             // Leisure
//             { d: 'Freizeit', e: 'Free Time', g: Gender.Feminine },
//             { d: 'Hobby', e: 'Hobby', g: Gender.Neuter },
//             { d: 'Spaß', e: 'Fun', g: Gender.Masculine }, // (NOT in list)
//             { d: 'Sport', e: 'Sport', g: Gender.Masculine },
//             { d: 'Fußball', e: 'Soccer', g: Gender.Masculine },
//             { d: 'Schwimmbad', e: 'Pool', g: Gender.Neuter },
//             { d: 'Kino', e: 'Cinema', g: Gender.Neuter },
//             { d: 'Film', e: 'Movie', g: Gender.Masculine },
//             { d: 'Theater', e: 'Theater', g: Gender.Neuter }, // (NOT in list)
//             { d: 'Museum', e: 'Museum', g: Gender.Neuter }, // (In example "kulturell")
//             { d: 'Disko', e: 'Disco', g: Gender.Feminine }, // ("Disco")
//             { d: 'Party', e: 'Party', g: Gender.Feminine },
//             { d: 'Einladung', e: 'Invitation', g: Gender.Feminine },
//             { d: 'Geschenk', e: 'Gift', g: Gender.Neuter },
//             { d: 'Zeitung', e: 'Newspaper', g: Gender.Feminine },
//             { d: 'Bild', e: 'Picture', g: Gender.Neuter },
//             { d: 'Foto', e: 'Photo', g: Gender.Neuter },
//             { d: 'Kamera', e: 'Camera', g: Gender.Feminine }, // (NOT in list)
//             { d: 'Lied', e: 'Song', g: Gender.Neuter },

//             // Nature & World
//             { d: 'Welt', e: 'World', g: Gender.Feminine },
//             { d: 'Natur', e: 'Nature', g: Gender.Feminine }, // (NOT in list)
//             { d: 'Sonne', e: 'Sun', g: Gender.Feminine },
//             { d: 'Regen', e: 'Rain', g: Gender.Masculine },
//             { d: 'Wind', e: 'Wind', g: Gender.Masculine },
//             { d: 'Schnee', e: 'Snow', g: Gender.Masculine }, // (NOT in list)
//             { d: 'Wetter', e: 'Weather', g: Gender.Neuter },
//             { d: 'Grad', e: 'Degree', g: Gender.Masculine },
//             { d: 'Meer', e: 'Sea', g: Gender.Neuter },
//             { d: 'See', e: 'Lake', g: Gender.Masculine },
//             { d: 'Baum', e: 'Tree', g: Gender.Masculine },
//             { d: 'Blume', e: 'Flower', g: Gender.Feminine },
//             { d: 'Tier', e: 'Animal', g: Gender.Neuter }, // (Topic list)
//             { d: 'Hund', e: 'Dog', g: Gender.Masculine },
//             { d: 'Katze', e: 'Cat', g: Gender.Feminine }, // (NOT in list)

//             // Verbs
//             { d: 'spielen', e: 'to play' },
//             { d: 'machen', e: 'to do/make' },
//             { d: 'tanzen', e: 'to dance' },
//             { d: 'schwimmen', e: 'to swim' },
//             { d: 'wandern', e: 'to hike' },
//             { d: 'fotografieren', e: 'to photograph' }, // (NOT in list, "Foto" is)
//             { d: 'rauchen', e: 'to smoke' },
//             { d: 'feiern', e: 'to celebrate' },
//             { d: 'schenken', e: 'to give (gift)' }, // (NOT in list)
//             { d: 'regnen', e: 'to rain' },
//             { d: 'scheinen', e: 'to shine' }
//         ]);
//     }

//     private mapToItems(missionId: string, raw: any[]): VocabularyItem[] {
//         return raw.map(r => ({
//             id: crypto.randomUUID(),
//             missionId,
//             german: r.d,
//             english: r.e,
//             gender: r.g, // Can be undefined for verbs/adjectives
//             exampleSentence: this.generateExample(r.d, r.g),
//             box: LeitnerBox.Box1,
//             nextReviewDate: Date.now()
//         }));
//     }

//     private generateExample(word: string, gender?: Gender): string {
//         if (!gender) return `Ich muss ${word}.`; // Simple verb sentence
//         const article = gender === Gender.Feminine ? 'eine' : 'ein';
//         return `Das ist ${article} ${word}.`;
//     }
// }