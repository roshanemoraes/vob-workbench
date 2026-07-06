import { Component, inject, OnInit, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { MockCurrentUserStore } from '../../core/auth/mock-current-user.store';
import { MockVobStore } from '../../core/api/mock-vob.store';
import { ToastService } from '../../core/api/toast.service';
import { Vob, VobStatus } from '../../core/models/vob.models';
import { PageHeaderComponent } from '../../core/layout/page-header.component';
import { CursorPaginationControlsComponent } from '../../shared/components/cursor-pagination-controls.component';
import { AppButtonComponent } from '../../shared/ui/app-button.component';
import { IconButtonComponent } from '../../shared/ui/icon-button.component';
import { LoadingStateComponent } from '../../shared/ui/loading-state.component';
import { FormsModule } from '@angular/forms';
import { VobStatusTabsComponent } from './vob-status-tabs.component';
import { VobTableComponent } from './vob-table.component';

@Component({
  selector: 'app-vob-list-page',
  standalone: true,
  imports: [
    FormsModule,
    PageHeaderComponent,
    VobStatusTabsComponent,
    VobTableComponent,
    CursorPaginationControlsComponent,
    IconButtonComponent,
    LoadingStateComponent
  ],
  template: `
    <app-page-header
      [title]="pageTitle"
      actionLabel="New VOB"
      [action]="goToCreate.bind(this)"
    />

    <div class="list-controls">
      <app-vob-status-tabs [status]="status()" (statusChange)="onStatusChange($event)" />
      <div class="list-controls__right">
        <select class="sort-select" [(ngModel)]="sortOrder" (ngModelChange)="reload()">
          <option value="desc">Newest first</option>
          <option value="asc">Oldest first</option>
        </select>
        <app-icon-button label="Refresh list" (clicked)="reload()">↻</app-icon-button>
      </div>
    </div>

    @if (loading()) {
      <app-loading-state />
    } @else {
      <app-vob-table
        [vobs]="vobs()"
        [status]="status()"
        (view)="viewVob($event)"
        (claim)="claimVob($event)"
        (verifyApi)="verifyApi($event)"
        (verifyManual)="verifyManual($event)"
      />
      <app-cursor-pagination
        [hasMore]="hasMore()"
        [totalShown]="vobs().length"
        (next)="loadMore()"
      />
    }
  `,
  styles: `
    .list-controls {
      display: flex;
      flex-wrap: wrap;
      align-items: flex-end;
      justify-content: space-between;
      gap: var(--space-3);
    }

    .list-controls__right {
      display: flex;
      align-items: center;
      gap: var(--space-2);
      margin-bottom: var(--space-4);
    }

    .sort-select {
      height: 36px;
      padding: 0 var(--space-2);
      border: 1px solid var(--color-border);
      border-radius: var(--radius-md);
      font-size: 13px;
      background: var(--color-surface);
    }
  `
})
export class VobListPageComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly vobStore = inject(MockVobStore);
  private readonly userStore = inject(MockCurrentUserStore);
  private readonly toast = inject(ToastService);

  readonly loading = signal(true);
  readonly vobs = signal<Vob[]>([]);
  readonly hasMore = signal(false);
  readonly status = signal<VobStatus>('QUEUED');
  sortOrder: 'asc' | 'desc' = 'desc';
  private cursor: string | undefined;

  get pageTitle(): string {
    const titles: Record<VobStatus, string> = {
      QUEUED: 'Queued VOBs',
      IN_PROGRESS: 'In Progress VOBs',
      VERIFIED: 'Verified VOBs',
      FAILED_TO_VERIFY: 'Failed Verification'
    };
    return titles[this.status()];
  }

  ngOnInit(): void {
    this.route.queryParamMap.subscribe((params) => {
      const status = (params.get('status') as VobStatus) || 'QUEUED';
      this.status.set(status);
      this.cursor = undefined;
      this.load();
    });
  }

  onStatusChange(status: VobStatus): void {
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { status },
      queryParamsHandling: 'merge'
    });
  }

  reload(): void {
    this.cursor = undefined;
    this.load();
  }

  loadMore(): void {
    if (!this.hasMore()) return;
    this.load(true);
  }

  goToCreate(): void {
    this.router.navigate(['/app/vob/new']);
  }

  viewVob(id: string): void {
    this.router.navigate(['/app/vob', id]);
  }

  claimVob(id: string): void {
    const userId = this.userStore.currentUser()?.id;
    if (!userId) return;
    this.vobStore.claimVob(id, userId).subscribe({
      next: () => {
        this.toast.success('VOB claimed successfully.');
        this.reload();
      },
      error: (err) => this.toast.error(err.message ?? 'Failed to claim VOB.')
    });
  }

  verifyApi(id: string): void {
    this.router.navigate(['/app/vob', id]);
  }

  verifyManual(id: string): void {
    this.router.navigate(['/app/vob', id, 'verify-manual']);
  }

  private load(append = false): void {
    this.loading.set(!append);
    this.vobStore
      .listByStatus(this.status(), { cursor: this.cursor, sortOrder: this.sortOrder })
      .subscribe((page) => {
        this.vobs.update((list) => (append ? [...list, ...page.items] : page.items));
        this.hasMore.set(page.hasMore);
        this.cursor = page.nextCursor ?? undefined;
        this.loading.set(false);
      });
  }
}
