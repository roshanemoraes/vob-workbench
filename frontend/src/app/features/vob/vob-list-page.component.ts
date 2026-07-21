import { Component, HostListener, inject, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { MockCurrentUserStore } from '../../core/auth/mock-current-user.store';
import { PatientApiService } from '../../core/api/patient-api.service';
import { VobApiService } from '../../core/api/vob-api.service';
import { ToastService } from '../../core/api/toast.service';
import { Patient } from '../../core/models/patient.models';
import { Vob, VobStatus } from '../../core/models/vob.models';
import { LoadingStateComponent } from '../../shared/ui/loading-state.component';
import { EmptyStateComponent } from '../../shared/ui/empty-state.component';
import { VobStatusFilter } from './vob-search-bar.component';
import { VobTableComponent } from './vob-table.component';

@Component({
  selector: 'app-vob-list-page',
  standalone: true,
  imports: [
    FormsModule,
    LoadingStateComponent,
    EmptyStateComponent,
    VobTableComponent
  ],
  template: `
    <section class="vob-list-panel">
      <header class="vob-list-toolbar">
        <h1>Verification of Benefit</h1>

        <div class="vob-list-controls">
          <label class="search-control">
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path d="m21 21-4.35-4.35M10.5 18a7.5 7.5 0 1 1 0-15 7.5 7.5 0 0 1 0 15Z" />
            </svg>
            <input
              type="search"
              placeholder="Search VOB"
              [(ngModel)]="searchTerm"
              (keyup.enter)="applySearch()"
            />
          </label>

          <div class="status-filter-wrap">
            <button
              type="button"
              class="dropdown-control status-filter-button"
              [class.status-filter-button--open]="statusMenuOpen()"
              (click)="toggleStatusMenu($event)"
            >
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <path d="M3 5h18l-7 8v5l-4 2v-7z" />
              </svg>
              <span>{{ statusFilterLabel }}</span>
              @if (status() !== 'ALL') {
                <span class="filter-count">1</span>
              }
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <path d="m6 9 6 6 6-6" />
              </svg>
            </button>

            @if (statusMenuOpen()) {
              <div class="status-menu" role="menu">
                @for (option of statusOptions; track option.value) {
                  @if (option.value === 'QUEUED') {
                    <hr class="status-menu-divider" />
                  }
                  <button
                    type="button"
                    class="status-menu-item"
                    [class.status-menu-item--selected]="status() === option.value"
                    role="menuitemradio"
                    [attr.aria-checked]="status() === option.value"
                    (click)="selectStatus(option.value)"
                  >
                    @if (option.dot) {
                      <span class="status-dot" [class]="option.dot"></span>
                    }
                    <span>{{ option.label }}</span>
                    <svg class="status-check" viewBox="0 0 24 24" aria-hidden="true">
                      <path d="m20 6-11 11-5-5" />
                    </svg>
                  </button>
                }
              </div>
            }
          </div>

          <div class="sort-note">
            <!-- <span>Sort by:</span> -->
            <button type="button" class="dropdown-control sort-button">
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <path d="M3 7h12M3 12h8M3 17h4M18 7v10M15 14l3 3 3-3" />
              </svg>
              Newest
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <path d="m6 9 6 6 6-6" />
              </svg>
            </button>
          </div>

          <button type="button" class="new-vob-button" (click)="goToCreate()">New VOB</button>
        </div>
      </header>

      @if (loading()) {
        <app-loading-state />
      } @else if (vobs().length === 0) {
        <app-empty-state title="No VOBs" [message]="emptyMessage" />
      } @else {
        @if (selectedVobIds().length > 0) {
          <div class="bulk-bar">
            <div class="bulk-bar-left">
              <span>{{ selectedVobIds().length }} selected</span>
              <button type="button" class="bulk-clear" (click)="clearSelection()">Clear</button>
            </div>
            <div class="bulk-actions">
              <button type="button" class="bulk-btn claim" (click)="claimSelectedQueued()">Claim queued</button>
              <button type="button" class="bulk-btn" (click)="exportSelected()">Export</button>
            </div>
          </div>
        }

        <app-vob-table
          [vobs]="vobs()"
          [patientLookup]="patientLookup()"
          [selectedIds]="selectedVobIds()"
          (selectionChange)="selectedVobIds.set($event)"
          (view)="viewVob($event)"
          (claim)="claimVob($event)"
        />

        <footer class="vob-list-footer">
          <div>
            <span>Show</span>
            <strong>{{ vobs().length }}</strong>
            <span>of {{ totalCount() }} VOBs</span>
            <label class="page-size">
              <span>per page</span>
              <select [value]="10" aria-label="Rows per page">
                <option>10</option>
                <option>25</option>
                <option>50</option>
              </select>
            </label>
          </div>
          <button type="button" [disabled]="!hasMore()" (click)="loadMore()">
            Load more
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path d="m9 18 6-6-6-6" />
            </svg>
          </button>
        </footer>
      }
    </section>
  `,
  styles: `
    .vob-list-panel {
      max-width: 1650px;
      padding: 24px 28px;
      border: 1px solid rgba(0, 0, 0, 0.09);
      border-radius: 14px;
      background: #fff;
    }

    .vob-list-toolbar {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: var(--space-4);
      margin-bottom: 20px;
      flex-wrap: wrap;
    }

    .vob-list-toolbar h1 {
      color: #2d3438;
      font-size: 22px;
      font-weight: 400;
    }

    .vob-list-controls {
      display: flex;
      align-items: center;
      justify-content: flex-end;
      gap: 10px;
      flex: 1;
    }

    .search-control,
    .dropdown-control {
      display: flex;
      align-items: center;
      height: 36px;
      border: 0;
      border-radius: 8px;
      color: #5f5e5a;
      font-size: 13px;
    }

    .search-control {
      width: 220px;
      padding: 0 12px;
      gap: 8px;
      background: #f5f4f2;
      color: #8a8983;
    }

    .dropdown-control {
      padding: 0 12px;
      gap: 6px;
      background: #e6f4ee;
      color: #168a74;
      font-weight: 600;
    }

    .status-filter-wrap {
      position: relative;
      display: inline-block;
    }

    .status-filter-button {
      min-width: 144px;
      cursor: pointer;
    }

    .status-filter-button--open {
      box-shadow: 0 0 0 3px rgba(15, 138, 114, 0.12);
    }

    .sort-button {
      font: inherit;
      cursor: default;
    }

    .search-control svg,
    .dropdown-control svg,
    .vob-list-footer svg {
      width: 16px;
      height: 16px;
      fill: none;
      stroke: currentColor;
      stroke-linecap: round;
      stroke-linejoin: round;
      stroke-width: 2;
      flex-shrink: 0;
    }

    .search-control input {
      width: 100%;
      height: 100%;
      border: 0;
      background: transparent;
      color: #1a1a18;
      font: inherit;
      font-weight: 600;
    }

    .search-control input::placeholder {
      color: #7d878b;
      font-weight: 500;
    }

    .search-control input:focus,
    .search-control input:focus {
      outline: none;
    }

    .status-menu {
      position: absolute;
      z-index: 40;
      top: calc(100% + 8px);
      left: 0;
      width: 220px;
      padding: 6px;
      border: 1px solid rgba(0, 0, 0, 0.08);
      border-radius: 12px;
      background: #fff;
      box-shadow: 0 8px 24px rgba(20, 20, 18, 0.1), 0 2px 6px rgba(20, 20, 18, 0.06);
    }

    .status-menu-item {
      display: flex;
      align-items: center;
      gap: 10px;
      width: 100%;
      min-height: 36px;
      padding: 9px 10px;
      border: 0;
      border-radius: 8px;
      background: transparent;
      color: #1a1a18;
      font: inherit;
      font-size: 13.5px;
      text-align: left;
      cursor: pointer;
    }

    .status-menu-item:hover {
      background: #f5f4f2;
    }

    .status-menu-item--selected {
      background: #e4f5f0;
      color: #0f8a72;
      font-weight: 700;
    }

    .status-dot {
      width: 8px;
      height: 8px;
      flex-shrink: 0;
      border-radius: 999px;
    }

    .status-dot--queued {
      background: #a3a29d;
    }

    .status-dot--progress {
      background: #d99a1e;
    }

    .status-dot--verified {
      background: #1b9b63;
    }

    .status-dot--failed {
      background: #c44536;
    }

    .status-check {
      display: none;
      width: 15px;
      height: 15px;
      margin-left: auto;
      fill: none;
      stroke: currentColor;
      stroke-linecap: round;
      stroke-linejoin: round;
      stroke-width: 2.4;
    }

    .status-menu-item--selected .status-check {
      display: block;
    }

    .status-menu-divider {
      margin: 6px 4px;
      border: 0;
      border-top: 1px solid rgba(0, 0, 0, 0.08);
    }

    .sort-note {
      display: flex;
      align-items: center;
      gap: 6px;
      color: #8a8983;
      white-space: nowrap;
      font-size: 13px;
    }

    .filter-count {
      display: inline-flex;
      align-items: center;
      height: 16px;
      padding: 0 6px;
      border-radius: 10px;
      background: #168a74;
      color: #fff;
      font-size: 11px;
      font-weight: 800;
    }

    .new-vob-button {
      height: 36px;
      padding: 0 16px;
      border: 0;
      border-radius: 8px;
      background: #1a1a18;
      color: #fff;
      font: inherit;
      font-size: 13px;
      font-weight: 600;
      cursor: pointer;
      white-space: nowrap;
    }

    .new-vob-button:hover {
      background: #2c2c29;
    }

    .bulk-bar {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 12px;
      margin-bottom: 14px;
      padding: 10px 12px;
      border-radius: 10px;
      background: #1a1a18;
      color: #fff;
      font-size: 13px;
      flex-wrap: wrap;
    }

    .bulk-bar-left,
    .bulk-actions {
      display: flex;
      align-items: center;
      gap: 10px;
    }

    .bulk-clear {
      border: 0;
      background: transparent;
      color: #c9c8c4;
      font: inherit;
      font-size: 13px;
      text-decoration: underline;
      cursor: pointer;
    }

    .bulk-btn {
      height: 31px;
      padding: 0 14px;
      border: 0;
      border-radius: 7px;
      background: #2c2c29;
      color: #fff;
      font: inherit;
      font-size: 13px;
      font-weight: 600;
      cursor: pointer;
    }

    .bulk-btn:hover {
      background: #3a3a36;
    }

    .bulk-btn.claim {
      background: #168a74;
    }

    .bulk-btn.claim:hover {
      background: #0c7561;
    }

    .vob-list-footer {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: var(--space-4);
      margin-top: 18px;
      color: #5f5e5a;
      font-size: 13px;
      flex-wrap: wrap;
    }

    .vob-list-footer div {
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .vob-list-footer strong {
      display: inline-flex;
      align-items: center;
      padding: 2px 9px;
      border-radius: 6px;
      background: #f0efec;
      color: #1a1a18;
    }

    .page-size {
      display: flex;
      align-items: center;
      gap: 6px;
      margin-left: 4px;
      color: #8a8983;
    }

    .page-size select {
      padding: 4px 8px;
      border: 1px solid rgba(0, 0, 0, 0.09);
      border-radius: 6px;
      background: #fff;
      color: #1a1a18;
      font: inherit;
    }

    .vob-list-footer button {
      display: inline-flex;
      align-items: center;
      gap: var(--space-2);
      height: 36px;
      padding: 0 12px;
      border: 0;
      border-radius: 8px;
      background: #f0efec;
      color: #1a1a18;
      font: inherit;
      font-weight: 600;
      cursor: pointer;
    }

    .vob-list-footer button:disabled {
      color: #c8ced0;
      cursor: not-allowed;
    }

    @media (max-width: 1100px) {
      .vob-list-toolbar,
      .vob-list-controls {
        align-items: stretch;
        flex-direction: column;
      }

      .search-control {
        width: 100%;
      }
    }
  `
})
export class VobListPageComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly vobStore = inject(VobApiService);
  private readonly patientStore = inject(PatientApiService);
  private readonly userStore = inject(MockCurrentUserStore);
  private readonly toast = inject(ToastService);

  readonly loading = signal(true);
  readonly vobs = signal<Vob[]>([]);
  readonly patientLookup = signal<Record<string, Patient>>({});
  readonly selectedVobIds = signal<string[]>([]);
  readonly hasMore = signal(false);
  readonly totalCount = signal(0);
  readonly status = signal<VobStatusFilter>('ALL');
  readonly statusMenuOpen = signal(false);
  selectedStatus: VobStatusFilter = 'ALL';
  searchTerm = '';
  private cursor: string | undefined;

  readonly statusOptions: Array<{ value: VobStatusFilter; label: string; dot?: string }> = [
    { value: 'ALL', label: 'All statuses' },
    { value: 'QUEUED', label: 'Queued', dot: 'status-dot--queued' },
    { value: 'IN_PROGRESS', label: 'In progress', dot: 'status-dot--progress' },
    { value: 'VERIFIED', label: 'Verified', dot: 'status-dot--verified' },
    { value: 'FAILED_TO_VERIFY', label: 'Failed to verify', dot: 'status-dot--failed' }
  ];

  @HostListener('document:click')
  closeStatusMenu(): void {
    this.statusMenuOpen.set(false);
  }

  get emptyMessage(): string {
    const messages: Record<VobStatusFilter, string> = {
      ALL: 'No VOBs match the selected criteria.',
      QUEUED: 'No queued VOBs at this time.',
      IN_PROGRESS: 'No VOBs currently in progress.',
      VERIFIED: 'No verified VOBs yet.',
      FAILED_TO_VERIFY: 'No failed verifications.'
    };
    return messages[this.status()];
  }

  get statusFilterLabel(): string {
    const labels: Record<VobStatusFilter, string> = {
      ALL: 'All statuses',
      QUEUED: 'Queued',
      IN_PROGRESS: 'In progress',
      VERIFIED: 'Verified',
      FAILED_TO_VERIFY: 'Failed to verify'
    };
    return labels[this.status()];
  }

  ngOnInit(): void {
    this.route.queryParamMap.subscribe((params) => {
      const status = (params.get('status') as VobStatusFilter) || 'ALL';
      this.status.set(status);
      this.selectedStatus = status;
      this.cursor = undefined;
      this.clearSelection();
      this.load();
    });
  }

  applySearch(): void {
    this.cursor = undefined;
    this.load();
  }

  applyStatusFilter(status: VobStatusFilter): void {
    this.status.set(status);
    this.selectedStatus = status;
    this.cursor = undefined;
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: status === 'ALL' ? {} : { status },
      queryParamsHandling: ''
    });
  }

  toggleStatusMenu(event: MouseEvent): void {
    event.stopPropagation();
    this.statusMenuOpen.update((open) => !open);
  }

  selectStatus(status: VobStatusFilter): void {
    this.statusMenuOpen.set(false);
    this.applyStatusFilter(status);
  }

  loadMore(): void {
    if (!this.hasMore()) return;
    this.load(true);
  }

  clearSelection(): void {
    this.selectedVobIds.set([]);
  }

  exportSelected(): void {
    this.toast.success(`${this.selectedVobIds().length} VOBs selected for export.`);
  }

  claimSelectedQueued(): void {
    const queuedIds = this.vobs()
      .filter((vob) => this.selectedVobIds().includes(vob.publicId) && vob.status === 'QUEUED')
      .map((vob) => vob.publicId);

    if (queuedIds.length === 0) {
      this.toast.error('No queued VOBs selected.');
      return;
    }

    this.toast.success(`${queuedIds.length} queued VOB selected for claim.`);
  }

  goToCreate(): void {
    this.router.navigate(['/app/vob/add']);
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
        this.router.navigate(['/app/vob', id]);
      },
      error: (err) => this.toast.error(err.message ?? 'Failed to claim VOB.')
    });
  }

  private load(append = false): void {
    this.loading.set(!append);
    this.vobStore
      .list({
        status: this.status(),
        search: this.searchTerm.trim(),
        searchField: 'all',
        cursor: this.cursor,
        sortOrder: 'desc'
      })
      .subscribe((page) => {
        this.vobs.update((list) => (append ? [...list, ...page.items] : page.items));
        this.hasMore.set(page.hasMore);
        this.totalCount.set(page.totalCount);
        this.cursor = page.nextCursor ?? undefined;
        this.loading.set(false);
        this.loadPatientsFor(page.items);
      });
  }

  private loadPatientsFor(vobs: Vob[]): void {
    const missingPatientIds = Array.from(new Set(vobs.map((vob) => vob.patientId)))
      .filter((patientId) => !this.patientLookup()[patientId]);

    for (const patientId of missingPatientIds) {
      this.patientStore.getById(patientId).subscribe((patient) => {
        if (!patient) return;
        this.patientLookup.update((lookup) => ({ ...lookup, [patient.publicId]: patient }));
      });
    }
  }
}
