# DeuVocab PWA
A high-performance, offline-first Progressive Web App (PWA) for learning German vocabulary using the Leitner Spaced Repetition System. Built with Angular 18+, Signals, and IndexedDB.

## Key Features
Local-First Architecture: Uses IndexedDB (via idb) as the primary data source. The app functions 100% offline after the initial sync.

Spaced Repetition (Leitner): Implements a 5-Box Leitner system with specific interval algorithms (1, 3, 7, 14, 30 days).

Reactive State: Fully Signal-based architecture (signal, computed, effect) for fine-grained change detection and OnPush optimization.

Interactive UI:

Tinder-style Swiping: Custom implementation using Pointer Events (touch/mouse) for "Know/Don't Know" logic.

3D Flip Cards: CSS 3D transforms for flashcard interactions.

Glassmorphism: Modern UI design using CSS variables and backdrop filters.

Smart Sync:

Optimistic UI updates (instant feedback).

Background synchronization queue for progress updates.

Differential downloading (only fetches changed missions).

## Tech Stack
Framework: Angular (Standalone Components)

State Management: Angular Signals

Storage: IndexedDB (wraps idb)

PWA: @angular/service-worker

Styles: SCSS, CSS Variables, CSS Grid/Flexbox

Routing: Angular Router with View Transitions

## Project Structure
Plaintext
src/app/
├── core/
│   ├── models/          # Types (VocabularyItem, LeitnerBox)
│   ├── repositories/    # Abstract Repository Interfaces
│   └── services/        # Business Logic (Leitner calc, Study State)
├── infrastructure/
│   ├── repositories/    # IDB Implementation (IdbVocabularyRepository)
│   └── sync/            # HTTP Sync Service (ContentSyncService)
├── features/
│   ├── curriculum/      # Dashboard & Level Logic
│   ├── dictionary/      # Searchable Library
│   ├── learning/        # Study Session & Swipe Logic
│   └── review-stats/    # Leitner Box Visualization
└── shared/
    └── ui/              # Reusable UI (FlipCard, SwipeCard)

## Getting Started
Install Dependencies:

Bash
npm install
Run Development Server:

Bash
ng serve
Navigate to http://localhost:4200.

Test PWA (Service Worker):
Service workers do not run in standard ng serve. To test offline capabilities:

Bash
npm run build
npx http-server dist/deu-vocab/browser

## Architecture Highlights
The Repository Pattern
The app does not use HttpClient directly in components.

Interface: VocabularyRepository (Core)

Implementation: IdbVocabularyRepository (Infrastructure)
This allows the app to swap data sources easily and ensures components only interact with local data.

Sync Strategy (ContentSyncService)
Pull: On startup, checks the backend for curriculum structure.

Merge: Fetches items for missions, merging them into IndexedDB while preserving the user's local Leitner progress (Box/Due Date).

Push: Flushes a local "Sync Queue" of progress updates to the backend.