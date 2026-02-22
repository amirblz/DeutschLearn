import { Component, inject, signal, computed, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { ReactiveFormsModule, FormControl } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { VocabularyRepository } from '../../core/repositories/vocabulary.repository';
import { VocabularyItem } from '../../core/models/vocabulary.model';
import { FlipCardComponent } from '../../shared/ui/flip-card/flip-card.component';

@Component({
  selector: 'app-library',
  imports: [ReactiveFormsModule, FlipCardComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="library-container">
      <header class="search-header glass">
        <div class="search-bar">
          <svg class="search-icon" aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="11" cy="11" r="8"></circle>
            <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
          </svg>
          
          <input 
            type="text" 
            aria-label="Search German or English"
            placeholder="Search German or English..." 
            [formControl]="searchControl"
            autocomplete="off">
          
          @if (query().length > 0) {
            <button class="clear-btn" aria-label="Clear search" (click)="clearSearch()">✕</button>
          }
        </div>
      </header>

      <div class="results-area" role="region" aria-live="polite">
        @if (filteredItems().length === 0) {
          <div class="empty-state">
            <div class="empty-icon" aria-hidden="true">🔍</div>
            <h3>{{ query().length === 0 ? 'Explore your words' : 'No matches found' }}</h3>
            <p>
              {{ query().length === 0 
                 ? 'Type above to find any word in your collection.' 
                 : 'Try searching for a different term.' }}
            </p>
          </div>
        }

        <div class="card-grid">
          @for (item of filteredItems(); track item.id) {
            <div class="card-wrapper">
              <app-flip-card 
                [item]="item" 
                [isFlipped]="flippedState().has(item.id)" 
                mode="DE_TO_EN"
                (click)="toggleCard(item.id)">
              </app-flip-card>
            </div>
          }
        </div>
      </div>
    </div>
  `,
  // ... (Keep exact styles)
  styles: [`/* Styles remain identical */`]
})
export class DictionaryComponent implements OnInit {
  private repository = inject(VocabularyRepository);

  allItems = signal<VocabularyItem[]>([]);
  query = signal<string>('');
  flippedState = signal<Set<string>>(new Set());

  searchControl = new FormControl('', { nonNullable: true });

  constructor() {
    this.searchControl.valueChanges.pipe(takeUntilDestroyed()).subscribe(val => {
      this.query.set(val);
    });
  }

  ngOnInit() {
    this.loadData();
  }

  async loadData() {
    const data = await this.repository.getAll();
    data.sort((a, b) => a.german.localeCompare(b.german));
    this.allItems.set(data);
  }

  clearSearch() {
    this.searchControl.setValue('');
  }

  toggleCard(id: string) {
    this.flippedState.update(set => {
      const updatedSet = new Set(set);
      if (updatedSet.has(id)) {
        updatedSet.delete(id);
      } else {
        updatedSet.add(id);
      }
      return updatedSet;
    });
  }

  filteredItems = computed(() => {
    const currentQuery = this.query().toLowerCase().trim();
    const all = this.allItems();

    if (!currentQuery) return [];

    return all.filter(item => {
      const matchGerman = item.german.toLowerCase().startsWith(currentQuery);
      const matchEnglish = item.english.toLowerCase().startsWith(currentQuery);
      return matchGerman || matchEnglish;
    });
  });
}