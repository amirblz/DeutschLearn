import { Routes } from '@angular/router';
import { DashboardComponent } from './features/curriculum/dashboard.component';
import { LearningComponent } from './features/learning/learning.component';
import { LevelDetailComponent } from './features/curriculum/level-detail.component';
import { ReviewStatsComponent } from './features/curriculum/review-stats.component';

export const routes: Routes = [
    { path: '', component: DashboardComponent },
    { path: 'level/:id', component: LevelDetailComponent },
    { path: 'learn', component: LearningComponent },
    { path: 'review', component: ReviewStatsComponent },
    { path: '**', redirectTo: '' }
];