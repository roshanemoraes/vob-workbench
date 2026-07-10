import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AuditApiService } from '../../core/api/audit-api.service';
import {
  AuditAction,
  AuditEntityType,
  AuditEvent
} from '../../core/models/audit.models';
import { EmptyStateComponent } from '../../shared/ui/empty-state.component';
import { ErrorBannerComponent } from '../../shared/ui/error-banner.component';
import { LoadingStateComponent } from '../../shared/ui/loading-state.component';

type ActionFilter = AuditAction | 'ALL';
type EntityFilter = AuditEntityType | 'ALL';
type TimeRangeFilter = 'LAST_HOUR' | 'LAST_24_HOURS' | 'LAST_7_DAYS' | 'LAST_MONTH';
type AuditFilterField = 'ACTOR' | 'RESOURCE' | 'RESOURCE_TYPE' | 'DURATION' | 'ACTION_TYPE';
type AuditTableColumn = 'timestamp' | 'actor' | 'action' | 'resource';

interface AuditFilterCondition {
  id: number;
  field: AuditFilterField;
  value: string;
}

@Component({
  selector: 'app-audit-page',
  standalone: true,
  imports: [FormsModule, EmptyStateComponent, ErrorBannerComponent, LoadingStateComponent],
  template: `
    <section class="audit-panel">
      <header class="audit-head">
        <h1>Audit Log</h1>

        <div class="toolbar">
          <label class="search" title="Search actor ID, resource ID, reason, or metadata">
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path d="m21 21-4.35-4.35M10.5 18a7.5 7.5 0 1 1 0-15 7.5 7.5 0 0 1 0 15Z" />
            </svg>
            <input type="search" placeholder="Search audit log" [(ngModel)]="searchTerm" />
          </label>

          <div class="filters-wrap">
            <button type="button" class="filter-button" (click)="toggleFilters()">
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <path d="M3 5h18l-7 8v5l-4 2v-7z" />
              </svg>
              Filters
              @if (activeFilterCount() > 0) {
                <span class="filter-count">{{ activeFilterCount() }}</span>
              }
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <path d="m6 9 6 6 6-6" />
              </svg>
            </button>

            @if (filtersOpen()) {
              <div class="filters-panel">
                <div class="filters-title">Filter audit log</div>

                <div class="condition-list">
                  @for (condition of conditions(); track condition.id; let index = $index) {
                    <div class="condition-row">
                      <span class="and-label">{{ index === 0 ? 'Where' : 'And' }}</span>

                      <select
                        class="cond-select field-select"
                        [ngModel]="condition.field"
                        (ngModelChange)="updateConditionField(condition.id, $event)"
                      >
                        @for (option of fieldOptions; track option.value) {
                          <option [ngValue]="option.value">{{ option.label }}</option>
                        }
                      </select>

                      <select class="cond-select op-select" aria-label="Operator">
                        <option>is</option>
                      </select>

                      <span class="value-cell">
                        @if (condition.field === 'ACTOR') {
                          <input
                            class="cond-input"
                            type="text"
                            placeholder="Enter user id"
                            [ngModel]="condition.value"
                            (ngModelChange)="updateConditionValue(condition.id, $event)"
                          />
                        } @else if (condition.field === 'RESOURCE') {
                          <input
                            class="cond-input"
                            type="text"
                            placeholder="Enter patient or VOB id"
                            [ngModel]="condition.value"
                            (ngModelChange)="updateConditionValue(condition.id, $event)"
                          />
                        } @else if (condition.field === 'RESOURCE_TYPE') {
                          <select
                            class="cond-input"
                            [ngModel]="condition.value"
                            (ngModelChange)="updateConditionValue(condition.id, $event)"
                          >
                            @for (option of resourceTypeOptions; track option.value) {
                              <option [ngValue]="option.value">{{ option.label }}</option>
                            }
                          </select>
                        } @else if (condition.field === 'DURATION') {
                          <select
                            class="cond-input"
                            [ngModel]="condition.value"
                            (ngModelChange)="updateConditionValue(condition.id, $event)"
                          >
                            @for (option of timeRangeOptions; track option.value) {
                              <option [ngValue]="option.value">{{ option.label }}</option>
                            }
                          </select>
                        } @else {
                          <select
                            class="cond-input"
                            [ngModel]="condition.value"
                            (ngModelChange)="updateConditionValue(condition.id, $event)"
                          >
                            @for (option of actionTypeOptions; track option.value) {
                              <option [ngValue]="option.value">{{ option.label }}</option>
                            }
                          </select>
                        }
                      </span>

                      <button
                        type="button"
                        class="delete-condition"
                        title="Remove condition"
                        (click)="removeCondition(condition.id)"
                      >
                        <svg viewBox="0 0 24 24" aria-hidden="true">
                          <path d="M3 6h18M8 6V4h8v2M10 11v6M14 11v6M6 6l1 15h10l1-15" />
                        </svg>
                      </button>
                    </div>
                  }
                </div>

                <button type="button" class="add-condition" (click)="addCondition()">
                  <svg viewBox="0 0 24 24" aria-hidden="true">
                    <path d="M12 5v14M5 12h14" />
                  </svg>
                  Add condition
                </button>

                <div class="filters-footer">
                  <button type="button" class="clear-all" (click)="clearAllConditions()">Clear all</button>
                  <button type="button" class="apply-filters" (click)="applyConditions()">Apply filters</button>
                </div>
              </div>
            }
          </div>

          <button type="button" class="export-button" (click)="exportVisibleEvents()">
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path d="M12 3v12M7 10l5 5 5-5M5 21h14" />
            </svg>
            Export
          </button>
        </div>
      </header>

      @if (error()) {
        <app-error-banner [message]="error()!" [showRetry]="true" (retry)="load()" />
      }

      @if (loading()) {
        <app-loading-state message="Loading audit events..." />
      } @else if (visibleEvents().length === 0) {
        <app-empty-state title="No audit events found" message="No audit records match the selected filters." />
      } @else {
        <div class="table-wrap">
          <table>
            <colgroup>
              <col [style.width.%]="widthFor('timestamp')" />
              <col [style.width.%]="widthFor('actor')" />
              <col [style.width.%]="widthFor('action')" />
              <col [style.width.%]="widthFor('resource')" />
            </colgroup>
            <thead>
              <tr>
                <th>Timestamp</th>
                <th>Actor</th>
                <th>Action</th>
                <th>Resource</th>
              </tr>
            </thead>
            <tbody>
              @for (event of visibleEvents(); track event.id) {
                <tr class="log-row">
                  <td class="timestamp">{{ formatTimestamp(event.createdAt) }}</td>
                  <td>
                    <div class="actor-cell">
                      <span class="actor-avatar">{{ actorInitial(event) }}</span>
                      <span>
                        <span class="actor-id">{{ event.actorUserId || 'System' }}</span>
                        <span class="actor-role">{{ event.actorRole || 'SYSTEM' }}</span>
                      </span>
                    </div>
                  </td>
                  <td>
                    <span class="action-pill" [class]="actionClass(event.action)">
                      {{ actionLabel(event.action) }}
                    </span>
                  </td>
                  <td>
                    <div class="entity-cell">
                      <span>{{ entityLabel(event.entityType) }}</span>
                      <strong>{{ event.entityId || 'n/a' }}</strong>
                    </div>
                  </td>
                </tr>
              }
            </tbody>
          </table>
        </div>

        <footer class="footer">
          <div>
            <span>Show</span>
            <strong>{{ visibleEvents().length }}</strong>
            <span>of {{ totalCount() }} events</span>
            <label class="page-size">
              <span>per page</span>
              <select [(ngModel)]="limit" (change)="load()" aria-label="Rows per page">
                <option [ngValue]="25">25</option>
                <option [ngValue]="50">50</option>
                <option [ngValue]="100">100</option>
                <option [ngValue]="200">200</option>
              </select>
            </label>
          </div>
          <button type="button" class="load-more" (click)="increaseLimit()" [disabled]="limit >= 200">
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
    .audit-panel { max-width: 1650px; padding: 24px 28px; border: 1px solid rgba(0, 0, 0, 0.09); border-radius: 14px; background: #fff; }
    .audit-head, .toolbar, .footer { display: flex; align-items: center; gap: 10px; flex-wrap: wrap; }
    .audit-head { justify-content: space-between; margin-bottom: 16px; }
    .toolbar { position: relative; }
    h1 { color: #1a1a18; font-size: 22px; font-weight: 400; }
    .search, .filter-button, .export-button { display: inline-flex; align-items: center; height: 36px; border-radius: 8px; font-size: 13px; }
    .search { width: 230px; gap: 8px; padding: 0 12px; background: #f5f4f2; color: #8a8983; }
    .search input { border: 0; outline: none; background: transparent; color: #1a1a18; font: inherit; }
    .search input { width: 100%; min-width: 0; }
    .filter-button { gap: 6px; padding: 0 12px; border: 0; background: #e4f5f0; color: #0f8a72; font: inherit; font-weight: 600; cursor: pointer; }
    .filter-count { display: inline-flex; align-items: center; height: 16px; padding: 0 6px; border-radius: 10px; background: #0f8a72; color: #fff; font-size: 11px; font-weight: 800; }
    .filters-wrap { position: relative; }
    .filters-panel { position: absolute; z-index: 50; top: calc(100% + 10px); right: 0; width: min(560px, calc(100vw - 40px)); max-height: calc(100vh - 180px); overflow: auto; padding: 18px; border: 1px solid rgba(0, 0, 0, 0.09); border-radius: 14px; background: #fff; box-shadow: 0 12px 32px rgba(20, 20, 18, 0.14), 0 2px 8px rgba(20, 20, 18, 0.06); }
    .filters-title { margin-bottom: 14px; color: #1a1a18; font-size: 14px; font-weight: 400; }
    .condition-list { display: flex; flex-direction: column; gap: 10px; }
    .condition-row { display: flex; align-items: center; gap: 8px; }
    .and-label { width: 48px; flex-shrink: 0; color: #8a8983; font-size: 11.5px; font-weight: 700; letter-spacing: 0.03em; text-align: left; text-transform: uppercase; }
    .cond-select, .cond-input { min-height: 36px; border: 1px solid rgba(0, 0, 0, 0.09); border-radius: 7px; background: #fff; color: #1a1a18; font: inherit; font-size: 13px; }
    .cond-select { padding: 0 8px; }
    .cond-input { width: 100%; padding: 0 10px; }
    .field-select { width: 146px; flex-shrink: 0; }
    .op-select { width: 68px; flex-shrink: 0; color: #8a8983; }
    .value-cell { flex: 1; min-width: 0; }
    .delete-condition { width: 30px; height: 30px; display: inline-flex; align-items: center; justify-content: center; flex-shrink: 0; border: 0; border-radius: 7px; background: transparent; color: #8a8983; cursor: pointer; }
    .delete-condition:hover { background: #f5dfe0; color: #7a1f2b; }
    .add-condition { display: flex; align-items: center; gap: 6px; margin-top: 8px; padding: 8px 0 0 56px; border: 0; background: transparent; color: #0f8a72; font: inherit; font-size: 13px; font-weight: 700; cursor: pointer; }
    .add-condition:hover { text-decoration: underline; }
    .filters-footer { display: flex; align-items: center; justify-content: space-between; margin-top: 16px; padding-top: 14px; border-top: 1px solid rgba(0, 0, 0, 0.09); }
    .clear-all { border: 0; background: transparent; color: #8a8983; font: inherit; font-size: 13px; font-weight: 600; cursor: pointer; }
    .clear-all:hover { color: #1a1a18; text-decoration: underline; }
    .apply-filters { padding: 9px 18px; border: 0; border-radius: 8px; background: #0f8a72; color: #fff; font: inherit; font-size: 13px; font-weight: 700; cursor: pointer; }
    .apply-filters:hover { background: #0c7561; }
    .load-more, .export-button { border: 1px solid rgba(0, 0, 0, 0.09); background: #fff; color: #1a1a18; cursor: pointer; }
    .export-button { gap: 6px; padding: 0 14px; font: inherit; font-weight: 600; }
    svg { width: 16px; height: 16px; fill: none; stroke: currentColor; stroke-linecap: round; stroke-linejoin: round; stroke-width: 2; flex-shrink: 0; }
    .load-more { height: 34px; padding: 0 12px; border-radius: 8px; font: inherit; font-size: 13px; font-weight: 600; }
    .table-wrap { width: 100%; overflow-x: auto; }
    table { min-width: 860px; table-layout: fixed; }
    th { background: #f7f7f5; color: #8a8983; font-size: 12px; font-weight: 600; text-align: center; text-transform: uppercase; letter-spacing: 0.03em; }
    td, th { padding: 12px; text-align: center; }
    .log-row:hover td { background: #fafaf9; }
    .timestamp, .mono, .entity-cell strong { font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace; font-size: 12.5px; }
    .timestamp { color: #5f5e5a; white-space: nowrap; }
    .actor-cell { display: flex; align-items: center; justify-content: center; gap: 8px; min-width: 190px; }
    .actor-avatar { width: 26px; height: 26px; display: inline-flex; align-items: center; justify-content: center; flex-shrink: 0; border-radius: 999px; background: #e4e2de; color: #5f5e5a; font-size: 11px; font-weight: 700; }
    .actor-id, .actor-role, .entity-cell span, .entity-cell strong { display: block; }
    .actor-id { max-width: 180px; overflow: hidden; color: #1a1a18; font-weight: 400; text-overflow: ellipsis; white-space: nowrap; }
    .actor-role, .entity-cell span { color: #8a8983; font-size: 12px; }
    .action-pill { display: inline-flex; align-items: center; gap: 4px; padding: 3px 10px; border-radius: 6px; font-size: 11.5px; font-weight: 700; white-space: nowrap; }
    .action-pill { background: #f0efec; color: #5f5e5a; }
    .action-create { background: #e4f3e8; color: #1d7a3c; }
    .action-update { background: #e6f1fb; color: #0c447c; }
    .action-verify { background: #fcefdc; color: #8a5a0c; }
    .action-security { background: #f5dfe0; color: #7a1f2b; }
    .action-auth { background: #e4f5f0; color: #0f8a72; }
    .entity-cell strong { max-width: 210px; margin: 0 auto; overflow: hidden; color: #0f8a72; font-weight: 700; text-overflow: ellipsis; white-space: nowrap; }
    .muted { margin: 0; color: #8a8983; font-size: 13px; }
    .footer { justify-content: space-between; margin-top: 18px; color: #5f5e5a; font-size: 13px; }
    .footer div { display: flex; align-items: center; gap: 8px; }
    .footer strong { display: inline-flex; align-items: center; padding: 2px 9px; border-radius: 6px; background: #f0efec; color: #1a1a18; }
    .page-size { display: flex; align-items: center; gap: 6px; margin-left: 4px; color: #8a8983; }
    .page-size select { padding: 4px 8px; border: 1px solid rgba(0, 0, 0, 0.09); border-radius: 6px; background: #fff; color: #1a1a18; font: inherit; }
    .load-more { display: inline-flex; align-items: center; gap: 4px; color: #5f5e5a; }
    .load-more:disabled { color: #c8ced0; cursor: not-allowed; }
    @media (max-width: 900px) {
      .audit-head, .toolbar { align-items: stretch; flex-direction: column; }
      .search, .filter-button, .export-button { width: 100%; }
      .filters-panel { position: static; width: 100%; margin-top: 10px; }
      .condition-row { align-items: stretch; flex-direction: column; }
      .and-label, .field-select, .op-select { width: 100%; }
      .add-condition { padding-left: 0; }
    }
  `
})
export class AuditPageComponent implements OnInit {
  private readonly auditApi = inject(AuditApiService);
  private readonly defaultColumnWidths: Record<AuditTableColumn, number> = {
    timestamp: 18,
    actor: 28,
    action: 26,
    resource: 28
  };

