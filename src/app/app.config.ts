import { ApplicationConfig, provideZoneChangeDetection, provideAppInitializer, inject, isDevMode } from '@angular/core';
import { provideRouter, withComponentInputBinding, withViewTransitions } from '@angular/router';

import { routes } from './app.routes';
import { VocabularyRepository } from './core/repositories/vocabulary.repository';
import { provideServiceWorker } from '@angular/service-worker';
import { provideHttpClient, withFetch } from '@angular/common/http';
import { ContentSyncService } from './core/services/content-sync.service';
import { IdbVocabularyRepository } from './core/repositories/idb-vocabulary.repository';

export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(routes, withComponentInputBinding(), withViewTransitions()),
    provideHttpClient(withFetch()),
    { provide: VocabularyRepository, useClass: IdbVocabularyRepository },

    provideAppInitializer(() => {
      const syncer = inject(ContentSyncService);
      return syncer.sync();
    }),
    provideServiceWorker('ngsw-worker.js', {
      enabled: !isDevMode(),
      registrationStrategy: 'registerWhenStable:30000'
    }),
  ]
};