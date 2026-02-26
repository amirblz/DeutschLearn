import { Component, ChangeDetectionStrategy, inject } from '@angular/core';
import { ContentSyncService } from '../../../infrastructure/sync/content-sync.service';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-splash-screen',
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './splash-screen.component.html',
  styleUrl: './splash-screen.component.scss'
})
export class SplashScreenComponent {
  readonly syncService = inject(ContentSyncService);
}