  readonly loading = signal(false);
  readonly error = signal<string | null>(null);
  readonly events = signal<AuditEvent[]>([]);
  readonly totalCount = signal(0);
  readonly filtersOpen = signal(false);
  readonly conditions = signal<AuditFilterCondition[]>([
    { id: 1, field: 'ACTOR', value: '' }
  ]);

  searchTerm = '';
  actorUserId = '';
  entityId = '';
  selectedAction: ActionFilter = 'ALL';
  selectedEntityType: EntityFilter = 'ALL';
  selectedTimeRange: TimeRangeFilter = 'LAST_7_DAYS';
  limit = 25;

  readonly visibleEvents = computed(() => {
    const search = this.searchTerm.trim().toLowerCase();
    if (!search) return this.events();
    return this.events().filter((event) => this.matchesSearch(event, search));
  });

  readonly fieldOptions: Array<{ value: AuditFilterField; label: string }> = [
    { value: 'ACTOR', label: 'Actor' },
    { value: 'RESOURCE', label: 'Resource' },
    { value: 'RESOURCE_TYPE', label: 'Resource Type' },
    { value: 'DURATION', label: 'Duration' },
    { value: 'ACTION_TYPE', label: 'Action Type' }
  ];

  readonly actionOptions: Array<{ value: ActionFilter; label: string }> = [
    { value: 'ALL', label: 'All actions' },
    { value: 'LOGIN_FAILED', label: 'Login failed' },
    { value: 'ACCESS_DENIED', label: 'Access denied' },
    { value: 'PATIENT_CREATED', label: 'Patient created' },
    { value: 'PATIENT_VIEWED', label: 'Patient viewed' },
    { value: 'PATIENT_SEARCHED', label: 'Patient searched' },
    { value: 'VOB_REQUEST_CREATED', label: 'VOB created' },
    { value: 'VOB_REQUEST_ASSIGNED', label: 'VOB assigned' },
    { value: 'VOB_REQUEST_STATUS_CHANGED', label: 'VOB status changed' },
    { value: 'VOB_REQUEST_VERIFICATION_ATTEMPTED', label: 'VOB verification attempted' },
    { value: 'VOB_REQUEST_LOCKED', label: 'VOB locked' },
    { value: 'ELIGIBILITY_RESULT_CREATED', label: 'Eligibility result created' },
    { value: 'INVALID_STATUS_TRANSITION_ATTEMPTED', label: 'Invalid status transition' },
    { value: 'LOCKED_REQUEST_MODIFICATION_ATTEMPTED', label: 'Locked request modification' },
    { value: 'AUDIT_HISTORY_VIEWED', label: 'Audit history viewed' }
  ];

