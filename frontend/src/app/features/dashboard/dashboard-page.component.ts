import { DatePipe } from '@angular/common';
import { Component, inject, OnInit, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { MockCurrentUserStore } from '../../core/auth/mock-current-user.store';
import { VobApiService } from '../../core/api/vob-api.service';
import { VobStatus } from '../../core/models/vob.models';
import { PageHeaderComponent } from '../../core/layout/page-header.component';
import { LoadingStateComponent } from '../../shared/ui/loading-state.component';
import { RecentActivityListComponent, ActivityItem } from './recent-activity-list.component';
import { StatusSummaryGridComponent } from './status-summary-grid.component';

@Component({
  selector: 'app-dashboard-page',
  standalone: true,
  imports: [
    RouterLink,
    PageHeaderComponent,
    StatusSummaryGridComponent,
    RecentActivityListComponent,
    LoadingStateComponent
  ],
  template: `
    <app-page-header title="Dashboard" subtitle="Operational overview" />

    @if (loading()) {
      <app-loading-state />
    } @else {
      <section class="dashboard-section">
        <h2 class="section-title">VOB Status Summary</h2>
        <app-status-summary-grid [counts]="counts()" />
      </section>

      @if (userStore.currentUser()?.role === 'SPECIALIST') {
        <section class="dashboard-section panel">
          <h2 class="section-title">My Work</h2>
          <p class="my-work">
            You have <strong>{{ counts().IN_PROGRESS }}</strong> VOB(s) in progress.
            <a routerLink="/app/vob" [queryParams]="{ status: 'IN_PROGRESS' }">View assigned work</a>
          </p>
        </section>
      }

      <section class="dashboard-section panel">
        <h2 class="section-title">Recent Activity</h2>
        <app-recent-activity-list [items]="recentActivity()" />
      </section>
    }
  `,
  styles: `
    .dashboard-section {
      margin-bottom: var(--space-5);
    }

    .section-title {
      font-size: 16px;
      font-weight: 600;
      margin-bottom: var(--space-3);
    }

    .my-work {
      margin: 0;
      font-size: 14px;
      color: var(--color-text-muted);
    }
  `
})
export class DashboardPageComponent implements OnInit {
  private readonly vobStore = inject(VobApiService);
  readonly userStore = inject(MockCurrentUserStore);

  readonly loading = signal(true);
  readonly counts = signal<Record<VobStatus, number>>({
    QUEUED: 0,
    IN_PROGRESS: 0,
    VERIFIED: 0,
    FAILED_TO_VERIFY: 0
  });
  readonly recentActivity = signal<ActivityItem[]>([
    { id: '1', description: 'VOB vob-001 queued for Maria Garcia', timestamp: '2026-06-28T08:00:00Z' },
    { id: '2', description: 'VOB vob-002 claimed by Sam Specialist', timestamp: '2026-06-26T09:30:00Z' },
    { id: '3', description: 'VOB vob-003 verified via API', timestamp: '2026-06-22T16:00:00Z' }
  ]);

  ngOnInit(): void {
    this.vobStore.countByStatus().subscribe((counts) => {
      this.counts.set(counts);
      this.loading.set(false);
    });
  }
}
