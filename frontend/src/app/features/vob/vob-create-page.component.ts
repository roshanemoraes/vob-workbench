import { Component, inject, OnInit, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { MockCurrentUserStore } from '../../core/auth/mock-current-user.store';
import { MockPatientStore } from '../../core/api/mock-patient.store';
import { MockVobStore } from '../../core/api/mock-vob.store';
import { ToastService } from '../../core/api/toast.service';
import { Patient } from '../../core/models/patient.models';
import { CreateVobRequest, RelationshipToSubscriber, VobPriority } from '../../core/models/vob.models';
import { PageHeaderComponent } from '../../core/layout/page-header.component';
import { AppButtonComponent } from '../../shared/ui/app-button.component';
import { DateInputComponent } from '../../shared/forms/date-input.component';
import { SelectInputComponent } from '../../shared/forms/select-input.component';
import { TextInputComponent } from '../../shared/forms/text-input.component';
import { LoadingStateComponent } from '../../shared/ui/loading-state.component';

@Component({
  selector: 'app-vob-create-page',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    PageHeaderComponent,
    TextInputComponent,
    DateInputComponent,
    SelectInputComponent,
    AppButtonComponent,
    LoadingStateComponent
  ],
  template: `
    <app-page-header title="New VOB" subtitle="Create a verification request for a patient" />

    @if (loadingPatients()) {
      <app-loading-state />
    } @else {
      <form [formGroup]="form" (ngSubmit)="submit()" class="panel">
        <h2 class="form-section-title">Patient</h2>
        <div class="form-grid">
          <app-select-input
            label="Patient"
            formControlName="patientId"
            [options]="patientOptions()"
            placeholder="Select patient"
            [required]="true"
          />
        </div>

        <h2 class="form-section-title">Insurance Policy</h2>
        <div class="form-grid" formGroupName="insurance">
          <app-text-input label="Payer name" formControlName="payerName" [required]="true" />
          <app-text-input label="Member ID" formControlName="memberId" [required]="true" />
          <app-text-input label="Group number" formControlName="groupNumber" [required]="true" />
          <app-text-input label="Plan type" formControlName="planType" [required]="true" />
          <app-select-input
            label="Relationship to subscriber"
            formControlName="relationshipToSubscriber"
            [options]="relationshipOptions"
            [required]="true"
          />
          <app-date-input label="Coverage start" formControlName="coverageStart" [required]="true" />
          <app-date-input label="Coverage end" formControlName="coverageEnd" [required]="true" />
        </div>

        <h2 class="form-section-title">Service Details</h2>
        <div class="form-grid">
          <app-date-input label="Date of service" formControlName="dateOfService" [required]="true" />
          <app-select-input
            label="Priority"
            formControlName="priority"
            [options]="priorityOptions"
            [required]="true"
          />
        </div>

        <div class="form-actions">
          <app-button variant="secondary" type="button" (click)="cancel()">Cancel</app-button>
          <app-button type="submit" variant="primary" [loading]="saving()" [disabled]="form.invalid">
            Create VOB
          </app-button>
        </div>
      </form>
    }
  `
})
export class VobCreatePageComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly patientStore = inject(MockPatientStore);
  private readonly vobStore = inject(MockVobStore);
  private readonly userStore = inject(MockCurrentUserStore);
  private readonly toast = inject(ToastService);

  readonly loadingPatients = signal(true);
  readonly saving = signal(false);
  readonly patientOptions = signal<{ value: string; label: string }[]>([]);

  readonly relationshipOptions = [
    { value: 'SELF', label: 'Self' },
    { value: 'SPOUSE', label: 'Spouse' },
    { value: 'CHILD', label: 'Child' },
    { value: 'OTHER', label: 'Other' }
  ];

  readonly priorityOptions = [
    { value: 'ROUTINE', label: 'Routine' },
    { value: 'URGENT', label: 'Urgent' }
  ];

  readonly form = this.fb.nonNullable.group({
    patientId: ['', Validators.required],
    insurance: this.fb.nonNullable.group({
      payerName: ['', Validators.required],
      memberId: ['', Validators.required],
      groupNumber: ['', Validators.required],
      planType: ['', Validators.required],
      relationshipToSubscriber: ['SELF', Validators.required],
      coverageStart: ['', Validators.required],
      coverageEnd: ['', Validators.required]
    }),
    dateOfService: ['', Validators.required],
    priority: ['ROUTINE', Validators.required]
  });

  ngOnInit(): void {
    this.patientStore.list().subscribe((page) => {
      this.patientOptions.set(
        page.items.map((p: Patient) => ({
          value: p.id,
          label: `${p.lastName}, ${p.firstName} (${p.mrn})`
        }))
      );
      this.loadingPatients.set(false);
      const patientId = this.route.snapshot.queryParamMap.get('patientId');
      if (patientId) {
        this.form.patchValue({ patientId });
      }
    });
  }

  cancel(): void {
    this.router.navigate(['/app/vob']);
  }

  submit(): void {
    if (this.form.invalid) return;
    this.saving.set(true);
    const userId = this.userStore.currentUser()?.id ?? 'unknown';
    const { patientId, insurance, dateOfService, priority } = this.form.getRawValue();
    const request: CreateVobRequest = {
      patientId,
      insurance: {
        ...insurance,
        relationshipToSubscriber: insurance.relationshipToSubscriber as RelationshipToSubscriber
      },
      dateOfService,
      priority: priority as VobPriority
    };
    this.vobStore.create(request, userId)
      .subscribe({
        next: () => {
          this.toast.success('VOB created successfully.');
          this.router.navigate(['/app/vob'], { queryParams: { status: 'QUEUED' } });
        },
        error: () => this.saving.set(false),
        complete: () => this.saving.set(false)
      });
  }
}