  readonly entityTypeOptions: Array<{ value: EntityFilter; label: string }> = [
    { value: 'ALL', label: 'All resources' },
    { value: 'AUTH', label: 'Auth' },
    { value: 'PATIENT', label: 'Patient' },
    { value: 'VOB_REQUEST', label: 'VOB request' },
    { value: 'ELIGIBILITY_RESULT', label: 'Eligibility result' },
    { value: 'AUDIT_RECORD', label: 'Audit record' },
    { value: 'SECURITY', label: 'Security' }
  ];

  readonly resourceTypeOptions: Array<{ value: EntityFilter; label: string }> = this.entityTypeOptions
    .filter((option) => option.value !== 'ALL');

  readonly actionTypeOptions: Array<{ value: ActionFilter; label: string }> = this.actionOptions
    .filter((option) => option.value !== 'ALL');

  readonly timeRangeOptions: Array<{ value: TimeRangeFilter; label: string }> = [
    { value: 'LAST_HOUR', label: 'Last hour' },
    { value: 'LAST_24_HOURS', label: 'Last 24 hours' },
    { value: 'LAST_7_DAYS', label: 'Last 7 days' },
    { value: 'LAST_MONTH', label: 'Last month' }
  ];

  ngOnInit(): void {
    this.load();
  }

