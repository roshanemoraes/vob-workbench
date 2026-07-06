import { Component, inject, OnInit, signal } from '@angular/core';
import { Router } from '@angular/router';
import { MockPatientStore } from '../../core/api/mock-patient.store';
import { Patient } from '../../core/models/patient.models';
import { PageHeaderComponent } from '../../core/layout/page-header.component';
import { CursorPaginationControlsComponent } from '../../shared/components/cursor-pagination-controls.component';
import { LoadingStateComponent } from '../../shared/ui/loading-state.component';
import { PatientSearchBarComponent } from './patient-search-bar.component';
import { PatientTableComponent } from './patient-table.component';

@Component({
  selector: 'app-patient-list-page',
  standalone: true,
  imports: [
    PageHeaderComponent,
    PatientSearchBarComponent,
    PatientTableComponent,
    CursorPaginationControlsComponent,
    LoadingStateComponent
  ],
  template: `
    <app-page-header
      title="Patients"
      actionLabel="New Patient"
      [action]="goToCreate.bind(this)"
    />

    <app-patient-search-bar (search)="onSearch($event)" />

    @if (loading()) {
      <app-loading-state />
    } @else {
      <app-patient-table
        [patients]="patients()"
        (createPatient)="goToCreate()"
      />
      <app-cursor-pagination
        [hasMore]="hasMore()"
        [totalShown]="patients().length"
        (next)="loadMore()"
      />
    }
  `
})
export class PatientListPageComponent implements OnInit {
  private readonly patientStore = inject(MockPatientStore);
  private readonly router = inject(Router);

  readonly loading = signal(true);
  readonly patients = signal<Patient[]>([]);
  readonly hasMore = signal(false);
  private searchTerm = '';
  private cursor: string | undefined;

  ngOnInit(): void {
    this.load();
  }

  onSearch(term: string): void {
    this.searchTerm = term;
    this.cursor = undefined;
    this.load();
  }

  loadMore(): void {
    if (!this.hasMore()) return;
    this.load(true);
  }

  goToCreate(): void {
    this.router.navigate(['/app/patients/new']);
  }

  private load(append = false): void {
    this.loading.set(!append);
    this.patientStore.list({ search: this.searchTerm, cursor: this.cursor }).subscribe((page) => {
      this.patients.update((list) => (append ? [...list, ...page.items] : page.items));
      this.hasMore.set(page.hasMore);
      this.cursor = page.nextCursor ?? undefined;
      this.loading.set(false);
    });
  }
}
