import { Routes } from '@angular/router';
import { DashboardComponent } from './features/curriculum/dashboard.component';
import { LearningComponent } from './features/learning/learning.component';
import { LevelDetailComponent } from './features/curriculum/level-detail.component';

export const routes: Routes = [
    { path: '', component: DashboardComponent },
    { path: 'level/:id', component: LevelDetailComponent },
    { path: 'learn', component: LearningComponent },
    { path: '**', redirectTo: '' }
];