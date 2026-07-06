import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { MockCurrentUserStore } from '../../core/auth/mock-current-user.store';
import { MockPatientStore } from '../../core/api/mock-patient.store';
import { ToastService } from '../../core/api/toast.service';
import { Gender } from '../../core/models/patient.models';
import { PageHeaderComponent } from '../../core/layout/page-header.component';
import { AppButtonComponent } from '../../shared/ui/app-button.component';
import { DateInputComponent } from '../../shared/forms/date-input.component';
import { SelectInputComponent } from '../../shared/forms/select-input.component';
import { TextInputComponent } from '../../shared/forms/text-input.component';

@Component({
  selector: 'app-patient-create-page',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    PageHeaderComponent,
    TextInputComponent,
    DateInputComponent,
    SelectInputComponent,
    AppButtonComponent
  ],
  template: `
    <app-page-header title="New Patient" subtitle="Record patient intake data" />

    <form [formGroup]="form" (ngSubmit)="submit()" class="panel form-grid">
      <app-text-input label="MRN" formControlName="mrn" [required]="true" />
      <app-text-input label="First name" formControlName="firstName" [required]="true" />
      <app-text-input label="Last name" formControlName="lastName" [required]="true" />
      <app-date-input label="Date of birth" formControlName="dateOfBirth" [required]="true" />
      <app-select-input
        label="Gender"
        formControlName="gender"
        [options]="genderOptions"
        placeholder="Select gender"
        [required]="true"
      />
      <app-text-input label="Phone" type="tel" formControlName="phone" [required]="true" />

      <div class="form-actions">
        <app-button variant="secondary" type="button" (click)="cancel()">Cancel</app-button>
        <app-button type="submit" variant="primary" [loading]="saving()" [disabled]="form.invalid">
          Create Patient
        </app-button>
      </div>
    </form>
  `
})
export class PatientCreatePageComponent {
  private readonly fb = inject(FormBuilder);
  private readonly patientStore = inject(MockPatientStore);
  private readonly userStore = inject(MockCurrentUserStore);
  private readonly toast = inject(ToastService);
  private readonly router = inject(Router);

  readonly saving = signal(false);
  readonly genderOptions = [
    { value: 'MALE', label: 'Male' },
    { value: 'FEMALE', label: 'Female' },
    { value: 'OTHER', label: 'Other' },
    { value: 'UNKNOWN', label: 'Unknown' }
  ];

  readonly form = this.fb.nonNullable.group({
    mrn: ['', Validators.required],
    firstName: ['', Validators.required],
    lastName: ['', Validators.required],
    dateOfBirth: ['', Validators.required],
    gender: ['' as Gender | '', Validators.required],
    phone: ['', Validators.required]
  });

  cancel(): void {
    this.router.navigate(['/app/patients']);
  }

  submit(): void {
    if (this.form.invalid) return;
    this.saving.set(true);
    const userId = this.userStore.currentUser()?.id ?? 'unknown';
    this.patientStore.create(this.form.getRawValue() as Parameters<MockPatientStore['create']>[0], userId).subscribe({
      next: (patient) => {
        this.toast.success('Patient created successfully.');
        this.router.navigate(['/app/patients', patient.id]);
      },
      error: () => this.saving.set(false),
      complete: () => this.saving.set(false)
    });
  }
}
