import { Component, inject, OnInit, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { MockPatientStore } from '../../core/api/mock-patient.store';
import { MockVobStore } from '../../core/api/mock-vob.store';
import { Patient } from '../../core/models/patient.models';
import { Vob } from '../../core/models/vob.models';
import { PageHeaderComponent } from '../../core/layout/page-header.component';
import { AppButtonComponent } from '../../shared/ui/app-button.component';
import { LoadingStateComponent } from '../../shared/ui/loading-state.component';
import { PatientSummaryComponent } from './patient-summary.component';
import { RelatedVobTableComponent } from './related-vob-table.component';

@Component({
  selector: 'app-patient-detail-page',
  standalone: true,
  imports: [
    PageHeaderComponent,
    PatientSummaryComponent,
    RelatedVobTableComponent,
    AppButtonComponent,
    LoadingStateComponent
  ],
  template: `
    @if (loading()) {
      <app-loading-state />
    } @else if (patient()) {
      <app-page-header
        [title]="patient()!.lastName + ', ' + patient()!.firstName"
        [subtitle]="'MRN: ' + patient()!.mrn"
      />

      <div class="detail-actions">
        <app-button variant="secondary" (click)="back()">Back to Patients</app-button>
        <app-button variant="primary" (click)="createVob()">Create VOB</app-button>
      </div>

      <section class="panel detail-section">
        <h2 class="form-section-title">Patient Summary</h2>
        <app-patient-summary [patient]="patient()!" />
      </section>

      <section class="detail-section">
        <h2 class="form-section-title">Related VOBs</h2>
        <app-related-vob-table [vobs]="vobs()" />
      </section>
    }
  `,
  styles: `
    .detail-actions {
      display: flex;
      gap: var(--space-2);
      margin-bottom: var(--space-4);
    }

    .detail-section {
      margin-bottom: var(--space-5);
    }
  `
})
export class PatientDetailPageComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly patientStore = inject(MockPatientStore);
  private readonly vobStore = inject(MockVobStore);

  readonly loading = signal(true);
  readonly patient = signal<Patient | null>(null);
  readonly vobs = signal<Vob[]>([]);

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id')!;
    this.patientStore.getById(id).subscribe((patient) => {
      this.patient.set(patient);
      if (patient) {
        this.vobStore.listByPatientId(patient.id).subscribe((vobs) => {
          this.vobs.set(vobs);
          this.loading.set(false);
        });
      } else {
        this.loading.set(false);
      }
    });
  }

  back(): void {
    this.router.navigate(['/app/patients']);
  }

  createVob(): void {
    const id = this.patient()?.id;
    if (id) {
      this.router.navigate(['/app/vob/new'], { queryParams: { patientId: id } });
    }
  }
}
