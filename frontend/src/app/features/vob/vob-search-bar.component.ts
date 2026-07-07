import { Component, EventEmitter, Input, OnChanges, OnInit, Output, SimpleChanges } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { VobStatus } from '../../core/models/vob.models';

export type VobStatusFilter = VobStatus | 'ALL';

export interface VobSearchCriteria {
  status: VobStatusFilter;
  field: string;
  term: string;
  sortOrder: 'asc' | 'desc';
}

@Component({
  selector: 'app-vob-search-bar',
  standalone: true,
  imports: [FormsModule],
  template: `
    <div class="search-bar">
      <div class="search-bar__title">Select search criteria</div>
      <div class="search-bar__controls">
        <select class="search-bar__select" [(ngModel)]="status">
          <option value="ALL">All statuses</option>
          <option value="QUEUED">Queued</option>
          <option value="IN_PROGRESS">In progress</option>
          <option value="VERIFIED">Verified</option>
          <option value="FAILED_TO_VERIFY">Failed to verify</option>
        </select>

        <select class="search-bar__select" [(ngModel)]="field">
          <option value="all">All VOB fields</option>
          <option value="id">VOB ID</option>
          <option value="patientId">Patient ID</option>
          <option value="payerName">Payer name</option>
          <option value="memberId">Member ID</option>
          <option value="groupNumber">Group number</option>
          <option value="planType">Plan type</option>
          <option value="priority">Priority</option>
          <option value="assignedToUserId">Assigned user</option>
        </select>

        <select class="search-bar__select" [(ngModel)]="sortOrder">
          <option value="desc">Newest first</option>
          <option value="asc">Oldest first</option>
        </select>

        <input
          type="search"
          class="search-bar__input"
          placeholder="Search term"
          [(ngModel)]="term"
          (keyup.enter)="onSearch()"
        />

        <button type="button" class="search-bar__button search-bar__button--primary" (click)="onSearch()">Search</button>
        <button type="button" class="search-bar__button search-bar__button--secondary" (click)="reset()">Reset</button>
      </div>
    </div>
  `,
  styles: `
    .search-bar {
      width: 100%;
      margin-bottom: var(--space-4);
      padding: var(--space-3);
      background: #f0f1f4;
      border-radius: var(--radius-md);
    }

    .search-bar__title {
      margin-bottom: var(--space-2);
      font-size: 14px;
      font-weight: 600;
      color: var(--color-text);
    }

    .search-bar__controls {
      display: grid;
      grid-template-columns: minmax(170px, 220px) minmax(170px, 220px) minmax(150px, 180px) minmax(240px, 1fr) auto auto;
      gap: var(--space-3);
      align-items: center;
    }

    .search-bar__input,
    .search-bar__select {
      width: 100%;
      height: 40px;
      padding: 0 var(--space-3);
      border: 0;
      border-radius: var(--radius-sm);
      font-size: 14px;
      font-family: inherit;
      line-height: 40px;
      background: var(--color-surface);
    }

    .search-bar__button {
      height: 40px;
      min-width: 96px;
      padding: 0 var(--space-4);
      border: 0;
      border-radius: var(--radius-sm);
      font-family: inherit;
      font-size: 14px;
      font-weight: 700;
      text-transform: uppercase;
      cursor: pointer;
    }

    .search-bar__button--primary {
      background: #0033b3;
      color: #fff;
    }

    .search-bar__button--secondary {
      background: #d2d5dc;
      color: #4b5563;
    }

    @media (max-width: 1100px) {
      .search-bar__controls {
        grid-template-columns: 1fr 1fr;
      }
    }

    @media (max-width: 700px) {
      .search-bar__controls {
        grid-template-columns: 1fr;
      }
    }
  `
})
export class VobSearchBarComponent implements OnChanges, OnInit {
  @Input() initialStatus: VobStatusFilter = 'ALL';
  @Output() search = new EventEmitter<VobSearchCriteria>();

  status: VobStatusFilter = 'ALL';
  field = 'all';
  term = '';
  sortOrder: 'asc' | 'desc' = 'desc';

  ngOnInit(): void {
    this.status = this.initialStatus;
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['initialStatus']) {
      this.status = this.initialStatus;
    }
  }

  onSearch(): void {
    this.search.emit({
      status: this.status,
      field: this.field,
      term: this.term.trim(),
      sortOrder: this.sortOrder
    });
  }

  reset(): void {
    this.status = 'ALL';
    this.field = 'all';
    this.term = '';
    this.sortOrder = 'desc';
    this.onSearch();
  }
}
