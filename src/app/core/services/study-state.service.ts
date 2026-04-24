import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { VocabularyRepository } from '../repositories/vocabulary.repository';
import { AuthService } from './auth.service';

@Injectable({
  providedIn: 'root'
})
export class StudyStateService {
  private repo = inject(VocabularyRepository);
  private http = inject(HttpClient);
  private auth = inject(AuthService);

  private readonly API_URL = '/api/vocabulary';

  dueCount = signal<number>(0);
  activeMission = signal<string | null>(localStorage.getItem('active_mission'));

  // 🚀 NEW: The live streak signal
  streakDays = signal<number>(0);

  constructor() {
    this.refreshCount();
  }

  async refreshCount() {
    const now = Date.now();
    const allItems = await this.repo.getAll();

    const due = allItems.filter(item =>
      item.nextReviewDate <= now && item.lastReviewedDate
    );
    this.dueCount.set(due.length);
  }

  async setActiveMission(missionId: string | null) {
    this.activeMission.set(missionId);
    if (missionId) localStorage.setItem('active_mission', missionId);
    else localStorage.removeItem('active_mission');

    if (this.auth.isAuthenticated()) {
      const userId = localStorage.getItem('app_user_id') || '';
      try {
        await firstValueFrom(
          this.http.post(`${this.API_URL}/active-mission`, { missionId }, { headers: { 'x-user-id': userId } })
        );
      } catch (e) { }
    }
  }

  // 🚀 UPDATED: Fetch both Mission and Streak
  async fetchCloudMeta() {
    if (!this.auth.isAuthenticated()) return;
    const userId = localStorage.getItem('app_user_id') || '';
    try {
      const res = await firstValueFrom(
        this.http.get<{ activeMission: string | null, streak: number }>(`${this.API_URL}/meta`, { headers: { 'x-user-id': userId } })
      );

      this.streakDays.set(res.streak || 0);

      if (res.activeMission !== undefined) {
        this.activeMission.set(res.activeMission);
        if (res.activeMission) localStorage.setItem('active_mission', res.activeMission);
        else localStorage.removeItem('active_mission');
      }
    } catch (e) {
      console.error('Failed to fetch cloud meta', e);
    }
  }
}