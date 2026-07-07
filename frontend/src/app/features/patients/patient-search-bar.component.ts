import { Component, EventEmitter, Output } from '@angular/core';
import { FormsModule } from '@angular/forms';

export interface PatientSearchCriteria {
  field: string;
  term: string;
}

@Component({
  selector: 'app-patient-search-bar',
  standalone: true,
  imports: [FormsModule],
  template: `
    <div class="search-bar">
      <div class="search-bar__title">Select search criteria</div>
      <div class="search-bar__controls">
        <select class="search-bar__select" [(ngModel)]="field">
          <option value="all">All patient fields</option>
          <option value="mrn">MRN</option>
          <option value="name">Patient name</option>
          <option value="firstName">First name</option>
          <option value="lastName">Last name</option>
          <option value="phone">Phone</option>
        </select>
        <label class="search-bar__input">
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="m21 21-4.35-4.35M10.5 18a7.5 7.5 0 1 1 0-15 7.5 7.5 0 0 1 0 15Z" />
          </svg>
          <input
            type="search"
            placeholder="Search term"
            [(ngModel)]="term"
            (keyup.enter)="onSearch()"
          />
        </label>
        <button type="button" class="search-bar__button search-bar__button--primary" (click)="onSearch()">Search</button>
        <button type="button" class="search-bar__button search-bar__button--secondary" (click)="reset()">Reset</button>
      </div>
    </div>
  `,
  styles: `
    .search-bar {
      width: 100%;
      margin-bottom: 20px;
      padding: 14px 16px;
      border: 1px solid rgba(0, 0, 0, 0.09);
      border-radius: 10px;
      background: #f7f7f5;
    }

    .search-bar__title {
      margin-bottom: 10px;
      color: #8a8983;
      font-size: 12px;
      font-weight: 600;
      letter-spacing: 0.03em;
      text-transform: uppercase;
    }

    .search-bar__controls {
      display: flex;
      align-items: center;
      gap: 10px;
      flex-wrap: wrap;
    }

    .search-bar__select {
      min-width: 180px;
      height: 38px;
      padding: 0 12px;
      border: 1px solid rgba(0, 0, 0, 0.09);
      border-radius: 8px;
      background: #fff;
      color: #1a1a18;
      font: inherit;
      font-size: 13px;
    }

    .search-bar__input {
      display: flex;
      align-items: center;
      gap: 8px;
      flex: 1;
      min-width: 220px;
      height: 38px;
      padding: 0 12px;
      border: 1px solid rgba(0, 0, 0, 0.09);
      border-radius: 8px;
      background: #fff;
      color: #1a1a18;
      font-size: 13px;
    }

    .search-bar__input svg {
      width: 15px;
      height: 15px;
      flex-shrink: 0;
      fill: none;
      stroke: #8a8983;
      stroke-linecap: round;
      stroke-linejoin: round;
      stroke-width: 2;
    }

    .search-bar__input input {
      width: 100%;
      border: 0;
      outline: none;
      background: transparent;
      color: #1a1a18;
      font: inherit;
      font-size: 13px;
    }

    .search-bar__input input::placeholder {
      color: #8a8983;
    }

    .search-bar__button {
      height: 38px;
      padding: 0 16px;
      border-radius: 8px;
      font: inherit;
      font-size: 13px;
      font-weight: 600;
      cursor: pointer;
    }

    .search-bar__button--primary {
      border: 0;
      background: #168a74;
      color: #fff;
    }

    .search-bar__button--primary:hover {
      background: #0c7561;
    }

    .search-bar__button--secondary {
      border: 1px solid rgba(0, 0, 0, 0.09);
      background: #fff;
      color: #5f5e5a;
    }

    .search-bar__button--secondary:hover {
      background: #f5f4f2;
    }

    @media (max-width: 900px) {
      .search-bar__controls {
        align-items: stretch;
        flex-direction: column;
      }

      .search-bar__select,
      .search-bar__input,
      .search-bar__button {
        width: 100%;
      }
    }
  `
})
export class PatientSearchBarComponent {
  field = 'all';
  term = '';
  @Output() search = new EventEmitter<PatientSearchCriteria>();

  onSearch(): void {
    this.search.emit({ field: this.field, term: this.term.trim() });
  }

  reset(): void {
    this.field = 'all';
    this.term = '';
    this.onSearch();
  }
}
