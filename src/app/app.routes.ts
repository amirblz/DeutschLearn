import { Routes } from '@angular/router';

export const routes: Routes = [
    {
        path: '',
        redirectTo: 'dashboard',
        pathMatch: 'full'
    },
    {
        path: 'dashboard',
        // Lazy load the Curriculum/Dashboard component
        loadComponent: () =>
            import('./features/curriculum/dashboard.component').then(m => m.DashboardComponent),
        title: 'My Library | German PWA'
    },
    {
        path: 'learn',
        // Lazy load the Learning Session
        loadComponent: () =>
            import('./features/learning/learning.component').then(m => m.LearningComponent),
        title: 'Study Session | German PWA'
    }
];