  widthFor(column: AuditTableColumn): number {
    return this.defaultColumnWidths[column];
  }

  load(): void {
    this.loading.set(true);
    this.error.set(null);
    this.auditApi.list({
      action: this.selectedAction,
      entityType: this.selectedEntityType,
      createdAfter: this.createdAfterFor(this.selectedTimeRange),
      actorUserId: this.actorUserId,
      entityId: this.entityId,
      limit: this.limit
    }).subscribe({
      next: (page) => {
        this.events.set(page.items);
        this.totalCount.set(page.totalCount);
        this.loading.set(false);
      },
      error: () => {
        this.error.set('Unable to load audit events.');
        this.loading.set(false);
      }
    });
  }

  clearFilters(): void {
    this.searchTerm = '';
    this.actorUserId = '';
    this.entityId = '';
    this.selectedAction = 'ALL';
    this.selectedEntityType = 'ALL';
    this.selectedTimeRange = 'LAST_7_DAYS';
    this.limit = 25;
    this.conditions.set([{ id: Date.now(), field: 'ACTOR', value: '' }]);
    this.load();
  }

  toggleFilters(): void {
    this.filtersOpen.update((open) => !open);
  }

  addCondition(): void {
    this.conditions.update((conditions) => [
      ...conditions,
      { id: Date.now() + conditions.length, field: 'ACTOR', value: '' }
    ]);
  }

