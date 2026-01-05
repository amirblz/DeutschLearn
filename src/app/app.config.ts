import { ApplicationConfig, provideZoneChangeDetection, provideAppInitializer, inject, isDevMode } from '@angular/core';
import { provideRouter, withComponentInputBinding, withViewTransitions } from '@angular/router';

import { routes } from './app.routes';
import { VocabularyRepository } from './core/repositories/vocabulary.repository';
import { IdbVocabularyRepository } from './infrastructure/repositories/idb-vocabulary.repository';
import { DataSeederService } from './infrastructure/seeder/data-seeder.service';
import { provideServiceWorker } from '@angular/service-worker';

export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(routes, withComponentInputBinding(), withViewTransitions()),

    // --- Clean Architecture Binding ---
    // Interface -> Implementation
    { provide: VocabularyRepository, useClass: IdbVocabularyRepository },

    // --- Data Seeding (Modern) ---
    // Runs in an injection context, so we can use inject() directly.
    provideAppInitializer(() => {
      const seeder = inject(DataSeederService);
      return seeder.seedIfEmpty();
    }),
    provideServiceWorker('ngsw-worker.js', {
      enabled: !isDevMode(),
      registrationStrategy: 'registerWhenStable:30000'
    }),
  ]
};