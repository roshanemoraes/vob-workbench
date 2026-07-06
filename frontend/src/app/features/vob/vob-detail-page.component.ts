import { DatePipe } from '@angular/common';
import { Component, inject, OnInit, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { MockPatientStore } from '../../core/api/mock-patient.store';
import { MockVobStore } from '../../core/api/mock-vob.store';
import { Patient } from '../../core/models/patient.models';
import { Vob } from '../../core/models/vob.models';
import { AppButtonComponent } from '../../shared/ui/app-button.component';
import { LoadingStateComponent } from '../../shared/ui/loading-state.component';
import { EligibilityResultPanelComponent } from './eligibility-result-panel.component';
import { InsurancePolicySummaryComponent } from './insurance-policy-summary.component';
import { VobActionBarComponent } from './vob-action-bar.component';
import { VobHeaderComponent } from './vob-header.component';
import { VobTimelinePanelComponent } from './vob-timeline-panel.component';

@Component({
  selector: 'app-vob-detail-page',
  standalone: true,
  imports: [
    DatePipe,
    RouterLink,
    VobHeaderComponent,
    VobActionBarComponent,
    InsurancePolicySummaryComponent,
    EligibilityResultPanelComponent,
    VobTimelinePanelComponent,
    AppButtonComponent,
    LoadingStateComponent
  ],
  template: `
    @if (loading()) {
      <app-loading-state />
    } @else if (vob()) {
      <app-vob-header [vob]="vob()!" />
      <app-vob-action-bar
        [vob]="vob()!"
        (updated)="vob.set($event)"
        (verified)="vob.set($event)"
      />

      <div class="detail-actions">
        <app-button variant="secondary" (click)="back()">Back to VOB list</app-button>
      </div>

      <section class="panel detail-section">
        <h2 class="form-section-title">Patient Reference</h2>
        @if (patient()) {
          <p>
            <a [routerLink]="['/app/patients', patient()!.id]">
              {{ patient()!.lastName }}, {{ patient()!.firstName }} ({{ patient()!.mrn }})
            </a>
          </p>
        } @else {
          <p>Patient ID: {{ vob()!.patientId }}</p>
        }
      </section>

      <section class="panel detail-section">
        <h2 class="form-section-title">Insurance Policy</h2>
        <app-insurance-policy-summary [insurance]="vob()!.insurance" />
      </section>

      <section class="panel detail-section">
        <h2 class="form-section-title">Service Details</h2>
        <dl class="detail-grid">
          <div class="detail-item">
            <dt>Date of service</dt>
            <dd>{{ vob()!.dateOfService | date: 'mediumDate' }}</dd>
          </div>
          <div class="detail-item">
            <dt>Priority</dt>
            <dd>{{ vob()!.priority }}</dd>
          </div>
          <div class="detail-item">
            <dt>Created</dt>
            <dd>{{ vob()!.createdAt | date: 'short' }}</dd>
          </div>
        </dl>
      </section>

      <section class="panel detail-section">
        <h2 class="form-section-title">Eligibility Result</h2>
        <app-eligibility-result-panel [result]="vob()!.eligibilityResult" />
      </section>

      <section class="panel detail-section">
        <h2 class="form-section-title">Timeline</h2>
        <app-vob-timeline-panel />
      </section>
    }
  `,
  styles: `
    .detail-actions { margin-bottom: var(--space-4); }
    .detail-section { margin-bottom: var(--space-4); }
  `
})
export class VobDetailPageComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly vobStore = inject(MockVobStore);
  private readonly patientStore = inject(MockPatientStore);

  readonly loading = signal(true);
  readonly vob = signal<Vob | null>(null);
  readonly patient = signal<Patient | null>(null);

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id')!;
    this.vobStore.getById(id).subscribe((vob) => {
      this.vob.set(vob);
      if (vob) {
        this.patientStore.getById(vob.patientId).subscribe((p) => {
          this.patient.set(p);
          this.loading.set(false);
        });
      } else {
        this.loading.set(false);
      }
    });
  }

  back(): void {
    const status = this.vob()?.status ?? 'QUEUED';
    this.router.navigate(['/app/vob'], { queryParams: { status } });
  }
}
