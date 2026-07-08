import { Component, inject, OnInit, signal } from '@angular/core';
import { Router } from '@angular/router';
import { PatientApiService } from '../../core/api/patient-api.service';
import { Patient } from '../../core/models/patient.models';
import { LoadingStateComponent } from '../../shared/ui/loading-state.component';
import { PatientSearchBarComponent, PatientSearchCriteria } from './patient-search-bar.component';
import { PatientTableComponent } from './patient-table.component';

@Component({
  selector: 'app-patient-list-page',
  standalone: true,
  imports: [
    PatientSearchBarComponent,
    PatientTableComponent,
    LoadingStateComponent
  ],
  template: `
    <section class="patient-list-panel">
      <header class="patient-list-header">
        <h1>Patients</h1>
        <button type="button" class="new-patient-button" (click)="goToCreate()">New Patient</button>
      </header>

      <app-patient-search-bar (search)="onSearch($event)" />

      @if (loading()) {
        <app-loading-state />
      } @else {
        <app-patient-table
          [patients]="patients()"
          (createPatient)="goToCreate()"
        />

        @if (patients().length > 0) {
          <footer class="patient-list-footer">
            <div class="show-count">
              <span>Showing</span>
              <strong>{{ patients().length }}</strong>
              <span>items</span>
            </div>
            <button type="button" class="load-more" [disabled]="!hasMore()" (click)="loadMore()">
              Load more
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <path d="m9 18 6-6-6-6" />
              </svg>
            </button>
          </footer>
        }
      }
    </section>
  `,
  styles: `
    .patient-list-panel {
      max-width: 1650px;
      padding: 24px 28px;
      border: 1px solid rgba(0, 0, 0, 0.09);
      border-radius: 14px;
      background: #fff;
    }

    .patient-list-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 12px;
      margin-bottom: 20px;
      flex-wrap: wrap;
    }

    .patient-list-header h1 {
      margin: 0;
      color: #1a1a18;
      font-size: 22px;
      font-weight: 700;
    }

    .new-patient-button {
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
    }

    .new-patient-button:hover {
      background: #000;
    }

    .patient-list-footer {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 12px;
      margin-top: 18px;
      color: #5f5e5a;
      font-size: 13px;
      flex-wrap: wrap;
    }

    .show-count {
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .show-count strong {
      display: inline-flex;
      align-items: center;
      padding: 2px 9px;
      border-radius: 6px;
      background: #f0efec;
      color: #1a1a18;
    }

    .load-more {
      display: inline-flex;
      align-items: center;
      gap: 4px;
      border: 0;
      background: transparent;
      color: #8a8983;
      font: inherit;
      font-size: 13px;
      font-weight: 600;
      cursor: pointer;
    }

    .load-more:hover:not(:disabled) {
      color: #1a1a18;
    }

    .load-more:disabled {
      color: #c8c8c4;
      cursor: not-allowed;
    }

    .load-more svg {
      width: 16px;
      height: 16px;
      fill: none;
      stroke: currentColor;
      stroke-linecap: round;
      stroke-linejoin: round;
      stroke-width: 2;
    }
  `
})
export class PatientListPageComponent implements OnInit {
  private readonly patientStore = inject(PatientApiService);
  private readonly router = inject(Router);

  readonly loading = signal(true);
  readonly patients = signal<Patient[]>([]);
  readonly hasMore = signal(false);
  private searchCriteria: PatientSearchCriteria = { field: 'all', term: '' };
  private cursor: string | undefined;

  ngOnInit(): void {
    this.load();
  }

  onSearch(criteria: PatientSearchCriteria): void {
    this.searchCriteria = criteria;
    this.cursor = undefined;
    this.load();
  }

  loadMore(): void {
    if (!this.hasMore()) return;
    this.load(true);
  }

  goToCreate(): void {
    this.router.navigate(['/app/patients/add']);
  }

  private load(append = false): void {
    this.loading.set(!append);
    this.patientStore.list({
      search: this.searchCriteria.term,
      searchField: this.searchCriteria.field,
      cursor: this.cursor
    }).subscribe((page) => {
      this.patients.update((list) => (append ? [...list, ...page.items] : page.items));
      this.hasMore.set(page.hasMore);
      this.cursor = page.nextCursor ?? undefined;
      this.loading.set(false);
    });
  }
}