  removeCondition(id: number): void {
    this.conditions.update((conditions) => {
      const next = conditions.filter((condition) => condition.id !== id);
      return next.length ? next : [{ id: Date.now(), field: 'ACTOR', value: '' }];
    });
  }

  clearAllConditions(): void {
    this.conditions.set([{ id: Date.now(), field: 'ACTOR', value: '' }]);
    this.actorUserId = '';
    this.entityId = '';
    this.selectedAction = 'ALL';
    this.selectedEntityType = 'ALL';
    this.selectedTimeRange = 'LAST_7_DAYS';
  }

  updateConditionField(id: number, field: AuditFilterField): void {
    this.conditions.update((conditions) => conditions.map((condition) => {
      if (condition.id !== id) return condition;
      return { ...condition, field, value: this.defaultValueFor(field) };
    }));
  }

  updateConditionValue(id: number, value: string): void {
    this.conditions.update((conditions) => conditions.map((condition) => {
      if (condition.id !== id) return condition;
      return { ...condition, value };
    }));
  }

  applyConditions(): void {
    this.actorUserId = '';
    this.entityId = '';
    this.selectedAction = 'ALL';
    this.selectedEntityType = 'ALL';
    this.selectedTimeRange = 'LAST_7_DAYS';

    for (const condition of this.conditions()) {
      if (condition.field === 'ACTOR') {
        this.actorUserId = condition.value.trim();
      } else if (condition.field === 'RESOURCE') {
        this.entityId = condition.value.trim();
      } else if (condition.field === 'RESOURCE_TYPE' && condition.value) {
        this.selectedEntityType = condition.value as EntityFilter;
      } else if (condition.field === 'DURATION' && condition.value) {
        this.selectedTimeRange = condition.value as TimeRangeFilter;
      } else if (condition.field === 'ACTION_TYPE' && condition.value) {
        this.selectedAction = condition.value as ActionFilter;
      }
    }

    this.filtersOpen.set(false);
    this.load();
  }

