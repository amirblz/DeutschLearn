import { Component, inject, signal, computed, OnInit, ChangeDetectionStrategy } from '@angular/core';

import { FormsModule } from '@angular/forms';
import { VocabularyRepository } from '../../core/repositories/vocabulary.repository';
import { VocabularyItem } from '../../core/models/vocabulary.model';
import { FlipCardComponent } from '../../shared/ui/flip-card/flip-card.component';

@Component({
  selector: 'app-library',
  imports: [FormsModule, FlipCardComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="library-container">
      
      <header class="search-header glass">
        <div class="search-bar">
          <svg class="search-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="11" cy="11" r="8"></circle>
            <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
          </svg>
          
          <input 
            type="text" 
            placeholder="Search German or English..." 
            [(ngModel)]="searchQuery" 
            (ngModelChange)="onSearch($event)"
            autocomplete="off">
          
          @if (query().length > 0) {
            <button class="clear-btn" (click)="clearSearch()">✕</button>
          }
        </div>
      </header>

      <div class="results-area">
        
        @if (filteredItems().length === 0) {
          <div class="empty-state">
            <div class="empty-icon">🔍</div>
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
  styles: [`
    :host { display: block; height: 100%; }

    .library-container {
      min-height: 100vh;
      background: var(--bg-app);
      display: flex; flex-direction: column;
    }

    /* --- SEARCH HEADER --- */
    .search-header {
      position: sticky; top: 0; z-index: 50;
      padding: 1rem 1.5rem;
      /* Glass effect handled by global .glass class */
      border-bottom: 1px solid var(--border-subtle);
    }

    .search-bar {
      position: relative;
      max-width: 600px; margin: 0 auto;
      display: flex; align-items: center;
    }

    .search-icon {
      position: absolute; left: 16px;
      width: 20px; height: 20px;
      color: var(--text-secondary);
      pointer-events: none;
    }

    input {
      width: 100%;
      background: var(--bg-surface);
      border: 1px solid var(--border-subtle);
      color: var(--text-primary);
      padding: 14px 14px 14px 48px; 
      border-radius: 16px;
      font-size: 1rem;
      outline: none;
      transition: all 0.2s;
      box-shadow: inset 0 2px 4px rgba(0,0,0,0.2);
    }

    input:focus {
      border-color: var(--primary);
      background: var(--bg-surface-2);
      box-shadow: 0 0 0 4px var(--primary-dim);
    }

    .clear-btn {
      position: absolute; right: 12px;
      background: var(--bg-surface-2);
      border: none; color: var(--text-secondary);
      width: 24px; height: 24px; border-radius: 50%;
      font-size: 0.8rem; cursor: pointer;
      display: flex; align-items: center; justify-content: center;
    }

    /* --- RESULTS AREA --- */
    .results-area {
      flex: 1;
      padding: 1.5rem;
      overflow-y: auto;
    }

    .card-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
      gap: 1.5rem;
      max-width: 1200px; margin: 0 auto;
      padding-bottom: 100px; /* Space for mobile nav */
    }

    .card-wrapper {
      /* Fixed height for uniformity in grid */
      height: 320px; 
      /* Make it pop */
      perspective: 1000px;
    }

    /* --- EMPTY STATE --- */
    .empty-state {
      display: flex; flex-direction: column; align-items: center; justify-content: center;
      padding-top: 4rem; text-align: center;
      opacity: 0.5;
    }
    .empty-icon { font-size: 4rem; margin-bottom: 1rem; filter: grayscale(1); }
    h3 { margin: 0; font-size: 1.2rem; color: var(--text-primary); }
    p { margin: 0.5rem 0 0; color: var(--text-secondary); max-width: 250px; }
  `]
})
export class DictionaryComponent implements OnInit {
  private repo = inject(VocabularyRepository);

  allItems = signal<VocabularyItem[]>([]);
  query = signal<string>('');

  // UI State: Track which cards are flipped individually
  flippedState = signal<Set<string>>(new Set());

  // Two-way binding proxy
  searchQuery = '';

  ngOnInit() {
    this.loadData();
  }

  async loadData() {
    // 1. Fetch all words (Fast local DB)
    const data = await this.repo.getAll();
    // 2. Sort alphabetically by German for better UX
    data.sort((a, b) => a.german.localeCompare(b.german));
    this.allItems.set(data);
  }

  onSearch(val: string) {
    this.query.set(val);
  }

  clearSearch() {
    this.searchQuery = '';
    this.query.set('');
  }

  toggleCard(id: string) {
    this.flippedState.update(set => {
      const newSet = new Set(set);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  }

  // --- THE SEARCH LOGIC ---
  filteredItems = computed(() => {
    const q = this.query().toLowerCase().trim();
    const all = this.allItems();

    // 1. If empty, show nothing?
    if (!q) return [];

    return all.filter(item => {
      const matchGerman = item.german.toLowerCase().startsWith(q);
      const matchEnglish = item.english.toLowerCase().startsWith(q);
      return matchGerman || matchEnglish;
    });
  });
}