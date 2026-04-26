import { Routes } from '@angular/router';
import { DashboardComponent } from './features/dashboard/dashboard.component';
import { LearningComponent } from './features/learning/learning.component';
import { LevelDetailComponent } from './features/curriculum/level-detail.component';
import { DictionaryComponent } from './features/dictionary/dictionary.component';
import { ReviewStatsComponent } from './features/review-stats/review-stats.component';

export const routes: Routes = [
    { path: '', component: DashboardComponent },
    { path: 'level/:id', component: LevelDetailComponent },
    { path: 'learn', component: LearningComponent },
    { path: 'review', component: ReviewStatsComponent },
    { path: 'library', component: DictionaryComponent },
    { path: '**', redirectTo: '' }
];