  activeFilterCount(): number {
    return this.appliedFilterCount();
  }

  increaseLimit(): void {
    this.limit = Math.min(this.limit + 50, 200);
    this.load();
  }

  exportVisibleEvents(): void {
    const rows = this.visibleEvents();
    const header = [
      'Timestamp',
      'Actor User ID',
      'Actor Role',
      'Action',
      'Resource Type',
      'Resource ID',
      'Outcome',
      'Reason',
      'Metadata'
    ];
    const csv = [
      header,
      ...rows.map((event) => [
        event.createdAt,
        event.actorUserId ?? '',
        event.actorRole ?? '',
        event.action,
        event.entityType,
        event.entityId ?? '',
        event.outcome,
        event.reason ?? '',
        JSON.stringify(event.metadata ?? {})
      ])
    ].map((row) => row.map((value) => this.csvValue(value)).join(',')).join('\n');

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `audit-log-${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  }

  formatTimestamp(value: string): string {
    return new Intl.DateTimeFormat('en', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit'
    }).format(new Date(value));
  }

  actorInitial(event: AuditEvent): string {
    return (event.actorRole || event.actorUserId || 'System').charAt(0).toUpperCase();
  }

  actionLabel(action: AuditAction): string {
    return this.humanize(action);
  }

  entityLabel(entityType: AuditEntityType): string {
    return this.humanize(entityType);
  }

  humanize(value: string): string {
    return value
      .replace(/_/g, ' ')
      .replace(/([a-z])([A-Z])/g, '$1 $2')
      .toLowerCase()
      .replace(/\b\w/g, (letter) => letter.toUpperCase());
  }

  actionClass(action: AuditAction): string {
    if (action.includes('LOGIN') || action === 'LOGOUT') return 'action-auth';
    if (action.includes('DENIED') || action.includes('FAILED') || action.includes('LOCKED')) return 'action-security';
    if (action.includes('CREATED')) return 'action-create';
    if (action.includes('STATUS') || action.includes('UPDATED') || action.includes('ASSIGNED')) return 'action-update';
    if (action.includes('VERIFY') || action.includes('VERIFICATION')) return 'action-verify';
    return '';
  }

  private createdAfterFor(range: TimeRangeFilter): string {
    const date = new Date();
    if (range === 'LAST_HOUR') {
      date.setHours(date.getHours() - 1);
    } else if (range === 'LAST_24_HOURS') {
      date.setDate(date.getDate() - 1);
    } else if (range === 'LAST_7_DAYS') {
      date.setDate(date.getDate() - 7);
    } else {
      date.setMonth(date.getMonth() - 1);
    }
    return date.toISOString();
  }

  private defaultValueFor(field: AuditFilterField): string {
    if (field === 'RESOURCE_TYPE') return 'VOB_REQUEST';
    if (field === 'DURATION') return 'LAST_7_DAYS';
    if (field === 'ACTION_TYPE') return 'VOB_REQUEST_CREATED';
    return '';
  }

  private appliedFilterCount(): number {
    let count = 0;
    if (this.actorUserId.trim()) count++;
    if (this.entityId.trim()) count++;
    if (this.selectedEntityType !== 'ALL') count++;
    if (this.selectedAction !== 'ALL') count++;
    if (this.selectedTimeRange !== 'LAST_7_DAYS') count++;
    return count;
  }

  private csvValue(value: unknown): string {
    const text = value === null || value === undefined ? '' : String(value);
    return `"${text.replace(/"/g, '""')}"`;
  }

  private matchesSearch(event: AuditEvent, search: string): boolean {
    const searchable = [
      event.id,
      event.actorUserId,
      event.actorRole,
      event.action,
      event.entityType,
      event.entityId,
      event.outcome,
      event.reason,
      JSON.stringify(event.metadata ?? {})
    ].filter(Boolean).join(' ').toLowerCase();

    return searchable.includes(search);
  }
}
