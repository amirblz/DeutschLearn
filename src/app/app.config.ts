import { ApplicationConfig, provideZoneChangeDetection, provideAppInitializer, inject, isDevMode } from '@angular/core';
import { provideRouter, withComponentInputBinding, withViewTransitions } from '@angular/router';

import { routes } from './app.routes';
import { VocabularyRepository } from './core/repositories/vocabulary.repository';
import { IdbVocabularyRepository } from './infrastructure/repositories/idb-vocabulary.repository';
import { provideServiceWorker } from '@angular/service-worker';
import { provideHttpClient, withFetch } from '@angular/common/http';
import { ContentSyncService } from './infrastructure/sync/content-sync.service';

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